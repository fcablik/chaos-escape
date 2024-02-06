import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { type CarModel, type CarModelsGalleryImage } from '@prisma/client'
import {
	json,
	type DataFunctionArgs,
	type SerializeFrom,
} from '@remix-run/node'
import { Form, useFetcher } from '@remix-run/react'
import { useState } from 'react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { ErrorList, Field } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { getCarModelsGalleryImgSrc } from '#app/utils/misc.tsx'
import { redirectWithToast } from '#app/utils/toast.server.ts'

const CarModelEditorSchema = z.object({
	id: z.string().optional(),
	carModelGalleryImages: z
		.array(z.string().transform(value => value.split(',')))
		.optional(),
})

export async function action({ request, params }: DataFunctionArgs) {
	const formData = await request.formData()

	const submission = await parse(formData, {
		schema: CarModelEditorSchema.superRefine(async (data, ctx) => {
			if (!data.id) return

			const carModel = await prisma.carModel.findUnique({
				select: { id: true },
				where: { id: data.id },
			})
			if (!carModel) {
				ctx.addIssue({
					code: 'custom',
					message: 'CarModel not found',
				})
			}
		}).transform(async ({ carModelGalleryImages = [], ...data }) => {
			return {
				...data,
				carModelGalleryImages: carModelGalleryImages,
			}
		}),
		async: true,
	})

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}

	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	const { id: carModelId, carModelGalleryImages = [] } = submission.value

	const updatedCarModel = await prisma.carModel.update({
		select: { id: true, title: true },
		where: { id: carModelId ?? '__new_carModel__' },
		data: {
			carModelGalleryImages: {
				set: [],
				connect: carModelGalleryImages.length
					? carModelGalleryImages[0].map(gallerImageId => ({ id: gallerImageId }))
					: [],
			},
		},
	})

	let toastTitle
	let toastDescription
	if (params.id) {
		toastTitle = 'CarModel Edited!'
		toastDescription = 'Your edits were saved. 😊'
	} else {
		toastTitle = 'CarModel Created!'
		toastDescription = `CarModel: "${updatedCarModel.title}" successfully created!`
	}

	return redirectWithToast(`/admin/models/${updatedCarModel.id}`, {
		type: 'success',
		title: toastTitle,
		description: toastDescription,
	})
}

export function GallerySelector({
	carModel,
	galleries,
}: {
	carModel?: SerializeFrom<
		Pick<CarModel, 'id'> & {
			carModelGalleryImages: Array<Pick<CarModelsGalleryImage, 'id'>>
		}
	>
	galleries?: object //{ id: string, name: string, images: { id: string } }
}) {
	const carModelFetcher = useFetcher<typeof action>()
	const isPending = carModelFetcher.state !== 'idle'

	// handling gallery images selection and their selected/non-selected states
	const allImages = galleries
		? Object.values(galleries).flatMap(item =>
				item.images.map((image: { id: string }) => ({
					id: image.id,
					galleryName: item.name,
				})),
		  )
		: []

	// Define a state variable to hold selected galleryImage IDs
	const [selectedGalleryImages, setSelectedGalleryImages] = useState<string[]>(
		carModel?.carModelGalleryImages?.map(gallery => gallery.id) ?? [],
	)

	// Handle checkbox changes
	const handleGalleryImagesChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const galleryImageId = event.target.value
		if (event.target.checked) {
			// Gallery Image is selected, add it to the selectedGalleryImages array
			setSelectedGalleryImages([...selectedGalleryImages, galleryImageId])
		} else {
			// Gallery Image is unselected, remove it from the selectedGalleryImages array
			setSelectedGalleryImages(
				selectedGalleryImages.filter(id => id !== galleryImageId),
			)
		}
	}

	const [form, fields] = useForm({
		id: 'carModel-editor',
		constraint: getFieldsetConstraint(CarModelEditorSchema),
		lastSubmission: carModelFetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: CarModelEditorSchema })
		},
		// defaultValue: {
		// 	carModelGalleryImages: carModel?.carModelGalleryImages
		// 		? (carModel?.carModelGalleryImages).map(galleryImage => galleryImage.id)
		// 		: selectedGalleryImages,
		// },
	})

	return (
		<div className="">
			<Form method="post" {...form.props} encType="multipart/form-data">
				{/*
					This hidden submit button is here to ensure that when the user hits
					"enter" on an input field, the primary form function is submitted
					rather than the first button in the form (which is delete/add image).
				*/}
				<button type="submit" className="hidden" />
				{carModel ? <input type="hidden" name="id" value={carModel.id} /> : null}

				<div className="mt-12 flex flex-col gap-1">
					{allImages.length ? (
						<>
							<Field
								labelProps={{ children: 'Gallery Images' }}
								inputProps={{
									...conform.input(fields.carModelGalleryImages, {
										ariaAttributes: true,
									}),
									type: 'hidden',
									name: 'carModelGalleryImages',
									value: selectedGalleryImages,
								}}
							/>

							<div className="flex gap-10 text-center">
								{allImages.map((galleryImage, i) => (
									<div key={i}>
										gallery: {galleryImage.galleryName}
										<label>
											<div className="flex flex-col gap-2">
												<input
													type="checkbox"
													name="galleryImages"
													value={galleryImage.id}
													checked={selectedGalleryImages.includes(
														galleryImage.id,
													)}
													onChange={handleGalleryImagesChange}
												/>
												<div>
													<img
														src={getCarModelsGalleryImgSrc(galleryImage.id)}
														alt=""
														className="h-16 w-16 rounded-lg object-cover"
													/>
												</div>
											</div>
										</label>
									</div>
								))}
							</div>
						</>
					) : (
						<>
							<label>gallery images</label>
							<div>"No gallery images available"</div>
							<div className="min-h-[16px] px-4 pb-3 pt-1"></div>
						</>
					)}
				</div>

				<ErrorList id={form.errorId} errors={form.errors} />
			</Form>

			<div className="mt-8 flex justify-center gap-5 md:mt-16">
				<Button form={form.id} variant="destructive" type="reset">
					Reset
				</Button>
				<StatusButton
					form={form.id}
					type="submit"
					disabled={isPending}
					status={isPending ? 'pending' : 'idle'}
				>
					Submit
				</StatusButton>
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No carModel with the id "{params.carModelId}" exists</p>
				),
			}}
		/>
	)
}
