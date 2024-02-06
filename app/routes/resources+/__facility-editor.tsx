import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { type RoomFacility } from '@prisma/client'
import {
	json,
	type DataFunctionArgs,
	type SerializeFrom,
} from '@remix-run/node'
import { Form, useFetcher } from '@remix-run/react'
import { toast } from 'sonner'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { ErrorList, Field, SelectBox } from '#app/components/forms.tsx'
import { IconNames } from '#app/components/ui/icons/nameStrings.ts'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'

const FacilityEditorSchema = z.object({
	id: z.string().optional(),
	name: z.string(),
	iconName: z.string().optional(),
})

export async function action({ params, request }: DataFunctionArgs) {
	const formData = await request.formData()

	const submission = await parse(formData, {
		schema: FacilityEditorSchema.superRefine(async (data, ctx) => {
			if (!data.id) return

			const facility = await prisma.roomFacility.findUnique({
				select: { id: true },
				where: { id: data.id },
			})
			if (!facility) {
				ctx.addIssue({
					code: 'custom',
					message: 'Facility not found',
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

	const { id: facilityId, name, iconName } = submission.value

	const updatedFacility = await prisma.roomFacility.upsert({
		select: { name: true }, //name instead of id because of updatedFacility.name being needed as string for toast
		where: { id: facilityId ?? '__new_facility__' },
		create: {
			name,
			iconName,
		},
		update: {
			name,
			iconName,
		},
	})

	let toastTitle
	let toastDescription
	if (params.id) {
		toastTitle = 'Facility Saved!'
		toastDescription = `Facility "${updatedFacility.name}" saved.`
	} else {
		toastTitle = 'Facility Created!'
		toastDescription = `New facility "${updatedFacility.name}" successfully created.`
	}

	return redirectWithToast('/admin/rooms/facility', {
		type: 'success',
		title: toastTitle,
		description: toastDescription,
	})
}

export function FacilityEditor({
	facility,
	existingFacilities, //ready for not creating more items with the same name/icon
}: {
	facility?: SerializeFrom<Pick<RoomFacility, 'id' | 'name' | 'iconName'>>
	existingFacilities?: object
}) {
	// TODO: implement - existingFacilities & don't allow to create the same twice
	// TODO: editing route?

	const facilityFetcher = useFetcher<typeof action>()
	const isPending = facilityFetcher.state !== 'idle'

	const [form, fields] = useForm({
		id: 'facility-editor',
		constraint: getFieldsetConstraint(FacilityEditorSchema),
		lastSubmission: facilityFetcher.data?.submission,
		onValidate({ formData }) {
			const parsedData = parse(formData, { schema: FacilityEditorSchema })
			const errorCheck = parsedData.error

			if (Object.entries(errorCheck).length) {
				const name = errorCheck.name

				if (name) {
					toast.error('Facility not filled.')
				}
			}

			return parsedData
		},
		defaultValue: {
			name: facility?.name ?? '',
			iconName: facility?.iconName ?? '',
		},
	})

	const iconNames = IconNames()

	return (
		<div className='flex flex-col items-center'>
			<Form
				method="post"
				className="flex flex-col w-full"
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

					{facility ? (
						<input type="hidden" name="id" value={facility.id} />
					) : null}

					<div className="flex flex-col gap-1">
						<Field
							labelProps={{ children: 'Facility Name' }}
							inputProps={{
								...conform.input(fields.name, { ariaAttributes: true }),
								placeholder: 'Name Of Facility',
								className: 'bg-backgroundDashboard h-12',
							}}
							errors={fields.name.errors}
						/>

						<SelectBox
							labelProps={{ children: 'Icon (optional select)' }}
							inputProps={{
								...conform.input(fields.iconName, { ariaAttributes: true }),
							}}
							selectClassName="bg-backgroundDashboard h-12"
							errors={fields.iconName.errors}
							options={iconNames}
							defaultOption={facility?.iconName ?? ''}
						/>
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
				{facility ? 'save' : 'create'}
			</StatusButton>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No facility with the id "{params.facilityId}" exists</p>
				),
			}}
		/>
	)
}
