import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { type CarModelFacility, type CarModel } from '@prisma/client'
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
import {
	ErrorList,
	Field,
	SelectBox,
	TextareaField,
} from '#app/components/forms.tsx'
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

const CarModelEditorSchema = z.object({
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
	year: z.preprocess(
		number => parseInt(z.string().parse(number), 10),
		z.number(),
	),
	description: z.string().min(descriptionMinLength).max(descriptionMaxLength),
	seo: z.string().max(seoMaxLength).optional(),
	carModelFacility: z
		.array(z.string().transform(value => value.split(',')))
		.optional(),
	carBrandId: z.string(),
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
		}).transform(async ({ carModelFacility = [], ...data }) => {
			return {
				...data,
				carModelFacility: carModelFacility, // Include the carModelFacility data
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
		id: carModelId,
		url,
		title,
		year,
		description,
		seo,
		carModelFacility = [],
		carBrandId,
	} = submission.value

	const updatedCarModel = await prisma.carModel.upsert({
		select: { id: true, title: true },
		where: { id: carModelId ?? '__new_carModel__' },
		create: {
			url, // has to be unique!
			title,
			year,
			description,
			seo,
			carModelFacility: {
				connect: carModelFacility.length
					? carModelFacility[0].map(facilityId => ({ id: facilityId }))
					: [],
			},
			carBrandId,
		},
		update: {
			url,
			title,
			year,
			description,
			seo,
			carModelFacility: {
				set: [],
				connect: carModelFacility.length
					? carModelFacility[0].map(facilityId => ({ id: facilityId }))
					: [],
			},
			carBrandId,
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

export function CarModelEditor({
	carModel,
	facilities,
	availableBrands,
}: {
	carModel?: SerializeFrom<
		Pick<
			CarModel,
			'id' | 'url' | 'title' | 'year' | 'description' | 'seo' | 'carBrandId'
		> & {
			carModelFacility: Array<
				Pick<CarModelFacility, 'id' | 'name' | 'iconName'>
			>
		}
	>
	facilities?: object
	availableBrands: string[]
}) {
	const carModelFetcher = useFetcher<typeof action>()
	const isPending = carModelFetcher.state !== 'idle'

	const facilityValues = Object.values(facilities ?? {})
	// Define a state variable to hold selected facility IDs
	const [selectedFacilities, setSelectedFacilities] = useState<string[]>(
		carModel?.carModelFacility?.map(facility => facility.id) ?? [],
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
		id: 'carModel-editor',
		constraint: getFieldsetConstraint(CarModelEditorSchema),
		lastSubmission: carModelFetcher.data?.submission,
		onValidate({ formData }) {
			const parsedData = parse(formData, { schema: CarModelEditorSchema })
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
			url: carModel?.url ?? '',
			title: carModel?.title ?? '',
			year: carModel?.year ?? '',
			description: carModel?.description ?? '',
			seo: carModel?.seo ?? '',
			facilities: carModel?.carModelFacility ?? selectedFacilities,
			carBrandId: carModel?.carBrandId ?? '',
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
				{carModel ? (
					<input type="hidden" name="id" value={carModel.id} />
				) : null}

				<div className="flex flex-col gap-1">
					{/*//TODO: add connection to brand first - select box with 1 possible connection  */}
					<div className="flex gap-5">
						<SelectBox
							labelProps={{ children: 'Select Brand' }}
							inputProps={{
								...conform.input(fields.carBrandId, { ariaAttributes: true }),
							}}
							selectClassName="bg-backgroundDashboard h-12"
							errors={fields.carBrandId.errors}
							options={availableBrands} //TODO: dynamic load from existing carBrands Ids
							defaultOption={carModel?.carBrandId ?? ''}
							className="w-1/2"
						/>

						<SelectBox
							labelProps={{ children: 'Year Of Manufacture' }}
							inputProps={{
								...conform.input(fields.year, { ariaAttributes: true }),
							}}
							selectClassName="bg-backgroundDashboard h-12"
							errors={fields.year.errors}
							options={getAvailableYears()} //TODO: dynamic load from existing carBrands Ids
							defaultOption={carModel?.year.toString() ?? ''}
							className="w-1/2"
						/>
					</div>

					<div className="flex gap-5">
						<Field
							labelProps={{ children: `carModel's URL` }}
							inputProps={{
								autoFocus: true,
								...conform.input(fields.url, { ariaAttributes: true }),
							}}
							errors={fields.url.errors}
							className="w-1/2"
						/>
						<Field
							labelProps={{ children: 'Title' }}
							inputProps={{
								...conform.input(fields.title, { ariaAttributes: true }),
							}}
							errors={fields.title.errors}
							className="w-1/2"
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

					{facilityValues.length ? (
						<>
							<Field
								labelProps={{ children: 'Facilities' }}
								inputProps={{
									...conform.input(fields.carModelFacility, {
										ariaAttributes: true,
									}),
									type: 'hidden',
									name: 'carModelFacility',
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

function getAvailableYears() {
	const currentYear = new Date().getFullYear()
	const startYear = 1914

	const years = []
	for (let year = startYear; year <= currentYear; year++) {
		years.push(year.toString())
	}

	return years.reverse()
}
