import { json, type DataFunctionArgs } from '@remix-run/node'
import {
	Link,
	Outlet,
	useFetcher,
	useLoaderData,
	useNavigate,
} from '@remix-run/react'
import { format } from 'date-fns'
import { useState } from 'react'
import { adminDetailBoxesClassList } from '#app/components/classlists.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { ReadOnlyReservationCalendar } from '#app/components/reservation-handlers-extensions.tsx'
import { useRedirectWithScrollToTop } from '#app/components/reservation-modal-animation.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { ReservationAccordion } from '#app/routes/resources+/__reservation-accordion.tsx'
import { prisma } from '#app/utils/db.server.ts'
import {
	cn,
	invariantResponse,
	getRoomsGalleryImgSrc,
} from '#app/utils/misc.tsx'

export async function loader({ params }: DataFunctionArgs) {
	const room = await prisma.room.findUnique({
		where: { id: params.id },
		select: {
			id: true,
			url: true,
			title: true,
			description: true,
			seo: true,
			price1: true,
			price2: true,
			price3: true,
			additionalNightPrice1: true,
			additionalNightPrice2: true,
			additionalNightPrice3: true,
			numberOfGuestsForDefaultPrice: true,
			maxGuests: true,
			visibility: true,
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
			roomFacility: {
				select: {
					name: true,
					iconName: true,
				},
			},
			roomGalleryImages: {
				select: {
					id: true,
				},
			},
			roomPreviewImages: {
				select: {
					id: true,
				},
			},
			seasons: {
				select: {
					id: true,
					name: true,
					dateFrom: true,
					dateTo: true,
					rooms: true,
					seasonalRoomPrices: {
						where: {
							roomId: params.id,
						},
						select: {
							id: true,
							season: true,
							seasonId: true,
							nightPrice: true,
							additionalNightPrice: true,
							room: true,
							roomId: true,
							weekDivision: true,
							weekDivisionId: true,
							// additionalNightPrice: true,
						},
					},
				},
			},
		},
	})
	invariantResponse(room, 'Not found', { status: 404 })

	const weekParts = await prisma.weekDivision.findMany({
		select: {
			partOfTheWeek: true,
		},
	})

	return json({
		room,
		isVisible: Boolean(room.visibility),
		weekParts,
	})
}

export async function action({ request, params }: DataFunctionArgs) {
	const form = await request.formData()
	const isVisible = form.get('isVisible') === 'true'

	if (isVisible) {
		await prisma.room.update({
			where: { id: params.id },
			data: { visibility: true },
			select: { id: true },
		})
	} else {
		await prisma.room.update({
			where: { id: params.id },
			data: { visibility: false },
			select: { id: true },
		})
	}
	return json({ status: 'success' })
}

export default function RoomIdRoute() {
	const data = useLoaderData<typeof loader>()
	const room = data.room

	const visibilityFetcher = useFetcher()
	const pendingVisible = visibilityFetcher.state !== 'idle'
	const isVisible = pendingVisible
		? visibilityFetcher.formData?.get('isVisible') === 'true'
		: data.isVisible

	const currency = '€' //switch to dynamic #later

	const [showCalendar, setShowCalendar] = useState(false)
	const toggleCalendarVisibility = () => {
		setShowCalendar(prevVisible => !prevVisible)
	}

	const navigate = useNavigate()
	const goBack = () => navigate(-1)

	const navigateAndScroll = useRedirectWithScrollToTop()
	const openReservationFormRoute = () => {
		navigateAndScroll('reservation')
	}

	const numberOfWeekParts: number = data.weekParts.filter(
		division => division.partOfTheWeek.length > 0,
	).length

	return (
		<>
			<div className="px-2 md:px-6 xl:mx-auto xl:max-w-[1200px] 2xl:max-w-[1300px]">
				<div className="flex justify-between">
					<Button
						onClick={goBack}
						variant="secondary"
						className="text-xs capitalize"
					>
						go back
					</Button>

					<Link to="edit">
						<Button variant="default">edit</Button>
					</Link>
				</div>
				<hr className="my-8 border-secondary" />

				<div className="mb-5 flex flex-col gap-5">
					<div className={cn(adminDetailBoxesClassList)}>
						<h4 className="mb-8 text-h4">Title: {room.title}</h4>

						<div className="flex justify-between max-xl:flex-col">
							<div>
								<p>
									<span className="text-highlight dark:text-highlight">
										id:&nbsp;
									</span>
									{room.id}
								</p>
								<p>
									<span className="text-highlight dark:text-highlight">
										url:&nbsp;
									</span>
									/{room.url}
								</p>

								<p className="flex max-w-full overflow-hidden">
									<span className="text-highlight dark:text-highlight">
										max. guests:&nbsp;
									</span>
									<span className="max-w-20"> {room.maxGuests}</span>
								</p>
							</div>

							<div className="mt-8 flex items-center gap-2 sm:gap-5">
								<div className="min-w-[8em]">
									<div>
										<span className="text-highlight dark:text-highlight">
											visibility:
										</span>{' '}
										<span
											className={
												room.visibility ? 'text-highlight' : 'text-red-500'
											}
										>
											{room.visibility ? 'visible' : 'hidden'}
										</span>
									</div>
								</div>

								<visibilityFetcher.Form method="POST">
									<input
										type="hidden"
										name="isVisible"
										value={(!isVisible).toString()}
									/>
									<Button
										variant="secondary"
										className="min-w-[6em]"
										type="submit"
									>
										{isVisible ? 'hide' : 'publish'}
									</Button>
								</visibilityFetcher.Form>

								{room.visibility ? (
									<Link to={'/rooms/' + room.url} target="_blank">
										<Button variant="secondary">see live</Button>
									</Link>
								) : null}
							</div>
						</div>
					</div>

					<div className={cn(adminDetailBoxesClassList)}>
						<h4 className="mb-8 text-h4">Pricing</h4>

						<div>
							<div className="underline">default prices</div>

							<div className="flex gap-5">
								{numberOfWeekParts > 1 && '1. part: '}

								<p className="flex max-w-full overflow-hidden">
									<span className="text-highlight dark:text-highlight">
										price / night:
									</span>
									<span className="max-w-20 ml-1">
										{currency}
										{room.price1}
									</span>
								</p>
								<p className="flex max-w-full overflow-hidden">
									<span className="text-highlight dark:text-highlight">
										additional guest price / night:
									</span>
									<span className="max-w-20 ml-1">
										{currency}
										{room.additionalNightPrice1}
									</span>
								</p>
							</div>

							{numberOfWeekParts > 1 && (
								<>
									<div className="flex gap-5">
										2. part:{' '}
										<p className="flex max-w-full overflow-hidden">
											<span className="text-highlight dark:text-highlight">
												price / night:
											</span>
											<span className="max-w-20 ml-1">
												{currency}
												{room.price2}
											</span>
										</p>
										<p className="flex max-w-full overflow-hidden">
											<span className="text-highlight dark:text-highlight">
												additional guest price / night:
											</span>
											<span className="max-w-20 ml-1">
												{currency}
												{room.additionalNightPrice2}
											</span>
										</p>
									</div>

									{numberOfWeekParts > 2 && (
										<div className="flex gap-5">
											3. part:{' '}
											<p className="flex max-w-full overflow-hidden">
												<span className="text-highlight dark:text-highlight">
													price / night:
												</span>
												<span className="max-w-20 ml-1">
													{currency}
													{room.price3}
												</span>
											</p>
											<p className="flex max-w-full overflow-hidden">
												<span className="text-highlight dark:text-highlight">
													additional guest price / night:
												</span>
												<span className="max-w-20 ml-1">
													{currency}
													{room.additionalNightPrice3}
												</span>
											</p>
										</div>
									)}
								</>
							)}
							<p className="flex max-w-full overflow-hidden">
								<span className="text-highlight dark:text-highlight">
									default prices / night are set for:
								</span>
								<span className="max-w-20 ml-1">
									{room.numberOfGuestsForDefaultPrice} guest
									{room.numberOfGuestsForDefaultPrice > 1 ? 's' : ''}
								</span>
							</p>
						</div>

						<div className="mt-8">
							<div className="mb-4">
								<div className="underline">seasonal (event) prices</div>
								<div>
									{/* // TODO: recreate after finishing new mode-1 seasons  */}
									{room.seasons.length ? (
										<>
											<div className="flex gap-2 border-b border-gray-400 pb-2">
												<span className="w-1/4">name</span>
												<span className="w-1/4">(week part): night price / +bed</span>
												<span className="w-1/4">date from</span>
												<span className="w-1/4">date to</span>
											</div>

											{room.seasons.map((season, i) => (
												<div key={i} className="flex gap-2 py-4 border-b border-gray-400">
													<span className="w-1/4">season {season.name}</span>

													<div className="flex w-1/4 flex-col gap-2">
														{season.seasonalRoomPrices.map((price, i) => (
															<div key={i}>
																{price.weekDivisionId}.{' '}
																<span className="text-highlight">
																	{currency}
																	{price.nightPrice}
																</span>
																{' / '}
																<span className="text-highlight">
																	{currency}
																	{price.additionalNightPrice}
																</span>
																{/* {price.additionalNightPrice} */}
															</div>
														))}
													</div>
													<span className="w-1/4">
														{format(new Date(season.dateFrom), 'PPP')}
													</span>
													<span className="w-1/4">
														{format(new Date(season.dateTo), 'PPP')}
													</span>
												</div>
											))}
										</>
									) : (
										'no pricings are set for this room'
									)}
								</div>
							</div>
						</div>
					</div>
				</div>

				<div>
					<div className="mb-5 flex gap-5 max-xl:flex-col">
						<div className={cn(adminDetailBoxesClassList, 'z-50 xl:w-1/2')}>
							<h4 className="mb-8 text-h4 capitalize">Availability</h4>

							<div className="mb-8">
								<div className="relative flex gap-5 max-md:flex-col">
									<Button
										className="min-w-48 capitalize max-md:order-2"
										onClick={() => toggleCalendarVisibility()}
									>
										<Icon name="calendar">
											{showCalendar ? 'hide' : 'show'} calendar
										</Icon>
									</Button>

									<Button
										className="capitalize max-md:order-1"
										onClick={openReservationFormRoute}
									>
										<Icon iconAfter={true} name="arrow-right">
											create new reservation
										</Icon>
									</Button>

									<div
										className={cn(
											'absolute top-10 pt-4 max-md:top-24',
											showCalendar ? '' : 'hidden',
										)}
									>
										<ReadOnlyReservationCalendar
											roomReservations={room.reservations}
										/>
									</div>
								</div>
							</div>
						</div>

						<div className={cn(adminDetailBoxesClassList, 'xl:w-1/2')}>
							<h4 className="mb-6 text-h4">Descriptions</h4>

							<p className="max-w-full overflow-hidden">{room.description}</p>

							<p className="mt-4 flex max-w-full overflow-hidden">
								<span className="text-highlight dark:text-highlight">
									seo:&nbsp;
								</span>
								<span className="max-w-20"> {room.seo}</span>
							</p>
						</div>
					</div>

					<div className="mb-5 flex gap-5 max-xl:flex-col">
						<div className={cn(adminDetailBoxesClassList, 'xl:w-1/2')}>
							<h4 className="mb-6 text-h4">Gallery Images</h4>

							{room.roomGalleryImages.length ? (
								<>
									<div className="flex flex-wrap gap-5">
										{room.roomGalleryImages.map(image => (
											<div key={image.id}>
												{/* <a
													href={getRoomImgSrc(image.id)}
													target="_blank"
													rel="noreferrer"
												> */}
												<img
													src={getRoomsGalleryImgSrc(image.id)}
													alt=""
													className="h-16 w-16 rounded-lg object-cover"
												/>
												{/* </a> */}
											</div>
										))}
									</div>
									<div className="mt-6">
										<span>
											...you can add more images from{' '}
											<Link className="underline" to="gallery/edit">
												library
											</Link>{' '}
											section.
										</span>
									</div>
								</>
							) : (
								<>
									<span>
										You can add gallery images from{' '}
										<Link className="underline" to="gallery/edit">
											library
										</Link>{' '}
										section.
									</span>
								</>
							)}
						</div>

						<div className={cn(adminDetailBoxesClassList, 'xl:w-1/2')}>
							<h4 className="mb-6 text-h4">Preview Images</h4>

							{room.roomPreviewImages.length ? (
								<>
									<div className="flex flex-wrap gap-5">
										{room.roomPreviewImages.map(image => (
											<div key={image.id}>
												{/* <a
													href={getRoomImgSrc(image.id)}
													target="_blank"
													rel="noreferrer"
												> */}
												<img
													src={getRoomsGalleryImgSrc(image.id)}
													alt=""
													className="h-16 w-16 rounded-lg object-cover"
												/>
												{/* </a> */}
											</div>
										))}
									</div>
									<div className="mt-6">
										<span>
											...you can add more images from{' '}
											<Link className="underline" to="previewimages/edit">
												library
											</Link>{' '}
											section.
										</span>
									</div>
								</>
							) : (
								<>
									<span>
										You can add gallery images from{' '}
										<Link className="underline" to="previewimages/edit">
											library
										</Link>{' '}
										section.
									</span>
								</>
							)}
						</div>
					</div>

					<div className="mb-12 flex gap-5 max-xl:flex-col">
						<div className={cn(adminDetailBoxesClassList, 'xl:w-1/2')}>
							<h4 className="mb-6 text-h4">Facilities</h4>

							<div className="flex flex-wrap gap-5">
								{room.roomFacility.length ? (
									<div className="flex w-full flex-col">
										{room.roomFacility.map((facility, i) => (
											<div key={i} className="flex justify-between">
												<div className="w-1/3">{facility.name}</div>
												<div className="w-1/3">
													{facility.iconName ? (
														<Icon name={facility.iconName} />
													) : (
														'no icon'
													)}
												</div>
											</div>
										))}
									</div>
								) : (
									'Room has no facilities selected.'
								)}
							</div>
						</div>
					</div>

					<div className="relative z-49">
						<h4 className="mb-12 text-h4">Room's Reservations</h4>

						{room.reservations.length ? (
							<div className="flex w-full flex-wrap items-center justify-center gap-4 delay-200">
								{room.reservations.map(reservation => (
									<div key={reservation.id} className="relative w-full">
										{format(new Date(reservation.createdAt), 'yyyy/MM/dd') ===
										format(new Date(), 'yyyy/MM/dd') ? (
											<div
												className={cn(
													reservation.status !== 'cancelled'
														? 'bg-foreground'
														: 'bg-destructive',
													'absolute left-[-1em] top-[-1em] rotate-[-20deg] rounded-sm px-2 text-background xl:top-[-.5em] xl:px-4 xl:py-1 2xl:top-[-.2em]',
												)}
											>
												{reservation.status !== 'cancelled'
													? 'new'
													: 'cancelled'}
											</div>
										) : null}

										<ReservationAccordion
											roomId={room.id}
											roomTitle={room.title}
											reservationStatus={reservation.status}
											reservationNumber={reservation.reservationNumber}
											guestName={reservation.name}
											checkIn={reservation.reservationDateFrom}
											checkOut={reservation.reservationDateTo}
											guestEmail={reservation.email}
											guestMessage={reservation.message ?? ''}
											reservationId={reservation.id}
											numberOfGuests={reservation.numberOfGuests}
											numberOfNights={reservation.numberOfNights}
											totalPrice={reservation.totalPrice}
											createdAt={new Date(reservation.createdAt)}
										/>
									</div>
								))}
							</div>
						) : (
							<p>No reservations found</p>
						)}
					</div>
				</div>
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
