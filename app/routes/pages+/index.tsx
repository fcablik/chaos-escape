import { json } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import React from 'react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Spacer } from '#app/components/spacer.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'

export async function loader() {
	const pages = await prisma.page.findMany({
		select: {
			id: true,
			url: true,
			title: true,
			seo: true,
			visibility: true,
		},
	})
	if (!pages) {
		throw new Response('not found', { status: 404 })
	}
	return json({ pages })
}

export default function PagesIndex() {
	const data = useLoaderData<typeof loader>()

	const pagesVisibility = data.pages
		.map(page => page.visibility ?? true)
		.filter(Boolean)

	return (
		<div className="text-center">
			<h1 className="text-h1">Pages</h1>
			<Spacer size="sm" />

			{data.pages.length && pagesVisibility?.length ? (
				<div
					id="list"
					className="px-2 py-4 sm:mx-auto sm:max-w-[550px] md:max-w-[650px] lg:max-w-[750px] lg:px-0 lg:py-12"
				>
					<div className="flex flex-row flex-wrap justify-between">
						{data.pages.map(page => (
							<React.Fragment key={page.id}>
								{page.visibility ? (
									<>
										<div className="w-1/2 p-2 text-center md:p-6">
											<div className="z-1 border bg-background px-3 pb-6 pt-4 transition-opacity hover:opacity-95 lg:px-4 lg:pb-10 lg:pt-6">
												<Link to={page.url} className="text-center">
													<div className="overflow-hidden py-6 lg:p-8">
														<div>{page.title}</div>
														<div>{page.seo}</div>
													</div>

													<Button variant="secondary" className="">
														Detail
													</Button>
												</Link>
											</div>
										</div>
									</>
								) : null}
							</React.Fragment>
						))}
					</div>
				</div>
			) : (
				<p>Seems like no pages are live at this moment. 😏</p>
			)}
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
