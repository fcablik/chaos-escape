import { json, type DataFunctionArgs } from '@remix-run/node'
import {
	Link,
	Outlet,
	useFetcher,
	useLoaderData,
	useNavigate,
} from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { useRedirectWithScrollToTop } from '#app/components/reservation-modal-animation.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { cn, invariantResponse, useDoubleCheck } from '#app/utils/misc.tsx'

export async function loader({ params }: DataFunctionArgs) {
	const reservation = await prisma.reservation.findUnique({
		where: {
			id: params.id,
		},
		select: {
			id: true,
			status: true,
			name: true,
			email: true,
			message: true,
			// nightPrice: true,
			// additionalGuestNightPrice: true,
			// numberOfGuestsForDefaultPrice: true,
			totalPrice: true,
			numberOfGuests: true,
			numberOfNights: true,
			reservationNumber: true,
			reservationDateFrom: true,
			reservationDateTo: true,
			createdAtString: true,
			room: true,
			roomId: true,
		},
	})
	invariantResponse(reservation, 'Not found', { status: 404 })
	return json({ reservation })
}

export async function action({ request, params }: DataFunctionArgs) {
	const formData = await request.formData()
	const statusHandler = formData.get('statusHandler')

	if (typeof statusHandler === 'string') {
		// Only proceed if statusHandler is a string
		await prisma.reservation.update({
			where: { id: params.id },
			data: { status: statusHandler },
			select: { id: true },
		})

		return json({ status: 'success' })
	} else {
		// Handle the case where statusHandler is not a string, e.g., if it's null
		return json(
			{ status: 'error', message: 'Invalid statusHandler value' },
			{ status: 400 },
		)
	}
}

export default function AdminReservationIdRoute() {
	const data = useLoaderData<typeof loader>()
	const reservation = data.reservation
	const currency = '€' //#later dynamic

	const navigate = useNavigate()
	const goBack = () => navigate(-1)

	const navigateAndScroll = useRedirectWithScrollToTop()
	const openReservationFormRoute = () => {
		navigateAndScroll('edit')
	}

	const statusFetcher = useFetcher()
	const pendingStatus = statusFetcher.state !== 'idle'
	const statusHandler = pendingStatus
		? statusFetcher.formData?.get('statusHandler')
		: data.reservation.status

	const doubleCheckCancell = useDoubleCheck()

	// const plusBeds =
	// 	reservation.numberOfGuests > reservation.numberOfGuestsForDefaultPrice
	// 		? reservation.numberOfGuests - reservation.numberOfGuestsForDefaultPrice
	// 		: null
	// const plusBedsTotalPrice =
	// 	plusBeds && reservation.additionalGuestNightPrice
	// 		? reservation.additionalGuestNightPrice * plusBeds
	// 		: null

	return (
		<div className="px-2 md:px-6 xl:mx-auto xl:max-w-[1200px] 2xl:max-w-[1300px]">
			<div className="flex justify-between">
				<Button
					onClick={goBack}
					variant="secondary"
					className="text-xs capitalize"
				>
					Go Back
				</Button>

				<div className="flex gap-5">
					{statusHandler !== 'cancelled' ? (
						<>
							<statusFetcher.Form method="POST">
								<input
									type="hidden"
									name="statusHandler"
									// this is the next posting value, not current
									value={
										statusHandler !== 'cancelled' ? 'cancelled' : 'accepted'
									}
								/>
								<Button
									variant="destructive"
									{...doubleCheckCancell.getButtonProps({
										type: 'submit',
										name: 'intent',
										value: 'cancell',
									})}
									// variant={statusHandler !== 'cancelled' ? 'destructive' : 'highlight'}
									className="capitalize md:min-w-[8em]"
									type="submit"
								>
									<Icon name="trash">
										{doubleCheckCancell.doubleCheck
											? 'Are you sure?'
											: 'Cancel'}
									</Icon>

									{/* {statusHandler === 'accepted' ? 'cancel' : 'un-cancell'} */}
								</Button>
							</statusFetcher.Form>

							<Button
								className="capitalize"
								onClick={openReservationFormRoute}
								variant="default"
							>
								<Icon name="pencil-1">edit reservation</Icon>
							</Button>
						</>
					) : null}
				</div>
			</div>
			<hr className="my-8 border-secondary" />

			<div className="flex gap-[30%] px-0 text-left xl:mx-auto xl:max-w-[1200px] 2xl:max-w-[1300px]">
				<div className="w-full">
					<div className="mb-8">
						<p
							className={cn(
								'mb-2 rounded-lg p-2 text-center capitalize text-background',
								reservation.status === 'cancelled'
									? 'bg-destructive'
									: 'bg-highlight',
							)}
						>
							status: <strong>{reservation.status}</strong>
						</p>
					</div>

					<div className="px-6 lg:px-12">
						{/* 
							// TODO: format the detail - even tho this is just a check-point after saving editing form of existing reservation
						*/}
						<p className="flex max-w-full overflow-hidden">
							<span className="text-highlight dark:text-highlight">
								Room:&nbsp;
							</span>
							<Link
								to={`/admin/rooms/${reservation.room.id}`}
								className="underline"
							>
								{reservation.room.title}
							</Link>
						</p>

						<div className="mt-8">
							<p className="mb-1 flex w-full md:w-1/2">
								<span className="w-1/2 font-bold">reservation number:</span>{' '}
								<span className="w-1/2">{reservation.reservationNumber}</span>
							</p>
							<p className="mb-1 flex w-full md:w-1/2">
								<span className="w-1/2 font-bold">room:</span>{' '}
								<span className="w-1/2">{reservation.room.title}</span>
							</p>
							<p className="mb-1 flex w-full md:w-1/2">
								<span className="w-1/2 font-bold">name:</span>{' '}
								<span className="w-1/2">{reservation.name}</span>
							</p>
							<p className="mb-4 flex w-full md:w-1/2">
								<span className="w-1/2 font-bold">email:</span>{' '}
								<span className="w-1/2">{reservation.email}</span>
							</p>

							<p className="mb-1 flex w-full md:w-1/2">
								<span className="w-1/2 font-bold">guests:</span>{' '}
								<span className="w-1/2">
									{reservation.numberOfGuests} guest
									{reservation.numberOfGuests > 1 ? 's' : ''}
								</span>
							</p>
							<p className="mb-1 flex w-full md:w-1/2">
								<span className="w-1/2 font-bold">nights:</span>{' '}
								<span className="w-1/2">
									{reservation.numberOfNights} night
									{reservation.numberOfNights > 1 ? 's' : ''}
								</span>
							</p>
							{/* <p className="mb-1 flex w-full md:w-1/2">
								<span className="w-1/2 font-bold">base price / night</span>{' '}
								<span className="w-1/2">
									{currency}
									{reservation.nightPrice}
								</span>
							</p> */}
							{/* <p className="mb-1 flex w-full md:w-1/2">
								<span className="w-1/2">default night price is for:</span>{' '}
								<span className="w-1/2">
									{reservation.numberOfGuestsForDefaultPrice} guest
									{reservation.numberOfGuestsForDefaultPrice > 1 ? 's' : ''}
								</span>
							</p> */}
							{/* {plusBeds ? (
								<p className="mb-1 flex w-full md:w-1/2">
									<span className="w-1/2 font-bold">+bed price / night:</span>{' '}
									<span className="w-1/2">
										{currency}
										{reservation.additionalGuestNightPrice} (+ {plusBeds}bed
										{plusBeds > 1 ? 's' : ''} = {currency}
										{plusBedsTotalPrice} / night)
									</span>
								</p>
							) : null}

							{plusBedsTotalPrice ? (
								<p className="mb-4 flex w-full md:w-1/2">
									<span className="w-1/2 font-bold">total price / night:</span>{' '}
									<span className="w-1/2">
										{currency}
										{reservation.nightPrice + plusBedsTotalPrice} / night
									</span>
								</p>
							) : null} */}
							<p className="mb-4 flex w-full font-bold md:w-1/2">
								<span className="w-1/2">total price:</span>{' '}
								<span className="w-1/2">
									{currency}
									{reservation.totalPrice}
								</span>
							</p>
							<p className="mb-1 flex w-full md:w-1/2">
								<span className="w-1/2 font-bold">check-in:</span>{' '}
								<span className="w-1/2">{reservation.reservationDateFrom}</span>
							</p>
							<p className="mb-1 flex w-full md:w-1/2">
								<span className="w-1/2 font-bold">check-out:</span>{' '}
								<span className="w-1/2">{reservation.reservationDateTo}</span>
							</p>
							<p className="mb-1 flex w-full md:w-1/2">
								<span className="w-1/2 font-bold">created at:</span>{' '}
								<span className="w-1/2">{reservation.createdAtString}</span>
							</p>
							{reservation.message ? (
								<>
									<p className="mb-1 flex w-full md:w-1/2">
										<span className="w-1/2 font-bold">message:</span>{' '}
										<span className="w-1/2">{reservation.message}</span>
									</p>
								</>
							) : null}
						</div>
					</div>
				</div>
			</div>

			<Outlet />
		</div>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<div className="mx-auto flex h-5/6 flex-col justify-center pb-32 pt-20 text-center">
						<h3 className="text-h3">
							Reservation id: "{params.id}" has been cancelled or doesn't exist.
						</h3>
					</div>
				),
			}}
		/>
	)
}
