import { json, type DataFunctionArgs, type MetaFunction } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { frontendRoutesSpacingFromHeaderAndFooter } from '#app/components/classlists.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Spacer } from '#app/components/spacer.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { useOptionalUser } from '#app/utils/user.ts'

export async function loader({ params }: DataFunctionArgs) {
	const dealer = await prisma.dealer.findUnique({
		where: { url: params.url },
		select: {
			id: true,
			url: true,
			name: true,
			images: {
				select: {
					id: true,
					altText: true,
				},
			},
			// previewImageId: true,
		},
	})
	if (!dealer) {
		throw new Response('not found', { status: 404 })
	}
	return json({ dealer })
}

export default function DealerUrlRoute() {
	const data = useLoaderData<typeof loader>()
	const isUserLoggedIn = useOptionalUser()
	const dealer = data.dealer

	return (
		<div className={frontendRoutesSpacingFromHeaderAndFooter}>
			<div className="relative h-[20vh] max-h-[350px] min-h-[250px] md:h-[40vh]">
				<div className="absolute left-10 top-1/2 -translate-y-1/2 md:left-1/2 md:-translate-x-1/2">
					<h1 className="text-h3 capitalize lg:text-h1">{dealer.name}</h1>

					{isUserLoggedIn ? (
						<div className="mt-4 text-center">
							<Link to={'/admin/dealers/' + dealer.id}>
								<Button variant="default" className="text-xs" size="sm">
									edit
								</Button>
							</Link>
						</div>
					) : null}
				</div>
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<div className="container mx-auto flex h-5/6 flex-col justify-center pb-32 pt-20 text-center">
						<h3 className="text-h3">
							No dealer with the dealer url "{params.url}" exists
						</h3>

						<Spacer size="sm" />

						<Link to="/">
							<Button variant="default" className="text-xs" size="sm">
								go home
							</Button>
						</Link>
					</div>
				),
			}}
		/>
	)
}

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
	const displayName = data?.dealer.name ?? params.url

	return [
		{ title: `${displayName} | chaos escape` },
		{
			name: 'content',
			content: displayName,
		},
	]
}
