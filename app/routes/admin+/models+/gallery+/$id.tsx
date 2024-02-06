import { json, type DataFunctionArgs } from '@remix-run/node'
import { Link, Outlet, useLoaderData, useNavigate } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { modalBackdropClassList } from '#app/components/modal-backdrop.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { getCarModelsGalleryImgSrc, invariantResponse } from '#app/utils/misc.tsx'

export async function loader({ params }: DataFunctionArgs) {
	const gallery = await prisma.carModelsGallery.findUnique({
		where: { id: params.id },
		select: {
			id: true,
			name: true,
			images: {
				select: {
					id: true,
					altText: true,
				},
			},
		},
	})

	invariantResponse(gallery, 'Not found', { status: 404 })
	return json({
		gallery,
	})
}

export default function CarModelIdRoute() {
	const data = useLoaderData<typeof loader>()
	const gallery = data.gallery

	const navigate = useNavigate()
	const goBack = () => navigate('/admin/models/gallery')

	return (
		<>
			<div onClick={goBack} className={modalBackdropClassList} />
			<div className="absolute left-1/2 top-20 z-2001 w-full -translate-x-1/2 rounded-xl bg-white p-4 dark:text-background">
				<div className="px-2 md:px-6 xl:mx-auto xl:max-w-[1200px] 2xl:max-w-[1300px]">
					<div className="flex items-center justify-between">
						<div className="text-lg capitalize">
							Gallery: <span className="font-bold">{data.gallery.name}</span>
						</div>

						<Link to="edit">
							<Button variant="highlight-secondary">edit</Button>
						</Link>
					</div>
					<hr className="my-8 border-secondary" />

					<div>
						<div className="mb-12 flex gap-5 max-xl:flex-col">
							<div className="w-full">
								<h4 className="mb-6 text-h4">Gallery Images</h4>

								{gallery.images.length ? (
									<>
										<div className="flex flex-wrap gap-5">
											{gallery.images.map(image => (
												<div key={image.id}>
													{/* <a
													href={getCarModelsGalleryImgSrc(image.id)}
													target="_blank"
													rel="noreferrer"
												> */}
													<img
														src={getCarModelsGalleryImgSrc(image.id)}
														alt={image.altText ?? ''}
														className="h-16 w-16 rounded-lg object-cover"
													/>
													{/* </a> */}
												</div>
											))}
										</div>
										<div className="mt-6">
											<span>
												...you can add more gallery images in the{' '}
												<Link className="underline" to="edit">
													gallery's&nbsp;edit
												</Link>{' '}
												section.
											</span>
										</div>
									</>
								) : (
									<>
										<span>
											You can add gallery images in the{' '}
											<Link className="underline" to="edit">
												gallery's&nbsp;edit
											</Link>{' '}
											section.
										</span>
									</>
								)}
							</div>
						</div>
					</div>
				</div>

				<Outlet />
			</div>
		</>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<div className="container mx-auto flex h-5/6 flex-col justify-center pb-32 pt-20 text-center">
						<h3 className="text-h3">
							No gallery with the id "{params.id}" exists
						</h3>
					</div>
				),
			}}
		/>
	)
}
