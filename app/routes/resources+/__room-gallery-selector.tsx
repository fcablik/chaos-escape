import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { type Room, type RoomsGalleryImage } from '@prisma/client'
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
import { getRoomsGalleryImgSrc } from '#app/utils/misc.tsx'
import { redirectWithToast } from '#app/utils/toast.server.ts'

const RoomEditorSchema = z.object({
	id: z.string().optional(),
	roomGalleryImages: z
		.array(z.string().transform(value => value.split(',')))
		.optional(),
})

export async function action({ request, params }: DataFunctionArgs) {
	const formData = await request.formData()

	const submission = await parse(formData, {
		schema: RoomEditorSchema.superRefine(async (data, ctx) => {
			if (!data.id) return

			const room = await prisma.room.findUnique({
				select: { id: true },
				where: { id: data.id },
			})
			if (!room) {
				ctx.addIssue({
					code: 'custom',
					message: 'Room not found',
				})
			}
		}).transform(async ({ roomGalleryImages = [], ...data }) => {
			return {
				...data,
				roomGalleryImages: roomGalleryImages,
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

	const { id: roomId, roomGalleryImages = [] } = submission.value

	const updatedRoom = await prisma.room.update({
		select: { id: true, title: true },
		where: { id: roomId ?? '__new_room__' },
		data: {
			roomGalleryImages: {
				set: [],
				connect: roomGalleryImages.length
					? roomGalleryImages[0].map(gallerImageId => ({ id: gallerImageId }))
					: [],
			},
		},
	})

	let toastTitle
	let toastDescription
	if (params.id) {
		toastTitle = 'Room Edited!'
		toastDescription = 'Your edits were saved. 😊'
	} else {
		toastTitle = 'Room Created!'
		toastDescription = `Room: "${updatedRoom.title}" successfully created!`
	}

	return redirectWithToast(`/admin/rooms/${updatedRoom.id}`, {
		type: 'success',
		title: toastTitle,
		description: toastDescription,
	})
}

export function GallerySelector({
	room,
	galleries,
}: {
	room?: SerializeFrom<
		Pick<Room, 'id'> & {
			roomGalleryImages: Array<Pick<RoomsGalleryImage, 'id'>>
		}
	>
	galleries?: object //{ id: string, name: string, images: { id: string } }
}) {
	const roomFetcher = useFetcher<typeof action>()
	const isPending = roomFetcher.state !== 'idle'

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
		room?.roomGalleryImages?.map(gallery => gallery.id) ?? [],
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
		id: 'room-editor',
		constraint: getFieldsetConstraint(RoomEditorSchema),
		lastSubmission: roomFetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: RoomEditorSchema })
		},
		// defaultValue: {
		// 	roomGalleryImages: room?.roomGalleryImages
		// 		? (room?.roomGalleryImages).map(galleryImage => galleryImage.id)
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
				{room ? <input type="hidden" name="id" value={room.id} /> : null}

				<div className="mt-12 flex flex-col gap-1">
					{allImages.length ? (
						<>
							<Field
								labelProps={{ children: 'Gallery Images' }}
								inputProps={{
									...conform.input(fields.roomGalleryImages, {
										ariaAttributes: true,
									}),
									type: 'hidden',
									name: 'roomGalleryImages',
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
														src={getRoomsGalleryImgSrc(galleryImage.id)}
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
					<p>No room with the id "{params.roomId}" exists</p>
				),
			}}
		/>
	)
}
