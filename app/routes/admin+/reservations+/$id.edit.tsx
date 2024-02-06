import { json, type DataFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { addDays, format } from 'date-fns'
import { SetBodyToOpenModalState } from '#app/components/classlist-modifiers.tsx'
import { modalBackdropClassList } from '#app/components/modal-backdrop.tsx'
import { useRedirectWithScrollToTop } from '#app/components/reservation-modal-animation.tsx'
import {
	ReservationEditor,
	action,
} from '#app/routes/resources+/__reservation-editor.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { invariantResponse } from '#app/utils/misc.tsx'

export { action }

export async function loader({ params }: DataFunctionArgs) {
	const now = new Date()
	const yesterday = format(addDays(now, -1), 'yyyy/MM/dd')

	const reservation = await prisma.reservation.findFirst({
		where: {
			id: params.id,
			status: 'accepted',
		},
		select: {
			id: true,
			reservationNumber: true,
			name: true,
			email: true,
			message: true,
			roomId: true,
			room: {
				select: {
					id: true,
					price1: true,
					price2: true,
					price3: true,
					additionalNightPrice1: true,
					additionalNightPrice2: true,
					additionalNightPrice3: true,
					maxGuests: true,
					reservations: {
						where: {
							roomId: params.id,
							status: 'accepted',
						},
						select: {
							reservationDateFrom: true,
							reservationDateTo: true,
						},
					},
					title: true,
					numberOfGuestsForDefaultPrice: true,
					roomPackageItems: {
						orderBy: {
							visibility: 'asc',
						},
						select: {
							id: true,
							name: true,
							price: true,
							visibility: true,
						},
					},
					roomMultiPackages: {
						orderBy: {
							visibility: 'desc',
						},
						select: {
							id: true,
							name: true,
							price: true,
							visibility: true,
						},
					},
				},
			},
			numberOfGuests: true,
			numberOfNights: true,
			// additionalGuestNightPrice: true,
			// nightPrice: true,
			// numberOfGuestsForDefaultPrice: true,
			reservationDateFrom: true,
			reservationDateTo: true,
			createdAtString: true,
			roomPackageItems: {
				select: {
					id: true,
					name: true,
					price: true,
				},
			},
			roomMultiPackages: {
				select: {
					id: true,
					name: true,
					price: true,
				},
			},
		},
	})
	invariantResponse(reservation, 'Not found', { status: 404 })

	const weekDays = await prisma.weekDay.findMany({
		select: {
			dayInAWeek: true,
			divisionAssignmentId: true,
		},
	})

	const activeRoomSeasonsAndPrices = await prisma.seasonList.findMany({
		where: {
			dateTo: {
				gte: yesterday,
			},
			rooms: {
				some: {
					id: params.id,
				},
			},
		},
		select: {
			dateFrom: true,
			dateTo: true,
			seasonalRoomPrices: {
				select: {
					nightPrice: true,
					additionalNightPrice: true,
					weekDivisionId: true,
				},
			},
		},
	})

	return json({
		reservation,
		weekDays,
		activeRoomSeasonsAndPrices,
	})
}

export default function ReservationEdit() {
	SetBodyToOpenModalState()

	const data = useLoaderData<typeof loader>()
	const reservation = data?.reservation
	const roomData = {
		id: reservation.roomId,
		price1: reservation.room.price1, // -ability to edit prices/dates from here is disabled, so no need for price
		additionalNightPrice1: reservation.room.additionalNightPrice1, // -ability to edit prices/dates from here is disabled, so no need for price
		numberOfGuestsForDefaultPrice:
			reservation.room.numberOfGuestsForDefaultPrice, // -ability to edit prices/dates from here is disabled, so no need for price
		maxGuests: reservation.room.maxGuests,
		reservations: reservation.room.reservations,
		title: reservation.room.title,
		roomPackageItems: reservation.room.roomPackageItems,
		roomMultiPackages: reservation.room.roomMultiPackages,
	}
	const navigateAndScroll = useRedirectWithScrollToTop()
	const closeReservationFormRoute = () => {
		navigateAndScroll('back')
	}

	return (
		<>
			<div
				onClick={closeReservationFormRoute}
				className={modalBackdropClassList}
			/>

			<ReservationEditor
				reservation={reservation}
				roomData={roomData}
				weekDays={data.weekDays}
				seasonalExtendedPrices={data.activeRoomSeasonsAndPrices}
				parentRoute="reservation-edit"
			/>
		</>
	)
}
