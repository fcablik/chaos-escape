import { format, isSameDay } from 'date-fns'
import { useState } from 'react'
import { cn } from '#app/utils/misc.tsx'
import {
	generateCalendar,
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
const daysInSeasonCalendarClassList =
	highlightHoverClassList +
	' hover:transition-colors rounded-lg' +
	spacingClassList
const disabledDaysInSeasonCalendarClassList =
	'text-foreground opacity-40 rounded-lg' + spacingClassList
const startDateDaysInSeasonCalendarClassList =
	'text-foreground bg-checkin-day from-orange-200 from-50% to-transparent to-0% rounded-lg' +
	spacingClassList
const endDateDaysInSeasonCalendarClassList =
	'text-foreground bg-checkout-day from-orange-200 from-50% to-transparent to-0% rounded-lg' +
	spacingClassList
const fullyBookedDaysInSeasonCalendarClassList =
	'dark:text-background bg-destructive rounded-lg' + spacingClassList

function getDatesInBetween(startDate: Date, endDate: Date) {
	const date = new Date(startDate.getTime())
	const dates = []

	date.setDate(date.getDate() + 1) // exclude start date
	while (date < endDate) {
		// exclude end date
		dates.push(new Date(date))
		date.setDate(date.getDate() + 1)
	}

	return dates
}

// main season calendar - component
export function EditorExtendedOperatorDatesPicker({
	existingSelectedDatesData,
	existingDateFrom,
	existingDateTo,
	datesErroredOnValidation,
	parentEditorName,
}: {
	existingSelectedDatesData: {
		id: string
		// name?: string
		dateFrom: string
		dateTo: string
	}[]
	existingDateFrom?: string
	existingDateTo?: string
	datesErroredOnValidation?: boolean
	parentEditorName: string
}) {
	const { calendarNavigation, daysTitles, selectedMonth, selectedYear } =
		useCalendarsCommonLogic(true)

	// handling show/hide of check-in calendar and backdrop underlay
	const [showStartDateCalendar, setShowStartDateCalendar] = useState(false)
	const toggleCalendarStartDateVisibility = () => {
		setShowStartDateCalendar(prevVisible => !prevVisible)
	}

	// handling show/hide of check-out calendar and backdrop underlay
	const [showEndDateCalendar, setShowEndDateCalendar] = useState(false)
	const toggleCalendarEndDateVisibility = () => {
		setShowEndDateCalendar(prevVisible => !prevVisible)
	}

	// handling the rendered section of all the dates
	const displayedCalendarDate = new Date()
	displayedCalendarDate.setMonth(selectedMonth - 1)
	displayedCalendarDate.setFullYear(selectedYear)
	const selectedMonthDates = generateCalendar(displayedCalendarDate)

	// handling existing seasons from db
	const seasons = Object.values(existingSelectedDatesData)
	const reservationDatesFrom = seasons.map(season =>
		format(new Date(season.dateFrom), 'yyyy/M/d'),
	)
	const reservationDatesTo = seasons.map(season =>
		format(new Date(season.dateTo), 'yyyy/M/d'),
	)
	const reservationDatesBetween = seasons
		.map(season =>
			getDatesInBetween(new Date(season.dateFrom), new Date(season.dateTo)).map(
				date => format(date, 'yyyy/M/d'),
			),
		)
		.flat()

	// handling check-in/check-out days selection
	const [selectedStartDateDate, setSelectedStartDateDate] = useState('')
	const [selectedEndDateDate, setSelectedEndDateDate] = useState('')

	const [datesErrored, setDatesErrored] = useState(false)

	// bug: datesErrored is switched between 1/0 on each error range selected (e.g. first error triggers true, second error in row triggers false, so the second error doesn't get the proper error treatment)
	if (datesErrored && selectedStartDateDate && selectedEndDateDate) {
		setDatesErrored(false)
	}

	function handleStartDateDateClick(dateString: string) {
		setSelectedStartDateDate(dateString)
		toggleCalendarStartDateVisibility()
	}
	function handleStartDateDateChange(e: React.ChangeEvent<HTMLInputElement>) {
		setSelectedStartDateDate(e.target.value)
	}

	function handleEndDateDateClick(dateString: string) {
		setSelectedEndDateDate(dateString)
		toggleCalendarEndDateVisibility()
	}
	function handleEndDateDateChange(e: React.ChangeEvent<HTMLInputElement>) {
		setSelectedEndDateDate(e.target.value)
	}

	function resetStartDateEndDate() {
		setSelectedStartDateDate('')
		setSelectedEndDateDate('')
		setDatesErrored(true)
	}

	// mapping over rendered dates to get each week in the currently selected month
	const calendarDatesStartDate = selectedMonthDates.map(week =>
		week.map((date, i) => {
			const renderedFullDate =
				date !== 0 ? selectedYear + '/' + selectedMonth + '/' + date : ''
			let classList = daysInSeasonCalendarClassList
			let disabledState = false

			let isDateStartDate
			let isDateEndDate

			if (date !== 0) {
				isDateStartDate = reservationDatesFrom.includes(renderedFullDate)
				isDateEndDate = reservationDatesTo.includes(renderedFullDate)
				const isDateBetweenStartDateAndEndDate =
					reservationDatesBetween.includes(renderedFullDate)

				if (
					selectedEndDateDate &&
					new Date(renderedFullDate) >= new Date(selectedEndDateDate)
				) {
					classList = disabledDaysInSeasonCalendarClassList
					disabledState = true
				}

				if (isDateStartDate && isDateEndDate) {
					disabledState = true
					classList = fullyBookedDaysInSeasonCalendarClassList
				} else {
					if (
						isDateStartDate &&
						isSameDay(new Date(), new Date(renderedFullDate))
					) {
						disabledState = true
						classList = fullyBookedDaysInSeasonCalendarClassList
					} else if (isDateStartDate) {
						classList = startDateDaysInSeasonCalendarClassList
					}
					if (isDateEndDate) {
						disabledState = false
						classList = endDateDaysInSeasonCalendarClassList

						if (new Date(renderedFullDate) >= new Date(selectedEndDateDate)) {
							disabledState = true
						}
					}
					if (isDateBetweenStartDateAndEndDate) {
						classList = fullyBookedDaysInSeasonCalendarClassList
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
							renderedFullDate === selectedStartDateDate && highlightSelectClassList,
							renderedFullDate === selectedEndDateDate
								&& highlightSelectClassList,
							isDateEndDate &&
								!(isDateStartDate && isDateEndDate) &&
								!isSameDay(new Date(), new Date(renderedFullDate))
								? highlightHoverClassList
								: '',
						)}
						onClick={() => handleStartDateDateClick(renderedFullDate)}
						disabled={disabledState}
					>
						<div className="flex flex-col">
							{date}

							{renderedFullDate === selectedEndDateDate ? (
								<Icon name="arrow-left" />
							) : null}
							{renderedFullDate === selectedStartDateDate ? (
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

	const calendarDatesEndDate = selectedMonthDates.map(week =>
		week.map((date, i) => {
			const renderedFullDate =
				date !== 0 ? selectedYear + '/' + selectedMonth + '/' + date : ''
			let classList = daysInSeasonCalendarClassList
			let disabledState = false

			let isDateStartDate
			let isDateEndDate

			if (date !== 0) {
				isDateStartDate = reservationDatesFrom.includes(renderedFullDate)
				isDateEndDate = reservationDatesTo.includes(renderedFullDate)
				const isDateBetweenStartDateAndEndDate =
					reservationDatesBetween.includes(renderedFullDate)

				if (
					selectedStartDateDate &&
					new Date(renderedFullDate) <= new Date(selectedStartDateDate)
				) {
					classList = disabledDaysInSeasonCalendarClassList
					disabledState = true
				}

				if (isDateStartDate && isDateEndDate) {
					disabledState = true
					classList = fullyBookedDaysInSeasonCalendarClassList
				} else {
					if (
						isDateStartDate &&
						isSameDay(new Date(), new Date(renderedFullDate))
					) {
						classList = fullyBookedDaysInSeasonCalendarClassList
					} else if (isDateStartDate) {
						disabledState = false
						classList = startDateDaysInSeasonCalendarClassList

						if (new Date(renderedFullDate) <= new Date(selectedStartDateDate)) {
							disabledState = true
						}
					}
					if (isDateEndDate) {
						classList = endDateDaysInSeasonCalendarClassList
					}
					if (isDateBetweenStartDateAndEndDate) {
						classList = fullyBookedDaysInSeasonCalendarClassList
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
							renderedFullDate === selectedStartDateDate
								? highlightSelectClassList
								: '',
							renderedFullDate === selectedEndDateDate
								? highlightSelectClassList
								: '',
							isDateStartDate &&
								!(isDateStartDate && isDateEndDate) &&
								!isSameDay(new Date(), new Date(renderedFullDate))
								? highlightHoverClassList
								: '',
						)}
						onClick={() => handleEndDateDateClick(renderedFullDate)}
						disabled={disabledState}
					>
						<div className="flex flex-col">
							{date}

							{renderedFullDate === selectedEndDateDate ? (
								<Icon name="arrow-left" />
							) : null}
							{renderedFullDate === selectedStartDateDate ? (
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
				onClick={() => resetStartDateEndDate()}
			>
				Reset
			</Button>
		</>
	)

	return (
		<>
			<div className="min-h-[16px]" />

			<div className="flex gap-5">
				{existingDateFrom &&
				existingDateTo &&
				!(selectedStartDateDate || selectedEndDateDate) ? (
					<>
						<div className="w-full">
							<p className="dark:text-background">Start-Date</p>
							<Button
								type="button"
								variant="primary"
								onClick={toggleCalendarStartDateVisibility}
								size="xl"
								className="w-full bg-backgroundDashboard"
							>
								{format(new Date(existingDateFrom), 'PPP')}
							</Button>

							<input
								name="dateFrom"
								type="hidden"
								value={existingDateFrom}
							/>
						</div>

						<div className="w-full">
							<p className="dark:text-background">End-Date</p>
							<Button
								type="button"
								variant="primary"
								onClick={toggleCalendarEndDateVisibility}
								size="xl"
								className="w-full bg-backgroundDashboard"
							>
								{format(new Date(existingDateTo), 'PPP')}
							</Button>

							<input name="dateTo" type="hidden" value={existingDateTo} />
						</div>
					</>
				) : (
					<>
						<div className="w-full">
							<p className="dark:text-background">Start-Date</p>
							<Button
								type="button"
								onClick={toggleCalendarStartDateVisibility}
								variant="primary"
								size="xl"
								className={cn(
									'w-full',
									selectedStartDateDate ? highlightSelectClassList : '',
									datesErrored ? 'border-input-invalid' : '',
									datesErroredOnValidation ? 'border-input-invalid' : '',
								)}
							>
								{selectedStartDateDate
									? format(new Date(selectedStartDateDate), 'PPP')
									: 'Start-Date'}
							</Button>

							<input
								required
								name="dateFrom"
								type="hidden"
								value={
									selectedStartDateDate
										? format(new Date(selectedStartDateDate), 'yyyy/MM/dd')
										: ''
								}
								onChange={handleStartDateDateChange}
								form={parentEditorName}
								id={parentEditorName + '-dateFrom'}
								aria-invalid={selectedStartDateDate ? false : true}
							/>
						</div>

						<div className="w-full">
							<p className="dark:text-background">End-Date</p>
							<Button
								onClick={toggleCalendarEndDateVisibility}
								type="button"
								variant="primary"
								size="xl"
								className={cn(
									'w-full',
									selectedEndDateDate ? highlightSelectClassList : '',
									datesErrored ? 'border-input-invalid' : '',
									datesErroredOnValidation ? 'border-input-invalid' : '',
								)}
							>
								{selectedEndDateDate
									? format(new Date(selectedEndDateDate), 'PPP')
									: 'End-Date'}
							</Button>

							{/*
								//TODO: implement error handling for check-in/check-out
							*/}
							<input
								required
								name="dateTo"
								type="hidden"
								value={
									selectedEndDateDate
										? format(new Date(selectedEndDateDate), 'yyyy/MM/dd')
										: ''
								}
								onChange={handleEndDateDateChange}
								form={parentEditorName}
								id={parentEditorName + '-dateTo'}
								aria-invalid={selectedStartDateDate ? false : true}
							/>
						</div>
					</>
				)}

				{showStartDateCalendar && (
					<>
						<div
							onClick={toggleCalendarStartDateVisibility}
							className={calendarBackdropClassList}
						/>

						{/* calendar modal */}
						<div className="absolute top-20 z-100 rounded-lg border bg-background px-8 py-6 text-foreground">
							<h6 className="text-center text-h6">Select Your Start-Date</h6>

							<Spacer size="3xs" />

							{calendarNavigation}

							<Spacer size="4xs" />
							<div>
								{daysTitles}

								<div className="grid max-w-[30em] grid-cols-7">
									{calendarDatesStartDate}
								</div>
							</div>

							{selectedStartDateDate || selectedEndDateDate
								? resetSelectionButton
								: null}
						</div>
					</>
				)}

				{showEndDateCalendar && (
					<>
						<div
							onClick={toggleCalendarEndDateVisibility}
							className={calendarBackdropClassList}
						/>

						{/* calendar modal */}
						<div className="absolute top-20 z-100 rounded-lg border bg-background px-8 py-6 text-foreground">
							<h6 className="text-center text-h6">Select Your End-Date</h6>

							<Spacer size="3xs" />
							{calendarNavigation}

							<Spacer size="4xs" />
							<div>
								{daysTitles}

								<div className="grid max-w-[30em] grid-cols-7">
									{calendarDatesEndDate}
								</div>
							</div>

							{selectedStartDateDate || selectedEndDateDate
								? resetSelectionButton
								: null}
						</div>
					</>
				)}
			</div>
		</>
	)
}
