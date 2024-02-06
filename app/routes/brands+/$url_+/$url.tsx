import { json, type DataFunctionArgs, type MetaFunction } from '@remix-run/node'
import { Link, Outlet, useLoaderData } from '@remix-run/react'
import { baseContainerWidthClassList, frontendRoutesSpacingFromHeaderAndFooter } from '#app/components/classlists.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import {
	GallerySlider,
	CarModelPreviewImagesSlider,
} from '#app/components/image-sliders.tsx'
import { Spacer } from '#app/components/spacer.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { SimilarItemsLoader } from '#app/routes/resources+/_similar-items-loader.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { cn, getCarModelsGalleryImgSrc } from '#app/utils/misc.tsx'
import { useOptionalUser } from '#app/utils/user.ts'

export async function loader({ params }: DataFunctionArgs) {
	const carModel = await prisma.carModel.findUnique({
		where: { url: params.url },
		select: {
			id: true,
			url: true,
			title: true,
			description: true,
			seo: true,
			visibility: true,
			carModelFacility: {
				select: {
					id: true,
					name: true,
					iconName: true,
				},
			},
			carModelGalleryImages: {
				select: {
					id: true,
					altText: true,
				},
			},
			carModelPreviewImages: {
				select: {
					id: true,
					altText: true,
				},
			},
		},
	})

	if (!carModel || !carModel.visibility) {
		throw new Response('not found', { status: 404 })
	}

	const carModelCurrentSeasonalPrices = await prisma.carModel.findUnique({
		where: { id: carModel.id },
		select: {
			id: true,
		},
	})

	return json({
		carModel,
		carModelCurrentSeasonalPrices,
	})
}

export default function CarModelUrlRoute() {
	const data = useLoaderData<typeof loader>()
	const isUserLoggedIn = useOptionalUser()
	const carModel = data.carModel
	const carModelGallery = carModel.carModelGalleryImages
	const previewImages = carModel.carModelPreviewImages
	const content = carModel.description ? carModel.description : ''
	const carModelDescriptionHtml = content ? { __html: content } : null

	return (
		<div className={cn(baseContainerWidthClassList, frontendRoutesSpacingFromHeaderAndFooter)}>
			{previewImages.length ? (
				<div className="relative z-1000 h-[50vh] max-h-[550px] min-h-[350px]">
					{previewImages.length > 1 ? (
						<CarModelPreviewImagesSlider
							images={previewImages}
							carModelSeo={carModel.seo ?? ''}
							carModelTitle={carModel.title}
						/>
					) : (
						<>
							<img
								className="pointer-events-none h-full w-full rounded-2xl bg-cover bg-center object-cover"
								src={getCarModelsGalleryImgSrc(previewImages[0].id)}
								alt={previewImages[0].altText ?? carModel.seo ?? carModel.title}
							/>
							<div className="absolute inset-0 rounded-2xl bg-gradient-to-l from-transparent to-black opacity-60"></div>
						</>
					)}

					<div className="absolute left-10 top-1/2 z-999 -translate-y-1/2 text-background">
						<h1 className="text-h3 lg:text-h1">CarModel {carModel.title}</h1>
						<p className="mt-1 text-xl">carModel.shortDescription</p>
						{isUserLoggedIn ? (
							<div className="mt-4">
								<Link to={'/admin/models/' + carModel.id}>
									<Button variant="secondary" className="text-xs" size="sm">
										edit carModel
									</Button>
								</Link>
							</div>
						) : null}
					</div>
				</div>
			) : null}

			<div className={cn('mb-16 mt-16 md:relative md:mb-20 lg:mb-24')}>
				<div>
					<h3 className="text mb-2 text-2xl font-bold">Facility</h3>
					<div className="flex flex-wrap gap-5">
						{carModel.carModelFacility.length ? (
							<div className="flex w-full max-w-[180px] flex-col">
								{carModel.carModelFacility.map((facility, i) => (
									<div key={i} className="flex justify-between">
										<div className="w-1/3">{facility.name}</div>
										<div className="w-1/3">
											{facility.iconName ? (
												<Icon name={facility.iconName} />
											) : (
												'no icon'
											)}
										</div>
									</div>
								))}
							</div>
						) : (
							'CarModel has no selected facilities, Contact us for more informations.'
						)}
					</div>
				</div>

				<div className="mt-16 flex items-start justify-between max-md:flex-col">
					{carModelDescriptionHtml ? (
						<div className="max-md:order-2 md:max-w-[80%] xl:max-w-[60%]">
							<h3 className="text mb-2 text-2xl font-bold">CarModel details</h3>
							<span
								className="pb-2"
								dangerouslySetInnerHTML={carModelDescriptionHtml}
							/>
						</div>
					) : null}
				</div>

				{carModelGallery.length ? (
					<>
						<h3 className="text mb-2 text-center text-2xl font-bold">
							Gallery
						</h3>

						{carModelGallery.length > 1 ? (
							<GallerySlider
								images={carModelGallery}
								carModelSeo={carModel.seo ?? ''}
								carModelTitle={carModel.title}
							/>
						) : (
							<img
								className="pointer-events-none max-h-[300px] w-full object-contain"
								src={getCarModelsGalleryImgSrc(carModelGallery[0].id)}
								alt={
									carModelGallery[0].altText ?? carModel.seo ?? carModel.title
								}
							/>
						)}
					</>
				) : null}
			</div>

			<SimilarItemsLoader />
			<Outlet />
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
							No carModel with the carModel url "{params.url}" exists
						</h3>

						<Spacer size="sm" />

						<Link to="/">
							<Button variant="default" className="text-xs" size="sm">
								go home
							</Button>
						</Link>
					</div>
				),
			}}
		/>
	)
}

export const meta: MetaFunction<typeof loader> = ({ data, params }) => {
	const displayName = data?.carModel.title ?? params.url
	const seoContent = data?.carModel.seo ?? params.title

	return [
		{ title: `${displayName} | chaos escape` },
		{
			name: 'description',
			content: seoContent,
		},
	]
}
