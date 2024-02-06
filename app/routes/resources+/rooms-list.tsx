import { Link } from '@remix-run/react'
import React from 'react'
import { Button } from '#app/components/ui/button.tsx'
import { getRoomsGalleryImgSrc } from '#app/utils/misc.tsx'

export function RoomsListLoader({
	roomData,
}: {
	roomData: {
		rooms: {
			id: string
			url: string
			title: string
			visibility: boolean
			price1: number
			roomPreviewImages: {
				id: string
				altText: string | null
			}[]
		}[]
	}
}) {
	const roomsVisibility = roomData.rooms
		.map(room => room.visibility ?? true)
		.filter(Boolean)

	return (
		<>
			{roomData.rooms.length && roomsVisibility?.length ? (
				<div
					className="py-4 sm:mx-auto sm:max-w-[850px] md:max-w-[950px] lg:max-w-[1050px] lg:px-0 lg:py-12"
				>
					<div className="grid grid-cols-2 lg:grid-cols-3">
						{roomData.rooms.map(room => (
							<React.Fragment key={room.id}>
								{room.visibility && (
									<div className="w-full p-2 text-center md:p-6">
										<div className="z-1 border bg-background rounded-xl transition-opacity hover:opacity-95">
											<Link to={`/rooms/${room.url}`} className="text-center ">
												<div className="relative h-[105px] md:h-[165px]">
													<>
														{room.roomPreviewImages.length ? (
															<img
																src={getRoomsGalleryImgSrc(
																	room.roomPreviewImages[0]?.id,
																)}
																alt={room.roomPreviewImages[0]?.altText ?? ''}
																className="pointer-events-none h-full w-full rounded-t-xl bg-cover bg-center object-cover"
															/>
														) : (
															<img
																src="/img/room-preview-img-placeholder.png"
																alt=""
																className="pointer-events-none h-full w-full rounded-t-xl bg-cover bg-center object-cover"
															/>
														)}

														<div className="absolute inset-0 rounded-t-xl bg-gradient-to-l from-transparent to-black opacity-60"></div>
													</>
												</div>

												<div className="p-3 md:pb-6 md:pt-4 lg:px-4 lg:pb-10 lg:pt-6">
													<div className="overflow-hidden py-2 md:py-6 lg:p-8">
														<div>{room.title}</div>
														<div>{room.price1}</div>
													</div>

													<Button variant="secondary" className="">
														Detail
													</Button>
												</div>
											</Link>
										</div>
									</div>
								)}
							</React.Fragment>
						))}
					</div>
				</div>
			) : (
				<p>Seems like no rooms are available at the moment. 😏</p>
			)}
		</>
	)
}
