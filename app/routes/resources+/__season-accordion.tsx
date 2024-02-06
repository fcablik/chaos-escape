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

export function SeasonAccordion({
	id,
	name,
	dateFrom,
	dateTo,
	rooms,
	numberOfWeekParts,
	weekIsDivided,
}: {
	id: string
	name: string
	dateFrom: string
	dateTo: string
	rooms: {
		id: string
		title: string
		seasonalPrices: {
			id: string
			nightPrice: number
			seasonId: string
			weekDivisionId: string
			additionalNightPrice: number
		}[]
	}[]
	numberOfWeekParts: number
	weekIsDivided: boolean
}) {
	const currency = '€' //#later dynamic

	return (
		<Accordion type="single" collapsible>
			<AccordionItem
				value={'id_' + id}
				className="AccordionItem rounded-xl bg-background shadow-md"
			>
				<AccordionHeader className="AccordionHeader flex items-center justify-between px-2 py-3 md:max-xl:relative lg:px-4">
					<AccordionTrigger className="flex w-[92%] items-center sm:w-[94%]">
						<div className="w-1/4 text-left text-sm  sm:px-1">{name}</div>

						<div className="w-1/4 truncate text-left sm:px-1">
							{format(new Date(dateFrom), 'PPP')}
						</div>

						<div className="w-1/4 text-left capitalize sm:px-1">
							{format(new Date(dateTo), 'PPP')}
						</div>
					</AccordionTrigger>

					<AccordionTrigger className="w-8% sm:w-[6%]">
						<Link to={`season/${id}/edit`}>
							<Icon name="pencil-2" />
						</Link>

						<Icon
							name="caret-down"
							className="opener h-6 w-6 sm:h-10 sm:w-10"
						/>
					</AccordionTrigger>
				</AccordionHeader>

				<AccordionContent className="AccordionContent px-4 lg:px-8">
					<div className="py-4 md:max-xl:mt-12 lg:py-8">
						<div className="pb-2">
							{rooms.length ? (
								<>
									<h5 className="mb-8 text-center text-h5">
										{name}'s room list
									</h5>
									<div className="flex items-center border-b border-background">
										<div className="w-1/3">room name</div>
										<div className="flex w-2/3">
											{weekIsDivided && <div className="w-1/3">week part</div>}
											<div className={weekIsDivided ? 'w-1/3' : 'w-1/2'}>
												price / night
											</div>
											<div className={weekIsDivided ? 'w-1/3' : 'w-1/2'}>
												+bed price /night
											</div>
										</div>
									</div>

									<div className="w-full">
										{rooms.map((room, i) => (
											<div key={i} className="my-4 flex items-center">
												<div className="w-1/3">
													<Link to={'/admin/rooms/' + room.id}>
														<span className="underline hover:no-underline">
															{room.title}
														</span>
													</Link>
												</div>

												<div className="w-2/3">
													{weekIsDivided
														? room.seasonalPrices
																.filter(
																	seasonalPrice =>
																		seasonalPrice.seasonId === id &&
																		parseInt(
																			seasonalPrice.weekDivisionId ?? '',
																		) <= numberOfWeekParts,
																)
																.map((seasonalPrice, i) => (
																	<div
																		key={i}
																		className="flex w-full items-center"
																	>
																		<div className="w-1/3">
																			{seasonalPrice.weekDivisionId}. week part
																		</div>
																		<div className="w-1/3">
																			{currency}
																			{seasonalPrice.nightPrice}
																		</div>
																		<div className="w-1/3">
																			{currency}
																			{seasonalPrice.additionalNightPrice}
																		</div>
																	</div>
																))
														: room.seasonalPrices
																.filter(
																	seasonalPrice =>
																		seasonalPrice.seasonId === id &&
																		parseInt(
																			seasonalPrice.weekDivisionId ?? '',
																		) === 1,
																)
																.map((seasonalPrice, i) => (
																	<div
																		key={i}
																		className="flex w-full items-center"
																	>
																		<div className="w-1/2">
																			{seasonalPrice.nightPrice}
																		</div>
																		<div className="w-1/2">/</div>
																	</div>
																))}
												</div>
											</div>
										))}
									</div>
								</>
							) : (
								<div className="flex flex-col gap-2 text-center font-bold">
									no rooms selected
									<Link to={`season/${id}/edit`}>
										<Button className="highlight-secondary w-[10em] self-center">
											<Icon name="plus">add rooms</Icon>
										</Button>
									</Link>
								</div>
							)}
						</div>
					</div>
				</AccordionContent>
			</AccordionItem>
		</Accordion>
	)
}
