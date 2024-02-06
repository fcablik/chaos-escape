import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { type Room, type RoomDiscount } from '@prisma/client'
import {
	json,
	type DataFunctionArgs,
	type SerializeFrom,
} from '@remix-run/node'
import { Form, useFetcher } from '@remix-run/react'
import { useState } from 'react'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { ErrorList, Field, SelectBox } from '#app/components/forms.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'

const RoomPackageEditorSchema = z.object({
	id: z.string().optional(),
	type: z.string(),
	nights: z.string(),
	code: z.string(),
	value: z.preprocess(
		value => parseInt(z.string().parse(value), 10),
		z.number(),
	),
	valueType: z.string(),
	rooms: z.array(z.string().transform(room => room.split(','))).optional(),
})

export async function action({ params, request }: DataFunctionArgs) {
	const formData = await request.formData()

	const submission = await parse(formData, {
		schema: RoomPackageEditorSchema.superRefine(async (data, ctx) => {
			if (!data.id) return

			const roomDiscount = await prisma.roomDiscount.findUnique({
				select: { id: true },
				where: { id: data.id },
			})
			if (!roomDiscount) {
				ctx.addIssue({
					code: 'custom',
					message: 'RoomDiscount not found',
				})
			}
		}).transform(async ({ rooms = [], ...data }) => {
			return {
				...data,
				rooms: rooms,
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
		type,
		nights,
		code,
		value,
		valueType,
		rooms = [],
	} = submission.value

	const updatedRoomDiscount = await prisma.roomDiscount.upsert({
		select: { type: true },
		where: { id: seasonId ?? '__new_season__' },
		create: {
			type,
			nights,
			code,
			value,
			valueType,
			rooms: {
				connect: rooms.length ? rooms[0].map(roomId => ({ id: roomId })) : [],
			},
		},
		update: {
			type,
			nights,
			code,
			value,
			valueType,
			rooms: {
				set: [],
				connect: rooms.length ? rooms[0].map(roomId => ({ id: roomId })) : [],
			},
		},
	})

	let toastTitle
	let toastDescription
	if (params.id) {
		toastTitle = 'RoomDiscount Saved!'
		toastDescription = `RoomDiscount "${updatedRoomDiscount.type}" saved.`
	} else {
		toastTitle = 'RoomDiscount Created!'
		toastDescription = `New roomDiscount "${updatedRoomDiscount.type}" successfully created.`
	}

	return redirectWithToast('/admin/rooms/discounts', {
		type: 'success',
		title: toastTitle,
		description: toastDescription,
	})
}

export function RoomDiscountEditor({
	existingRoomDiscount,
	existingRoomDiscounts,
	rooms,
}: {
	existingRoomDiscount?: SerializeFrom<
		Pick<
			RoomDiscount,
			'id' | 'type' | 'nights' | 'code' | 'value' | 'valueType'
		> & {
			rooms: Array<Pick<Room, 'id' | 'title'>>
		}
	>
	//existingRoomDiscounts - use this for not creating existing discounts
	existingRoomDiscounts: {
		id: string
	}[]
	rooms?: {
		id: string
		title: string
		url: string
	}[]
}) {
	const seasonFetcher = useFetcher<typeof action>()
	const isPending = seasonFetcher.state !== 'idle'

	const roomsValues = rooms ?? []
	// Define a state variable to hold selected room IDs
	const [selectedRooms, setSelectedRooms] = useState<string[]>(
		existingRoomDiscount?.rooms?.map(room => room.id) ?? [],
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

	const [form, fields] = useForm({
		id: 'roomDiscount-editor',
		constraint: getFieldsetConstraint(RoomPackageEditorSchema),
		lastSubmission: seasonFetcher.data?.submission,
		onValidate({ formData }) {
			const parsedData = parse(formData, { schema: RoomPackageEditorSchema })
			console.log(parsedData)
			return parsedData
		},
		defaultValue: {
			type: existingRoomDiscount?.type ?? '',
			nights:
				existingRoomDiscount?.nights !== '0'
					? existingRoomDiscount?.nights
					: '',
			code:
				existingRoomDiscount?.code !== '0' ? existingRoomDiscount?.code : '',
			value: existingRoomDiscount?.value ?? '',
			valueType: existingRoomDiscount?.valueType ?? '',
		},
	})

	const [selectedType, setSelectedType] = useState<string>(
		fields.type.defaultValue ?? '',
	)
	const handleDiscountTypeChange = (
		e: React.ChangeEvent<HTMLSelectElement>,
	) => {
		const newSelectedType = e.target.value
		setSelectedType(newSelectedType)
	}

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

					{existingRoomDiscount ? (
						<input type="hidden" name="id" value={existingRoomDiscount.id} />
					) : null}

					<div className="flex flex-col gap-1">
						<div className="flex w-full gap-2">
							<SelectBox
								labelProps={{
									children: 'type of discount',
									className: 'dark:text-background',
								}}
								inputProps={{
									...conform.input(fields.type, { ariaAttributes: true }),
								}}
								selectClassName="bg-backgroundDashboard h-12"
								errors={fields.type.errors}
								options={['multi-night', 'promo-discount']}
								defaultOption={existingRoomDiscount?.type ?? ''}
								className="w-1/2"
								onChange={handleDiscountTypeChange}
							/>

							<div className="w-1/2">
								{selectedType === 'multi-night' ? (
									<>
										<SelectBox
											labelProps={{
												children: 'minimum nights',
												className: 'dark:text-background',
											}}
											inputProps={{
												...conform.input(fields.nights, {
													ariaAttributes: true,
												}),
											}}
											selectClassName="bg-backgroundDashboard h-12"
											errors={fields.nights.errors}
											options={['2+', '3+', '4+', '5+', '6+', '7+']}
											defaultOption={fields.nights.defaultValue ?? ''}
										/>
										<input type="hidden" name="code" value="0" />
									</>
								) : (
									selectedType === 'promo-discount' && (
										<>
											<Field
												labelProps={{
													children: 'promo code',
													className: 'dark:text-background',
												}}
												inputProps={{
													...conform.input(fields.code, {
														ariaAttributes: true,
													}),
													placeholder: 'custom promo code',
													className: 'bg-backgroundDashboard h-12',
												}}
												errors={fields.code.errors}
											/>
											<input type="hidden" name="nights" value="0" />
										</>
									)
								)}
							</div>
						</div>

						<div className="flex w-full gap-2">
							<Field
								labelProps={{
									children: 'value',
									className: 'dark:text-background',
								}}
								inputProps={{
									...conform.input(fields.value, { ariaAttributes: true }),
									placeholder: 'discount sum',
									className: 'bg-backgroundDashboard h-12',
								}}
								errors={fields.value.errors}
								className="w-1/2"
							/>
							<SelectBox
								labelProps={{
									children: 'value type',
									className: 'dark:text-background',
								}}
								inputProps={{
									...conform.input(fields.valueType, { ariaAttributes: true }),
								}}
								selectClassName="bg-backgroundDashboard h-12"
								errors={fields.valueType.errors}
								options={['% percentage', '- fixed value']}
								defaultOption={fields.valueType.defaultValue ?? ''}
								className="w-1/2"
							/>
						</div>

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
				{existingRoomDiscount ? 'save' : 'create'}
			</StatusButton>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No roomDiscount with the id "{params.seasonId}" exists</p>
				),
			}}
		/>
	)
}
