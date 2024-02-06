import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import {
	type RoomPackageItem,
	type Reservation,
	type RoomMultiPackage,
} from '@prisma/client'
import {
	json,
	type DataFunctionArgs,
	type SerializeFrom,
} from '@remix-run/node'
import {
	Form,
	Link,
	useActionData,
	useFetcher,
	useFormAction,
	useNavigation,
} from '@remix-run/react'
import { format, getYear } from 'date-fns'
import { useState } from 'react'
import { toast } from 'sonner'
import { z } from 'zod'
import { ReservationFormEmail } from '#app/components/emails/reservation-email.server.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { ErrorList, Field, TextareaField } from '#app/components/forms.tsx'
import { ReservationEditorExtentionsOperator } from '#app/components/reservation-handlers-extensions.tsx'
import { useRedirectWithScrollToTop } from '#app/components/reservation-modal-animation.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { sendEmail } from '#app/utils/email.server.ts'
import { cn } from '#app/utils/misc.tsx'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { EmailSchema } from '#app/utils/user-validation.ts'

const ReservationEditorSchema = z.object({
	id: z.string().optional(),
	reservationNumber: z.string(),
	roomId: z.string(),
	reservationDateFrom: z.string(),
	reservationDateTo: z.string(),
	createdAtString: z.string(),
	totalPrice: z.preprocess(
		totalPrice => parseInt(z.string().parse(totalPrice), 10),
		z.number(),
	),
	numberOfGuests: z.preprocess(
		guests => parseInt(z.string().parse(guests), 10),
		z.number(),
	),
	numberOfNights: z.preprocess(
		nights => parseInt(z.string().parse(nights), 10),
		z.number(),
	),
	name: z.string(),
	email: EmailSchema,
	message: z.string().optional(),
	roomPackageItems: z
		.array(z.string().transform(value => value.split(',')))
		.optional(),
	roomMultiPackages: z
		.array(z.string().transform(value => value.split(',')))
		.optional(),
})

export async function action({ params, request }: DataFunctionArgs) {
	const formData = await request.formData()

	const submission = await parse(formData, {
		schema: ReservationEditorSchema.superRefine(async (data, ctx) => {
			if (!data.id) return

			const reservation = await prisma.reservation.findUnique({
				select: { id: true },
				where: { id: data.id },
			})
			if (!reservation) {
				ctx.addIssue({
					code: 'custom',
					message: 'Reservation not found',
				})
			}
		}).transform(
			async ({ roomPackageItems = [], roomMultiPackages = [], ...data }) => {
				return {
					...data,
					roomPackageItems: roomPackageItems,
					roomMultiPackages: roomMultiPackages,
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
		id: reservationId,
		roomId,
		reservationNumber,
		name,
		email,
		message,
		reservationDateFrom,
		reservationDateTo,
		createdAtString,
		totalPrice,
		numberOfGuests,
		numberOfNights,
		roomPackageItems = [],
		roomMultiPackages = [],
	} = submission.value

	const updatedReservation = await prisma.reservation.upsert({
		select: { id: true },
		where: { id: reservationId ?? '__new_reservation__' },
		create: {
			roomId,
			reservationNumber,
			name,
			email,
			message,
			reservationDateFrom,
			reservationDateTo,
			createdAtString,
			totalPrice,
			numberOfGuests,
			numberOfNights,
			roomPackageItems: {
				connect: roomPackageItems.length
					? roomPackageItems[0].map(roomPackageItemId => ({
							id: roomPackageItemId,
					  }))
					: [],
			},
			roomMultiPackages: {
				connect: roomMultiPackages.length
					? roomMultiPackages[0].map(roomMultiPackageId => ({
							id: roomMultiPackageId,
					  }))
					: [],
			},
		},
		update: {
			roomId,
			reservationNumber,
			name,
			email,
			message,
			reservationDateFrom,
			reservationDateTo,
			createdAtString,
			totalPrice,
			numberOfGuests,
			numberOfNights,
			roomPackageItems: {
				set: [],
				connect: roomPackageItems.length
					? roomPackageItems[0].map(roomPackageItemId => ({
							id: roomPackageItemId,
					  }))
					: [],
			},
			roomMultiPackages: {
				set: [],
				connect: roomMultiPackages.length
					? roomMultiPackages[0].map(roomMultiPackageId => ({
							id: roomMultiPackageId,
					  }))
					: [],
			},
		},
	})

	const mailMessage =
		'We have successfully received Your created reservation. Here are the further steps: ... ...'
	const subjectMessage = 'Created Reservation at Chaos Escape'

	// TODO: //! I need to add mail send to the owner, not only to the user
	// params.url ?? --> if not reservation from admin, but from FE (this is default/base, that's why it comes first)
	if (params.url) {
		//handling confirmation mail and returning success toast
		const responseToUser = await sendEmail({
			from: 'Reservation Created <noreply@wochdev.com>',
			to: email,
			reply_to: 'reservations@wochdev.com',
			subject: subjectMessage,
			react: (
				<ReservationFormEmail
					email={email}
					name={name}
					message={mailMessage}
					reservationDateFrom={reservationDateFrom}
					reservationDateTo={reservationDateTo}
				/>
			),
		})
		if (responseToUser.status === 'success') {
			return redirectWithToast(`/rooms/${params.url}`, {
				type: 'success',
				title: 'Reservation Created!',
				description:
					'Thank You, Your reservation has been successfully created. 🫡',
			})
		} else {
			submission.error[''] = [responseToUser.error.message]
			return json(
				{
					status: 'error',
					submission,
				} as const,
				{ status: 500 },
			)
		}
	} else {
		// if it's a new reservation
		if (!reservationId) {
			//handling confirmation mail and returning success toast
			const responseToUser = await sendEmail({
				from: 'Reservation Created <noreply@wochdev.com>',
				to: email,
				reply_to: 'reservations@wochdev.com',
				subject: subjectMessage,
				react: (
					<ReservationFormEmail
						email={email}
						name={name}
						message={mailMessage}
						reservationDateFrom={reservationDateFrom}
						reservationDateTo={reservationDateTo}
					/>
				),
			})

			if (responseToUser.status === 'success') {
				return redirectWithToast(
					`/admin/reservations/${updatedReservation.id}`,
					{
						type: 'success',
						title: 'Reservation Created!',
						description: 'Your reservation has been successfully created.',
					},
				)
			} else {
				submission.error[''] = [responseToUser.error.message]
				return json(
					{
						status: 'error',
						submission,
					} as const,
					{ status: 500 },
				)
			}
		} else {
			// else --> it's an existing reservation (reservationId exists)
			return redirectWithToast(`/admin/reservations/${updatedReservation.id}`, {
				type: 'success',
				title: 'Reservation Saved!',
				description: 'Your reservation has been successfully saved.',
			})
		}
	}
}

export function ReservationEditor({
	reservation,
	roomData,
	weekDays,
	existingReservations,
	seasonalExtendedPrices,
	roomDiscounts,
	parentRoute,
}: {
	reservation?: SerializeFrom<
		Pick<
			Reservation,
			| 'id'
			| 'roomId'
			| 'reservationNumber'
			| 'email'
			| 'name'
			| 'message'
			| 'reservationDateFrom'
			| 'reservationDateTo'
			| 'createdAtString'
			| 'numberOfGuests'
			| 'numberOfNights'
		> & {
			roomPackageItems: Array<Pick<RoomPackageItem, 'id' | 'name' | 'price'>>
		} & {
			roomMultiPackages: Array<Pick<RoomMultiPackage, 'id' | 'name' | 'price'>>
		}
	>
	roomData: {
		id: string
		maxGuests: number
		price1: number
		price2?: number | null
		price3?: number | null
		additionalNightPrice1: number
		additionalNightPrice2?: number | null
		additionalNightPrice3?: number | null
		reservations?: {
			reservationDateFrom: string
			reservationDateTo: string
		}[]
		title: string
		numberOfGuestsForDefaultPrice: number
		roomPackageItems: {
			visibility: boolean
			id: string
			name: string
			price: number
		}[]
		roomMultiPackages: {
			id: string
			name: string
			price: number
			visibility: boolean
		}[]
	}
	weekDays: {
		dayInAWeek: string
		divisionAssignmentId: string | null
	}[]
	existingReservations?: {
		reservationNumber: string
	}[]
	seasonalExtendedPrices: {
		dateFrom: string
		dateTo: string
		seasonalRoomPrices: {
			nightPrice: number
			additionalNightPrice: number
			weekDivisionId: string
		}[]
	}[]
	roomDiscounts?: {
		id: string
		type: string
		nights: string | null
		code: string | null
		value: number
		valueType: string
	}[]
	parentRoute?: string
}) {
	const reservationFetcher = useFetcher<typeof action>()
	const [datesErrored, setDatesErrored] = useState(false)

	const actionData = useActionData<typeof action>()
	const formAction = useFormAction()
	const navigation = useNavigation()
	const isSubmitting = navigation.formAction === formAction

	// handling new reservation numbers
	let getReservationNumber
	if (reservation) {
		getReservationNumber = reservation.reservationNumber
	} else if (existingReservations && Object.keys(existingReservations).length) {
		const reservationsFromLoader = Object.values(existingReservations)
		const lastReservationNumber = parseInt(
			reservationsFromLoader[
				reservationsFromLoader.length - 1
			].reservationNumber.split('_')[0],
		)
		getReservationNumber = lastReservationNumber + 1 + '_' + getYear(new Date())
	} else {
		getReservationNumber = 1 + '_' + getYear(new Date())
	}

	// these roomData.roomPackageItems are already filtered from parents' loader!!
	// -- from edit - all existing, from $id routes, only available with status "active"
	// -- (+ ordered by status name: 'active' come first, then deactivated)
	const packageItemsValues = roomData.roomPackageItems
		? Object.values(roomData.roomPackageItems)
		: []

	// Define a state variable to hold selected room IDs
	// -- (+ default values are from already existing reservations and its selected package items)
	const [selectedPackageItems, setSelectedPackageItems] = useState<string[]>(
		reservation?.roomPackageItems?.map(packageItem => packageItem.id) ?? [],
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

	// these roomData.roomPackageItems are already filtered from parents' loader!!
	// -- from edit - all existing, from $id routes, only available with status "active"
	// -- (+ ordered by status name: 'active' come first, then deactivated)
	const multiPackagesValues = roomData.roomMultiPackages
		? Object.values(roomData.roomMultiPackages)
		: []

	// Define a state variable to hold selected room IDs
	// -- (+ default values are from already existing reservations and its selected package items)
	const [selectedMultiPackages, setSelectedMultiPackages] = useState<string[]>(
		reservation?.roomMultiPackages?.map(multiPackage => multiPackage.id) ?? [],
	)
	// Handle checkbox changes
	const handleMultiPackageSelectChange = (
		event: React.ChangeEvent<HTMLInputElement>,
	) => {
		const multiPackageId = event.target.value
		if (event.target.checked) {
			// room is selected, add it to the selectedMultiPackages array
			setSelectedMultiPackages([...selectedMultiPackages, multiPackageId])
		} else {
			// room is unselected, remove it from the selectedMultiPackages array
			setSelectedMultiPackages(
				selectedMultiPackages.filter(id => id !== multiPackageId),
			)
		}
	}

	// Calculate total price based on selected items
	const priceOfSelectedPackages = () => {
		// Calculate total price based on selected package items and multi-packages
		let totalSelectedPackagesPrice = 0

		// Add prices of selected package items
		selectedPackageItems.forEach(packageItemId => {
			const selectedPackageItem = packageItemsValues.find(
				item => item.id === packageItemId,
			)
			totalSelectedPackagesPrice += selectedPackageItem?.price ?? 0
		})

		// Add prices of selected multi-packages
		selectedMultiPackages.forEach(multiPackageId => {
			const selectedMultiPackage = multiPackagesValues.find(
				multiPackage => multiPackage.id === multiPackageId,
			)
			totalSelectedPackagesPrice += selectedMultiPackage?.price ?? 0
		})

		return totalSelectedPackagesPrice
	}

	const [form, fields] = useForm({
		id: 'reservation-editor',
		constraint: getFieldsetConstraint(ReservationEditorSchema),
		lastSubmission: reservationFetcher.data?.submission,
		onValidate({ formData }) {
			const parsedData = parse(formData, { schema: ReservationEditorSchema })
			const errorCheck = parsedData.error

			if (Object.entries(errorCheck).length) {
				const dateFrom = errorCheck.reservationDateFrom
				const dateTo = errorCheck.reservationDateTo
				const name = errorCheck.name
				const email = errorCheck.email

				// TODO: switch to switch/case
				if (dateFrom && dateTo && name && email) {
					toast.error('Select and fill-in all information, please.')
					setDatesErrored(true)
				} else if (dateFrom && dateTo) {
					toast.error('Select both: Check-In and Check-Out dates, please.')
					setDatesErrored(true)
				} else if (dateFrom) {
					toast.error('Select Check-In date, please.')
					setDatesErrored(true)
				} else if (dateTo) {
					toast.error('Select Check-Out date, please.')
					setDatesErrored(true)
				} else if (name) {
					toast.error('Fill-in Your name, please.')
				} else if (email) {
					toast.error('Fill-in Your email, please.')
				}
			}

			return parsedData
		},
		defaultValue: {
			roomId: reservation?.roomId ?? roomData?.id,
			reservationNumber: reservation?.reservationNumber ?? getReservationNumber,
			name: reservation?.name ?? '',
			email: reservation?.email ?? '',
			message: reservation?.message ?? '',
			createdAtString: reservation?.createdAtString ?? '',
			numberOfGuests: reservation?.numberOfGuests ?? '',
			numberOfNights: reservation?.numberOfNights ?? '',
			packageItems: reservation?.roomPackageItems ?? [],
			multiPackages: reservation?.roomMultiPackages ?? [],
		},
	})

	const navigateAndScroll = useRedirectWithScrollToTop()
	const closeReservationFormRoute = () => {
		navigateAndScroll('back')
	}

	// handling slides changes
	const [activeSlide, setActiveSlide] = useState(1) //1=first slide is default
	const [totalPriceRecap, setTotalPriceRecap] = useState(0)

	const handleSlideChange = (newSlide: number) => {
		setActiveSlide(newSlide)

		if (newSlide === 2) {
			const totalPrice = document.getElementById(
				'reservation-editor-totalPrice',
			) as HTMLInputElement | null
			setTotalPriceRecap(parseInt(totalPrice?.value ?? '0'))
		}
	}
	const currency = '€' //#later dynamic

	const {
		price1,
		price2,
		price3,
		additionalNightPrice1,
		additionalNightPrice2,
		additionalNightPrice3,
	} = roomData
	const extractedRoomPrices = {
		price1,
		...(price2 !== null && price2 !== undefined ? { price2 } : {}),
		...(price3 !== null && price3 !== undefined ? { price3 } : {}),
		additionalNightPrice1,
		...(additionalNightPrice2 !== null && additionalNightPrice2 !== undefined
			? { additionalNightPrice2 }
			: {}),
		...(additionalNightPrice3 !== null && additionalNightPrice3 !== undefined
			? { additionalNightPrice3 }
			: {}),
	}

	return (
		<div className="reservationModalCustomMaxHeight fixed z-4001 flex flex-col justify-between overflow-scroll rounded-[40px] bg-white shadow-lg max-md:bottom-0 max-md:left-0 max-md:max-h-full max-md:w-full md:right-0 md:top-1/2 md:min-w-[500px] md:-translate-y-1/2">
			<div className="relative">
				<div
					className="absolute right-6 top-6 cursor-pointer"
					onClick={closeReservationFormRoute}
				>
					<Icon name="cross-1" className="dark:text-background" />
				</div>

				<div className="flex flex-col justify-between px-8 pt-8 dark:text-background lg:px-12 lg:pt-12">
					<h5 className="text-h5">Room Reservation</h5>

					{reservation ? (
						<Link to={'/admin/rooms/' + roomData.id} className="mb-4 underline">
							{roomData.title}
						</Link>
					) : (
						<div className="mb-4 underline">{roomData.title}</div>
					)}
				</div>

				<Form
					method="post"
					className="flex flex-col"
					{...form.props}
					encType="multipart/form-data"
				>
					{/* element with first slide - slide 1 */}
					<div
						id="reservation-form-slide-1"
						className={cn(
							'reservationModalSlideCustomHeight',
							activeSlide === 1 ? 'visible' : 'hidden',
						)}
					>
						<div className="flex flex-col justify-between px-8 lg:px-12">
							{/*
								This hidden submit button is here to ensure that when the user hits
								"enter" on an input field, the primary form function is submitted
								rather than the first button in the form (which was delete/add image).
							*/}
							<button type="submit" className="hidden" />

							{reservation ? (
								<input type="hidden" name="id" value={reservation.id} />
							) : null}

							<input
								name="reservationNumber"
								type="hidden"
								value={fields.reservationNumber.defaultValue}
							/>
							<input
								name="createdAtString"
								type="hidden"
								value={
									reservation?.createdAtString ??
									format(new Date(), 'yyyy/MM/dd')
								}
							/>

							<div className="flex flex-col gap-1">
								{roomData ? (
									<>
										<input name="roomId" type="hidden" value={roomData.id} />

										<ReservationEditorExtentionsOperator
											roomPrices={extractedRoomPrices}
											weekDays={weekDays}
											roomReservations={roomData.reservations}
											roomMaxGuests={roomData.maxGuests}
											seasonalExtendedPrices={seasonalExtendedPrices}
											roomDiscounts={roomDiscounts}
											selectedPackagesPrice={priceOfSelectedPackages()}
											defaultGuestCount={roomData.numberOfGuestsForDefaultPrice}
											numberOfGuests={fields.numberOfGuests.defaultValue}
											reservationNumberOfNights={
												fields.numberOfNights.defaultValue
											}
											fieldsDateFromDefaultValue={
												reservation?.reservationDateFrom ?? ''
											}
											fieldsDateToDefaultValue={
												reservation?.reservationDateTo ?? ''
											}
											datesErroredOnValidation={datesErrored}
										/>
										<div className="min-h-[32px] px-4 pb-3 pt-1" />
									</>
								) : null}

								<Field
									labelProps={{
										children: 'Name',
										className: 'dark:text-background',
									}}
									inputProps={{
										...conform.input(fields.name, { ariaAttributes: true }),
										placeholder: 'Your Full Name',
										className: 'bg-backgroundDashboard h-12',
									}}
									errors={fields.name.errors}
								/>
								<Field
									labelProps={{
										children: 'Email',
										className: 'dark:text-background',
									}}
									inputProps={{
										...conform.input(fields.email, { ariaAttributes: true }),
										placeholder: 'Your Email Address',
										className: 'bg-backgroundDashboard h-12',
									}}
									errors={fields.email.errors}
								/>
							</div>

							{packageItemsValues.length ? (
								<div className="my-2 dark:text-background">
									<div className="hidden">
										<Field
											labelProps={{}}
											inputProps={{
												...conform.input(fields.roomPackageItems, {
													ariaAttributes: true,
												}),
												type: 'hidden',
												name: 'roomPackageItems',
												value: selectedPackageItems,
											}}
										/>
									</div>
									<p className="my-2 text-sm dark:text-background">
										individual reservation extensions
									</p>

									<div className="flex flex-col gap-2">
										{packageItemsValues.map((packageItem, i) => (
											<div key={i}>
												<label className="dark:text-background">
													<div className="flex">
														<input
															type="checkbox"
															value={packageItem.id}
															checked={selectedPackageItems.includes(
																packageItem.id,
															)}
															onChange={handlePackageItemSelectChange}
														/>

														<div>
															{packageItem.name} - {currency}
															{packageItem.price}
															{parentRoute === '$id' &&
																packageItem.visibility && (
																	<>
																		{' '}
																		-{' '}
																		<span
																			className={cn(
																				packageItem.visibility
																					? 'rounded-sm bg-highlight px-2 py-1 text-white'
																					: 'rounded-sm bg-destructive px-2 py-1',
																			)}
																		>
																			{packageItem.visibility
																				? 'active'
																				: 'disabled'}
																		</span>
																	</>
																)}
														</div>
													</div>
												</label>
											</div>
										))}
									</div>
								</div>
							) : null}

							{multiPackagesValues.length ? (
								<div className="my-2">
									<div className="hidden">
										<Field
											labelProps={{}}
											inputProps={{
												...conform.input(fields.roomMultiPackages, {
													ariaAttributes: true,
												}),
												type: 'hidden',
												name: 'roomMultiPackages',
												value: selectedMultiPackages,
											}}
										/>
									</div>
									<p className="my-2 text-sm dark:text-background">
										special offers / packages
									</p>

									<div className="flex flex-col gap-2">
										{multiPackagesValues.map((multiPackage, i) => (
											<div key={i}>
												<label className="dark:text-background">
													<div className="flex">
														<input
															type="checkbox"
															value={multiPackage.id}
															checked={selectedMultiPackages.includes(
																multiPackage.id,
															)}
															onChange={handleMultiPackageSelectChange}
														/>

														<div>
															{multiPackage.name} - {currency}
															{multiPackage.price}
															{parentRoute === 'reservation-edit' &&
																(multiPackage.visibility ? (
																	<>
																		{' '}
																		-{' '}
																		<span className="rounded-sm bg-highlight px-2 py-1 text-white">
																			active
																		</span>
																	</>
																) : (
																	<>
																		{' '}
																		-{' '}
																		<span className="rounded-sm bg-destructive px-2 py-1">
																			disabled
																		</span>
																	</>
																))}
														</div>
													</div>
												</label>
											</div>
										))}
									</div>
								</div>
							) : null}

							<ErrorList id={form.errorId} errors={form.errors} />
						</div>
					</div>

					{/* element with slide 2 */}
					<div
						id="reservation-form-slide-2"
						className={cn(
							'reservationModalSlideCustomHeight dark:text-background',
							activeSlide === 2 ? 'visible' : 'hidden',
						)}
					>
						<div className="flex flex-col px-8 lg:px-12">
							{/* {nightPriceRecap ? (
								<div>
									{currency}
									{!additionalGuestNightPriceRecap
										? !selectedPackagesPriceRecap
											? nightPriceRecap
											: nightPriceRecap + selectedPackagesPriceRecap
										: nightPriceRecap +
										  additionalGuestNightPriceRecap +
										  selectedPackagesPriceRecap}{' '}
									/ night
								</div>
							) : null}
							{selectedPackagesPriceRecap > 0 && (
								<>
									Packages Total: {currency}
									{selectedPackagesPriceRecap}
								</>
							)} */}

							{totalPriceRecap ? (
								<div>
									Total Price: {currency}
									{totalPriceRecap}
								</div>
							) : null}

							<TextareaField
								labelProps={{ children: 'Your Message (optional)' }}
								textareaProps={{
									...conform.textarea(fields.message, { ariaAttributes: true }),
									placeholder: 'Leave a note if needed.',
									className: 'bg-backgroundDashboard h-12',
								}}
								errors={fields.message.errors}
							/>
						</div>
					</div>
				</Form>

				<div className="mx-8 my-8 flex justify-center lg:mx-12 lg:my-12">
					{/* <Button form={form.id} variant="destructive" type="reset">
						Reset
					</Button> */}

					{activeSlide !== 1 ? (
						<Button
							variant="outline"
							type="button"
							onClick={() => handleSlideChange(activeSlide - 1)}
							className="transition-none"
						>
							<Icon name="caret-left" size="xl" />
						</Button>
					) : (
						<Button
							variant="highlight-secondary"
							type="button"
							onClick={() => handleSlideChange(activeSlide + 1)}
							className="flex w-2/3 justify-center gap-4 py-6 capitalize"
						>
							<Icon iconAfter={true} name="caret-right">
								Continue
							</Icon>
						</Button>
					)}

					{activeSlide === 2 ? (
						<StatusButton
							form={form.id}
							type="submit"
							status={isSubmitting ? 'pending' : actionData?.status ?? 'idle'}
							disabled={isSubmitting}
							className="w-2/3 py-6 capitalize"
						>
							{reservation ? 'save reservation' : 'create reservation'}
						</StatusButton>
					) : null}
				</div>
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<p>No reservation with the id "{params.reservationId}" exists</p>
				),
			}}
		/>
	)
}
