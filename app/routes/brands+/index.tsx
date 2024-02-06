import {
	json,
	type DataFunctionArgs,
	// type MetaFunction,
	redirect,
} from '@remix-run/node'
import { Link, Outlet, useLoaderData } from '@remix-run/react'
import { z } from 'zod'
import {
	baseContainerWidthClassList,
	frontendRoutesSpacingFromHeaderAndFooter,
} from '#app/components/classlists.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { ErrorList } from '#app/components/forms.tsx'
import { SearchBar } from '#app/components/search-bar.tsx'
import { Spacer } from '#app/components/spacer.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { cn, useDelayedIsPending } from '#app/utils/misc.tsx'

const CarBrandSearchResultSchema = z.object({
	id: z.string(),
	url: z.string(),
	title: z.string().nullable(),
})

const CarBrandSearchResultsSchema = z.array(CarBrandSearchResultSchema)
export async function loader({ request }: DataFunctionArgs) {
	const searchTerm = new URL(request.url).searchParams.get('search')
	if (searchTerm === '') {
		return redirect('/brands')
	}

	const like = `%${searchTerm ?? ''}%`
	const rawCarBrands = await prisma.$queryRaw`
		SELECT CarBrand.id, CarBrand.url, CarBrand.title
		FROM CarBrand
		WHERE CarBrand.title LIKE ${like}
		OR CarBrand.url LIKE ${like}
		LIMIT 50
	`

	const result = CarBrandSearchResultsSchema.safeParse(rawCarBrands)
	if (!result.success) {
		return json({ status: 'error', error: result.error.message } as const, {
			status: 400,
		})
	}
	return json({ status: 'idle', carBrands: result.data } as const)
}

export default function CarBrandUrlRoute() {
	const data = useLoaderData<typeof loader>()

	//TODO: implement search & query logic of load
	const isPending = useDelayedIsPending({
		formMethod: 'GET',
		formAction: '/brands',
	})
	if (data.status === 'error') {
		console.error(data.error)
	}

	return (
		<div
			className={cn(
				baseContainerWidthClassList,
				frontendRoutesSpacingFromHeaderAndFooter,
			)}
		>
			<div className="text-center">
				<h1 className="text-h1 capitalize">
					Brands List
				</h1>
				<Spacer size="sm" />

				<div className="mb-8 w-full max-w-[700px]">
					<SearchBar
						actionUrl="brands"
						status={data.status}
						autoFocus
						autoSubmit
					/>
				</div>

				<div>
					{data.status === 'idle' ? (
						data.carBrands.length ? (
							<ul
								className={cn(
									'flex w-full flex-wrap items-center justify-center gap-4 delay-200',
									{ 'opacity-50': isPending },
								)}
							>
								{data.carBrands.map(carBrand => (
									<li key={carBrand.id}>
										<Link
											to={carBrand.url}
											className="flex h-36 w-44 flex-col items-center justify-center rounded-lg bg-muted px-5 py-3"
										>
											{carBrand.title && (
												<span className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-center text-body-md">
													{carBrand.title}
												</span>
											)}
										</Link>
									</li>
								))}
							</ul>
						) : (
							<p>No brands found</p>
						)
					) : data.status === 'error' ? (
						<ErrorList errors={['There was an error parsing the results']} />
					) : null}
				</div>

				{/* <div className="px-2 py-4 sm:mx-auto sm:max-w-[550px] md:max-w-[650px] lg:max-w-[750px] lg:px-0 lg:py-12">
					<div className="flex flex-row flex-wrap justify-between">
						{data.carBrand.carModels.map(
							(model, i) =>
								model.visibility && (
									<div className="w-1/2 p-2 text-center md:p-6" key={i}>
										<div className="z-1 border bg-background px-3 pb-6 pt-4 transition-opacity hover:opacity-95 lg:px-4 lg:pb-10 lg:pt-6">
											<Link to={model.url} className="text-center">
												<div className="overflow-hidden py-6 lg:p-8">
													<div>{model.title}</div>
												</div>

												<Button variant="secondary" className="">
													Detail
												</Button>
											</Link>
										</div>
									</div>
								),
						)}
					</div>
				</div> */}
			</div>

			<Outlet />
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
							No carBrand with the carBrand url "{params.url}" exists
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

// export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
// 	const displayName = data?.carBrand.title ?? params.url
// 	const seoContent = data?.carBrand.seo ?? params.title

// 	return [
// 		{ title: `${displayName} | chaos escape` },
// 		{
// 			name: 'description',
// 			content: seoContent,
// 		},
// 	]
// }
