import {
	Accordion,
	AccordionItem,
	AccordionHeader,
	AccordionTrigger,
	AccordionContent,
} from '@radix-ui/react-accordion'
import { Link } from '@remix-run/react'
import { format } from 'date-fns'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { cn, useDoubleCheck } from '#app/utils/misc.tsx'

export function ReservationAccordion({
	roomId,
	roomTitle,
	reservationStatus,
	reservationNumber,
	guestName,
	checkIn,
	checkOut,
	numberOfGuests,
	numberOfNights,
	guestEmail,
	guestMessage,
	reservationId,
	totalPrice,
	createdAt,
}: {
	roomId: string
	roomTitle: string
	reservationStatus: string
	reservationNumber: string
	guestName: string
	checkIn: string
	checkOut: string
	numberOfGuests: number
	numberOfNights: number
	guestEmail: string
	guestMessage: string
	reservationId: string
	totalPrice: number
	createdAt: Date
}) {
	const currency = '€' //#later dynamic

	const doubleCheckCancell = useDoubleCheck()

	return (
		<Accordion type="single" collapsible>
			<AccordionItem
				value={'id_' + roomId}
				className="AccordionItem rounded-xl bg-background shadow-md"
			>
				<AccordionHeader className="AccordionHeader flex items-center justify-between px-2 py-3 md:max-xl:relative lg:px-4">
					<AccordionTrigger className="flex w-[92%] sm:w-[94%] items-center max-sm:justify-between">
						<div className="text-left w-[7%]">
							{!!(reservationStatus === 'accepted') && (
								<div className="flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-3xl bg-accepted text-accepted-foreground">
									<Icon name="check" size="md" />
								</div>
							)}
							{!!(reservationStatus === 'cancelled') && (
								<div className="flex h-5 w-5 sm:h-7 sm:w-7 items-center justify-center rounded-3xl bg-destructive text-accepted-foreground">
									<Icon name="cross-1" size="sm" />
								</div>
							)}
						</div>

						<div className="text-left w-[18%] sm:px-1 text-sm sm:w-[13%]">
							{reservationNumber}
						</div>

						<div className="text-left w-[40%] truncate sm:px-1 sm:w-1/5">
							{/* <span>Deluxe Room Title</span> */}
							<Link to={`/admin/rooms/${roomId}`} className='hover:underline'>
								{roomTitle}
							</Link>
						</div>

						<div className="text-left w-[24%] sm:px-1 capitalize sm:w-1/5">
							{numberOfGuests} guest{numberOfGuests > 1 ? 's' : ''}
						</div>

						<div className="text-left sm:w-2/5 sm:px-1 max-sm:hidden">
							<div className="flex">
								<p className="w-12 capitalize">
									<span
										className={cn(
											'px-1',
											format(new Date(checkIn), 'yyyy/MM/dd') ===
												format(new Date(), 'yyyy/MM/dd') &&
												'rounded-sm bg-accepted font-bold text-accepted-foreground',
										)}
									>
										in:
									</span>{' '}
								</p>
								{format(new Date(checkIn), 'PPP')}
							</div>

							<div className="flex">
								<p className="w-12 capitalize">
									<span
										className={cn(
											'px-1',
											format(new Date(checkOut), 'yyyy/MM/dd') ===
												format(new Date(), 'yyyy/MM/dd') &&
												'rounded-sm bg-destructive font-bold text-destructive-foreground',
										)}
									>
										out:
									</span>{' '}
								</p>
								{format(new Date(checkOut), 'PPP')}
							</div>
						</div>
					</AccordionTrigger>

					<AccordionTrigger className='w-8% sm:w-[6%]'>
						<Icon name="caret-down" className="opener w-6 h-6 sm:w-10 sm:h-10" />
					</AccordionTrigger>
				</AccordionHeader>

				<AccordionContent className="AccordionContent px-4 lg:px-8">
					<div className="py-4 md:max-xl:mt-12 lg:py-8">
						<div className="mb-4 sm:hidden">
							<div
								className={cn(
									'my-1 rounded-sm py-1 text-center',
									format(new Date(checkIn), 'yyyy/MM/dd') ===
										format(new Date(), 'yyyy/MM/dd')
										? 'bg-backgroundDashboard'
										: '',
								)}
							>
								<span className="capitalize">check-in:&nbsp;</span>
								<span>{format(new Date(checkIn), 'PPP')}</span>
							</div>

							<div
								className={cn(
									'my-1 rounded-sm py-1 text-center',
									format(new Date(checkOut), 'yyyy/MM/dd') ===
										format(new Date(), 'yyyy/MM/dd')
										? 'bg-destructive'
										: '',
								)}
							>
								<span className="capitalize">check-out:&nbsp;</span>
								<span>{format(new Date(checkOut), 'PPP')}</span>
							</div>
						</div>

						<h5 className="text-h5 font-normal capitalize">
							guest information
						</h5>

						<div className="mt-4">
							<div
								className={cn(
									guestMessage
										? '2xl:flex 2xl:items-end 2xl:justify-between'
										: 'md:flex md:items-end md:justify-between',
								)}
							>
								<div className={cn(guestMessage ? '2xl:max-w-2/3' : '')}>
									<div>
										<strong>
											{numberOfGuests}{' '}
											<span className="capitalize">
												guest{numberOfGuests > 1 ? 's' : ''}
											</span>
										</strong>
										{' / '}
										<strong>
											{numberOfNights}{' '}
											<span className="capitalize">
												night{numberOfNights > 1 ? 's' : ''}
											</span>
										</strong>
									</div>

									<div className="flex flex-wrap">
										<span className="capitalize">guest's email:&nbsp;</span>
										{guestEmail}
									</div>

									<div className="flex flex-wrap">
										<span className="capitalize">Booking made by:&nbsp;</span>
										<strong>{guestName}</strong>
									</div>

									<div className="mt-2">
										<span className="capitalize">
											reservation created:&nbsp;
										</span>
										{format(createdAt, 'PPP')}
									</div>

									<div className="mt-2 sm:flex 2xl:pr-3">
										<div className="capitalize">message:&nbsp;</div>

										{guestMessage ? <>{guestMessage}</> : null}
									</div>
								</div>

								<div
									className={cn(
										'text-right',
										guestMessage ? 'max-2xl:mt-6' : '',
									)}
								>
									<div className="mb-4">
										<h5 className="text-xl">
											Total price:&nbsp;
											<span className="text-highlight">
												{totalPrice} {currency}
											</span>
										</h5>
									</div>

									<div className="flex justify-end gap-2">
										<Link to={`/admin/reservations/${reservationId}`}>
											<Button variant="outline">
												{reservationStatus !== 'cancelled' ? (
													'detail'
												) : (
													<span className="capitalize">detail</span>
												)}
											</Button>
										</Link>

										{reservationStatus !== 'cancelled' ? (
											<Link to={`/admin/reservations/${reservationId}`}>
												<Button
													variant={
														doubleCheckCancell.doubleCheck
															? 'highlight-secondary'
															: 'destructive'
													}
													{...doubleCheckCancell.getButtonProps({
														name: 'intent',
														value: 'delete',
													})}
												>
													{doubleCheckCancell.doubleCheck ? (
														'go to detail to cancel'
													) : (
														<Icon name="trash">Cancel</Icon>
													)}
												</Button>
											</Link>
										) : null}
									</div>
								</div>
							</div>
						</div>
					</div>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	)
}
