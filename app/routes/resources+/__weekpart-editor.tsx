import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { type WeekDay, type WeekDivision } from '@prisma/client'
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

const SeasonListEditorSchema = z.object({
	id: z.string().optional(),
	partOfTheWeek: z
		.array(z.string().transform(value => value.split(',')))
		.optional(),
})

export async function action({ params, request }: DataFunctionArgs) {
	const formData = await request.formData()

	const submission = await parse(formData, {
		schema: SeasonListEditorSchema.superRefine(async (data, ctx) => {
			if (!data.id) return

			const weekDivision = await prisma.weekDivision.findUnique({
				select: { id: true },
				where: { id: data.id },
			})
			if (!weekDivision) {
				ctx.addIssue({
					code: 'custom',
					message: 'SeasonList not found',
				})
			}
		}).transform(async ({ partOfTheWeek = [], ...data }) => {
			return {
				...data,
				partOfTheWeek: partOfTheWeek,
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

	const { id: partOfTheWeekId, partOfTheWeek = [] } = submission.value

	const updatedSeasonList = await prisma.weekDivision.upsert({
		select: { id: true },
		where: { id: partOfTheWeekId ?? '__new_partOfTheWeek__' },
		create: {
			partOfTheWeek: {
				connect: partOfTheWeek.length
					? partOfTheWeek[0].map(partOfTheWeekId => ({ id: partOfTheWeekId }))
					: [],
			},
		},
		update: {
			partOfTheWeek: {
				set: [],
				connect: partOfTheWeek.length
					? partOfTheWeek[0].map(partOfTheWeekId => ({ id: partOfTheWeekId }))
					: [],
			},
		},
	})

	let toastTitle
	let toastDescription
	if (params.id) {
		toastTitle = 'SeasonList Saved!'
		toastDescription = `SeasonList "${updatedSeasonList.id}" saved.`
	} else {
		toastTitle = 'SeasonList Created!'
		toastDescription = `New weekDivision "${updatedSeasonList.id}" successfully created.`
	}

	return redirectWithToast('/admin/rooms/pricing', {
		type: 'success',
		title: toastTitle,
		description: toastDescription,
	})
}

export function WeekPartEditor({
	weekDivision,
	weekDays,
}: {
	weekDivision?: SerializeFrom<
		Pick<WeekDivision, 'id'> & {
			partOfTheWeek: Array<
				Pick<WeekDay, 'id' | 'dayInAWeek' | 'divisionAssignmentId'>
			>
		}
	>
	weekDays: {
		id: string
		dayInAWeek: string
		divisionAssignmentId: string | null
	}[]
}) {
	const seasonListFetcher = useFetcher<typeof action>()
	const isPending = seasonListFetcher.state !== 'idle'

	const partOfTheWeekValues = weekDays ?? []
	// Define a state variable to hold selected room IDs
	const [selectedPartOfTheWeek, setSelectedPartOfTheWeek] = useState<string[]>(
		weekDivision?.partOfTheWeek?.map(room => room.id) ?? [],
	)

	// Handle checkbox changes
	const handleRoomSelectChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const partOfTheWeekId = event.target.value
		if (event.target.checked) {
			// room is selected, add it to the selectedPartOfTheWeek array
			setSelectedPartOfTheWeek([...selectedPartOfTheWeek, partOfTheWeekId])
		} else {
			// room is unselected, remove it from the selectedPartOfTheWeek array
			setSelectedPartOfTheWeek(
				selectedPartOfTheWeek.filter(id => id !== partOfTheWeekId),
			)
		}
	}

	// Sorting the weekDays by dayInAWeek
	const partOfTheWeekValues2 = weekDays.slice().sort((a, b) => {
		const dayValues: Record<string, number> = {
			Monday: 1,
			Tuesday: 2,
			Wednesday: 3,
			Thursday: 4,
			Friday: 5,
			Saturday: 6,
			Sunday: 7,
		}

		return dayValues[a.dayInAWeek] - dayValues[b.dayInAWeek]
	})

	const [form, fields] = useForm({
		id: 'weekDivision-editor',
		constraint: getFieldsetConstraint(SeasonListEditorSchema),
		lastSubmission: seasonListFetcher.data?.submission,
		onValidate({ formData }) {
			return parse(formData, { schema: SeasonListEditorSchema })
		},
		defaultValue: {},
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

					{weekDivision ? (
						<input type="hidden" name="id" value={weekDivision.id} />
					) : null}

					<div className="flex flex-col gap-1">
						{partOfTheWeekValues.length ? (
							<>
								<div className="hidden">
									<Field
										labelProps={{ children: 'PartOfTheWeek' }}
										inputProps={{
											...conform.input(fields.partOfTheWeek, {
												ariaAttributes: true,
											}),
											type: 'hidden',
											name: 'partOfTheWeek',
											value: selectedPartOfTheWeek, // Set the selected room IDs
										}}
									/>
								</div>

								<div className="flex flex-col gap-2 mb-8">
									{partOfTheWeekValues2.map((room, i) => (
										<div key={i}>
											<label className="dark:text-background">
												<div className="flex">
													<input
														type="checkbox"
														name="partOfTheWeek" // Use the appropriate field name
														value={room.id} // Use a unique identifier for each room
														checked={selectedPartOfTheWeek.includes(room.id)} // Check if the room should be selected
														onChange={handleRoomSelectChange} // Handle the checkbox change
													/>

													<div>{room.dayInAWeek}</div>
												</div>
											</label>
										</div>
									))}
								</div>
							</>
						) : (
							<>
								<label className="dark:text-background">partOfTheWeek</label>
								<div>"no partOfTheWeek to assign available"</div>
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
				{weekDivision ? 'save' : 'create'}
			</StatusButton>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No weekDivision with the id "{params.partOfTheWeekId}" exists</p>
				),
			}}
		/>
	)
}
