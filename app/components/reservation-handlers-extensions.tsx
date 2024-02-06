import {
	addDays,
	differenceInDays,
	format,
	isSameDay,
	parse,
	subDays,
} from 'date-fns'
import { useState } from 'react'
import { toast } from 'sonner'
import { cn } from '#app/utils/misc.tsx'
import {
	generateCalendar,
	getDatesInBetween,
	useCalendarsCommonLogic,
} from './calendar-helpers.tsx'
import { calendarBackdropClassList } from './modal-backdrop.tsx'
import { Spacer } from './spacer.tsx'
import { Button } from './ui/button.tsx'
import { Icon } from './ui/icon.tsx'

const spacingClassList = ' p-2 m-1'
const highlightSelectClassList = 'bg-highlight text-background'
const highlightHoverClassList =
	'hover:bg-highlight hover:text-background'
const daysInReservationCalendarClassList =
	highlightHoverClassList +
	' hover:transition-colors rounded-lg' +
	spacingClassList
const disabledDaysInReservationCalendarClassList =
	'text-foreground opacity-40 rounded-lg' + spacingClassList
const checkInDaysInReservationCalendarClassList =
	'text-foreground bg-checkin-day from-orange-200 from-50% to-transparent to-0% rounded-lg' +
	spacingClassList
const checkOutDaysInReservationCalendarClassList =
	'text-foreground bg-checkout-day from-orange-200 from-50% to-transparent to-0% rounded-lg' +
	spacingClassList
const fullyBookedDaysInReservationCalendarClassList =
	'dark:text-background bg-destructive rounded-lg' + spacingClassList

// room's calendar with dates availability preview
export function ReadOnlyReservationCalendar({
	roomReservations,
}: {
	roomReservations: {
		reservationDateFrom: string
		reservationDateTo: string
	}[]
}) {
	const { calendarNavigation, daysTitles, selectedMonth, selectedYear } =
		useCalendarsCommonLogic()

	// handling the rendered section of all the dates
	const displayedCalendarDate = new Date()
	displayedCalendarDate.setMonth(selectedMonth - 1)
	displayedCalendarDate.setFullYear(selectedYear)
	const selectedMonthDates = generateCalendar(displayedCalendarDate)

	// handling existing reservations from db
	const reservations = Object.values(roomReservations)
	const reservationDatesFrom = reservations.map(reservation =>
		format(new Date(reservation.reservationDateFrom), 'yyyy/M/d'),
	)
	const reservationDatesTo = reservations.map(reservation =>
		format(new Date(reservation.reservationDateTo), 'yyyy/M/d'),
	)
	const reservationDatesBetween = reservations
		.map(reservation =>
			getDatesInBetween(
				new Date(reservation.reservationDateFrom),
				new Date(reservation.reservationDateTo),
			).map(date => format(date, 'yyyy/M/d')),
		)
		.flat()

	const calendarDates = selectedMonthDates.map(week =>
		week.map((date, i) => {
			const renderedFullDate =
				date !== 0 ? selectedYear + '/' + selectedMonth + '/' + date : ''
			let isDateCheckIn
			let isDateCheckOut

			let classList = daysInReservationCalendarClassList
			if (date !== 0) {
				if (addDays(new Date(), -1) >= new Date(renderedFullDate)) {
					classList = disabledDaysInReservationCalendarClassList
				} else {
					isDateCheckIn = reservationDatesFrom.includes(renderedFullDate)
					isDateCheckOut = reservationDatesTo.includes(renderedFullDate)

					const isDateBetweenCheckInAndCheckOut =
						reservationDatesBetween.includes(renderedFullDate)

					if (isDateCheckIn && isDateCheckOut) {
						classList = fullyBookedDaysInReservationCalendarClassList
					} else {
						if (
							isDateCheckIn &&
							isSameDay(new Date(), new Date(renderedFullDate))
						) {
							classList = fullyBookedDaysInReservationCalendarClassList
						} else if (isDateCheckIn) {
							classList = checkInDaysInReservationCalendarClassList
						}
						if (isDateCheckOut) {
							classList = checkOutDaysInReservationCalendarClassList
						}
						if (isDateBetweenCheckInAndCheckOut) {
							classList = fullyBookedDaysInReservationCalendarClassList
						}
					}
				}
			}

			const dateButton =
				date !== 0 ? (
					<button
						type="button"
						key={i}
						className={cn(
							classList,
							(isDateCheckIn || isDateCheckOut) &&
								!(isDateCheckIn && isDateCheckOut) &&
								!isSameDay(new Date(), new Date(renderedFullDate))
								? highlightHoverClassList
								: '',
						)}
						disabled={true}
					>
						<div className="flex flex-col">{date}</div>
					</button>
				) : (
					<button type="button" disabled className="opacity-0" key={i}></button>
				)

			return dateButton
		}),
	)

	return (
		<div className="inline-block rounded-lg border bg-background p-8 text-foreground shadow-lg">
			{calendarNavigation}

			<Spacer size="4xs" />
			<div>
				{daysTitles}

				<div className="grid max-w-[30em] grid-cols-7">{calendarDates}</div>
			</div>
		</div>
	)
}

//rooom's reservation calendar
export function ReservationEditorExtentionsOperator({
	roomPrices,
	weekDays,
	roomReservations,
	seasonalExtendedPrices,
	roomDiscounts,
	defaultGuestCount,
	numberOfGuests,
	reservationNumberOfNights,
	roomMaxGuests,
	fieldsDateFromDefaultValue,
	fieldsDateToDefaultValue,
	datesErroredOnValidation,
	selectedPackagesPrice,
}: {
	roomPrices: {
		price1: number
		price2?: number
		price3?: number
		additionalNightPrice1: number
		additionalNightPrice2?: number
		additionalNightPrice3?: number
	}
	weekDays: {
		dayInAWeek: string
		divisionAssignmentId: string | null
	}[]
	roomReservations?: {
		reservationDateFrom: string
		reservationDateTo: string
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
	defaultGuestCount: number
	numberOfGuests?: number
	reservationNumberOfNights?: number
	roomMaxGuests: number
	fieldsDateFromDefaultValue: string
	fieldsDateToDefaultValue: string
	datesErroredOnValidation?: boolean
	selectedPackagesPrice: number
}) {
	const { calendarNavigation, daysTitles, selectedMonth, selectedYear } =
		useCalendarsCommonLogic()

	// reservation-editor's default values
	const formFieldsDateFrom = fieldsDateFromDefaultValue
	const formFieldsDateTo = fieldsDateToDefaultValue

	// handling show/hide of check-in calendar and backdrop underlay
	const [showCheckInCalendar, setShowCheckInCalendar] = useState(false)
	const toggleCalendarCheckInVisibility = () => {
		setShowCheckInCalendar(prevVisible => !prevVisible)
	}

	// handling show/hide of check-out calendar and backdrop underlay
	const [showCheckOutCalendar, setShowCheckOutCalendar] = useState(false)
	const toggleCalendarCheckOutVisibility = () => {
		setShowCheckOutCalendar(prevVisible => !prevVisible)
	}

	// handling the rendered section of all the dates
	const displayedCalendarDate = new Date()
	displayedCalendarDate.setMonth(selectedMonth - 1)
	displayedCalendarDate.setFullYear(selectedYear)
	const selectedMonthDates = generateCalendar(displayedCalendarDate)

	// handling existing reservations from db
	const reservations = Object.values(roomReservations ?? {})
	const reservationDatesFrom = reservations.map(reservation =>
		format(new Date(reservation.reservationDateFrom), 'yyyy/M/d'),
	)
	const reservationDatesTo = reservations.map(reservation =>
		format(new Date(reservation.reservationDateTo), 'yyyy/M/d'),
	)
	const reservationDatesBetween = reservations
		.map(reservation =>
			getDatesInBetween(
				new Date(reservation.reservationDateFrom),
				new Date(reservation.reservationDateTo),
			).map(date => format(date, 'yyyy/M/d')),
		)
		.flat()

	// handling check-in/check-out days selection
	const [selectedCheckInDate, setSelectedCheckInDate] = useState('')
	const [selectedCheckOutDate, setSelectedCheckOutDate] = useState('')

	let erroredSelectedDates = ['']
	if (
		reservationDatesTo.includes(selectedCheckInDate) &&
		reservationDatesFrom.includes(selectedCheckOutDate)
	) {
		// handling unavailable single nights between selected check/in/out dates (reservations that do not have between days/dates)
		const errorArrayFrom = reservationDatesFrom.filter(
			item => item !== selectedCheckOutDate,
		)
		const errorArrayTo = reservationDatesTo.filter(
			item => item !== selectedCheckInDate,
		)
		erroredSelectedDates = [
			...errorArrayFrom,
			...reservationDatesBetween,
			...errorArrayTo,
		]
	} else if (reservationDatesTo.includes(selectedCheckInDate)) {
		erroredSelectedDates = [...reservationDatesBetween, ...reservationDatesFrom]
	} else if (reservationDatesFrom.includes(selectedCheckOutDate)) {
		erroredSelectedDates = [...reservationDatesTo, ...reservationDatesBetween]
	} else {
		erroredSelectedDates = [
			...reservationDatesFrom,
			...reservationDatesBetween,
			...reservationDatesTo,
		]
	}

	const [datesErrored, setDatesErrored] = useState(false)
	let selectedRangeHasUnavailableDate = false
	if (erroredSelectedDates) {
		selectedRangeHasUnavailableDate = erroredSelectedDates.some(
			disabledDate => {
				if (!(selectedCheckInDate && selectedCheckOutDate)) {
					return false
				} else {
					const date = new Date(disabledDate)
					return (
						date >= new Date(selectedCheckInDate) &&
						date <= new Date(selectedCheckOutDate)
					)
				}
			},
		)
	}
	if (selectedRangeHasUnavailableDate) {
		resetCheckInCheckOut()
		setDatesErrored(true)
		toast.error(
			`You have selected a range with unavailable days.. 🫣 Please, select again.`,
		)
	}

	// bug: datesErrored is switched between 1/0 on each error range selected (e.g. first error triggers true, second error in row triggers false, so the second error doesn't get the proper error treatment)
	if (datesErrored && selectedCheckInDate && selectedCheckOutDate) {
		setDatesErrored(false)
	}

	function handleCheckInDateClick(dateString: string) {
		setSelectedCheckInDate(dateString)
		toggleCalendarCheckInVisibility()
	}
	function handleCheckInDateChange(e: React.ChangeEvent<HTMLInputElement>) {
		setSelectedCheckInDate(e.target.value)
	}

	function handleCheckOutDateClick(dateString: string) {
		setSelectedCheckOutDate(dateString)
		toggleCalendarCheckOutVisibility()
	}
	function handleCheckOutDateChange(e: React.ChangeEvent<HTMLInputElement>) {
		setSelectedCheckOutDate(e.target.value)
	}
	function resetCheckInCheckOut() {
		setSelectedCheckInDate('')
		setSelectedCheckOutDate('')
		setDatesErrored(true)

		if (!selectedRangeHasUnavailableDate) {
			toast.success('You have reset Your selected range.')
		}
	}

	// mapping over rendered dates to get each week in the currently selected month
	const calendarDatesCheckIn = selectedMonthDates.map(week =>
		week.map((date, i) => {
			const renderedFullDate =
				date !== 0 ? selectedYear + '/' + selectedMonth + '/' + date : ''
			let classList = daysInReservationCalendarClassList
			let disabledState = false

			let isDateCheckIn
			let isDateCheckOut

			if (date !== 0) {
				if (addDays(new Date(), -1) >= new Date(renderedFullDate)) {
					classList = disabledDaysInReservationCalendarClassList
					disabledState = true
				} else {
					isDateCheckIn = reservationDatesFrom.includes(renderedFullDate)
					isDateCheckOut = reservationDatesTo.includes(renderedFullDate)
					const isDateBetweenCheckInAndCheckOut =
						reservationDatesBetween.includes(renderedFullDate)

					if (
						selectedCheckOutDate &&
						new Date(renderedFullDate) >= new Date(selectedCheckOutDate)
					) {
						classList = disabledDaysInReservationCalendarClassList
						disabledState = true
					}

					if (isDateCheckIn && isDateCheckOut) {
						disabledState = true
						classList = fullyBookedDaysInReservationCalendarClassList
					} else {
						if (
							isDateCheckIn &&
							isSameDay(new Date(), new Date(renderedFullDate))
						) {
							disabledState = true
							classList = fullyBookedDaysInReservationCalendarClassList
						} else if (isDateCheckIn) {
							disabledState = true
							classList = checkInDaysInReservationCalendarClassList
						}
						if (isDateCheckOut) {
							disabledState = false
							classList = checkOutDaysInReservationCalendarClassList

							if (
								new Date(renderedFullDate) >= new Date(selectedCheckOutDate)
							) {
								disabledState = true
							}
						}
						if (isDateBetweenCheckInAndCheckOut) {
							disabledState = true
							classList = fullyBookedDaysInReservationCalendarClassList
						}
					}
				}
			}

			const dateButton =
				date !== 0 ? (
					<button
						type="button"
						key={i}
						className={cn(
							classList,
							renderedFullDate === selectedCheckInDate
								? highlightSelectClassList
								: '',
							renderedFullDate === selectedCheckOutDate
								? highlightSelectClassList
								: '',
							isDateCheckOut &&
								!(isDateCheckIn && isDateCheckOut) &&
								!isSameDay(new Date(), new Date(renderedFullDate))
								? highlightHoverClassList
								: '',
						)}
						onClick={() => handleCheckInDateClick(renderedFullDate)}
						disabled={disabledState}
					>
						<div className="flex flex-col">
							{date}

							{renderedFullDate === selectedCheckOutDate ? (
								<Icon name="arrow-left" />
							) : null}
							{renderedFullDate === selectedCheckInDate ? (
								<Icon name="arrow-right" />
							) : null}
						</div>
					</button>
				) : (
					<button type="button" disabled className="opacity-0" key={i}></button>
				)

			return dateButton
		}),
	)
	const calendarDatesCheckOut = selectedMonthDates.map(week =>
		week.map((date, i) => {
			const renderedFullDate =
				date !== 0 ? selectedYear + '/' + selectedMonth + '/' + date : ''
			let classList = daysInReservationCalendarClassList
			let disabledState = false

			let isDateCheckIn
			let isDateCheckOut

			if (date !== 0) {
				if (addDays(new Date(), -1) >= new Date(renderedFullDate)) {
					classList = disabledDaysInReservationCalendarClassList
					disabledState = true
				} else {
					isDateCheckIn = reservationDatesFrom.includes(renderedFullDate)
					isDateCheckOut = reservationDatesTo.includes(renderedFullDate)
					const isDateBetweenCheckInAndCheckOut =
						reservationDatesBetween.includes(renderedFullDate)

					if (
						selectedCheckInDate &&
						new Date(renderedFullDate) <= new Date(selectedCheckInDate)
					) {
						classList = disabledDaysInReservationCalendarClassList
						disabledState = true
					}

					if (isDateCheckIn && isDateCheckOut) {
						disabledState = true
						classList = fullyBookedDaysInReservationCalendarClassList
					} else {
						if (
							isDateCheckIn &&
							isSameDay(new Date(), new Date(renderedFullDate))
						) {
							disabledState = true
							classList = fullyBookedDaysInReservationCalendarClassList
						} else if (isDateCheckIn) {
							disabledState = false
							classList = checkInDaysInReservationCalendarClassList

							if (new Date(renderedFullDate) <= new Date(selectedCheckInDate)) {
								disabledState = true
							}
						}
						if (isDateCheckOut) {
							disabledState = true
							classList = checkOutDaysInReservationCalendarClassList
						}
						if (isDateBetweenCheckInAndCheckOut) {
							disabledState = true
							classList = fullyBookedDaysInReservationCalendarClassList
						}
					}
				}
			}

			const dateButton =
				date !== 0 ? (
					<button
						type="button"
						key={i}
						className={cn(
							classList,
							renderedFullDate === selectedCheckInDate
								? highlightSelectClassList
								: '',
							renderedFullDate === selectedCheckOutDate
								? highlightSelectClassList
								: '',
							isDateCheckIn &&
								!(isDateCheckIn && isDateCheckOut) &&
								!isSameDay(new Date(), new Date(renderedFullDate))
								? highlightHoverClassList
								: '',
						)}
						onClick={() => handleCheckOutDateClick(renderedFullDate)}
						disabled={disabledState}
					>
						<div className="flex flex-col">
							{date}

							{renderedFullDate === selectedCheckOutDate ? (
								<Icon name="arrow-left" />
							) : null}
							{renderedFullDate === selectedCheckInDate ? (
								<Icon name="arrow-right" />
							) : null}
						</div>
					</button>
				) : (
					<button type="button" disabled className="opacity-0" key={i}></button>
				)

			return dateButton
		}),
	)
	const resetSelectionButton = (
		<>
			<Spacer size="4xs" />
			<Button
				className="mx-auto flex"
				variant="outline"
				type="button"
				onClick={() => resetCheckInCheckOut()}
			>
				Reset
			</Button>
		</>
	)

	// handling initial guest / guest count changes
	const minNumberOfGuests = defaultGuestCount
	const initGuestCount = numberOfGuests ? numberOfGuests : minNumberOfGuests
	const [guestCount, setGuestCount] = useState(initGuestCount)
	function handleGuestsIncrement() {
		if (guestCount < roomMaxGuests) {
			setGuestCount(guestCount + 1)
		}
	}
	function handleGuestsDecrement() {
		if (guestCount > 1) {
			setGuestCount(guestCount - 1)
		}
	}

	//handling prices and nights
	let numberOfNightsText
	const numberOfNights =
		formFieldsDateFrom && formFieldsDateTo
			? differenceInDays(
					new Date(formFieldsDateTo),
					new Date(formFieldsDateFrom),
			  )
			: selectedCheckInDate && selectedCheckOutDate
			  ? differenceInDays(
						new Date(selectedCheckOutDate),
						new Date(selectedCheckInDate),
			    )
			  : 0

	numberOfNights < 2
		? (numberOfNightsText = 'night')
		: (numberOfNightsText = 'nights')

	const localTotalPrice = calculateReservationTotalPrice(
		selectedCheckInDate,
		selectedCheckOutDate,
		weekDays,
		roomPrices,
		seasonalExtendedPrices,
		guestCount,
		minNumberOfGuests,
		selectedPackagesPrice,
	)
	console.log("New Reservation's Final Total Price", localTotalPrice)

	// TODO:
	// 1. DONE: - if any discounts - get number of nights, find discount for this number of nights or lower
	// 2. DONE: - if found, apply to total price, display discount value
	// 3. - if nothing found, be ready for input of promo code - on inputted & submited promo code
	// ---> find this code in the roomDiscounts list, if found, apply to total price & display promo code with it's value
	// 4. if promo code not found, continue with base total price only
	console.log('room discounts:', roomDiscounts ?? 'no room discounts')

	// remodel simpler and better handling & also get ready to use promo codes
	// use promo code on top of nightly prices ??
	let activeMultiNightDiscount
	// let activePromoCodeDiscounts
	if (roomDiscounts) {
		activeMultiNightDiscount = getMultiNightDiscount(
			roomDiscounts,
			numberOfNights,
		)
		// activePromoCodeDiscounts = []
	}

	let discountedPrice: number = 0
	if (activeMultiNightDiscount) {
		if (activeMultiNightDiscount.valueType === '% percentage') {
			discountedPrice =
				localTotalPrice -
				localTotalPrice * (activeMultiNightDiscount.value / 100)
		} else if (activeMultiNightDiscount.valueType === '- fixed value') {
			discountedPrice = localTotalPrice - activeMultiNightDiscount.value
		}
	}

	const currency = '€' //#later switch to dynamic

	return (
		<>
			<div className="min-h-[16px]" />

			<div className="flex items-end gap-5">
				<div className="w-1/2">
					<p className="dark:text-background">Guests</p>

					<div className="inline-flex h-12 w-full items-center justify-between rounded-md border border-input bg-backgroundDashboard px-6 py-2 text-sm font-medium focus-visible:bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
						{!(formFieldsDateFrom && formFieldsDateTo) ? (
							<Icon
								name="minus"
								className="cursor-pointer text-white"
								onClick={handleGuestsDecrement}
							/>
						) : (
							<div />
						)}
						<input
							required
							name="numberOfGuests"
							form="reservation-editor"
							id="reservation-editor-numberOfGuests"
							className="focus-visible:none focus-visible:none focus-visible:none max-w-[30px] bg-backgroundDashboard text-center ring-offset-background focus-visible:outline-none"
							type="text"
							value={guestCount}
							readOnly
						/>
						{!(formFieldsDateFrom && formFieldsDateTo) ? (
							<Icon
								name="plus2"
								className="cursor-pointer"
								onClick={handleGuestsIncrement}
							/>
						) : (
							<div />
						)}
					</div>
				</div>

				<div className="w-1/2 text-right">
					<div className="mt-2 dark:text-background">
						{localTotalPrice !== 0 ? (
							<>






								<strong>
									<span>Total: </span>
									<span>
										{activeMultiNightDiscount
											? discountedPrice
											: localTotalPrice}
										&nbsp;{currency} / {numberOfNights}&nbsp;
										{numberOfNightsText}
									</span>
								</strong>




								<div className="mt-2">
									{activeMultiNightDiscount && (
										<>
											<strong>Discount: - </strong>
											{activeMultiNightDiscount.valueType === '% percentage' ? (
												<>{activeMultiNightDiscount.value}%</>
											) : (
												activeMultiNightDiscount.valueType ===
													'- fixed value' && (
													<>
														{currency}
														{activeMultiNightDiscount.value}
													</>
												)
											)}
										</>
									)}
								</div>







								<input
									name="totalPrice"
									type="hidden"
									value={
										activeMultiNightDiscount ? discountedPrice : localTotalPrice
									}
									form="reservation-editor"
									id="reservation-editor-totalPrice"
									required
								/>






								
							</>
						) : (
							<>
								<input
									name="totalPrice"
									type="hidden"
									value={''}
									form="reservation-editor"
									id="reservation-editor-totalPrice"
									aria-invalid="true"
									required
								/>
							</>
						)}

						{selectedPackagesPrice ? (
							<div className="dark:text-background">
								(extra: {currency + guestCount * selectedPackagesPrice} / night)
								<input
									type="hidden"
									id="selectedPackagesPrice"
									value={guestCount * selectedPackagesPrice}
								/>
							</div>
						) : null}

						{reservationNumberOfNights ? (
							<input
								required
								type="hidden"
								name="numberOfNights"
								id="reservation-editor-numberOfNights"
								value={reservationNumberOfNights}
							/>
						) : (
							<input
								required
								type="hidden"
								name="numberOfNights"
								id="reservation-editor-numberOfNights"
								value={numberOfNights}
							/>
						)}
					</div>
				</div>
			</div>

			<div className="min-h-[16px]" />

			<div className="flex gap-5">
				{formFieldsDateFrom && formFieldsDateTo ? (
					<>
						<div className="w-full">
							<p className="dark:text-background">Check-In</p>
							<Button
								type="button"
								variant="disabled"
								size="xl"
								className="w-full bg-backgroundDashboard"
							>
								{format(new Date(formFieldsDateFrom), 'PPP')}
							</Button>

							<input
								name="reservationDateFrom"
								type="hidden"
								value={formFieldsDateFrom}
							/>
						</div>

						<div className="w-full">
							<p className="dark:text-background">Check-Out</p>
							<Button
								type="button"
								variant="disabled"
								size="xl"
								className="w-full bg-backgroundDashboard"
							>
								{format(new Date(formFieldsDateTo), 'PPP')}
							</Button>

							<input
								name="reservationDateTo"
								type="hidden"
								value={formFieldsDateTo}
							/>
						</div>
					</>
				) : (
					<>
						<div className="w-full">
							<p className="dark:text-background">Check-In</p>
							<Button
								type="button"
								onClick={toggleCalendarCheckInVisibility}
								variant="primary"
								size="xl"
								className={cn(
									'w-full',
									selectedCheckInDate ? highlightSelectClassList : '',
									datesErrored ? 'border-input-invalid' : '',
									datesErroredOnValidation ? 'border-input-invalid' : '',
								)}
							>
								{selectedCheckInDate
									? format(new Date(selectedCheckInDate), 'PPP')
									: 'Check-In'}
							</Button>

							<input
								required
								name="reservationDateFrom"
								type="hidden"
								value={
									selectedCheckInDate
										? format(new Date(selectedCheckInDate), 'yyyy/MM/dd')
										: ''
								}
								onChange={handleCheckInDateChange}
								form="reservation-editor"
								id="reservation-editor-reservationDateFrom"
								aria-invalid={selectedCheckInDate ? false : true}
							/>
						</div>

						<div className="w-full">
							<p className="dark:text-background">Check-Out</p>
							<Button
								onClick={toggleCalendarCheckOutVisibility}
								type="button"
								variant="primary"
								size="xl"
								className={cn(
									'w-full',
									selectedCheckOutDate ? highlightSelectClassList : '',
									datesErrored ? 'border-input-invalid' : '',
									datesErroredOnValidation ? 'border-input-invalid' : '',
								)}
							>
								{selectedCheckOutDate
									? format(new Date(selectedCheckOutDate), 'PPP')
									: 'Check-Out'}
							</Button>

							<input
								required
								name="reservationDateTo"
								type="hidden"
								value={
									selectedCheckOutDate
										? format(new Date(selectedCheckOutDate), 'yyyy/MM/dd')
										: ''
								}
								onChange={handleCheckOutDateChange}
								form="reservation-editor"
								id="reservation-editor-reservationDateTo"
								aria-invalid={selectedCheckInDate ? false : true}
							/>
						</div>
					</>
				)}

				{showCheckInCalendar && (
					<>
						<div
							onClick={toggleCalendarCheckInVisibility}
							className={calendarBackdropClassList}
						/>

						{/* calendar modal */}
						<div className="absolute top-20 z-100 rounded-lg border bg-background px-8 py-6 text-foreground">
							<h6 className="text-center text-h6">Select Your Check-In</h6>

							<Spacer size="3xs" />

							{calendarNavigation}

							<Spacer size="4xs" />
							<div>
								{daysTitles}

								<div className="grid max-w-[30em] grid-cols-7">
									{calendarDatesCheckIn}
								</div>
							</div>

							{selectedCheckInDate || selectedCheckOutDate
								? resetSelectionButton
								: null}
						</div>
					</>
				)}

				{showCheckOutCalendar && (
					<>
						<div
							onClick={toggleCalendarCheckOutVisibility}
							className={calendarBackdropClassList}
						/>

						{/* calendar modal */}
						<div className="absolute top-20 z-100 rounded-lg border bg-background px-8 py-6 text-foreground">
							<h6 className="text-center text-h6">Select Your Check-Out</h6>

							<Spacer size="3xs" />
							{calendarNavigation}

							<Spacer size="4xs" />
							<div>
								{daysTitles}

								<div className="grid max-w-[30em] grid-cols-7">
									{calendarDatesCheckOut}
								</div>
							</div>

							{selectedCheckInDate || selectedCheckOutDate
								? resetSelectionButton
								: null}
						</div>
					</>
				)}
			</div>
		</>
	)
}

// handling reservation prices
function findWeekDivisionAssignmentIds(
	selectedNightsDates: string[],
	selectedDays: string[],
	weekDays: {
		dayInAWeek: string
		divisionAssignmentId: string | null
	}[],
): Record<string, string> {
	const result: Record<string, string> = {}

	selectedDays.forEach(day => {
		const foundDay = weekDays.find(weekDay => weekDay.dayInAWeek === day)
		const divisionAssignmentId = foundDay?.divisionAssignmentId ?? '1'
		result[day] = divisionAssignmentId
	})

	// Convert day names to dates
	const dateResult: Record<string, string> = {}
	Object.keys(result).forEach(dayName => {
		const date = selectedNightsDates.find(
			d => format(new Date(d), 'EEEE').toLowerCase() === dayName,
		)
		if (date) {
			dateResult[date] = result[dayName]
		}
	})

	return dateResult
}

function checkSelectedDatesInSeasons(
	selectedDatesWithWeekDivisionIds: Record<string, string>,
	roomPrices: {
		[key: string]: number | undefined
	},
	seasonalExtendedPrices?: {
		dateFrom: string
		dateTo: string
		seasonalRoomPrices: {
			nightPrice: number
			additionalNightPrice: number
			weekDivisionId: string
		}[]
	}[],
): {
	date: string
	weekDivisionId: string
	nightPrice: number
	additionalNightPrice: number
}[] {
	const results: {
		date: string
		weekDivisionId: string
		nightPrice: number
		additionalNightPrice: number
	}[] = []

	Object.keys(selectedDatesWithWeekDivisionIds).forEach(date => {
		// Check if the date falls into any season
		const matchingSeason = seasonalExtendedPrices?.find(season => {
			const startDate = new Date(season.dateFrom)
			const lastNightDate = parse(season.dateTo, 'yyyy/MM/dd', new Date())
			const endDate = subDays(lastNightDate, 1)
			const currentDate = new Date(date)
			return currentDate >= startDate && currentDate <= endDate
		})

		const weekDivisionId = selectedDatesWithWeekDivisionIds[date]

		if (matchingSeason) {
			// Date falls into a season, you can access the seasonal data here
			const seasonalRoomPrices = matchingSeason.seasonalRoomPrices

			// Find the specific price for the week division id
			const matchingPrice = seasonalRoomPrices.find(
				price => price.weekDivisionId === weekDivisionId,
			)

			if (matchingPrice) {
				const { nightPrice, additionalNightPrice } = matchingPrice
				// Accumulate the results
				results.push({
					date,
					weekDivisionId,
					nightPrice,
					additionalNightPrice,
				})
			}
		} else {
			// if date doesn't fall into any season, use base room prices
			const baseNightPriceKey = `price${parseInt(weekDivisionId) || 1}`
			const baseAdditionalNightPriceKey = `additionalNightPrice${
				parseInt(weekDivisionId) || 1
			}`

			const baseNightPrice = roomPrices[baseNightPriceKey] ?? 0
			const baseAdditionalNightPrice =
				roomPrices[baseAdditionalNightPriceKey] ?? 0

			// Accumulate the results for base prices
			results.push({
				date,
				weekDivisionId,
				nightPrice: baseNightPrice,
				additionalNightPrice: baseAdditionalNightPrice,
			})
		}
	})

	return results
}

function calculateReservationTotalPrice(
	selectedCheckInDate: string,
	selectedCheckOutDate: string,
	weekDays: {
		dayInAWeek: string
		divisionAssignmentId: string | null
	}[],
	roomPrices: {
		price1: number
		price2?: number
		price3?: number
		additionalNightPrice1: number
		additionalNightPrice2?: number
		additionalNightPrice3?: number
	},
	seasonalExtendedPrices: {
		dateFrom: string
		dateTo: string
		seasonalRoomPrices: {
			nightPrice: number
			additionalNightPrice: number
			weekDivisionId: string
		}[]
	}[],
	guestCount: number,
	minNumberOfGuests: number,
	selectedPackagesPrice: number,
) {
	if (!selectedCheckInDate || !selectedCheckOutDate) {
		return 0
	}

	console.log(' ')
	console.log('---refreshed pricing---')

	const selectedDatesBetween = getDatesInBetween(
		new Date(selectedCheckInDate),
		new Date(selectedCheckOutDate),
	).map(date => format(date, 'yyyy/M/d'))
	const selectedNightsDates = [selectedCheckInDate, ...selectedDatesBetween]

	const lastNightDate = parse(selectedCheckOutDate, 'yyyy/MM/dd', new Date())
	const endDate = subDays(lastNightDate, 1)
	const selectedNightsNames = []
	let startDate = parse(selectedCheckInDate, 'yyyy/MM/dd', new Date())
	while (startDate <= endDate) {
		selectedNightsNames.push(format(startDate, 'EEEE').toLowerCase())
		startDate = addDays(startDate, 1)
	}

	const selectedDatesWithWeekDivisionIds = findWeekDivisionAssignmentIds(
		selectedNightsDates,
		selectedNightsNames,
		weekDays,
	)

	const pricesForSelectedNights = checkSelectedDatesInSeasons(
		selectedDatesWithWeekDivisionIds,
		roomPrices,
		seasonalExtendedPrices,
	)
	console.log("list of selected nights' prices: ", pricesForSelectedNights)

	const nightPrices = pricesForSelectedNights.map(result => result.nightPrice)
	const additionalNightPrices = pricesForSelectedNights.map(
		result => result.additionalNightPrice,
	)

	const totalNightPrice = nightPrices.reduce((total, price) => total + price, 0)
	const totalAdditionalNightPrices = additionalNightPrices.reduce(
		(total, price) => total + price,
		0,
	)

	console.log('totalNightPrice: ', totalNightPrice)
	console.log('totalAdditionalNightPrices: ', totalAdditionalNightPrices)

	const extraGuests = guestCount - minNumberOfGuests
	const numberOfNights = differenceInDays(
		new Date(selectedCheckOutDate),
		new Date(selectedCheckInDate),
	)

	if (guestCount > minNumberOfGuests) {
		return (
			totalNightPrice +
			totalAdditionalNightPrices * extraGuests +
			guestCount * (selectedPackagesPrice * numberOfNights)
		)
	} else {
		return (
			totalNightPrice + guestCount * (selectedPackagesPrice * numberOfNights)
		)
	}
}

function getMultiNightDiscount(
	roomDiscounts: {
		id: string
		type: string
		nights: string | null
		code: string | null
		value: number
		valueType: string
	}[],
	numberOfNights: number,
) {
	// Sort roomDiscounts by the number of nights in descending order (to get closestMultiNightDiscount..)
	const sortedDiscounts = roomDiscounts.sort((a, b) => {
		const aNights = parseInt(a.nights || '0')
		const bNights = parseInt(b.nights || '0')
		return bNights - aNights
	})

	// Find the closest multi-night discount
	const closestMultiNightDiscount = sortedDiscounts.find(
		discount =>
			discount.nights &&
			discount.type === 'multi-night' &&
			parseInt(discount.nights) <= numberOfNights,
	)

	if (closestMultiNightDiscount) {
		return {
			type: 'multi-night',
			value: closestMultiNightDiscount.value,
			valueType: closestMultiNightDiscount.valueType,
			nights: closestMultiNightDiscount.nights ?? '',
			code: closestMultiNightDiscount.code ?? '',
		}
	}

	// No discount found
	return null
}

// room's calendar with dates availability preview
export function ReadOnlyReservationsBigCalendar({
	roomReservations,
}: {
	roomReservations: {
		reservationDateFrom: string
		reservationDateTo: string
	}[]
}) {
	const { calendarNavigation, daysTitlesBigCalendar, selectedMonth, selectedYear } =
		useCalendarsCommonLogic()

	// handling the rendered section of all the dates
	const displayedCalendarDate = new Date()
	displayedCalendarDate.setMonth(selectedMonth - 1)
	displayedCalendarDate.setFullYear(selectedYear)
	const selectedMonthDates = generateCalendar(displayedCalendarDate)

	// handling existing reservations from db
	const reservations = Object.values(roomReservations)
	const reservationDatesFrom = reservations.map(reservation =>
		format(new Date(reservation.reservationDateFrom), 'yyyy/M/d'),
	)
	const reservationDatesTo = reservations.map(reservation =>
		format(new Date(reservation.reservationDateTo), 'yyyy/M/d'),
	)
	const reservationDatesBetween = reservations
		.map(reservation =>
			getDatesInBetween(
				new Date(reservation.reservationDateFrom),
				new Date(reservation.reservationDateTo),
			).map(date => format(date, 'yyyy/M/d')),
		)
		.flat()

	const calendarDates = selectedMonthDates.map(week =>
		week.map((date, i) => {
			const renderedFullDate =
				date !== 0 ? selectedYear + '/' + selectedMonth + '/' + date : ''
			let isDateCheckIn
			let isDateCheckOut

			let classList = daysInReservationCalendarClassList
			if (date !== 0) {
				if (addDays(new Date(), -1) >= new Date(renderedFullDate)) {
					classList = disabledDaysInReservationCalendarClassList
				} else {
					isDateCheckIn = reservationDatesFrom.includes(renderedFullDate)
					isDateCheckOut = reservationDatesTo.includes(renderedFullDate)

					const isDateBetweenCheckInAndCheckOut =
						reservationDatesBetween.includes(renderedFullDate)

					if (isDateCheckIn && isDateCheckOut) {
						classList = fullyBookedDaysInReservationCalendarClassList
					} else {
						if (
							isDateCheckIn &&
							isSameDay(new Date(), new Date(renderedFullDate))
						) {
							classList = fullyBookedDaysInReservationCalendarClassList
						} else if (isDateCheckIn) {
							classList = checkInDaysInReservationCalendarClassList
						}
						if (isDateCheckOut) {
							classList = checkOutDaysInReservationCalendarClassList
						}
						if (isDateBetweenCheckInAndCheckOut) {
							classList = fullyBookedDaysInReservationCalendarClassList
						}
					}
				}
			}

			const dateButton =
				date !== 0 ? (
					<button
						type="button"
						key={i}
						className={cn(
							classList,
							(isDateCheckIn || isDateCheckOut) &&
								!(isDateCheckIn && isDateCheckOut) &&
								!isSameDay(new Date(), new Date(renderedFullDate))
								? highlightHoverClassList
								: '',
						)}
						disabled={true}
					>
						<div className="flex flex-col">{date}</div>
					</button>
				) : (
					<button type="button" disabled className="opacity-0" key={i}></button>
				)

			return dateButton
		}),
	)

	return (
		<>
			{calendarNavigation}

			<Spacer size="4xs" />
			<div>
				{daysTitlesBigCalendar}

				<div className="flex overflow-scroll">{calendarDates}</div>
			</div>
		</>
	)
}
