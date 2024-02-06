import { type MetaFunction } from '@remix-run/node'
import { useMatches } from '@remix-run/react'
import { LogoChaosEscape } from '#app/components/chaos-escape-logo.tsx'
import { SearchBar } from '#app/components/search-bar.tsx'
import { Button } from '#app/components/ui/button.tsx'

export default function Index() {
	const matches = useMatches()
	const isOnSearchPage = matches.find(m => m.id === 'routes/users+/index')
	const searchBar = isOnSearchPage ? null : (
		<SearchBar status="idle" actionUrl={'search'} />
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

				<div className="mx-auto max-w-[400px] text-foreground">{searchBar}</div>

				<h3 className="text-md capitalize">search, compare, find dealer</h3>
			</div>
		</div>
	)
}

export const meta: MetaFunction = () => [{ title: 'Welcome To Chaos Escape' }]
