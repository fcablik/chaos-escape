import { type MetaFunction } from '@remix-run/node'
import { Link, useLocation, useSearchParams } from '@remix-run/react'
import { useMemo } from 'react'
import { ErrorList } from '#app/components/forms.tsx'
import { modalBackDropOverMenuClassList } from '#app/components/modal-backdrop.tsx'
import { SearchBar } from '#app/components/search-bar.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { cn, stripLeadingSlash, useDelayedIsPending } from '#app/utils/misc.tsx'

export function GlobalSearchComponent({
	searchData,
	showSearch,
	classList,
	toggleSearch,
}: {
	searchData: {
		status: 'error' | 'success' | 'idle' | 'pending'
		searchResults:
			| {
					id: string
					type: 'CarBrand' | 'CarModel' | 'Dealer'
					title: string | null
					url: string
					carBrandTitle: string | null
			  }[]
			| null
		// error: string
	}
	showSearch: boolean
	classList?: string
	toggleSearch: () => void
}) {
	const data = searchData
	const location = useLocation()
	const currentUrl = location.pathname

	//TODO: implement search & query logic of load
	const isPending = useDelayedIsPending({
		formMethod: 'GET',
		formAction: currentUrl,
	})
	// if (data.status === 'error') {
	// 	console.error(data.error)
	// }

	const [searchParams] = useSearchParams()
	const searchTerm = useMemo(
		() => searchParams.get('search') ?? '',
		[searchParams],
	)

	return (
		<div
			className={cn(
				!showSearch ? 'hidden' : '',
				'custom-full-height-minus-header absolute mx-auto mb-4 w-full py-16 text-foreground',
				classList,
			)}
		>
			{/*sticky to top: sticky top-[65px] */}
			<div className="w-full text-center max-md:px-4">
				<div
					onClick={toggleSearch}
					className={modalBackDropOverMenuClassList}
				/>
				<Icon
					size="xl"
					onClick={toggleSearch}
					className="text-white absolute right-10 top-10 z-5001 cursor-pointer"
					name="cross-1"
				/>

				<div className="relative z-5001">
					{/* fixed to top on mobiles: data.status === 'idle' && searchTerm !== '' && "max-md:fixed max-md:w-full max-md:left-1/2 max-md:-translate-x-1/2 max-md:top-[65px]", */}
					<SearchBar
						actionUrl={stripLeadingSlash(currentUrl)}
						status={data.status}
						// autoFocus
						autoSubmit
						placeholder="find your car"
						classList="z-3001 w-full flex items-center justify-center"
						inputClassList={cn(
							'h-14 rounded-full placeholder:capitalize text-center transition-all duration-100 ease-out',
							'focus-visible:w-full',
							data.status === 'idle' && searchTerm === '' ? 'w-2/3' : 'w-full',
						)}
					/>

					<div className="absolute top-0 z-3000 w-full">
						{data.status === 'idle' ? (
							data.searchResults && data.searchResults.length ? (
								<ul
									className={cn(
										'no-scrollbar flex max-h-[420px] w-full flex-col gap-3 overflow-y-scroll rounded-3xl bg-background px-6 pb-6 pt-20 delay-200',
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
									<div className="flex w-full flex-col gap-2 rounded-3xl bg-background px-6 pb-6 pt-20 delay-200">
										<p className="px-5 py-8">
											No results for "{searchTerm}" found.
										</p>
									</div>
								)
							)
						) : data.status === 'error' ? (
							<ErrorList errors={['There was an error parsing the results']} />
						) : null}
					</div>
				</div>
			</div>
		</div>
	)
}

export const meta: MetaFunction = () => [{ title: 'Welcome To Chaos Escape' }]
