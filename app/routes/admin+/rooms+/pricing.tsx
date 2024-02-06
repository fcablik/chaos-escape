import { json } from '@remix-run/node'
import { Link, Outlet, useLoaderData } from '@remix-run/react'
import { useState } from 'react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { useRedirectWithScrollToTop } from '#app/components/reservation-modal-animation.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import {
	MobileModalCaretOpener,
	ModalCloserIcon,
} from '#app/components/ui/modal-helpers.tsx'
import { SeasonAccordion } from '#app/routes/resources+/__season-accordion.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { cn, isNumberOdd } from '#app/utils/misc.tsx'

export async function loader() {
	const seasonLists = await prisma.seasonList.findMany({
		select: {
			id: true,
			name: true,
			dateFrom: true,
			dateTo: true,
			rooms: {
				select: {
					id: true,
					title: true,
					seasonalPrices: {
						select: {
							id: true,
							nightPrice: true,
							seasonId: true,
							weekDivisionId: true,
							additionalNightPrice: true,
						},
					},
				},
			},
		},
	})
	const rooms = await prisma.room.findMany({
		select: {
			id: true,
			title: true,
			url: true,
			price1: true,
			additionalNightPrice1: true,
			price2: true,
			additionalNightPrice2: true,
			price3: true,
			additionalNightPrice3: true,
		},
	})
	if (!seasonLists || !rooms) {
		throw new Response('not found', { status: 404 })
	}

	const weekDivision = await prisma.weekDivision.findMany({
		select: {
			id: true,
			partOfTheWeek: {
				select: {
					id: true,
					dayInAWeek: true,
				},
			},
		},
	})

	return json({
		seasonLists,
		rooms,
		weekDivision,
	})
}

export default function PricingRoute() {
	const data = useLoaderData<typeof loader>()
	const reversedSeasonLists = data.seasonLists.slice().reverse()

	const navigateAndScroll = useRedirectWithScrollToTop()
	const openRoomPricesRoute = (route: string) => {
		navigateAndScroll(route)
	}

	const numberOfWeekParts: number = data.weekDivision.filter(
		division => division.partOfTheWeek.length > 0,
	).length
	const weekIsDivided = numberOfWeekParts > 0
	const [showWeekDivision, setShowWeekDivision] = useState(weekIsDivided)

	const [isMobExtraMenuToggled, setMobExtraMenuToggled] = useState(false)
	const handleToggle = () => {
		setMobExtraMenuToggled(prev => !prev)
	}

	const currency = '€' //switch to dynamic #later

	return (
		<div className="w-full rounded-3xl bg-backgroundDashboard px-2 py-8 sm:px-3 xl:col-span-2 xl:px-6 2xl:px-8 2xl:py-8">
			<Outlet />

			<div className="mb-12">
				<h5 className="mb-2 text-h5 capitalize text-foreground">
					pricings management
				</h5>
				<p>Manage default prices, seasons and week division here.. 🤗</p>
			</div>

			<h6 className="mb-4 text-h6 capitalize">Rooms' Default Prices</h6>

			<div className="grid items-start gap-5 xl:grid-cols-3">
				<div className="w-full rounded-3xl xl:col-span-2">
					<div className="flex gap-5 pb-4">
						<div className="w-1/4"></div>
						<div className="w-1/4">week parts</div>
						<div className="w-1/4">price</div>
						<div className="w-1/4">+bed price</div>
					</div>
				</div>
			</div>

			<div className="mb-12 grid items-start gap-5 xl:grid-cols-3">
				<div className="w-full rounded-3xl bg-background xl:col-span-2 p-3 sm:p-4">
					<div>
						{data.rooms.length ? (
							<div className="w-full">
								<div className="relative flex flex-row flex-wrap gap-4">
									{data.rooms.map((room, i) => (
										<div
											key={room.id}
											className={cn(
												'shadow-pricing-box relative flex w-full rounded-lg px-4 py-3',
												isNumberOdd(i)
													? 'bg-background'
													: 'bg-backgroundDashboard',
											)}
										>
											<div className="flex w-full items-center gap-5">
												<div className="w-1/4">{room.title}</div>
												<div className="w-1/4">
													<div>1.</div>
													{numberOfWeekParts > 1 && <div>2.</div>}
													{numberOfWeekParts > 2 && <div>3.</div>}
												</div>
												<div className="w-1/4">
													<div>
														{currency}
														{room.price1}
													</div>
													{numberOfWeekParts > 1 && (
														<div>
															{currency}
															{room.price2}
														</div>
													)}
													{numberOfWeekParts > 2 && (
														<div>
															{currency}
															{room.price3}
														</div>
													)}
												</div>
												<div className="w-1/4">
													<div>
														{currency}
														{room.additionalNightPrice1}
													</div>
													{numberOfWeekParts > 1 && (
														<div>
															{currency}
															{room.additionalNightPrice2}
														</div>
													)}
													{numberOfWeekParts > 2 && (
														<div>
															{currency}
															{room.additionalNightPrice3}
														</div>
													)}
												</div>
											</div>

											<Icon
												className="absolute right-2 top-2 cursor-pointer"
												name="pencil-2"
												size="md"
												onClick={() =>
													openRoomPricesRoute(`defaultprices/${room.id}/edit`)
												}
											/>
										</div>
									))}
								</div>
							</div>
						) : (
							<div className="w-full">
								<p className="text-xl font-semibold capitalize">
									- Rooms Prices
								</p>
								<p className="text-xl font-semibold capitalize">
									- Seasons / Seasonal Prices
								</p>
								<p className="font-bold">
									! create rooms to handle their prices !
								</p>
							</div>
						)}
					</div>
				</div>

				<MobileModalCaretOpener
					isMobExtraMenuToggled={isMobExtraMenuToggled}
					handleToggle={handleToggle}
					classList="xl:hidden"
					triggerTitle="week division"
				/>

				<div
					className={cn(
						isMobExtraMenuToggled
							? 'bottom-24 z-4001 max-xl:visible md:max-xl:right-4 md:max-lg:max-w-3/5 lg:max-xl:max-w-2/5'
							: 'max-xl:hidden',
						'rounded-3xl bg-background p-6 max-xl:fixed xl:sticky xl:top-[75px] xl:w-full 2xl:p-8',
					)}
				>
					{isMobExtraMenuToggled && (
						<ModalCloserIcon handleToggle={handleToggle} />
					)}

					<div>
						<div className="w-full rounded-xl bg-background">
							<div className="flex-evenly mb-2 flex items-center">
								<p className="text-xl font-semibold capitalize">week parts</p>
								<p className="text-md capitalize">
									( currently: {numberOfWeekParts} )
								</p>
							</div>

							<div className="mb-6 flex items-center gap-5">
								{!weekIsDivided && (
									<Button
										variant="highlight-secondary"
										className="w-[10em]"
										onClick={() => setShowWeekDivision(!showWeekDivision)}
									>
										{!showWeekDivision ? 'divide' : 'hide'}
									</Button>
								)}
								<div>
									- You can divide Your week into 2-3 parts to customize prices
									for each part.
								</div>
							</div>

							{showWeekDivision &&
								data.weekDivision.map((division, i) => (
									<div
										key={i}
										className="my-4 flex w-full items-center justify-between gap-5"
									>
										<div className="w-[7%]">{division.id}.</div>

										<div className="w-[93%]">
											<div className="flex w-full items-center">
												{division.partOfTheWeek.length ? (
													<>
														<div className="flex w-3/4 flex-wrap gap-5 rounded-lg border-2 border-highlight/20 p-2">
															{division.partOfTheWeek.map((parts, i) => (
																<div className="capitalize" key={i}>
																	{parts.id}
																</div>
															))}
														</div>

														<div className="w-1/4 text-right">
															<Link to={'weekpart/' + division.id + '/edit'}>
																<Icon name="pencil-2" />
															</Link>
														</div>
													</>
												) : (
													<>
														<div className="flex w-1/2 gap-5 p-2">
															-- not active --
														</div>

														<div className="text-right w-1/2">
															<Link to={'weekpart/' + division.id + '/edit'}>
																<Button variant="highlight-secondary">
																	<Icon name="plus">add days</Icon>
																</Button>
															</Link>
														</div>
													</>
												)}
											</div>
										</div>
									</div>
								))}
						</div>
					</div>
				</div>
			</div>

			{data.rooms.length ? (
				<div className="w-full">
					<div className="mb-6">
						<h6 className="mb-4 text-h6 capitalize">Seasons List</h6>
						<Link to="season/createnew">
							<Button variant="highlight" size="sm">
								create new
							</Button>
						</Link>
					</div>
					{data.seasonLists.length ? (
						reversedSeasonLists.map((seasonList, i) => (
							<div key={i} className='mb-6'>
							<SeasonAccordion
								id={seasonList.id}
								name={seasonList.name}
								dateFrom={seasonList.dateFrom}
								dateTo={seasonList.dateTo}
								rooms={seasonList.rooms}
								numberOfWeekParts={numberOfWeekParts}
								weekIsDivided={weekIsDivided}
							/>
							</div>
						))
					) : (
						<div>no existing pricings, create your first</div>
					)}
				</div>
			) : (
				<div className="w-full">
					<p className="text-xl font-semibold capitalize">- Rooms Prices</p>
					<p className="text-xl font-semibold capitalize">
						- Seasons / Seasonal Prices
					</p>
					<p className="font-bold">! create rooms to handle their prices !</p>
				</div>
			)}
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
