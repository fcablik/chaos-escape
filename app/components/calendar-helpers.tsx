import {
	format,
	getMonth,
	getYear,
	isSameMonth,
	startOfMonth,
} from 'date-fns'
import { useEffect, useState } from 'react'
import { cn } from '#app/utils/misc.tsx'
import { Icon } from './ui/icon.tsx'

export const generateCalendar = (firstDateOfMonth: Date): number[][] => {
	const date = startOfMonth(firstDateOfMonth)

	const getDay = (date: Date) => {
		let day = date.getDay()
		if (day === 0) day = 7
		return day - 1
	}

	const monthCalendar: number[][] = [[]]
	for (let i = 0; i < getDay(date); i++) {
		monthCalendar[monthCalendar.length - 1].push(0)
	}

	while (isSameMonth(date, firstDateOfMonth)) {
		monthCalendar[monthCalendar.length - 1].push(date.getDate())

		if (getDay(date) % 7 == 6) {
			monthCalendar.push([])
		}

		date.setDate(date.getDate() + 1)
	}

	if (getDay(date) != 0) {
		for (let i = getDay(date); i < 7; i++) {
			monthCalendar[monthCalendar.length - 1].push(0)
		}
	}

	return monthCalendar
}

export function useCalendarsCommonLogic(monthsInPastAllowed?: boolean) {
	const currentMonth = getMonth(new Date()) + 1
	const [selectedMonth, setSelectedMonth] = useState(currentMonth)

	const currentYear = getYear(new Date())
	const [selectedYear, setSelectedYear] = useState(currentYear)

	const [buttonDisabled, setButtonDisabled] = useState(false)
	setTimeout(() => {
		setButtonDisabled(false)
	}, 2000)

	const handleIncrement = () => {
		setSelectedMonth(prevMonth => {
			const newMonth = prevMonth === 12 ? 1 : prevMonth + 1
			if (newMonth === 1) {
				setSelectedYear(prevYear => prevYear + 1)
			}
			return newMonth
		})
	}

	const handleDecrement = () => {
		if (!monthsInPastAllowed) {
			setButtonDisabled(true)
		}
		setSelectedMonth(prevMonth => {
			const newMonth = prevMonth === 1 ? 12 : prevMonth - 1
			if (newMonth === 12) {
				setSelectedYear(prevYear => prevYear - 1)
			}
			return newMonth
		})
	}

	useEffect(() => {}, [selectedMonth, selectedYear]) // This runs whenever selectedMonth or selectedYear changes

	let selectedCurrentMonth = false
	if (currentMonth === selectedMonth) {
		selectedCurrentMonth = true
	}
	let selectedCurrentYear = false
	if (currentYear === selectedYear) {
		selectedCurrentYear = true
	}

	const calendarNavigation = (
		<div className="mx-auto mb-4 flex justify-between">
			<Icon
				name="caret-left"
				onClick={
					!buttonDisabled
						? !(selectedCurrentMonth && selectedCurrentYear) ||
						  monthsInPastAllowed
							? handleDecrement
							: undefined
						: undefined
				}
				className={cn(
					'order-1 text-2xl',
					!(selectedCurrentMonth && selectedCurrentYear) || monthsInPastAllowed
						&& 'cursor-pointer hover:text-highlight'
				)}
			/>
			<Icon
				onClick={handleIncrement}
				name="caret-right"
				className="order-3 cursor-pointer text-2xl hover:text-highlight"
			/>

			<h4 className="order-2 text-h4">
				{format(new Date(2023, selectedMonth - 1, 1), 'LLLL')}
				<span> {selectedYear}</span>
			</h4>
		</div>
	)

	const daysTitles = (
		<div className="grid max-w-[30em] grid-cols-7 text-center">
			<div>Mo</div>
			<div>Tu</div>
			<div>We</div>
			<div>Th</div>
			<div>Fr</div>
			<div>Sa</div>
			<div>Su</div>
		</div>
	)
	const daysTitlesBigCalendar = (
		<div className="flex overflow-scroll">
			<div className="text-foreground opacity-40 rounded-lg p-2 m-1">Mo</div>
			<div className="text-foreground opacity-40 rounded-lg p-2 m-1">Tu</div>
			<div className="text-foreground opacity-40 rounded-lg p-2 m-1">We</div>
			<div className="text-foreground opacity-40 rounded-lg p-2 m-1">Th</div>
			<div className="text-foreground opacity-40 rounded-lg p-2 m-1">Fr</div>
			<div className="text-foreground opacity-40 rounded-lg p-2 m-1">Sa</div>
			<div className="text-foreground opacity-40 rounded-lg p-2 m-1">Su</div>
		</div>
	)

	return {
		currentMonth,
		selectedMonth,
		selectedYear,
		calendarNavigation,
		daysTitles,
		daysTitlesBigCalendar,
	}
}

export function getDatesInBetween(startDate: Date, endDate: Date) {
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
