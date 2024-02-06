import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import {
	type SeasonalRoomPrice,
	type Room,
	type SeasonList,
} from '@prisma/client'
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
import { Button } from '#app/components/ui/button.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'

const SeasonListEditorSchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	dateFrom: z.string(),
	dateTo: z.string(),
	rooms: z.array(z.string().transform(value => value.split(','))).optional(),
	nightPrices: z
		.array(z.string().transform(value => value.split(',')))
		.optional(),
	additionalNightPrices: z
		.array(z.string().transform(value => value.split(',')))
		.optional(),
})

export async function action({ params, request }: DataFunctionArgs) {
	const formData = await request.formData()

	const submission = await parse(formData, {
		schema: SeasonListEditorSchema.superRefine(async (data, ctx) => {
			if (!data.id) return

			const seasonList = await prisma.seasonList.findUnique({
				select: { id: true },
				where: { id: data.id },
			})
			if (!seasonList) {
				ctx.addIssue({
					code: 'custom',
					message: 'SeasonList not found',
				})
			}
		}).transform(
			async ({
				rooms = [],
				nightPrices = [],
				additionalNightPrices = [],
				...data
			}) => {
				return {
					...data,
					rooms: rooms,
					nightPrices: nightPrices,
					additionalNightPrices: additionalNightPrices,
				}
			},
		),
		async: true,
	})

	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}

	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}

	const {
		id: seasonListId,
		name,
		dateFrom,
		dateTo,
		rooms = [],
		nightPrices = [],
		additionalNightPrices = [],
	} = submission.value

	const updatedSeasonList = await prisma.seasonList.upsert({
		select: { id: true },
		where: { id: seasonListId ?? '__new_season__' },
		create: {
			name,
			dateFrom,
			dateTo,
			rooms: {
				connect: rooms.length ? rooms[0].map(roomId => ({ id: roomId })) : [],
			},
		},
		update: {
			name,
			dateFrom,
			dateTo,
			rooms: {
				set: [],
				connect: rooms.length ? rooms[0].map(roomId => ({ id: roomId })) : [],
			},
		},
	})

	// Fetch the existing seasonalRoomPrices for the seasonList
	const existingSeasonalRoomPrices = await prisma.seasonalRoomPrice.findMany({
		where: { seasonId: updatedSeasonList.id },
	})

	// updating/creating new seasonal room prices
	if (rooms.length && nightPrices.length) {
		// && additionalNightPrices.length
		for (const roomId of rooms[0]) {
			const nightPricesMapped = nightPrices[0].map(nightPriceId =>
				nightPriceId.split('/'),
			)

			const additionalNightPricesMapped =
				additionalNightPrices.length &&
				additionalNightPrices[0].map(additionalNightPriceId =>
					additionalNightPriceId.split('/'),
				)

			for (const [nightPriceId, nightPrice] of nightPricesMapped) {
				const [roomID, weekDivisionId] = nightPriceId.split('-')

				if (roomID === roomId && weekDivisionId && nightPrice) {
					const additionalNightPrice =
						additionalNightPricesMapped &&
						additionalNightPricesMapped.find(([id]) => id === nightPriceId)

					const existingSeasonalRoomPrice = existingSeasonalRoomPrices.find(
						price =>
							price.roomId === roomId &&
							price.weekDivisionId === weekDivisionId,
					)

					const upsertPrices = {
						nightPrice: parseFloat(nightPrice),
						additionalNightPrice: additionalNightPrice
							? parseFloat(additionalNightPrice[1])
							: 0,
					}

					if (existingSeasonalRoomPrice) {
						await prisma.seasonalRoomPrice.update({
							where: { id: existingSeasonalRoomPrice.id },
							data: upsertPrices,
						})
					} else {
						await prisma.seasonalRoomPrice.create({
							data: {
								...upsertPrices,
								roomId: roomId,
								seasonId: updatedSeasonList.id,
								weekDivisionId: weekDivisionId,
							},
						})
					}
				}
			}
		}
	}

	let toastTitle
	let toastDescription
	if (params.id) {
		toastTitle = 'SeasonList Saved!'
		toastDescription = `SeasonList "${updatedSeasonList.id}" saved.`
	} else {
		toastTitle = 'SeasonList Created!'
		toastDescription = `New seasonList "${updatedSeasonList.id}" successfully created.`
	}

	return redirectWithToast('/admin/rooms/pricing', {
		type: 'success',
		title: toastTitle,
		description: toastDescription,
	})
}

export function SeasonListEditor({
	existingSeasonList,
	existingSeasonLists,
	rooms,
	weekParts,
}: {
	existingSeasonList?: SerializeFrom<
		Pick<SeasonList, 'id' | 'name' | 'dateFrom' | 'dateTo'> & {
			rooms: Array<
				Pick<Room, 'id' | 'title'> & {
					seasonalPrices: Array<
						Pick<
							SeasonalRoomPrice,
							| 'id'
							| 'roomId'
							| 'seasonId'
							| 'nightPrice'
							| 'additionalNightPrice'
							| 'weekDivisionId'
						>
					>
				}
			>
		}
	>
	existingSeasonLists: {
		id: string
		dateFrom: string
		dateTo: string
	}[]
	rooms?: {
		id: string
		title: string
		url: string
		price1: number
		price2?: number | null
		price3?: number | null
		additionalNightPrice1: number
		additionalNightPrice2?: number | null
		additionalNightPrice3?: number | null
	}[]
	weekParts: number
}) {
	const [datesErrored, setDatesErrored] = useState(false)
	const seasonListFetcher = useFetcher<typeof action>()
	const isPending = seasonListFetcher.state !== 'idle'

	//* Handling Rooms
	const roomsValues = rooms ?? []
	// Define a state variable to hold selected room IDs
	const [selectedRooms, setSelectedRooms] = useState<string[]>(
		existingSeasonList?.rooms?.map(room => room.id) ?? [],
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

	//* Handling Night Prices
	const existingRoomDefaultPrices = rooms
		? rooms
				.filter(room => selectedRooms.includes(room.id))
				.flatMap(room => {
					const { id } = room

					const nightPrices = [
						`${id}-1/${room.price1}`,
						room.price2 != null ? `${id}-2/${room.price2}` : null,
						room.price3 != null ? `${id}-3/${room.price3}` : null,
					].filter(Boolean)

					return nightPrices
				})
		: []

	const existingNightPrices = existingSeasonList
		? existingSeasonList.rooms
				.filter(room => selectedRooms.includes(room.id))
				.flatMap(room =>
					room.seasonalPrices.map(
						price => `${room.id}-${price.weekDivisionId}/${price.nightPrice}`,
					),
				)
		: []

	// Initialize state with existing night prices as default values
	const [nightPricesList, setNightPricesList] =
		useState<string[]>(existingNightPrices)

	const handleNightPricesListChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const { name, value } = event.target
		const newNightPriceId = `${name}/${value}`

		// Check if there is an existing nightPriceId with the same "name"
		const existingWeekDivisionId = nightPricesList.findIndex(
			nightPriceId => nightPriceId.split('/')[0] === name,
		)

		// If an existing nightPriceId is found, replace it; otherwise, add the new one
		if (existingWeekDivisionId !== -1) {
			//-1 is empty in terms of indexing (0,1,2...)
			setNightPricesList(prevNightPricesList => {
				const updatedList = [...prevNightPricesList]
				updatedList[existingWeekDivisionId] = newNightPriceId
				return updatedList
			})
		} else {
			setNightPricesList(prevNightPricesList => [
				...prevNightPricesList,
				newNightPriceId,
			])
		}
	}

	//* Handling Additional Night Prices
	const existingRoomDefaultAdditionalNightPrices = rooms
		? rooms
				.filter(room => selectedRooms.includes(room.id))
				.flatMap(room => {
					const { id } = room

					const nightPrices = [
						`${id}-1/${room.additionalNightPrice1}`,
						room.additionalNightPrice2 != null
							? `${id}-2/${room.additionalNightPrice2}`
							: null,
						room.additionalNightPrice3 != null
							? `${id}-3/${room.additionalNightPrice3}`
							: null,
					].filter(Boolean)

					return nightPrices
				})
		: []

	// Extract existing additional night prices from the existingSeasonList
	const existingAdditionalNightPrices = existingSeasonList
		? existingSeasonList.rooms
				.filter(room => selectedRooms.includes(room.id))
				.flatMap(room =>
					room.seasonalPrices.map(
						price =>
							`${room.id}-${price.weekDivisionId}/${price.additionalNightPrice}`,
					),
				)
		: []

	// Initialize state with existing additional night prices as default values
	const [additionalNightPricesList, setAdditionalNightPricesList] = useState<
		string[]
	>(existingAdditionalNightPrices)

	const handleAdditionalNightPricesListChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const { name, value } = event.target
		const newAdditionalNightPriceId = `${name}/${value}`

		// Check if there is an existing nightPriceId with the same "name"
		const existingWeekDivisionId = additionalNightPricesList.findIndex(
			additionalNightPriceId => additionalNightPriceId.split('/')[0] === name,
		)

		// If an existing nightPriceId is found, replace it; otherwise, add the new one
		if (existingWeekDivisionId !== -1) {
			//-1 is empty in terms of indexing (0,1,2...)
			setAdditionalNightPricesList(prevAdditionalNightPricesList => {
				const updatedList = [...prevAdditionalNightPricesList]
				updatedList[existingWeekDivisionId] = newAdditionalNightPriceId
				return updatedList
			})
		} else {
			setAdditionalNightPricesList(prevAdditionalNightPricesList => [
				...prevAdditionalNightPricesList,
				newAdditionalNightPriceId,
			])
		}
	}

	//* Handling Getting Default Prices For Missing Entries - by Button click
	const [buttonClicked, setButtonClicked] = useState(false)
	const handleUpdateNightPricesClick = () => {
		// Function to add missing entries to the array
		const addMissingEntries = (originalArray: string[], newArray: string[]) => {
			const updatedArray: string[] = [...originalArray]

			newArray.forEach(item => {
				const [, $id, $index] = item.match(/(.+)-(\d+)\/\d+/) || []
				const existingIds = originalArray
					.filter(existingItem => existingItem.includes($id))
					.map(existingItem => existingItem.match(/(.+)-(\d+)\/\d+/)?.[2])

				if (!existingIds.includes($index)) {
					updatedArray.push(item)
				}
			})

			return updatedArray
		}

		// Get arrays with updated prices
		const updatedNightPrices = addMissingEntries(
			existingNightPrices,
			existingRoomDefaultPrices,
		)
		const updatedAdditionalNightPrices = addMissingEntries(
			existingAdditionalNightPrices,
			existingRoomDefaultAdditionalNightPrices,
		)

		// Set the final arrays with updated prices
		setNightPricesList(updatedNightPrices)
		setAdditionalNightPricesList(updatedAdditionalNightPrices)

		if (rooms && rooms.length && rooms.length === selectedRooms.length) {
			setButtonClicked(true)
		}
	}
	console.log('nightPricesList: ', nightPricesList)

	const isButtonClickable =
		existingNightPrices.length !== existingRoomDefaultPrices.length &&
		existingAdditionalNightPrices.length !==
			existingRoomDefaultAdditionalNightPrices.length

	//* ...form logic
	const [form, fields] = useForm({
		id: 'seasonList-editor',
		constraint: getFieldsetConstraint(SeasonListEditorSchema),
		lastSubmission: seasonListFetcher.data?.submission,
		onValidate({ formData }) {
			const parsedData = parse(formData, { schema: SeasonListEditorSchema })
			const errorCheck = parsedData.error

			if (Object.entries(errorCheck).length) {
				const name = errorCheck.name
				const dateFrom = errorCheck.dateFrom
				const dateTo = errorCheck.dateTo

				// TODO: switch to switch/case
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
			name: existingSeasonList?.name ?? '',
		},
	})

	return (
		<div className="flex flex-col items-center">
			<Form
				method="post"
				className="mb-8 flex w-full flex-col"
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

					{existingSeasonList ? (
						<input type="hidden" name="id" value={existingSeasonList.id} />
					) : null}

					<div className="flex flex-col gap-1">
						<Field
							labelProps={{ children: 'name' }}
							inputProps={{
								...conform.input(fields.name, { ariaAttributes: true }),
								placeholder: 'name',
								className: 'bg-backgroundDashboard h-12',
							}}
							errors={fields.name.errors}
						/>

						<div className="mb-8">
							{existingSeasonList ? (
								<EditorExtendedOperatorDatesPicker
									existingSelectedDatesData={existingSeasonLists}
									existingDateFrom={existingSeasonList.dateFrom}
									existingDateTo={existingSeasonList.dateTo}
									datesErroredOnValidation={datesErrored}
									parentEditorName="seasonList-editor"
								/>
							) : (
								<EditorExtendedOperatorDatesPicker
									existingSelectedDatesData={existingSeasonLists}
									datesErroredOnValidation={datesErrored}
									parentEditorName="seasonList-editor"
								/>
							)}
						</div>

						{roomsValues.length ? (
							<>
								<Field
									labelProps={{ children: 'Rooms' }}
									inputProps={{
										...conform.input(fields.rooms, {
											ariaAttributes: true,
										}),
										type: 'hidden',
										name: 'rooms',
										value: selectedRooms,
									}}
									className="hidden"
								/>
								<p className="capitalize dark:text-background">
									select rooms to assign
								</p>

								<div className="flex flex-col gap-2">
									{isButtonClickable &&
									roomsValues.length &&
									selectedRooms.length &&
									!buttonClicked ? (
										<Button
											size="sm"
											variant="outline"
											type="button"
											onClick={handleUpdateNightPricesClick}
										>
											get default prices
										</Button>
									) : (
										''
									)}

									{roomsValues.map((room, i) => (
										<div key={i}>
											<label className="dark:text-background">
												<div className="flex">
													<input
														type="checkbox"
														name={`room-${room.id}`}
														value={room.id}
														checked={selectedRooms.includes(room.id)}
														onChange={handleRoomSelectChange}
													/>

													<div>{room.title}</div>
												</div>
											</label>

											{selectedRooms.includes(room.id) &&
												(weekParts > 0 ? (
													<>
														<div className="flex w-full gap-5">
															{Array.from({ length: weekParts }, (_, index) => (
																<div
																	key={index}
																	className="flex w-full flex-col gap-2"
																>
																	<p className="dark:text-background">
																		week part {index + 1}
																	</p>

																	<input
																		type="text"
																		name={`${room.id}-${index + 1}`}
																		className="flex h-12 w-full rounded-md border border-input bg-backgroundDashboard px-6 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid]:border-input-invalid dark:text-foreground"
																		defaultValue={
																			nightPricesList
																				.find(entry =>
																					entry.startsWith(
																						`${room.id}-${index + 1}/`,
																					),
																				)
																				?.split('/')[1] || ''
																		}
																		onChange={handleNightPricesListChange}
																	/>

																	<input
																		type="text"
																		name={`${room.id}-${index + 1}`}
																		className="flex h-12 w-full rounded-md border border-input bg-backgroundDashboard px-6 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid]:border-input-invalid dark:text-foreground"
																		defaultValue={
																			additionalNightPricesList
																				.find(entry =>
																					entry.startsWith(
																						`${room.id}-${index + 1}/`,
																					),
																				)
																				?.split('/')[1] || ''
																		}
																		onChange={
																			handleAdditionalNightPricesListChange
																		}
																	/>
																</div>
															))}
														</div>
													</>
												) : (
													<div className="flex w-full flex-col gap-2">
														<input
															type="text"
															name={`${room.id}-1`}
															className="flex h-12 w-full rounded-md border border-input bg-backgroundDashboard px-6 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid]:border-input-invalid dark:text-foreground"
															defaultValue={
																nightPricesList
																	.find(entry =>
																		entry.startsWith(`${room.id}-1/`),
																	)
																	?.split('/')[1] || ''
															}
															onChange={handleNightPricesListChange}
														/>

														<input
															type="text"
															name={`${room.id}-1`}
															className="flex h-12 w-full rounded-md border border-input bg-backgroundDashboard px-6 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid]:border-input-invalid dark:text-foreground"
															defaultValue={
																additionalNightPricesList
																	.find(entry =>
																		entry.startsWith(`${room.id}-1/`),
																	)
																	?.split('/')[1] || ''
															}
															onChange={handleAdditionalNightPricesListChange}
														/>
													</div>
												))}
										</div>
									))}
								</div>

								<Field
									labelProps={{ children: 'nightPrices' }}
									inputProps={{
										...conform.input(fields.nightPrices, {
											ariaAttributes: true,
										}),
										type: 'hidden',
										name: 'nightPrices',
										value: nightPricesList,
									}}
									className="hidden"
								/>
								<Field
									labelProps={{ children: 'additionalNightPrices' }}
									inputProps={{
										...conform.input(fields.additionalNightPrices, {
											ariaAttributes: true,
										}),
										type: 'hidden',
										name: 'additionalNightPrices',
										value: additionalNightPricesList,
									}}
									className="hidden"
								/>
							</>
						) : (
							<>
								<label className="dark:text-background">rooms</label>
								<div>"no rooms to assign available"</div>
								<div className="min-h-[16px] px-4 pb-3 pt-1"></div>
							</>
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
				{existingSeasonList ? 'save' : 'create'}
			</StatusButton>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No seasonList with the id "{params.seasonListId}" exists</p>
				),
			}}
		/>
	)
}
