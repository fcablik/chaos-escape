import { json, type DataFunctionArgs, type MetaFunction } from '@remix-run/node'
import { Link, useLoaderData, useSearchParams } from '@remix-run/react'
import { useMemo } from 'react'
import { z } from 'zod'
import { LogoChaosEscape } from '#app/components/chaos-escape-logo.tsx'
import { ErrorList } from '#app/components/forms.tsx'
import { SearchBar } from '#app/components/search-bar.tsx'
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
	if (!searchTerm) {
		return json({ status: 'idle', searchResults: null } as const)
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
      LIMIT 20
    `

	const result = SearchResultsSchema.safeParse(rawSearchResults)
	if (!result.success) {
		return json({ status: 'error', error: result.error.message } as const, {
			status: 400,
		})
	}

	return json({ status: 'idle', searchResults: result.data } as const)
}

export default function Index() {
	const data = useLoaderData<typeof loader>()

	//TODO: implement search & query logic of load
	const isPending = useDelayedIsPending({
		formMethod: 'GET',
		formAction: '/',
	})
	if (data.status === 'error') {
		console.error(data.error)
	}

	const [searchParams] = useSearchParams()
	const searchTerm = useMemo(
		() => searchParams.get('search') ?? '',
		[searchParams],
	)

	return (
		<div className="hp-custom-height mx-auto flex flex-col justify-center bg-[url(/img/bg-hp-min.png)] bg-cover bg-center text-center text-white">
			<h1 className="hidden">Chaos Escape</h1>
			<div className="mb-16 flex flex-col items-center">
				<div className="mb-4">
					<LogoChaosEscape className="max-w-full px-8" />
				</div>

				<h2 className="text-[22px] font-[300] capitalize">
					your ultimate car world guru
				</h2>
			</div>

			<div>
				<Button
					className="mb-5 text-xl font-semibold text-foreground"
					size="wide"
					variant="primary"
				>
					Find Your Car
				</Button>

				<div className="mx-auto mb-4 max-w-[400px] text-foreground">
					<div className="w-full text-center max-md:px-4">
						<div className="relative w-full max-w-[700px]">
							<SearchBar
								actionUrl=""
								status={data.status}
								// autoFocus
								autoSubmit
							/>

							<div className="absolute w-full">
								{data.status === 'idle' ? (
									data.searchResults && data.searchResults.length ? (
										<ul
											className={cn(
												'mt-2 flex w-full flex-col gap-2 rounded-xl bg-background p-4 delay-200',
												{
													'opacity-50': isPending,
												},
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
														className="flex flex-col items-center justify-center rounded-lg bg-muted px-5 py-8 transition duration-200 hover:bg-highlight hover:text-highlight-foreground"
													>
														<span className="overflow-hidden text-ellipsis whitespace-nowrap text-center text-body-md">
															{result.title}
														</span>
													</Link>
												</li>
											))}
										</ul>
									) : (
										searchTerm !== '' && (
											<div className="mt-2 flex w-full flex-col gap-2 rounded-xl bg-background p-4 delay-200">
												<p className="px-5 py-8">
													No results for "{searchTerm}" found.
												</p>
											</div>
										)
									)
								) : data.status === 'error' ? (
									<ErrorList
										errors={['There was an error parsing the results']}
									/>
								) : null}
							</div>
						</div>
					</div>
				</div>

				<h3 className="text-md capitalize">search, compare, find dealer</h3>
			</div>
		</div>
	)
}

export const meta: MetaFunction = () => [{ title: 'Welcome To Chaos Escape' }]
