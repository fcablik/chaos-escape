import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { type Room, type RoomPackageItem } from '@prisma/client'
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
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'

const RoomPackageItemEditorSchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	price: z.preprocess(
		price => parseInt(z.string().parse(price), 10),
		z.number(),
	),
	rooms: z.array(z.string().transform(value => value.split(','))).optional(),
})

export async function action({ params, request }: DataFunctionArgs) {
	const formData = await request.formData()

	const submission = await parse(formData, {
		schema: RoomPackageItemEditorSchema.superRefine(async (data, ctx) => {
			if (!data.id) return

			const roomPackageItem = await prisma.roomPackageItem.findUnique({
				select: { id: true },
				where: { id: data.id },
			})
			if (!roomPackageItem) {
				ctx.addIssue({
					code: 'custom',
					message: 'RoomPackageItem not found',
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

	const { id: seasonId, name, price, rooms = [] } = submission.value

	const updatedRoomPackageItem = await prisma.roomPackageItem.upsert({
		select: { id: true },
		where: { id: seasonId ?? '__new_season__' },
		create: {
			name,
			price,
			rooms: {
				connect: rooms.length ? rooms[0].map(roomId => ({ id: roomId })) : [],
			},
		},
		update: {
			name,
			price,
			rooms: {
				set: [],
				connect: rooms.length ? rooms[0].map(roomId => ({ id: roomId })) : [],
			},
		},
	})

	let toastTitle
	let toastDescription
	if (params.id) {
		toastTitle = 'RoomPackageItem Saved!'
		toastDescription = `RoomPackageItem "${updatedRoomPackageItem.id}" saved.`
	} else {
		toastTitle = 'RoomPackageItem Created!'
		toastDescription = `New roomPackageItem "${updatedRoomPackageItem.id}" successfully created.`
	}

	return redirectWithToast('/admin/rooms/packagedeals', {
		type: 'success',
		title: toastTitle,
		description: toastDescription,
	})
}

export function RoomPackageItemEditor({
	existingRoomPackageItem,
	rooms,
}: {
	existingRoomPackageItem?: SerializeFrom<
		Pick<RoomPackageItem, 'id' | 'name' | 'price'> & {
			rooms: Array<Pick<Room, 'id' | 'title'>>
		}
	>
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
		existingRoomPackageItem?.rooms?.map(room => room.id) ?? [],
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
		id: 'roomPackageItem-editor',
		constraint: getFieldsetConstraint(RoomPackageItemEditorSchema),
		lastSubmission: seasonFetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: RoomPackageItemEditorSchema })
		},
		defaultValue: {
			name: existingRoomPackageItem?.name ?? '',
			price: existingRoomPackageItem?.price ?? '',
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

					{existingRoomPackageItem ? (
						<input type="hidden" name="id" value={existingRoomPackageItem.id} />
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

						<Field
							labelProps={{ children: 'price' }}
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
									labelProps={{ children: 'Rooms' }}
									inputProps={{
										...conform.input(fields.rooms, {
											ariaAttributes: true,
										}),
										type: 'hidden',
										name: 'rooms',
										value: selectedRooms,
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
								<label>rooms</label>
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
				{existingRoomPackageItem ? 'save' : 'create'}
			</StatusButton>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No roomPackageItem with the id "{params.seasonId}" exists</p>
				),
			}}
		/>
	)
}
