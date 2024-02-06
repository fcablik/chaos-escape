import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { type Room } from '@prisma/client'
import {
	json,
	type DataFunctionArgs,
	type SerializeFrom,
} from '@remix-run/node'
import { Form, useFetcher } from '@remix-run/react'
import { toast } from 'sonner'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { ErrorList, Field } from '#app/components/forms.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'

const urlErrorRef = 'Invalid URL: Use only letters, numbers and dashes.'

const RoomEditorSchema = z.object({
	id: z.string().optional(),
	price1: z.preprocess(
		price => parseInt(z.string().parse(price), 10),
		z.number(),
	),
	additionalNightPrice1: z.preprocess(
		additionalNightPrice =>
			parseInt(z.string().parse(additionalNightPrice), 10),
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
		price1,
		price2,
		price3,
		additionalNightPrice1,
		additionalNightPrice2,
		additionalNightPrice3,
	} = submission.value

	const updatedRoom = await prisma.room.update({
		select: { id: true, title: true },
		where: { id: roomId ?? '__new_room__' },
		data: {
			price1,
			price2,
			price3,
			additionalNightPrice1,
			additionalNightPrice2,
			additionalNightPrice3,
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

	return redirectWithToast(`/admin/rooms/pricing/`, {
		type: 'success',
		title: toastTitle,
		description: toastDescription,
	})
}

export function RoomPricesEditor({
	room,
	weekParts,
}: {
	room?: SerializeFrom<
		Pick<
			Room,
			| 'id'
			| 'price1'
			| 'additionalNightPrice1'
			| 'price2'
			| 'additionalNightPrice2'
			| 'price3'
			| 'additionalNightPrice3'
		>
	>
	weekParts: number
}) {
	const roomFetcher = useFetcher<typeof action>()
	const isPending = roomFetcher.state !== 'idle'

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
			price1: room?.price1 ?? '',
			additionalNightPrice1: room?.additionalNightPrice1 ?? '',
			price2: room?.price2 ?? '',
			additionalNightPrice2: room?.additionalNightPrice2 ?? '',
			price3: room?.price3 ?? '',
			additionalNightPrice3: room?.additionalNightPrice3 ?? '',
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

				<div>
					<div className="flex w-full gap-5">
						<Field
							labelProps={{
								children: `1. Price / night`,
								className: 'dark:text-background',
							}}
							inputProps={{
								...conform.input(fields.price1, { ariaAttributes: true }),
							}}
							errors={fields.price1.errors}
							className="w-1/2"
						/>
						<Field
							labelProps={{
								children: `1. Additional Guest Price / night`,
								className: 'dark:text-background',
							}}
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
									labelProps={{
										children: `2. Price / night`,
										className: 'dark:text-background',
									}}
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
										className: 'dark:text-background',
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
										labelProps={{
											children: `3. Price / night`,
											className: 'dark:text-background',
										}}
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
											className: 'dark:text-background',
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
