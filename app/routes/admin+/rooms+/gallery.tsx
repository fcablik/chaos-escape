import { json } from '@remix-run/node'
import { Link, Outlet, useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { action } from '#app/routes/resources+/__rooms-gallery-editor.tsx'
import { prisma } from '#app/utils/db.server.ts'

export { action }

export async function loader() {
	const roomsGalleries = await prisma.roomsGallery.findMany({
		select: {
			id: true,
			name: true,
		},
	})
	if (!roomsGalleries) {
		throw new Response('not found', { status: 404 })
	}
	return json({ roomsGalleries })
}

export default function GalleriesRoute() {
	const data = useLoaderData<typeof loader>()

	return (
		<div className="relative flex flex-col items-center justify-center gap-6 py-8">
			<Outlet />

			<div className="mb-12 w-full">
				<h5 className="mb-4 text-h5 capitalize">create new roomsGalleries</h5>
				<Link to="createnew">
					<Button variant="highlight">createnew</Button>
				</Link>
			</div>

			{data.roomsGalleries.length ? (
				<div className="w-full">
					<h5 className="mb-6 pb-4 text-h5 capitalize">
						existing roomsGalleries
					</h5>

					<div className="flex w-full gap-5">
						{data.roomsGalleries.map((gallery, i) => (
							<div
								key={i}
								className="flex w-1/2 justify-between rounded-xl border border-foreground p-4 md:w-1/3"
							>
								<div className="w-1/3">{gallery.name}</div>

								<div className="flex w-2/3 items-center justify-end gap-2 text-right">
									<Link to={gallery.id}>
										<Button variant="primary">detail</Button>
									</Link>

									<Link to={gallery.id + '/delete'}>
										<button className="text-destructive">
											<span aria-hidden>
												<Icon name="cross-1" />
											</span>{' '}
											<span className="sr-only">Remove image</span>
										</button>
									</Link>
								</div>
							</div>
						))}
					</div>
				</div>
			) : (
				<>
					<p className="text-lg">no existing gallerys, create your first</p>
				</>
			)}
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
