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

const SearchResultSchema = z.object({
	id: z.string(),
	url: z.string(),
	title: z.string().nullable(),
	type: z.enum(['CarBrand', 'CarModel', 'Dealer']),
	carBrandTitle: z.string().nullable(),
})

const SearchResultsSchema = z.array(SearchResultSchema)

export async function loader({ request }: DataFunctionArgs) {
	const searchTerm = new URL(request.url).searchParams.get('search')
	if (searchTerm === '') {
		return redirect('/search')
	}

	const like = `%${searchTerm ?? ''}%`

	const rawSearchResults = await prisma.$queryRaw`
      SELECT 
        m.id, 
        m.url, 
        m.title, 
        'CarModel' as type,
        b.title as carBrandTitle
      FROM CarModel m
      JOIN CarBrand b ON m.carBrandId = b.id
      WHERE m.title LIKE ${like} OR m.url LIKE ${like}
      UNION
      SELECT id, url, title, 'CarBrand' as type, NULL as carBrandTitle
      FROM CarBrand
      WHERE title LIKE ${like}
      UNION
      SELECT id, url, name as title, 'Dealer' as type, NULL as carBrandTitle
      FROM Dealer
      WHERE name LIKE ${like}
      LIMIT 50
    `

	const result = SearchResultsSchema.safeParse(rawSearchResults)
	if (!result.success) {
		return json({ status: 'error', error: result.error.message } as const, {
			status: 400,
		})
	}

	return json({ status: 'idle', searchResults: result.data } as const)
}

export default function GlobalSearch() {
	const data = useLoaderData<typeof loader>()

	//TODO: implement search & query logic of load
	const isPending = useDelayedIsPending({
		formMethod: 'GET',
		formAction: '/search',
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
				<h1 className="text-h1 capitalize">Search</h1>
				<Spacer size="sm" />

				<div className="mb-8 w-full max-w-[700px]">
					<SearchBar
						actionUrl="search"
						status={data.status}
						autoFocus
						autoSubmit
					/>
				</div>

				<div>
					{data.status === 'idle' ? (
						data.searchResults.length ? (
							<ul
								className={cn(
									'flex w-full flex-wrap items-center justify-center gap-4 delay-200',
									{ 'opacity-50': isPending },
								)}
							>
								{data.searchResults.map(result => (
									<li key={result.id}>
										<Link
											to={
												'/' +
												(result.type === 'CarBrand'
													? 'brands'
													: result.type === 'CarModel'
													  ? 'brands/' + result.carBrandTitle
													  : result.type === 'Dealer'
													    ? 'dealers'
													    : '') +
												'/' +
												result.url
											}
											className={cn(
												'flex h-36 w-44 flex-col items-center justify-center rounded-lg bg-muted px-5 py-3',
											)}
										>
											<span className="w-full overflow-hidden text-ellipsis whitespace-nowrap text-center text-body-md">
												{result.title}
											</span>
										</Link>
									</li>
								))}
							</ul>
						) : (
							<p>No results found</p>
						)
					) : data.status === 'error' ? (
						<ErrorList errors={['There was an error parsing the results']} />
					) : null}
				</div>
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
