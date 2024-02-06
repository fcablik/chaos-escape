import { json } from '@remix-run/node'
import { Link, Outlet, useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Button } from '#app/components/ui/button.tsx'
// import { Icon } from '#app/components/ui/icon.tsx'
import { action } from '#app/routes/resources+/__translation-editor.tsx'
import { prisma } from '#app/utils/db.server.ts'

export { action }

export async function loader() {
	const translations = await prisma.translation.findMany({
		select: {
			id: true,
			tid: true,
			cs: true,
			en: true,
		},
	})
	if (!translations) {
		throw new Response('not found', { status: 404 })
	}
	return json({ translations })
}

export default function TranslationsRoute() {
	const data = useLoaderData<typeof loader>()
	const reversedTranslations = data.translations.slice().reverse()

	return (
		<div className="relative flex flex-col items-center justify-center gap-6 py-8">
			<Outlet />

			<div className="mb-12 w-full md:w-1/2">
				<h5 className="mb-4 text-h5 capitalize">create new translations</h5>
				<Link to="createnew">
					<Button variant="highlight">createnew</Button> 
					<div> !! // filip's access only, will be removed for release as these will be already set and only editable</div>
				</Link>
			</div>

			{data.translations.length ? (
				<div className="w-full md:w-1/2">
					<h5 className="mb-6 border-b border-foreground pb-4 text-h5 capitalize">
						existing translations
					</h5>

					<div className="flex flex-col gap-2">
						{/* // !reversed mapping */}
						{reversedTranslations.map((translation, i) => (
							<div key={i} className="flex w-full">
								<div className="w-1/3">{translation.tid}</div>

								<div className="w-1/3">
									cs: {translation.cs}
									<br/>
									en: {translation.en}
								</div>

								<div className="w-1/3 text-right">
									<Link to={`${translation.id}/edit`}>
										<Button variant="primary">edit</Button>
									</Link>

									{/* <Link to={translation.id + '/delete'}>
										<button className="text-destructive">
											<span aria-hidden>
												<Icon name="cross-1" />
											</span>{' '}
											<span className="sr-only">Remove image</span>
										</button>
									</Link> */}
								</div>
							</div>
						))}
					</div>
				</div>
			) : (
				<>
					<p className="text-lg">no existing translations, create your first</p>
				</>
			)}
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
