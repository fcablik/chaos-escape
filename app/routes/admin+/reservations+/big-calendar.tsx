import { json } from '@remix-run/node'
import {
	Outlet,
	useLoaderData,
} from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { ReadOnlyReservationsBigCalendar } from '#app/components/reservation-handlers-extensions.tsx'
import { prisma } from '#app/utils/db.server.ts'
import {
	invariantResponse,
} from '#app/utils/misc.tsx'

export async function loader() {
	const rooms = await prisma.room.findMany({
		select: {
			id: true,
			url: true,
			title: true,
			price1: true,
			price2: true,
			price3: true,
			additionalNightPrice1: true,
			additionalNightPrice2: true,
			additionalNightPrice3: true,
			reservations: {
				orderBy: {
					createdAt: 'desc',
				},
				take: 50,
				select: {
					id: true,
					status: true,
					reservationNumber: true,
					numberOfGuests: true,
					numberOfNights: true,
					name: true,
					email: true,
					reservationDateFrom: true,
					reservationDateTo: true,
					totalPrice: true,
					message: true,
					createdAt: true,
					// nightPrice: true,
					// additionalGuestNightPrice: true,
				},
			},
		},
	})
	invariantResponse(rooms, 'Not found', { status: 404 })

	return json({
		rooms,
	})
}

export default function RoomIdRoute() {
	const data = useLoaderData<typeof loader>()

	return (
		<>
			<div className="px-2 md:px-6 xl:mx-auto xl:max-w-[1200px] 2xl:max-w-[1300px] w-full">

                {data.rooms.map((room, i) => (
                    <div key={i} className='mb-8'>
                    <ReadOnlyReservationsBigCalendar
                        roomReservations={room.reservations}
                    />
                    </div>
                ))
                    
                }
			</div>

			<Outlet />
		</>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<div className="container mx-auto flex h-5/6 flex-col justify-center pb-32 pt-20 text-center">
						<h3 className="text-h3">
							No room with the id "{params.id}" exists
						</h3>
					</div>
				),
			}}
		/>
	)
}
