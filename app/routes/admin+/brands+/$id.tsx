import { json, type DataFunctionArgs } from '@remix-run/node'
import {
	Link,
	Outlet,
	useFetcher,
	useLoaderData,
	useNavigate,
} from '@remix-run/react'
import { adminDetailBoxesClassList } from '#app/components/classlists.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import {
	cn,
	invariantResponse,
	getCarBrandImgSrc,
} from '#app/utils/misc.tsx'

export async function loader({ params }: DataFunctionArgs) {
	const carBrand = await prisma.carBrand.findUnique({
		where: { id: params.id },
		select: {
			id: true,
			url: true,
			title: true,
			description: true,
			seo: true,
			visibility: true,
			images: {
				select: {
					id: true,
				},
			},
		},
	})
	invariantResponse(carBrand, 'Not found', { status: 404 })

	return json({
		carBrand,
		isVisible: Boolean(carBrand.visibility),
	})
}

export async function action({ request, params }: DataFunctionArgs) {
	const form = await request.formData()
	const isVisible = form.get('isVisible') === 'true'

	if (isVisible) {
		await prisma.carBrand.update({
			where: { id: params.id },
			data: { visibility: true },
			select: { id: true },
		})
	} else {
		await prisma.carBrand.update({
			where: { id: params.id },
			data: { visibility: false },
			select: { id: true },
		})
	}
	return json({ status: 'success' })
}

export default function CarBrandIdRoute() {
	const data = useLoaderData<typeof loader>()
	const carBrand = data.carBrand

	const visibilityFetcher = useFetcher()
	const pendingVisible = visibilityFetcher.state !== 'idle'
	const isVisible = pendingVisible
		? visibilityFetcher.formData?.get('isVisible') === 'true'
		: data.isVisible

	const navigate = useNavigate()
	const goBack = () => navigate(-1)

	return (
		<>
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

				<div className="mb-5 flex flex-col gap-5">
					<div className={cn(adminDetailBoxesClassList)}>
						<h4 className="mb-8 text-h4">Title: {carBrand.title}</h4>

						<div className="flex justify-between max-xl:flex-col">
							<div>
								<p>
									<span className="text-highlight dark:text-highlight">
										id:&nbsp;
									</span>
									{carBrand.id}
								</p>
								<p>
									<span className="text-highlight dark:text-highlight">
										url:&nbsp;
									</span>
									/{carBrand.url}
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
												carBrand.visibility ? 'text-highlight' : 'text-red-500'
											}
										>
											{carBrand.visibility ? 'visible' : 'hidden'}
										</span>
									</div>
								</div>

								<visibilityFetcher.Form method="POST">
									<input
										type="hidden"
										name="isVisible"
										value={(!isVisible).toString()}
									/>
									<Button
										variant="secondary"
										className="min-w-[6em]"
										type="submit"
									>
										{isVisible ? 'hide' : 'publish'}
									</Button>
								</visibilityFetcher.Form>

								{carBrand.visibility ? (
									<Link to={'/brands/' + carBrand.id} target="_blank">
										<Button variant="secondary">see live</Button>
									</Link>
								) : null}
							</div>
						</div>
					</div>
				</div>

				<div>
					<div className="mb-5 flex gap-5 max-xl:flex-col">
						<div className={cn(adminDetailBoxesClassList, 'xl:w-1/2')}>
							<h4 className="mb-6 text-h4">Descriptions</h4>

							<p className="max-w-full overflow-hidden">{carBrand.description}</p>

							<p className="mt-4 flex max-w-full overflow-hidden">
								<span className="text-highlight dark:text-highlight">
									seo:&nbsp;
								</span>
								<span className="max-w-20"> {carBrand.seo}</span>
							</p>
						</div>
					</div>

					<div className="mb-5 flex gap-5 max-xl:flex-col">
						<div className={cn(adminDetailBoxesClassList, 'xl:w-1/2')}>
							<h4 className="mb-6 text-h4">Images</h4>

							{carBrand.images.length ? (
								<>
									<div className="flex flex-wrap gap-5">
										{carBrand.images.map(image => (
											<div key={image.id}>
												{/* <a
													href={getCarBrandImgSrc(image.id)}
													target="_blank"
													rel="noreferrer"
												> */}
												<img
													src={getCarBrandImgSrc(image.id)}
													alt=""
													className="h-16 w-16 rounded-lg object-cover"
												/>
												{/* </a> */}
											</div>
										))}
									</div>
								</>
							) : (
								<>
									<span>
										You can add image in{' '}
										<Link className="underline" to="edit">
											edit
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
							No brand with the id "{params.id}" exists
						</h3>
					</div>
				),
			}}
		/>
	)
}
