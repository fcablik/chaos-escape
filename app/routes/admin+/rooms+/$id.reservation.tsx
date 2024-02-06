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

export { action }
export async function loader({ params }: DataFunctionArgs) {
	const now = new Date()
	const currentDate = format(now, 'yyyy/MM/dd')
	const yesterday = format(addDays(now, -1), 'yyyy/MM/dd')

	const room = await prisma.room.findUnique({
		where: { id: params.id },
		select: {
			id: true,
			title: true,
			price1: true,
			price2: true,
			price3: true,
			additionalNightPrice1: true,
			additionalNightPrice2: true,
			additionalNightPrice3: true,
			numberOfGuestsForDefaultPrice: true,
			maxGuests: true,
			reservations: {
				where: {
					status: 'accepted',
				},
				select: {
					reservationDateFrom: true,
					reservationDateTo: true,
				},
			},
			roomPackageItems: {
				where: {
					visibility: true,
				},
				select: {
					visibility: true,
					id: true,
					name: true,
					price: true,
				},
			},
			roomMultiPackages: {
				where: {
					visibility: true,
					dateFrom: {
						lte: currentDate, // currentDate should be after or equal to dateFrom
					},
					dateTo: {
						gte: currentDate, // currentDate should be before or equal to dateTo
					},
				},
				select: {
					id: true,
					name: true,
					price: true,
					visibility: true,
				},
			},
		},
	})
	if (!room) {
		throw new Response('not found', { status: 404 })
	}

	// all reservations - for reservation numbering only (object /w strings)
	const existingReservations = await prisma.reservation.findMany({
		select: {
			reservationNumber: true,
		},
	})

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

	const roomDiscounts = await prisma.roomDiscount.findMany({
		where: {
			visibility: true,	
		},
		select: {
			id: true,
			type: true,
			nights: true,
			code: true,
			value: true,
			valueType: true,
		}
	})

	return json({
		room,
		existingReservations,
		weekDays,
		activeRoomSeasonsAndPrices,
		roomDiscounts,
	})
}

export default function ReservationEdit() {
	SetBodyToOpenModalState()

	const data = useLoaderData<typeof loader>()
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
				roomData={data.room}
				weekDays={data.weekDays}
				existingReservations={data.existingReservations}
				seasonalExtendedPrices={data.activeRoomSeasonsAndPrices}
				roomDiscounts={data.roomDiscounts}
			/>
		</>
	)
}
