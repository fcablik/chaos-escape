import {
	conform,
	list,
	useFieldList,
	useFieldset,
	useForm,
	type FieldConfig,
} from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { createId as cuid } from '@paralleldrive/cuid2'
import { type CarBrand, type CarBrandImage } from '@prisma/client'
import {
	unstable_createMemoryUploadHandler as createMemoryUploadHandler,
	unstable_parseMultipartFormData as parseMultipartFormData,
	json,
	type DataFunctionArgs,
	type SerializeFrom,
} from '@remix-run/node'
import { Form, useFetcher } from '@remix-run/react'
import { useRef, useState } from 'react'
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
import { IconNames } from '#app/components/ui/icons/nameStrings.ts'
import { Label } from '#app/components/ui/label.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { Textarea } from '#app/components/ui/textarea.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { cn, getCarBrandImgSrc } from '#app/utils/misc.tsx'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { countryList } from './_country-list.tsx'

const urlMaxLength = 50
const titleMinLength = 1
const titleMaxLength = 100
const descriptionMinLength = 1
const descriptionMaxLength = 10000
const seoMaxLength = 156

const MAX_UPLOAD_SIZE = 1024 * 1024 * 1 // 1MB

const ImageFieldsetSchema = z.object({
	id: z.string().optional(),
	file: z
		.instanceof(File)
		.optional()
		.refine(file => {
			return !file || file.size <= MAX_UPLOAD_SIZE
		}, 'File size must be less than 1MB'),
	altText: z.string().optional(),
})

type ImageFieldset = z.infer<typeof ImageFieldsetSchema>

function imageHasFile(
	image: ImageFieldset,
): image is ImageFieldset & { file: NonNullable<ImageFieldset['file']> } {
	return Boolean(image.file?.size && image.file?.size > 0)
}

function imageHasId(
	image: ImageFieldset,
): image is ImageFieldset & { id: NonNullable<ImageFieldset['id']> } {
	return image.id != null
}

const maxImages = 1

const urlErrorRef = 'Invalid URL: Use only letters, numbers and dashes.'
const imgsErrorRef =
	'You have reached maximum number of images! (' + maxImages + ')'

const CarBrandEditorSchema = z.object({
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
	countryOfOrigin: z.string(),
	logoIcon: z.string().optional(),
	seo: z.string().max(seoMaxLength).optional(),
	images: z.array(ImageFieldsetSchema).max(maxImages).optional(),
})

export async function action({ request, params }: DataFunctionArgs) {
	const formData = await parseMultipartFormData(
		request,
		createMemoryUploadHandler({ maxPartSize: MAX_UPLOAD_SIZE }),
	)

	const submission = await parse(formData, {
		schema: CarBrandEditorSchema.superRefine(async (data, ctx) => {
			if (!data.id) return

			const carBrand = await prisma.carBrand.findUnique({
				select: { id: true },
				where: { id: data.id },
			})
			if (!carBrand) {
				ctx.addIssue({
					code: 'custom',
					message: 'CarBrand not found',
				})
			}
		}).transform(async ({ images = [], ...data }) => {
			return {
				...data,
				imageUpdates: await Promise.all(
					images.filter(imageHasId).map(async i => {
						if (imageHasFile(i)) {
							return {
								id: i.id,
								altText: i.altText,
								contentType: i.file.type,
								blob: Buffer.from(await i.file.arrayBuffer()),
							}
						} else {
							return {
								id: i.id,
								altText: i.altText,
							}
						}
					}),
				),
				newImages: await Promise.all(
					images
						.filter(imageHasFile)
						.filter(i => !i.id)
						.map(async image => {
							return {
								altText: image.altText,
								contentType: image.file.type,
								blob: Buffer.from(await image.file.arrayBuffer()),
							}
						}),
				),
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
		id: carBrandId,
		url,
		title,
		description,
		countryOfOrigin,
		logoIcon,
		seo,
		imageUpdates = [],
		newImages = [],
	} = submission.value

	const updatedCarBrand = await prisma.carBrand.upsert({
		select: { id: true, title: true },
		where: { id: carBrandId ?? '__new_carBrand__' },
		create: {
			id: carBrandId ?? url,
			url, // has to be unique!! //TODO: error handling unique constraint
			title,
			description,
			countryOfOrigin,
			logoIcon,
			seo,
			images: { create: newImages },
		},
		update: {
			url,
			title,
			description,
			countryOfOrigin,
			logoIcon,
			seo,
			images: {
				deleteMany: { id: { notIn: imageUpdates.map(i => i.id) } },
				updateMany: imageUpdates.map(updates => ({
					where: { id: updates.id },
					data: { ...updates, id: updates.blob ? cuid() : updates.id },
				})),
				create: newImages,
			},
		},
	})

	let toastTitle
	let toastDescription
	if (params.id) {
		toastTitle = 'CarBrand Edited!'
		toastDescription = 'Your edits were saved. 😊'
	} else {
		toastTitle = 'CarBrand Created!'
		toastDescription = `CarBrand: "${updatedCarBrand.title}" successfully created!`
	}

	return redirectWithToast(`/admin/brands/${updatedCarBrand.id}`, {
		type: 'success',
		title: toastTitle,
		description: toastDescription,
	})
}

export function CarBrandEditor({
	carBrand,
}: {
	carBrand?: SerializeFrom<
		Pick<
			CarBrand,
			| 'id'
			| 'url'
			| 'title'
			| 'description'
			| 'logoIcon'
			| 'seo'
			| 'countryOfOrigin'
		> & {
			images: Array<Pick<CarBrandImage, 'id' | 'altText'>>
		}
	>
}) {
	const carBrandFetcher = useFetcher<typeof action>()
	const isPending = carBrandFetcher.state !== 'idle'

	const [form, fields] = useForm({
		id: 'carBrand-editor',
		constraint: getFieldsetConstraint(CarBrandEditorSchema),
		lastSubmission: carBrandFetcher.data?.submission,
		onValidate({ formData }) {
			const parsedData = parse(formData, { schema: CarBrandEditorSchema })
			const errorCheck = parsedData.error

			if (Object.entries(errorCheck).length) {
				if (
					errorCheck.url &&
					errorCheck.url.filter(url => url.includes(urlErrorRef))
				) {
					toast.error(urlErrorRef)
				}

				if (errorCheck.images) {
					toast.error(imgsErrorRef)
				}
			}

			return parsedData
		},
		defaultValue: {
			url: carBrand?.url ?? '',
			title: carBrand?.title ?? '',
			description: carBrand?.description ?? '',
			countryOfOrigin: carBrand?.countryOfOrigin ?? '',
			logoIcon: carBrand?.logoIcon ?? '',
			seo: carBrand?.seo ?? '',
			images: carBrand?.images ?? [{}],
		},
	})
	const imageList = useFieldList(form.ref, fields.images)

	const iconNames = IconNames()

	return (
		<div className="">
			<Form
				method="post"
				className="flex h-full flex-col gap-y-4 overflow-y-auto overflow-x-hidden px-4"
				{...form.props}
				encType="multipart/form-data"
			>
				{/*
					This hidden submit button is here to ensure that when the user hits
					"enter" on an input field, the primary form function is submitted
					rather than the first button in the form (which is delete/add image).
				*/}
				<button type="submit" className="hidden" />
				{carBrand ? (
					<input type="hidden" name="id" value={carBrand.id} />
				) : null}

				<div className="flex flex-col gap-1">
					<div className="flex gap-5">
						<Field
							labelProps={{ children: `carBrand's URL` }}
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

					<div className="flex gap-5">
						<SelectBox
							labelProps={{ children: 'Brand Logo' }}
							inputProps={{
								...conform.input(fields.logoIcon, { ariaAttributes: true }),
							}}
							selectClassName="bg-backgroundDashboard h-12"
							errors={fields.logoIcon.errors}
							options={iconNames}
							defaultOption={carBrand?.logoIcon ?? ''}
							className="w-1/2"
						/>

						<SelectBox
							labelProps={{ children: 'Country Of Origin' }}
							inputProps={{
								...conform.input(fields.countryOfOrigin, {
									ariaAttributes: true,
								}),
							}}
							selectClassName="bg-backgroundDashboard h-12"
							errors={fields.countryOfOrigin.errors}
							options={countryList}
							defaultOption={carBrand?.countryOfOrigin ?? ''}
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

					<div className="mt-8">
						<Label className="text-lg font-bold">
							Images (max. {maxImages})
						</Label>

						<ul className="mt-8 gap-5 max-xl:flex max-xl:flex-col xl:grid xl:grid-cols-2">
							{imageList.map((image, index) => (
								<li
									key={image.key}
									className="relative border-b-2 border-muted-foreground"
								>
									<button
										className="absolute right-0 top-0 text-destructive"
										{...list.remove(fields.images.name, { index })}
									>
										<span aria-hidden>
											<Icon name="cross-1" />
										</span>{' '}
										<span className="sr-only">Remove image {index + 1}</span>
									</button>
									<ImageChooser config={image} />
								</li>
							))}
						</ul>
					</div>

					{imageList.length < maxImages ? (
						<Button
							className="mt-3"
							{...list.append(fields.images.name, { defaultValue: {} })}
						>
							<span aria-hidden>
								<Icon name="plus">Image</Icon>
							</span>{' '}
							<span className="sr-only">Add image</span>
						</Button>
					) : null}
				</div>
				<ErrorList id={form.errorId} errors={form.errors} />
			</Form>

			<div className="">
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

function ImageChooser({
	config,
}: {
	config: FieldConfig<z.infer<typeof ImageFieldsetSchema>>
}) {
	const ref = useRef<HTMLFieldSetElement>(null)
	const fields = useFieldset(ref, config)
	const existingImage = Boolean(fields.id.defaultValue)
	const [previewImage, setPreviewImage] = useState<string | null>(
		fields.id.defaultValue ? getCarBrandImgSrc(fields.id.defaultValue) : null,
	)
	const [altText, setAltText] = useState(fields.altText.defaultValue ?? '')

	return (
		<fieldset
			ref={ref}
			aria-invalid={Boolean(config.errors?.length) || undefined}
			aria-describedby={config.errors?.length ? config.errorId : undefined}
		>
			<div className="flex gap-3">
				<div className="w-32">
					<div className="relative h-32 w-32">
						<label
							htmlFor={fields.file.id}
							className={cn('group absolute h-32 w-32 rounded-lg', {
								'bg-accent opacity-40 focus-within:opacity-100 hover:opacity-100':
									!previewImage,
								'cursor-pointer focus-within:ring-4': !existingImage,
							})}
						>
							{previewImage ? (
								<div className="relative">
									<img
										src={previewImage}
										alt={altText ?? ''}
										className="h-32 w-32 rounded-lg object-cover"
									/>
									{existingImage ? null : (
										<div className="pointer-events-none absolute -right-0.5 -top-0.5 rotate-12 rounded-sm bg-secondary px-2 py-1 text-xs text-secondary-foreground shadow-md">
											new
										</div>
									)}
								</div>
							) : (
								<div className="flex h-32 w-32 items-center justify-center rounded-lg border border-muted-foreground text-4xl text-muted-foreground">
									<Icon name="plus" />
								</div>
							)}
							{existingImage ? (
								<input
									{...conform.input(fields.id, {
										type: 'hidden',
										ariaAttributes: true,
									})}
								/>
							) : null}
							<input
								aria-label="Image"
								className="absolute left-0 top-0 z-0 h-32 w-32 cursor-pointer opacity-0"
								onChange={event => {
									const file = event.target.files?.[0]

									if (file) {
										const reader = new FileReader()
										reader.onloadend = () => {
											setPreviewImage(reader.result as string)
										}
										reader.readAsDataURL(file)
									} else {
										setPreviewImage(null)
									}
								}}
								accept="image/*"
								{...conform.input(fields.file, {
									type: 'file',
									ariaAttributes: true,
								})}
							/>
						</label>
					</div>
					<div className="min-h-[32px] px-4 pb-3 pt-1">
						<ErrorList id={fields.file.errorId} errors={fields.file.errors} />
					</div>
				</div>
				<div className="flex-1">
					<Label htmlFor={fields.altText.id}>Alt Text</Label>
					<Textarea
						onChange={e => setAltText(e.currentTarget.value)}
						{...conform.textarea(fields.altText, { ariaAttributes: true })}
					/>
					<div className="min-h-[32px] px-4 pb-3 pt-1">
						<ErrorList
							id={fields.altText.errorId}
							errors={fields.altText.errors}
						/>
					</div>
				</div>
			</div>
			<div className="min-h-[32px] px-4 pb-3 pt-1">
				<ErrorList id={config.errorId} errors={config.errors} />
			</div>
		</fieldset>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No carBrand with the id "{params.carBrandId}" exists</p>
				),
			}}
		/>
	)
}
