import { Form, useSearchParams, useSubmit } from '@remix-run/react'
import { format } from 'date-fns'
import { useEffect, useState } from 'react'
import { cn, useDebounce, useIsPending } from '#app/utils/misc.tsx'
import {
	generateCalendar,
	useCalendarsCommonLogic,
} from './calendar-helpers.tsx'
import { modalBackDropOverMenuClassList } from './modal-backdrop.tsx'
import { Button } from './ui/button.tsx'
import { Icon } from './ui/icon.tsx'
import { Input } from './ui/input.tsx'
// import { Label } from './ui/label.tsx'
import { StatusButton } from './ui/status-button.tsx'

export function FiltersWithSearchAndCalendar({
	actionUrl,
	status,
	// autoFocus = false,
	autoSubmit = false,
	reservationsFound,
}: {
	actionUrl: 'admin/reservations'
	status: 'idle' | 'pending' | 'success' | 'error'
	// autoFocus?: boolean
	autoSubmit?: boolean
	reservationsFound: boolean
}) {
	const action = actionUrl
	const [searchParams] = useSearchParams()
	const submit = useSubmit()
	const isSubmitting = useIsPending({
		formMethod: 'GET',
		formAction: action,
	})
	const handleFormChange = useDebounce((form: HTMLFormElement) => {
		submit(form)
	}, 400)

	const [currentSearch, setCurrentSearch] = useState(
		searchParams.get('search') ?? '',
	)
	// handling live search param changes -(e.g. on change of searchParams by external Link from sidebar)
	useEffect(() => {
		setCurrentSearch(searchParams.get('search') ?? '')
	}, [searchParams])

	function handleSelectedFilter(e: React.ChangeEvent<HTMLInputElement>) {
		setCurrentSearch(e.target.value)
	}
	function handleSelect(selectString: string) {
		setCurrentSearch(selectString)
	}

	// calendarSelections... (calendar from reservation-handlers-extensions.tsx)
	const { calendarNavigation, daysTitles, selectedMonth, selectedYear } =
		useCalendarsCommonLogic(true) //monthsInPastAllowed = true

	// handling the rendered section of all the dates
	const displayedCalendarDate = new Date()
	displayedCalendarDate.setMonth(selectedMonth - 1)
	displayedCalendarDate.setFullYear(selectedYear)
	const selectedMonthDates = generateCalendar(displayedCalendarDate)

	const highlightHoverClassList = 'hover:bg-highlight hover:text-background'

	let certainDateSearch = ''
	const certainDateSearchString = 'check-in-out-dates-'
	if (currentSearch.includes(certainDateSearchString)) {
		const dateOnly = currentSearch.split(certainDateSearchString)
		certainDateSearch = dateOnly[1]
	}

	const calendarDates = selectedMonthDates.map(week =>
		week.map((date, i) => {
			const renderedFullDate =
				date !== 0
					? format(
							new Date(selectedYear + '/' + selectedMonth + '/' + date),
							'yyyy/MM/dd',
					  )
					: ''
			const dateHandler = 'check-in-out-dates-' + renderedFullDate
			const selectedDateForSearch =
				renderedFullDate === certainDateSearch ? true : false

			const dateButton =
				date !== 0 ? (
					<button
						key={i}
						className={cn(
							highlightHoverClassList +
								' cursor-pointer rounded-lg hover:transition-colors',
							dateHandler,
							renderedFullDate === format(new Date(), 'yyyy/MM/dd')
								? 'bg-black/20 dark:bg-white/20'
								: null,
							selectedDateForSearch
								? 'bg-black/70 text-background dark:bg-white/70'
								: null,
						)}
						onClick={() => handleSelect(dateHandler)}
					>
						<div className="m-1 flex flex-col px-2 py-1">{date}</div>
					</button>
				) : (
					<button type="button" disabled className="opacity-0" key={i}></button>
				)

			return dateButton
		}),
	)

	const [dropdownFiltersState, setDropdownFiltersState] = useState(false)
	function handleChangeFilterDropdownState() {
		setDropdownFiltersState(prevVisible => !prevVisible)
	}

	return (
		<Form
			method="GET"
			action={`/${action}`}
			className="flex flex-col md:gap-2"
			onChange={e => autoSubmit && handleFormChange(e.currentTarget)}
		>
			<p className="mb-4 text-lg font-semibold sm:mb-2">Filter Reservations</p>

			<div className="relative sm:max-xl:flex sm:max-md:flex-col-reverse ">
				<div>
					<div className="mb-4 flex w-full flex-col gap-3">
						<div className="relative flex flex-wrap gap-3">
							<div className="mb8 flex w-full gap-2">
								<Button
									onClick={() => handleSelect('upcoming')}
									variant={
										currentSearch === 'upcoming'
											? 'highlight-static'
											: 'outline'
									}
									className="capitalize"
								>
									upcoming / current
								</Button>
								<Button
									onClick={() => handleSelect('past')}
									variant={
										currentSearch === 'past' ? 'highlight-static' : 'outline'
									}
									className="capitalize"
								>
									past
								</Button>
							</div>

							<div className="flex w-full gap-2">
								<Button
									className="no-scrollbar w-4/5 justify-start overflow-scroll capitalize"
									variant="highlight"
									onClick={handleChangeFilterDropdownState}
								>
									{currentSearch !== '' ? 'change filter' : 'select filter'}
								</Button>

								<Button onClick={() => handleSelect('')} variant="highlight">
									<Icon name="cross-1" />
								</Button>

								{dropdownFiltersState && (
									<>
										<div
											className={modalBackDropOverMenuClassList}
											onClick={handleChangeFilterDropdownState}
										/>
										<div
											className="absolute z-4001 flex w-4/5 flex-col gap-2 rounded-xl bg-highlight/80 p-3"
											// onClick={handleChangeFilterDropdownState}
										>
											<div className="mb-4 flex items-center justify-between text-background">
												<p className="text-body-sm font-semibold capitalize">
													{currentSearch !== ''
														? 'change filter'
														: 'select filter'}
												</p>

												<Icon
													name="cross-1"
													size="sm"
													className="cursor-pointer"
													onClick={handleChangeFilterDropdownState}
												/>
											</div>

											<Button
												onClick={() => handleSelect('new-today')}
												variant={
													currentSearch === 'new-today'
														? 'highlight-contrast'
														: 'outline-contrast'
												}
												className="capitalize"
											>
												new today
											</Button>

											<Button
												onClick={() => handleSelect('todays-check-ins')}
												variant={
													currentSearch === 'todays-check-ins'
														? 'highlight-contrast'
														: 'outline-contrast'
												}
												className="capitalize"
											>
												check-ins today
											</Button>
											<Button
												onClick={() => handleSelect('todays-check-outs')}
												variant={
													currentSearch === 'todays-check-outs'
														? 'highlight-contrast'
														: 'outline-contrast'
												}
												className="capitalize"
											>
												check-outs today
											</Button>

											<Button
												onClick={() => handleSelect('tomorrows-check-ins')}
												variant={
													currentSearch === 'tomorrows-check-ins'
														? 'highlight-contrast'
														: 'outline-contrast'
												}
												className="capitalize"
											>
												check-ins tomorrow
											</Button>
											<Button
												onClick={() => handleSelect('tomorrows-check-outs')}
												variant={
													currentSearch === 'tomorrows-check-outs'
														? 'highlight-contrast'
														: 'outline-contrast'
												}
												className="capitalize"
											>
												check-outs tomorrow
											</Button>
										</div>
									</>
								)}
							</div>

							<div className="flex w-full flex-wrap gap-3">
								<div className="w-full">
									{/* <Label htmlFor="search" className="sr-only">
										Search
									</Label> */}
									<Input
										type="search"
										name="search"
										id="search"
										placeholder="Search"
										// autoFocus={autoFocus}
										onChange={handleSelectedFilter}
										value={currentSearch}
										className={cn(
											'border-2',
											currentSearch !== '' &&
												(reservationsFound
													? 'border-accepted'
													: 'border-destructive'),
										)}
									/>
								</div>

								{!autoSubmit && (
									<div>
										<StatusButton
											type="submit"
											status={isSubmitting ? 'pending' : status}
											className="flex w-full items-center justify-center"
											size="sm"
										>
											<Icon name="magnifying-glass" size="sm" />
											<span className="sr-only">Search</span>
										</StatusButton>
									</div>
								)}
							</div>

							<div className="inline-block w-full rounded-lg border-2 border-highlight bg-background px-3 pb-2 pt-4 text-foreground">
								<div className="mx-1">{calendarNavigation}</div>

								<div className="flex min-h-[270px] flex-col justify-center">
									{daysTitles}

									<div className="grid max-w-[30em] grid-cols-7">
										{calendarDates}
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</div>
		</Form>
	)
}
