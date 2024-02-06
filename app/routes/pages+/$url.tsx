import { json, type DataFunctionArgs, type MetaFunction } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { frontendRoutesSpacingFromHeaderAndFooter, pagesContentContainerClassList } from '#app/components/classlists.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Spacer } from '#app/components/spacer.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { cn, getPageImgSrc } from '#app/utils/misc.tsx'
import { useOptionalUser } from '#app/utils/user.ts'
import { OffersAndServicesLoader } from '../resources+/_offers-and-services-loader.tsx'

export async function loader({ params }: DataFunctionArgs) {
	const page = await prisma.page.findUnique({
		where: { url: params.url },
		select: {
			id: true,
			url: true,
			title: true,
			content: true,
			seo: true,
			visibility: true,
			images: {
				select: {
					id: true,
					altText: true,
				},
			},
			// previewImageId: true,
		},
	})
	if (!page || !page.visibility) {
		throw new Response('not found', { status: 404 })
	}
	return json({ page })
}

export default function PageUrlRoute() {
	const data = useLoaderData<typeof loader>()
	const isUserLoggedIn = useOptionalUser()
	const page = data.page
	const content = page.content ? page.content : ''
	const getContentString = { __html: content }

	return (
		<div className={frontendRoutesSpacingFromHeaderAndFooter}>
			{/* {room.previewImageId ? */}
			<div className="relative h-[20vh] max-h-[350px] min-h-[250px] md:h-[40vh]">
				<div className="relative h-full rounded-2xl bg-[url('/img/room-preview-img-placeholder.png')] bg-cover bg-center"></div>
				<div className="absolute inset-0 rounded-2xl bg-gradient-to-l from-transparent to-black opacity-60"></div>
				<div className="absolute left-10 top-1/2 -translate-y-1/2 text-background md:left-1/2 md:-translate-x-1/2">
					<h1 className="text-h3 capitalize lg:text-h1">{page.title}</h1>

					{isUserLoggedIn ? (
						<div className="mt-4 text-center">
							<Link to={'/admin/pages/' + page.id}>
								<Button variant="default" className="text-xs" size="sm">
									edit
								</Button>
							</Link>
						</div>
					) : null}
				</div>
			</div>

			<div className={cn(pagesContentContainerClassList, 
				"rounded-3xl bg-background shadow-page-container",
				"mt-[-2em] pt-[2em]")}>
				<div className={cn(
					"mb-16 md:mb-20 lg:mb-24",
					"px-4 md:px-8 lg:px-10 xl:px-12 3xl:px-16",
					"pt-8 pb-12 md:py-10 lg:py-14 xl:py-18 3xl:py-20"
				)}>
					<div className='page-detail-contents' dangerouslySetInnerHTML={getContentString} />

					{page.images.length ? (
						<div className={cn(
							"w-full max-w-[855px] mx-auto",
							"pt-8 md:pt-8 lg:pt-10 xl:pt-16 3xl:pt-18",
							"grid grid-cols-2 gap-2 md:gap-5",
						)}>
							{page.images.slice(0, 4).map((image, i) => (
								<div key={i} className='max-sm:max-h-[120px] sm:max-lg:max-h-[180px] lg:max-xl:max-h-[210px] xl:w-[414px] xl:h-[235px] shadow-page-container'>
									<img
										draggable="false"
										loading='lazy'
										src={getPageImgSrc(image.id)}
										alt={image.altText ?? ''}
										className="h-full w-full rounded-lg object-cover"
									/>
								</div>
							))}
						</div>
					) : null}
				</div>
			</div>

			<OffersAndServicesLoader />
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
							No page with the page url "{params.url}" exists
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
	const displayName = data?.page.title ?? params.url
	const seoContent = data?.page.seo ?? params.title

	return [
		{ title: `${displayName} | Chaos Escape` },
		{
			name: 'content',
			content: seoContent,
		},
	]
}
