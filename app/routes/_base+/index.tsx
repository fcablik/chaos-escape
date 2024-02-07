import { json, type DataFunctionArgs, type MetaFunction } from '@remix-run/node'
import {
	Link,
	useLoaderData,
	useNavigate,
	useSearchParams,
} from '@remix-run/react'
import { useMemo } from 'react'
import { z } from 'zod'
import { LogoChaosEscape } from '#app/components/chaos-escape-logo.tsx'
import { ErrorList } from '#app/components/forms.tsx'
import { modalBackDropOverMenuClassList } from '#app/components/modal-backdrop.tsx'
import { SearchBar } from '#app/components/search-bar.tsx'
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
	const likeParts = searchTerm.split(' ').map(part => `%${part}%`)

	// TODO: in future, extend search params to look for individual string parts - e.g. "500 speciale" and "speciale 500" should find the same item.. (TBD)
	const rawSearchResults = await prisma.$queryRaw`
		SELECT 
			m.id, 
			m.url, 
			m.title, 
			'CarModel' as type,
			b.title as carBrandTitle
		FROM CarModel m
		JOIN CarBrand b ON m.carBrandId = b.id
			WHERE (m.visibility = true)
			AND (
				m.title LIKE ${like}
				OR m.url LIKE ${like}
				OR m.carBrandId LIKE ${like}
				OR m.carBrandId LIKE ${likeParts[0]} AND m.title LIKE ${likeParts[1]}
				OR m.title LIKE ${likeParts[0]} AND m.carBrandId LIKE ${likeParts[1]}
			)
		UNION
		SELECT id, url, title, 'CarBrand' as type, NULL as carBrandTitle
		FROM CarBrand
			WHERE (visibility = true AND title LIKE ${like})
		UNION
		SELECT id, url, name as title, 'Dealer' as type, NULL as carBrandTitle
		FROM Dealer
			WHERE name LIKE ${like}
		LIMIT 20
	`;

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

	const navigate = useNavigate()
	const closeSearchBackdrop = () => {
		navigate('/')
	}

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
				<div className={cn(
					"mx-auto mb-4 max-w-[400px] text-foreground",
				)}> {/*sticky to top: sticky top-[65px] */}
					<div className="w-full text-center max-md:px-4">
						{data.status === 'idle' && searchTerm !== '' && (
							<div
								onClick={closeSearchBackdrop}
								className={modalBackDropOverMenuClassList}
							/>
						)}

						<div className="relative z-4001">
							{/* fixed to top on mobiles: data.status === 'idle' && searchTerm !== '' && "max-md:fixed max-md:w-full max-md:left-1/2 max-md:-translate-x-1/2 max-md:top-[65px]", */}
							<SearchBar
								actionUrl=""
								status={data.status}
								// autoFocus
								autoSubmit
								placeholder='find your car'
								classList="z-3001 w-full flex items-center justify-center"
								inputClassList={cn(
									'h-14 rounded-full placeholder:capitalize text-center transition-all duration-100 ease-out',
									'focus-visible:w-full',
									data.status === 'idle' && searchTerm === '' ? 'w-2/3' : 'w-full',
								  )}
								  
							/>

							<div className="absolute z-3000 top-0 w-full">
								{data.status === 'idle' ? (
									data.searchResults && data.searchResults.length ? (
										<ul
											className={cn(
												'no-scrollbar flex max-h-[420px] flex-col gap-3 overflow-y-scroll rounded-3xl bg-background pb-6 px-6 pt-20 w-full delay-200',
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
														className="flex flex-col items-center justify-center rounded-2xl bg-muted px-5 py-8 transition duration-200 hover:bg-highlight hover:text-highlight-foreground"
													>
														<span className="overflow-hidden text-ellipsis whitespace-nowrap text-center text-body-md">
															{result.carBrandTitle} {result.title}
														</span>
													</Link>
												</li>
											))}
										</ul>
									) : (
										searchTerm !== '' && (
											<div className="flex flex-col gap-2 rounded-3xl bg-background pb-6 px-6 pt-20 w-full delay-200">
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
