import { json, type DataFunctionArgs } from '@remix-run/node'
import { Link, useLoaderData, useNavigate } from '@remix-run/react'
import { adminDetailBoxesClassList } from '#app/components/classlists.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { getDealerImgSrc, cn, invariantResponse } from '#app/utils/misc.tsx'

export async function loader({ params }: DataFunctionArgs) {
	const dealer = await prisma.dealer.findUnique({
		where: { id: params.id },
		select: {
			id: true,
			url: true,
			name: true,
			images: {
				select: {
					id: true,
					altText: true,
				},
			},
		},
	})
	invariantResponse(dealer, 'Not found', { status: 404 })
	return json({
		dealer,
	})
}


export default function AdminDealerIdRoute() {
	const data = useLoaderData<typeof loader>()
	const dealer = data.dealer

	const navigate = useNavigate()
	const goBack = () => navigate(-1)

	return (
		<div className="px-2 md:px-6 xl:mx-auto xl:max-w-[1200px] 2xl:max-w-[1300px]">
			<div className="flex justify-between">
				<Button
					onClick={goBack}
					variant="secondary"
					className="text-xs capitalize"
				>
					go back
				</Button>

				<Link to="edit">
					<Button variant="default">edit</Button>
				</Link>
			</div>
			<hr className="my-8 border-secondary" />

			<div className="mb-5 flex max-xl:flex-col xl:gap-5">
				<div className={cn(adminDetailBoxesClassList, 'max-xl:mb-5 xl:w-1/2')}>
					<h4 className="mb-4 text-h4">
						Title: <span className="underline">{dealer.name}</span>
					</h4>

					<div>
						<p>
							<span className="text-highlight dark:text-highlight">
								id:&nbsp;
							</span>
							{dealer.id}
						</p>
						<p>
							<span className="text-highlight dark:text-highlight">
								url:&nbsp;
							</span>
							/{dealer.url}
						</p>
					</div>
				</div>
			</div>

			<div>
				<div className="mb-12 flex max-xl:flex-col xl:gap-5">
					<div className={cn(adminDetailBoxesClassList, 'xl:w-1/2')}>
						<h4 className="mb-6 text-h4">Gallery Images</h4>

						{dealer.images.length ? (
							<>
								<div className="flex gap-5 flex-wrap">
									{dealer.images.map(image => (
										<div key={image.id}>
											{/* <a
												href={getDealerImgSrc(image.id)}
												target="_blank"
												rel="noreferrer"
											> */}
												<img
													src={getDealerImgSrc(image.id)}
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
											dealer's&nbsp;edit
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
										dealer's&nbsp;edit
									</Link>{' '}
									section.
								</span>
							</>
						)}
					</div>
				</div>
			</div>
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
							No dealer with the id "{params.id}" exists
						</h3>
					</div>
				),
			}}
		/>
	)
}
