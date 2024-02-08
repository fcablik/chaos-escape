import { type MetaFunction } from '@remix-run/node'
import { LogoChaosEscape } from '#app/components/chaos-escape-logo.tsx'
import { Button } from '#app/components/ui/button.tsx'

export default function Index() {
// trigger header's search here from the button with "handleSearchState"

	return (
		<div className="custom-full-height-minus-header mx-auto flex flex-col justify-center bg-[url(/img/bg-hp-min.png)] bg-cover bg-center text-center text-white">
			<h1 className="hidden">Chaos Escape</h1>
			<div className="mb-16 flex flex-col items-center">
				<div className="mb-4">
					<LogoChaosEscape className="max-w-full px-8" />
				</div>

				<h2 className="text-[22px] font-[300] capitalize">
					your ultimate car world guru
				</h2>
			</div>

			<Button
				className="rounded-full h-14 px-16 lg:rounded-full mx-auto mb-4 max-w-[400px] text-foreground"
				// onClick={handleSearchState}
			>
				Find Your Car
			</Button>
		</div>
	)
}

export const meta: MetaFunction = () => [{ title: 'Welcome To Chaos Escape' }]
