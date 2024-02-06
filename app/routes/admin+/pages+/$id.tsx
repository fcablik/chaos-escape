import { json, type DataFunctionArgs } from '@remix-run/node'
import { Link, useFetcher, useLoaderData, useNavigate } from '@remix-run/react'
import { adminDetailBoxesClassList } from '#app/components/classlists.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { getPageImgSrc, cn, invariantResponse } from '#app/utils/misc.tsx'

export async function loader({ params }: DataFunctionArgs) {
	const page = await prisma.page.findUnique({
		where: { id: params.id },
		select: {
			id: true,
			url: true,
			title: true,
			content: true,
			visibility: true,
			images: {
				select: {
					id: true,
					altText: true,
				},
			},
			seo: true,
			// previewImageId: true,
		},
	})
	invariantResponse(page, 'Not found', { status: 404 })
	return json({
		page,
		isVisible: Boolean(page.visibility),
	})
}

export async function action({ request, params }: DataFunctionArgs) {
	const form = await request.formData()
	const isVisible = form.get('isVisible') === 'true'

	if (isVisible) {
		await prisma.page.update({
			where: { id: params.id },
			data: { visibility: true },
			select: { id: true },
		})
	} else {
		await prisma.page.update({
			where: { id: params.id },
			data: { visibility: false },
			select: { id: true },
		})
	}
	return json({ status: 'success' })
}

export default function AdminPageIdRoute() {
	const data = useLoaderData<typeof loader>()
	const page = data.page

	const visibilityFetcher = useFetcher()
	const pendingVisible = visibilityFetcher.state !== 'idle'
	const isVisible = pendingVisible
		? visibilityFetcher.formData?.get('isVisible') === 'true'
		: data.isVisible

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
						Title: <span className="underline">{page.title}</span>
					</h4>

					<div>
						<p>
							<span className="text-highlight dark:text-highlight">
								id:&nbsp;
							</span>
							{page.id}
						</p>
						<p>
							<span className="text-highlight dark:text-highlight">
								url:&nbsp;
							</span>
							/{page.url}
						</p>
					</div>

					<div className="mt-8 flex items-center gap-2 sm:gap-5">
						<div className="min-w-[8em]">
							<div>
								<span className="text-highlight dark:text-highlight">
									visibility:
								</span>{' '}
								<span
									className={
										page.visibility ? 'text-highlight' : 'text-red-500'
									}
								>
									{page.visibility ? 'visible' : 'hidden'}
								</span>
							</div>
						</div>

						<visibilityFetcher.Form method="POST">
							<input
								type="hidden"
								name="isVisible"
								value={(!isVisible).toString()}
							/>
							<Button variant="secondary" className="min-w-[6em]" type="submit">
								{isVisible ? 'hide' : 'publish'}
							</Button>
						</visibilityFetcher.Form>

						{page.visibility ? (
							<Link to={'/pages/' + page.url} target="_blank">
								<Button variant="secondary">see live</Button>
							</Link>
						) : null}
					</div>
				</div>

				<div className={cn(adminDetailBoxesClassList, 'z-50 xl:w-1/2')}>
					<h4 className="mb-4 text-h4 capitalize">SEO</h4>

					<p>{page.seo}</p>
				</div>
			</div>

			<div>
				<div className="mb-12 flex max-xl:flex-col xl:gap-5">
					<div
						className={cn(adminDetailBoxesClassList, 'max-xl:mb-5 xl:w-1/2')}
					>
						<h4 className="mb-6 text-h4">Descriptions</h4>
						<p className="max-w-full max-h-[35vh] overflow-scroll whitespace-break-spaces">{page.content}</p>
					</div>

					<div className={cn(adminDetailBoxesClassList, 'xl:w-1/2')}>
						<h4 className="mb-6 text-h4">Gallery Images</h4>

						{page.images.length ? (
							<>
								<div className="flex gap-5 flex-wrap">
									{page.images.map(image => (
										<div key={image.id}>
											{/* <a
												href={getPageImgSrc(image.id)}
												target="_blank"
												rel="noreferrer"
											> */}
												<img
													src={getPageImgSrc(image.id)}
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
											page's&nbsp;edit
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
										page's&nbsp;edit
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
							No page with the id "{params.id}" exists
						</h3>
					</div>
				),
			}}
		/>
	)
}
