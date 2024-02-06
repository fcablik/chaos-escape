import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { type RoomFacility, type Room } from '@prisma/client'
import {
	json,
	type DataFunctionArgs,
	type SerializeFrom,
} from '@remix-run/node'
import { Form, useFetcher } from '@remix-run/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { ErrorList, Field, TextareaField } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'

const urlMaxLength = 50
const titleMinLength = 1
const titleMaxLength = 100
const descriptionMinLength = 1
const descriptionMaxLength = 10000
const seoMaxLength = 156

const urlErrorRef = 'Invalid URL: Use only letters, numbers and dashes.'

const RoomEditorSchema = z.object({
	id: z.string().optional(),
	url: z
		.string({ required_error: 'url is required' })
		.max(urlMaxLength)
		// eslint-disable-next-line no-useless-escape
		.regex(/^[a-zA-Z0-9\-]+$/, {
			message: urlErrorRef,
		})
		//allowing user to input both upper/lower, but always saving it in lowercase
		.transform(value => value.toLowerCase()),
	title: z.string().min(titleMinLength).max(titleMaxLength),
	description: z.string().min(descriptionMinLength).max(descriptionMaxLength),
	seo: z.string().max(seoMaxLength).optional(),
	price1: z.preprocess(
		price1 => parseInt(z.string().parse(price1), 10),
		z.number(),
	),
	additionalNightPrice1: z.preprocess(
		additionalNightPrice1 =>
			parseInt(z.string().parse(additionalNightPrice1), 10),
		z.number(),
	),
	price2: z
		.preprocess(price1 => parseInt(z.string().parse(price1), 10), z.number())
		.optional(),
	additionalNightPrice2: z
		.preprocess(
			additionalNightPrice1 =>
				parseInt(z.string().parse(additionalNightPrice1), 10),
			z.number(),
		)
		.optional(),
	price3: z
		.preprocess(price1 => parseInt(z.string().parse(price1), 10), z.number())
		.optional(),
	additionalNightPrice3: z
		.preprocess(
			additionalNightPrice1 =>
				parseInt(z.string().parse(additionalNightPrice1), 10),
			z.number(),
		)
		.optional(),
	numberOfGuestsForDefaultPrice: z.preprocess(
		count => parseInt(z.string().parse(count), 10),
		z.number(),
	),
	maxGuests: z.preprocess(
		guests => parseInt(z.string().parse(guests), 10),
		z.number(),
	),
	roomFacility: z
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
		}).transform(async ({ roomFacility = [], ...data }) => {
			return {
				...data,
				roomFacility: roomFacility, // Include the roomFacility data
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

	const {
		id: roomId,
		url,
		title,
		description,
		seo,
		price1,
		additionalNightPrice1,
		price2,
		additionalNightPrice2,
		price3,
		additionalNightPrice3,
		numberOfGuestsForDefaultPrice,
		maxGuests,
		roomFacility = [],
	} = submission.value

	const updatedRoom = await prisma.room.upsert({
		select: { id: true, title: true },
		where: { id: roomId ?? '__new_room__' },
		create: {
			url, // has to be unique!! //TODO: error handling unique constraint
			title,
			description,
			seo,
			price1,
			price2,
			price3,
			additionalNightPrice1,
			additionalNightPrice2,
			additionalNightPrice3,
			numberOfGuestsForDefaultPrice,
			maxGuests,
			roomFacility: {
				connect: roomFacility.length
					? roomFacility[0].map(facilityId => ({ id: facilityId }))
					: [],
			},
		},
		update: {
			url,
			title,
			description,
			seo,
			price1,
			price2,
			price3,
			additionalNightPrice1,
			additionalNightPrice2,
			additionalNightPrice3,
			numberOfGuestsForDefaultPrice,
			maxGuests,
			roomFacility: {
				set: [],
				connect: roomFacility.length
					? roomFacility[0].map(facilityId => ({ id: facilityId }))
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

export function RoomEditor({
	room,
	facilities,
	weekParts,
}: {
	room?: SerializeFrom<
		Pick<
			Room,
			| 'id'
			| 'url'
			| 'title'
			| 'description'
			| 'seo'
			| 'price1'
			| 'additionalNightPrice1'
			| 'price2'
			| 'additionalNightPrice2'
			| 'price3'
			| 'additionalNightPrice3'
			| 'numberOfGuestsForDefaultPrice'
			| 'maxGuests'
		> & {
			roomFacility: Array<Pick<RoomFacility, 'id' | 'name' | 'iconName'>>
		}
	>
	facilities?: object
	weekParts: number
}) {
	const roomFetcher = useFetcher<typeof action>()
	const isPending = roomFetcher.state !== 'idle'

	const facilityValues = Object.values(facilities ?? {})
	// Define a state variable to hold selected facility IDs
	const [selectedFacilities, setSelectedFacilities] = useState<string[]>(
		room?.roomFacility?.map(facility => facility.id) ?? [],
	)

	// Handle checkbox changes
	const handleFacilityChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const facilityId = event.target.value
		if (event.target.checked) {
			// Facility is selected, add it to the selectedFacilities array
			setSelectedFacilities([...selectedFacilities, facilityId])
		} else {
			// Facility is unselected, remove it from the selectedFacilities array
			setSelectedFacilities(selectedFacilities.filter(id => id !== facilityId))
		}
	}

	const [form, fields] = useForm({
		id: 'room-editor',
		constraint: getFieldsetConstraint(RoomEditorSchema),
		lastSubmission: roomFetcher.data?.submission,
		onValidate({ formData }) {
			const parsedData = parse(formData, { schema: RoomEditorSchema })
			const errorCheck = parsedData.error

			if (Object.entries(errorCheck).length) {
				if (
					errorCheck.url &&
					errorCheck.url.filter(url => url.includes(urlErrorRef))
				) {
					toast.error(urlErrorRef)
				}
			}

			return parsedData
		},
		defaultValue: {
			url: room?.url ?? '',
			title: room?.title ?? '',
			description: room?.description ?? '',
			seo: room?.seo ?? '',
			price1: room?.price1 ?? '',
			additionalNightPrice1: room?.additionalNightPrice1 ?? '',
			price2: room?.price2 ?? '',
			additionalNightPrice2: room?.additionalNightPrice2 ?? '',
			price3: room?.price3 ?? '',
			additionalNightPrice3: room?.additionalNightPrice3 ?? '',
			numberOfGuestsForDefaultPrice: room?.numberOfGuestsForDefaultPrice ?? '1',
			maxGuests: room?.maxGuests ?? '',
			facilities: room?.roomFacility ?? selectedFacilities,
		},
	})

	return (
		<div className="">
			<Form
				method="post"
				// className="flex h-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden max-md:px-2"
				{...form.props}
				encType="multipart/form-data"
			>
				{/*
					This hidden submit button is here to ensure that when the user hits
					"enter" on an input field, the primary form function is submitted
					rather than the first button in the form (which is delete/add image).
				*/}
				<button type="submit" className="hidden" />
				{room ? <input type="hidden" name="id" value={room.id} /> : null}

				<div className="flex flex-col gap-1">
					{facilityValues.length ? (
						<>
							<Field
								labelProps={{ children: 'Facilities' }}
								inputProps={{
									...conform.input(fields.roomFacility, {
										ariaAttributes: true,
									}),
									type: 'hidden',
									name: 'roomFacility',
									value: selectedFacilities, // Set the selected facility IDs
								}}
							/>

							<div className="flex flex-col gap-2">
								{facilityValues.map((facility, i) => (
									<div key={i}>
										<label>
											<div className="flex">
												<input
													type="checkbox"
													name="facilities" // Use the appropriate field name
													value={facility.id} // Use a unique identifier for each facility
													checked={selectedFacilities.includes(facility.id)} // Check if the facility should be selected
													onChange={handleFacilityChange} // Handle the checkbox change
												/>

												<div className="w-16">
													{facility.iconName ? (
														<Icon name={facility.iconName} />
													) : (
														'no icon'
													)}
												</div>
												<div>{facility.name}</div>
											</div>
										</label>
									</div>
								))}
							</div>
						</>
					) : (
						<>
							<label>facilities</label>
							<div>"No facilities available"</div>
							<div className="min-h-[16px] px-4 pb-3 pt-1"></div>
						</>
					)}

					<div className="grid w-full gap-5 sm:grid-cols-2">
						<Field
							labelProps={{ children: `room's URL` }}
							inputProps={{
								autoFocus: true,
								...conform.input(fields.url, { ariaAttributes: true }),
							}}
							errors={fields.url.errors}
						/>
						<Field
							labelProps={{ children: 'Title' }}
							inputProps={{
								...conform.input(fields.title, { ariaAttributes: true }),
							}}
							errors={fields.title.errors}
						/>
					</div>

					<TextareaField
						labelProps={{ children: 'Description (possible to use html tags)' }}
						textareaProps={{
							...conform.textarea(fields.description, { ariaAttributes: true }),
							className: 'min-h-[150px]',
						}}
						errors={fields.description.errors}
					/>
					<TextareaField
						labelProps={{ children: 'SEO text (max. 156 characters)' }}
						textareaProps={{
							...conform.textarea(fields.seo, { ariaAttributes: true }),
						}}
						errors={fields.seo.errors}
					/>

					<div>
						<div className="flex w-full gap-5">
							<Field
								labelProps={{ children: `1. Price / night` }}
								inputProps={{
									...conform.input(fields.price1, { ariaAttributes: true }),
								}}
								errors={fields.price1.errors}
								className="w-1/2"
							/>
							<Field
								labelProps={{ children: `1. Additional Guest Price / night` }}
								inputProps={{
									...conform.input(fields.additionalNightPrice1, {
										ariaAttributes: true,
									}),
								}}
								errors={fields.additionalNightPrice1.errors}
								className="w-1/2"
							/>
						</div>

						{weekParts > 1 && (
							<>
								<div className="flex w-full gap-5">
									<Field
										labelProps={{ children: `2. Price / night` }}
										inputProps={{
											...conform.input(fields.price2, {
												ariaAttributes: true,
											}),
										}}
										errors={fields.price2.errors}
										className="w-1/2"
									/>
									<Field
										labelProps={{
											children: `2. Additional Guest Price / night`,
										}}
										inputProps={{
											...conform.input(fields.additionalNightPrice2, {
												ariaAttributes: true,
											}),
										}}
										errors={fields.additionalNightPrice2.errors}
										className="w-1/2"
									/>
								</div>

								{weekParts === 3 && (
									<div className="flex w-full gap-5">
										<Field
											labelProps={{ children: `3. Price / night` }}
											inputProps={{
												...conform.input(fields.price3, {
													ariaAttributes: true,
												}),
											}}
											errors={fields.price3.errors}
											className="w-1/2"
										/>
										<Field
											labelProps={{
												children: `3. Additional Guest Price / night`,
											}}
											inputProps={{
												...conform.input(fields.additionalNightPrice3, {
													ariaAttributes: true,
												}),
											}}
											errors={fields.additionalNightPrice3.errors}
											className="w-1/2"
										/>
									</div>
								)}
							</>
						)}
					</div>

					<div className="grid w-full grid-cols-2 items-end gap-5">
						<Field
							labelProps={{
								children: `For how many guests is the default price1? (1 / 2 ...)`,
							}}
							inputProps={{
								...conform.input(fields.numberOfGuestsForDefaultPrice, {
									ariaAttributes: true,
								}),
							}}
							errors={fields.numberOfGuestsForDefaultPrice.errors}
						/>
						<Field
							labelProps={{ children: `Max. Number Of Guests` }}
							inputProps={{
								...conform.input(fields.maxGuests, { ariaAttributes: true }),
							}}
							errors={fields.maxGuests.errors}
						/>
					</div>
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
