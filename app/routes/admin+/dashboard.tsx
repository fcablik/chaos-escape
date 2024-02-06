import { json } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { addDays, format } from 'date-fns'
import { z } from 'zod'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Spacer } from '#app/components/spacer.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { cn } from '#app/utils/misc.tsx'
import { useUser } from '#app/utils/user.ts'

const CheckInsResultSchema = z.object({
	reservationDateFrom: z.string(),
})
const CheckOutsResultSchema = z.object({
	reservationDateTo: z.string(),
})
const TodaysNewReservationsResultSchema = z.object({
	createdAtString: z.string(),
})

const NewReservationsTodaySchema = z.array(TodaysNewReservationsResultSchema)
const CheckInsResultsSchema = z.array(CheckInsResultSchema)
const CheckOutsResultsSchema = z.array(CheckOutsResultSchema)

export async function loader() {
	// Sidebar Info Section queries
	const newReservationToday = format(new Date(), 'yyyy/MM/dd')
	const checkInOutToday = format(new Date(), 'yyyy/MM/dd')
	const checkInOutTomorrow = format(addDays(new Date(), 1), 'yyyy/MM/dd')

	// new-TODAY
	const rawNewReservationsToday = await prisma.$queryRaw`
		SELECT Reservation.createdAtString
		FROM Reservation
		WHERE Reservation.createdAtString LIKE ${newReservationToday}
		LIMIT 100
	`
	const resultNewReservationsToday = NewReservationsTodaySchema.safeParse(
		rawNewReservationsToday,
	)

	// TODAYs
	const rawCheckInsToday = await prisma.$queryRaw`
		SELECT Reservation.reservationDateFrom
		FROM Reservation
		WHERE Reservation.reservationDateFrom LIKE ${checkInOutToday}
		LIMIT 100
	`
	const resultCheckInsToday = CheckInsResultsSchema.safeParse(rawCheckInsToday)

	const rawCheckOutsToday = await prisma.$queryRaw`
		SELECT Reservation.reservationDateTo
		FROM Reservation
		WHERE Reservation.reservationDateTo LIKE ${checkInOutToday}
		LIMIT 100
	`
	const resultCheckOutsToday =
		CheckOutsResultsSchema.safeParse(rawCheckOutsToday)

	// TOMORROWs
	const rawCheckInsTomorrow = await prisma.$queryRaw`
		SELECT Reservation.reservationDateFrom
		FROM Reservation
		WHERE Reservation.reservationDateFrom LIKE ${checkInOutTomorrow}
		LIMIT 100
	`
	const resultCheckInsTomorrow =
		CheckInsResultsSchema.safeParse(rawCheckInsTomorrow)

	const rawCheckOutsTomorrow = await prisma.$queryRaw`
		SELECT Reservation.reservationDateTo
		FROM Reservation
		WHERE Reservation.reservationDateTo LIKE ${checkInOutTomorrow}
		LIMIT 100
	`
	const resultCheckOutsTomorrow =
		CheckOutsResultsSchema.safeParse(rawCheckOutsTomorrow)

	if (!resultNewReservationsToday.success) {
		return json(
			{
				status: 'error',
				error: resultNewReservationsToday.error.message,
			} as const,
			{
				status: 400,
			},
		)
	}

	if (!resultCheckInsToday.success) {
		return json(
			{ status: 'error', error: resultCheckInsToday.error.message } as const,
			{
				status: 400,
			},
		)
	}
	if (!resultCheckOutsToday.success) {
		return json(
			{ status: 'error', error: resultCheckOutsToday.error.message } as const,
			{
				status: 400,
			},
		)
	}

	if (!resultCheckInsTomorrow.success) {
		return json(
			{ status: 'error', error: resultCheckInsTomorrow.error.message } as const,
			{
				status: 400,
			},
		)
	}
	if (!resultCheckOutsTomorrow.success) {
		return json(
			{
				status: 'error',
				error: resultCheckOutsTomorrow.error.message,
			} as const,
			{
				status: 400,
			},
		)
	}

	return json({
		status: 'idle',
		newReservationsToday: resultNewReservationsToday.data,
		checkInsToday: resultCheckInsToday.data,
		checkOutsToday: resultCheckOutsToday.data,
		checkInsTomorrow: resultCheckInsTomorrow.data,
		checkOutsTomorrow: resultCheckOutsTomorrow.data,
	} as const)
}

export default function AdminDashboard() {
	const user = useUser()

	const sidebarBoxBaseClasslist =
		'flex flex-col items-center rounded-2xl bg-backgroundDashboard'
	const sidebarBoxClasslist =
		sidebarBoxBaseClasslist +
		' px-2 2xl:px-4 py-4 gap-2 font-semibold capitalize'
	const sidebarCheckInsOutsBoxClassList =
		'w-full text-center rounded-xl bg-highlight border-2 border-foreground py-2 text-background'
	const clickableSidebarCheckInsOutsBoxClassList =
		'hover:bg-backgroundDashboard hover:text-highlight transition duration-200'

	const newReservationsAlertBox =
		'capitalize justify-center max-md:col-span-2 max-md:py-8 ' +
		sidebarBoxClasslist

	const data = useLoaderData<typeof loader>()
	if (data.status === 'error') {
		console.error(data.error)
	}

	let newReservationsDataToday
	let checkInsDataToday
	let checkOutsDataToday
	let checkInsDataTomorrow
	let checkOutsDataTomorrow

	if (data.status === 'idle') {
		if (data.newReservationsToday.length) {
			const mappedNewReservationsTodayData = data.newReservationsToday.map(
				reservation =>
					format(new Date(reservation.createdAtString), 'yyyy/M/d'),
			)
			newReservationsDataToday = mappedNewReservationsTodayData.length ?? null
		}
		if (data.checkInsToday.length) {
			const mappedCheckInsTodayData = data.checkInsToday.map(reservation =>
				format(new Date(reservation.reservationDateFrom), 'yyyy/M/d'),
			)
			checkInsDataToday = mappedCheckInsTodayData.length ?? null
		}
		if (data.checkOutsToday.length) {
			const mappedCheckOutsTodayData = data.checkOutsToday.map(reservation =>
				format(new Date(reservation.reservationDateTo), 'yyyy/M/d'),
			)
			checkOutsDataToday = mappedCheckOutsTodayData.length ?? null
		}

		if (data.checkInsTomorrow.length) {
			const mappedCheckInsTomorrowData = data.checkInsTomorrow.map(
				reservation =>
					format(new Date(reservation.reservationDateFrom), 'yyyy/M/d'),
			)
			checkInsDataTomorrow = mappedCheckInsTomorrowData.length ?? null
		}
		if (data.checkOutsTomorrow.length) {
			const mappedCheckOutsTomorrowData = data.checkOutsTomorrow.map(
				reservation =>
					format(new Date(reservation.reservationDateTo), 'yyyy/M/d'),
			)
			checkOutsDataTomorrow = mappedCheckOutsTomorrowData.length ?? null
		}
	}

	return (
		<div className="grid gap-5 xl:grid-cols-3">
			<div className="xl:col-span-2">
				<div className="mb-4 grid grid-cols-2 gap-2 md:grid-cols-3 md:gap-5">
					{newReservationsDataToday ? (
						<Link
							className={cn(
								newReservationsAlertBox,
								'text-md group font-semibold transition duration-200 hover:bg-highlight hover:text-background lg:text-lg xl:px-4',
							)}
							to="/admin/reservations?search=new-today"
							prefetch="intent"
						>
							<div className="rounded-3xl bg-highlight px-3 py-2 text-background group-hover:bg-background group-hover:text-foreground lg:px-4 lg:py-2 2xl:mb-2">
								{newReservationsDataToday ?? '0'}
							</div>

							<div className="max-2xl:text-md text-center">
								new reservations (today)
							</div>
						</Link>
					) : (
						<div className={newReservationsAlertBox}>
							0 new reservations
							<div className="text-xs">(today)</div>
						</div>
					)}

					{/* <div className={cn(newReservationsAlertBox, "text-center lg:hidden")}>
							go to <br/>homepage
						</div> */}

					<div className={sidebarBoxClasslist}>
						<div className="mb-3 mt-1">check-ins</div>
						{checkInsDataToday ? (
							<Link
								className={cn(
									sidebarCheckInsOutsBoxClassList,
									clickableSidebarCheckInsOutsBoxClassList,
								)}
								to="/admin/reservations?search=todays-check-ins"
								prefetch="intent"
							>
								Today: {checkInsDataToday ?? '0'}
							</Link>
						) : (
							<div className={sidebarCheckInsOutsBoxClassList}>Today: 0</div>
						)}
						{checkInsDataTomorrow ? (
							<Link
								className={cn(
									sidebarCheckInsOutsBoxClassList,
									clickableSidebarCheckInsOutsBoxClassList,
								)}
								to="/admin/reservations?search=tomorrows-check-ins"
								prefetch="intent"
							>
								Tomorrow: {checkInsDataTomorrow ?? '0'}
							</Link>
						) : (
							<div className={sidebarCheckInsOutsBoxClassList}>Tomorrow: 0</div>
						)}
					</div>

					<div className={sidebarBoxClasslist}>
						<div className="mb-3 mt-1">check-outs</div>
						{checkOutsDataToday ? (
							<Link
								className={cn(
									sidebarCheckInsOutsBoxClassList,
									clickableSidebarCheckInsOutsBoxClassList,
								)}
								to="/admin/reservations?search=todays-check-outs"
								prefetch="intent"
							>
								Today: {checkOutsDataToday ?? '0'}
							</Link>
						) : (
							<div className={sidebarCheckInsOutsBoxClassList}>Today: 0</div>
						)}
						{checkOutsDataTomorrow ? (
							<Link
								className={cn(
									sidebarCheckInsOutsBoxClassList,
									clickableSidebarCheckInsOutsBoxClassList,
								)}
								to="/admin/reservations?search=tomorrows-check-outs"
								prefetch="intent"
							>
								Tomorrow: {checkOutsDataTomorrow ?? '0'}
							</Link>
						) : (
							<div className={sidebarCheckInsOutsBoxClassList}>Tomorrow: 0</div>
						)}
					</div>
				</div>

				<div className="w-full rounded-3xl bg-backgroundDashboard px-2 py-8 sm:px-3 xl:px-6 2xl:px-8 2xl:py-8">
					{/* <div className='rounded-3xl bg-backgroundDashboard px-2 py-8 sm:px-3 xl:px-4 2xl:px-8 2xl:py-8'> */}
					<div className="container mx-auto flex flex-col justify-center pb-32 pt-20 text-center">
						<p className="text-2xl">
							Welcome back <strong>{user.username}</strong>!
						</p>

						<Spacer size="3xs" />
						<div className="flex justify-center gap-5 max-sm:flex-wrap">
							<Link to="/admin/reservations" prefetch="intent">
								<Button variant="secondary">reservations</Button>
							</Link>

							<Link to="/admin/rooms" prefetch="intent">
								<Button variant="secondary">rooms</Button>
							</Link>

							<Link to="/admin/pages">
								<Button variant="secondary">pages</Button>
							</Link>

							<Link to="/admin/users">
								<Button variant="secondary">users</Button>
							</Link>

							<Link to="cache">
								<Button variant="secondary">cache</Button>
							</Link>
						</div>
					</div>
				</div>
			</div>

			<div className="w-full rounded-3xl bg-backgroundDashboard px-2 py-8 sm:px-3 xl:px-6 2xl:px-8 2xl:py-8">
				<div className="mb-8 flex flex-wrap items-start gap-2">
					<Link
						to="/admin/rooms"
						className="mb-3 w-full text-lg font-semibold transition hover:text-highlight/70"
					>
						Rooms
					</Link>

					<Button variant="highlight">
						<Link
							to="/admin/rooms/pricing"
							className="font-semibold capitalize transition"
						>
							Pricings
						</Link>
					</Button>

					<Button variant="highlight">
						<Link
							to="/admin/rooms/gallery"
							className="font-semibold capitalize transition"
						>
							Galleries
						</Link>
					</Button>

					<Button variant="highlight">
						<Link
							to="/admin/rooms/packagedeals"
							className="font-semibold capitalize transition"
						>
							Package Deals
						</Link>
					</Button>

					<Button variant="highlight">
						<Link
							to="/admin/rooms/facilities"
							className="font-semibold capitalize transition"
						>
							Facilities
						</Link>
					</Button>
				</div>

				<div className="mb-8 flex flex-wrap items-start gap-2">
					<div className="mb-3 w-full text-lg font-semibold">Reservations</div>

					<Button variant="highlight">
						<Link
							to="/admin/reservations"
							className="font-semibold capitalize transition"
						>
							All
						</Link>
					</Button>

					<Button variant="highlight">
						<Link
							to="/admin/reservations?search=upcoming"
							className="font-semibold capitalize transition"
						>
							Upcoming
						</Link>
					</Button>

					<Button variant="highlight">
						<Link
							to="/admin/reservations?search=past"
							className="font-semibold capitalize transition"
						>
							past
						</Link>
					</Button>
				</div>

				<div className="flex flex-wrap items-start gap-2">
					<div className="mb-3 w-full text-lg font-semibold">Others</div>

					<Button variant="highlight">
						<Link
							to="/admin/translations"
							className="font-semibold capitalize transition"
						>
							Translations / Texts
						</Link>
					</Button>

					<Button variant="highlight">
						<Link
							to="/admin/pages"
							className="font-semibold capitalize transition"
						>
							Pages
						</Link>
					</Button>

					<Button variant="highlight">
						<Link
							to="/admin/docs"
							className="font-semibold capitalize transition"
						>
							Documentation
						</Link>
					</Button>

					<Button variant="highlight">
						<Link
							to="/admin/users"
							className="font-semibold capitalize transition"
						>
							Users
						</Link>
					</Button>
				</div>
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
