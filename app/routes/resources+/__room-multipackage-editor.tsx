import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { type Room, type RoomMultiPackage } from '@prisma/client'
import {
	json,
	type DataFunctionArgs,
	type SerializeFrom,
} from '@remix-run/node'
import { Form, useFetcher } from '@remix-run/react'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { EditorExtendedOperatorDatesPicker } from '#app/components/editor-extended-operator-dates-picker.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { ErrorList, Field } from '#app/components/forms.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'

const RoomMultiPackageEditorSchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	price: z.preprocess(
		price => parseInt(z.string().parse(price), 10),
		z.number(),
	),
	rooms: z.array(z.string().transform(room => room.split(','))).optional(),
	packageItems: z.array(z.string().transform(item => item.split(','))),
	dateFrom: z.string(),
	dateTo: z.string(),
})

export async function action({ params, request }: DataFunctionArgs) {
	const formData = await request.formData()

	const submission = await parse(formData, {
		schema: RoomMultiPackageEditorSchema.superRefine(async (data, ctx) => {
			if (!data.id) return

			const roomMultiPackage = await prisma.roomMultiPackage.findUnique({
				select: { id: true },
				where: { id: data.id },
			})
			if (!roomMultiPackage) {
				ctx.addIssue({
					code: 'custom',
					message: 'RoomMultiPackage not found',
				})
			}
		}).transform(async ({ rooms = [], packageItems = [], ...data }) => {
			return {
				...data,
				rooms: rooms,
				packageItems: packageItems,
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
		id: seasonId,
		name,
		price,
		rooms = [],
		packageItems = [],
		dateFrom,
		dateTo,
	} = submission.value

	const updatedRoomMultiPackage = await prisma.roomMultiPackage.upsert({
		select: { name: true },
		where: { id: seasonId ?? '__new_season__' },
		create: {
			name,
			price,
			rooms: {
				connect: rooms.length ? rooms[0].map(roomId => ({ id: roomId })) : [],
			},
			packageItems: {
				connect: packageItems.length
					? packageItems[0].map(packageItemId => ({ id: packageItemId }))
					: [],
			},
			dateFrom,
			dateTo,
		},
		update: {
			name,
			price,
			rooms: {
				set: [],
				connect: rooms.length ? rooms[0].map(roomId => ({ id: roomId })) : [],
			},
			packageItems: {
				set: [],
				connect: packageItems.length
					? packageItems[0].map(packageItemId => ({ id: packageItemId }))
					: [],
			},
			dateFrom,
			dateTo,
		},
	})

	let toastTitle
	let toastDescription
	if (params.id) {
		toastTitle = 'RoomMultiPackage Saved!'
		toastDescription = `RoomMultiPackage "${updatedRoomMultiPackage.name}" saved.`
	} else {
		toastTitle = 'RoomMultiPackage Created!'
		toastDescription = `New roomMultiPackage "${updatedRoomMultiPackage.name}" successfully created.`
	}

	return redirectWithToast('/admin/rooms/packagedeals', {
		type: 'success',
		title: toastTitle,
		description: toastDescription,
	})
}

export function RoomMultiPackageEditor({
	existingRoomMultiPackage,
	existingRoomMultiPackages,
	rooms,
	packageItems,
}: {
	existingRoomMultiPackage?: SerializeFrom<
		Pick<RoomMultiPackage, 'id' | 'name' | 'price' | 'dateFrom' | 'dateTo'> & {
			rooms: Array<Pick<Room, 'id' | 'title'>>
		} & {
			packageItems: Array<Pick<RoomMultiPackage, 'id' | 'name'>>
		}
	>
	existingRoomMultiPackages: {
		id: string
		dateFrom: string
		dateTo: string
	}[]
	rooms?: {
		id: string
		title: string
		url: string
	}[]
	packageItems?: {
		id: string
		name: string
	}[]
}) {
	const seasonFetcher = useFetcher<typeof action>()
	const isPending = seasonFetcher.state !== 'idle'

	const [datesErrored, setDatesErrored] = useState(false)

	const roomsValues = rooms ?? []
	// Define a state variable to hold selected room IDs
	const [selectedRooms, setSelectedRooms] = useState<string[]>(
		existingRoomMultiPackage?.rooms?.map(room => room.id) ?? [],
	)
	// Handle checkbox changes
	const handleRoomSelectChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const roomId = event.target.value
		if (event.target.checked) {
			// room is selected, add it to the selectedRooms array
			setSelectedRooms([...selectedRooms, roomId])
		} else {
			// room is unselected, remove it from the selectedRooms array
			setSelectedRooms(selectedRooms.filter(id => id !== roomId))
		}
	}

	const packageItemsValues = packageItems ?? []
	// Define a state variable to hold selected room IDs
	const [selectedPackageItems, setSelectedPackageItems] = useState<string[]>(
		existingRoomMultiPackage?.packageItems?.map(
			packageItem => packageItem.id,
		) ?? [],
	)
	// Handle checkbox changes
	const handlePackageItemSelectChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const packageItemId = event.target.value
		if (event.target.checked) {
			// room is selected, add it to the selectedPackageItems array
			setSelectedPackageItems([...selectedPackageItems, packageItemId])
		} else {
			// room is unselected, remove it from the selectedPackageItems array
			setSelectedPackageItems(
				selectedPackageItems.filter(id => id !== packageItemId),
			)
		}
	}

	const [form, fields] = useForm({
		id: 'roomMultiPackage-editor',
		constraint: getFieldsetConstraint(RoomMultiPackageEditorSchema),
		lastSubmission: seasonFetcher.data?.submission,
		onValidate({ formData }) {
			const parsedData = parse(formData, { schema: RoomMultiPackageEditorSchema })
			const errorCheck = parsedData.error

			if (Object.entries(errorCheck).length) {
				const name = errorCheck.name
				const dateFrom = errorCheck.dateFrom
				const dateTo = errorCheck.dateTo
				// toast.error('Fill-in and select all fields, please.')

				if (dateFrom && dateTo && name) {
					toast.error('Select and fill-in all information, please.')
					setDatesErrored(true)
				} else if (dateFrom && dateTo) {
					toast.error('Select both: Startin & Ending Date, please.')
					setDatesErrored(true)
				} else if (dateFrom) {
					toast.error('Select Starting Date, please.')
					setDatesErrored(true)
				} else if (dateTo) {
					toast.error('Select Ending Date, please.')
					setDatesErrored(true)
				} else if (name) {
					toast.error('SeasonList not filled.')
				}
			}

			return parsedData
		},
		defaultValue: {
			name: existingRoomMultiPackage?.name ?? '',
			price: existingRoomMultiPackage?.price ?? '',
		},
	})

	return (
		<div className="flex flex-col items-center">
			<Form
				method="post"
				className="flex w-full flex-col"
				{...form.props}
				encType="multipart/form-data"
			>
				<div className="flex flex-col justify-between px-8 lg:px-12">
					{/*
						This hidden submit button is here to ensure that when the user hits
						"enter" on an input field, the primary form function is submitted
						rather than the first button in the form (which was delete/add image).
					*/}
					<button type="submit" className="hidden" />

					{existingRoomMultiPackage ? (
						<input
							type="hidden"
							name="id"
							value={existingRoomMultiPackage.id}
						/>
					) : null}

					<div className="flex flex-col gap-1">
						<Field
							labelProps={{
								children: 'name',
								className: 'dark:text-background',
							}}
							inputProps={{
								...conform.input(fields.name, { ariaAttributes: true }),
								placeholder: 'name',
								className: 'bg-backgroundDashboard h-12',
							}}
							errors={fields.name.errors}
						/>

						<Field
							labelProps={{
								children: 'price',
								className: 'dark:text-background',
							}}
							inputProps={{
								...conform.input(fields.price, { ariaAttributes: true }),
								placeholder: 'price',
								className: 'bg-backgroundDashboard h-12',
							}}
							errors={fields.price.errors}
						/>

						{roomsValues.length ? (
							<>
								<Field
									labelProps={{
										children: 'Rooms',
										className: 'dark:text-background',
									}}
									inputProps={{
										...conform.input(fields.rooms, {
											ariaAttributes: true,
										}),
										type: 'hidden',
										name: 'rooms',
										value: selectedRooms, // Set the selected room IDs
									}}
								/>

								<div className="flex flex-col gap-2">
									{roomsValues.map((room, i) => (
										<div key={i}>
											<label className="dark:text-background">
												<div className="flex">
													<input
														type="checkbox"
														name="rooms"
														value={room.id}
														checked={selectedRooms.includes(room.id)}
														onChange={handleRoomSelectChange}
													/>

													<div>{room.title}</div>
												</div>
											</label>
										</div>
									))}
								</div>
							</>
						) : (
							<>
								<label className="dark:text-background">rooms</label>
								<div>"no rooms to assign available"</div>
								<div className="min-h-[16px] px-4 pb-3 pt-1"></div>
							</>
						)}

						{packageItemsValues.length ? (
							<>
								<Field
									labelProps={{
										children: 'Package Items',
										className: 'dark:text-background',
									}}
									inputProps={{
										...conform.input(fields.packageItems, {
											ariaAttributes: true,
										}),
										type: 'hidden',
										name: 'packageItems',
										value: selectedPackageItems,
									}}
								/>

								<div className="flex flex-col gap-2">
									{packageItemsValues.map((packageItem, i) => (
										<div key={i}>
											<label className="dark:text-background">
												<div className="flex">
													<input
														type="checkbox"
														name="packageItems"
														value={packageItem.id}
														checked={selectedPackageItems.includes(
															packageItem.id,
														)}
														onChange={handlePackageItemSelectChange}
													/>

													<div>{packageItem.name}</div>
												</div>
											</label>
										</div>
									))}
								</div>
							</>
						) : (
							<>
								<div>"no package items to assign available"</div>
								<div className="min-h-[16px] px-4 pb-3 pt-1"></div>
							</>
						)}
					</div>

					<div className="mb-8">
						{existingRoomMultiPackage ? (
							<EditorExtendedOperatorDatesPicker
								existingSelectedDatesData={existingRoomMultiPackages}
								existingDateFrom={existingRoomMultiPackage.dateFrom}
								existingDateTo={existingRoomMultiPackage.dateTo}
								datesErroredOnValidation={datesErrored}
								parentEditorName="roomMultiPackage-editor"
							/>
						) : (
							<EditorExtendedOperatorDatesPicker
								existingSelectedDatesData={existingRoomMultiPackages}
								datesErroredOnValidation={datesErrored}
								parentEditorName="roomMultiPackage-editor"
							/>
						)}
					</div>

					<ErrorList id={form.errorId} errors={form.errors} />
				</div>
			</Form>

			<StatusButton
				form={form.id}
				type="submit"
				disabled={isPending}
				status={isPending ? 'pending' : 'idle'}
				className="w-2/3 py-6 capitalize"
			>
				{existingRoomMultiPackage ? 'save' : 'create'}
			</StatusButton>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No roomMultiPackage with the id "{params.seasonId}" exists</p>
				),
			}}
		/>
	)
}
