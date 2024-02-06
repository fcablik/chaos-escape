import { type DataFunctionArgs, json } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { useState } from 'react'
import { Spacer } from '#app/components/spacer.tsx'
import { Button } from '#app/components/ui/button.tsx'
import {
	MobileModalCaretOpener,
	ModalCloserIcon,
} from '#app/components/ui/modal-helpers.tsx'
import { prisma } from '#app/utils/db.server.ts'
import {
	cn,
	generateShortString,
	getRoomsGalleryImgSrc,
} from '#app/utils/misc.tsx'

export async function loader() {
	const rooms = await prisma.room.findMany({
		select: {
			id: true,
			title: true,
			url: true,
			visibility: true,
			price1: true,
			additionalNightPrice1: true,
			roomPreviewImages: {
				take: 1,
				select: {
					id: true,
					altText: true,
				},
			},
		},
	})
	if (!rooms) {
		throw new Response('not found', { status: 404 })
	}
	return json({ rooms })
}

export async function action({ request }: DataFunctionArgs) {
	const form = await request.formData()
	const roomId = form.get('roomId') as string

	if (roomId) {
		await duplicateRoom(roomId)
	} else {
		return json({ status: 'error' })
	}

	return json({ status: 'success' })
}

async function duplicateRoom(roomId: string) {
	const room = await prisma.room.findUnique({
		where: { id: roomId },
	})

	if (!room) {
		throw new Error('Room not found')
	}

	const randomString = 'duplicated-' + room.title + '-' + generateShortString(4)
	await prisma.room.create({
		data: {
			...room,
			id: undefined, //letting Prisma generate a new ID
			url: randomString,
			title: randomString,
			description: randomString,
			visibility: false,
		},
	})
}

export default function AdminRoomsIndex() {
	const data = useLoaderData<typeof loader>()
	// const doubleCheckDuplicate = useDoubleCheckInsideMap()

	const [isMobExtraMenuToggled, setMobExtraMenuToggled] = useState(false)
	const handleToggle = () => {
		setMobExtraMenuToggled(prev => !prev)
	}

	const currency = "$"

	return (
		<>
			<div className="px-2 max-lg:mt-4 max-lg:px-4 max-lg:py-4">
				<h5 className="mb-2 text-h5 capitalize text-foreground">rooms list</h5>
				<p>Manage Your rooms from here. 🤗</p>
			</div>

			<div className="mt-6 grid items-start gap-5 lg:mt-12 xl:grid-cols-5 3xl:grid-cols-3">
				<div className="w-full xl:col-span-4 3xl:col-span-2">
					<div className="grid grid-cols-2 gap-3 lg:gap-5 px-3 md:grid-cols-3 xl:gap-6 xl:px-3 3xl:gap-8">
						{data.rooms.map(room => (
							<div key={room.id} className="relative flex min-h-full flex-col justify-between rounded-2xl bg-backgroundDashboard pb-6 xl:rounded-3xl shadow-room-box">
								<div className="relative h-[100px] xl:h-[145px]">
									<>
										{room.roomPreviewImages.length ? (
											<img
												src={getRoomsGalleryImgSrc(
													room.roomPreviewImages[0]?.id,
												)}
												alt={room.roomPreviewImages[0]?.altText ?? ''}
												className="pointer-events-none h-full w-full rounded-t-2xl bg-cover bg-center object-cover xl:rounded-t-3xl"
											/>
										) : (
											<img
												src="/img/room-preview-img-placeholder.png"
												alt=""
												className="pointer-events-none h-full w-full rounded-t-2xl bg-cover bg-center object-cover xl:rounded-t-3xl"
											/>
										)}

										<div className="absolute inset-0 rounded-t-2xl bg-gradient-to-l from-transparent to-black opacity-60 xl:rounded-t-3xl"></div>
									</>
								</div>

								<div className="p-3 sm:p-5 2xl:px-4 2xl:pt-4 xl:min-h-[125px] 2xl:min-h-[140px]">
									<div className="capitalize font-bold line-clamp-2"
									>{room.title}</div>

									<div className="py-2">
										<span>{currency}{room.price1}</span>
										<span>{' '}(+{currency}{room.additionalNightPrice1})</span>
										<span>{' '}/ night</span>
									</div>
									
									<div className='font-bold'>
										<span className='capitalize'>status:{' '}</span>
										<span className={room.visibility ? "text-accepted" : "text-destructive"}>
											{room.visibility ? 'visible' : 'hidden'}
										</span>
									</div>
								</div>

								{/* <div className="flex flex-wrap justify-center gap-2"> */}
									<Link to={room.id} className="text-center mt-4">
										<Button variant="highlight" className='px-8'>Detail</Button>
									</Link>

									{/* {room.visibility && (
										<Link
											to={'/rooms/' + room.url}
											className="text-center"
											target="_blank"
										>
											<Button variant="outline">See Live</Button>
										</Link>
									)} */}

									{/* <Form method="POST" className="max-lg:hidden">
										<input type="hidden" name="roomId" value={room.id} />

										<Button
											className={
												doubleCheckDuplicate.doubleCheckStates[room.id]
													? 'absolute bottom-[-1.25rem] right-0'
													: ''
											}
											variant={
												doubleCheckDuplicate.doubleCheckStates[room.id]
													? 'secondary'
													: 'outline'
											}
											{...doubleCheckDuplicate.getButtonProps(room.id, {
												name: 'intent',
												value: 'submit',
											})}
										>
											{doubleCheckDuplicate.doubleCheckStates[room.id] ? (
												'Click Again To Duplicate Room'
											) : (
												<Icon name="copy" />
											)}
										</Button>
									</Form> */}
								{/* </div> */}
							</div>
						))}
					</div>
				</div>

				<MobileModalCaretOpener
					isMobExtraMenuToggled={isMobExtraMenuToggled}
					handleToggle={handleToggle}
					classList="xl:hidden"
					triggerTitle="options"
				/>

				<div
					className={cn(
						isMobExtraMenuToggled
							? 'bottom-24 z-4001 max-xl:visible md:max-xl:right-4 md:max-lg:max-w-3/5 lg:max-xl:max-w-2/5'
							: 'max-xl:hidden',
						'rounded-3xl bg-backgroundDashboard px-6 py-8 max-xl:fixed max-sm:mx-3 xl:sticky xl:top-[75px] xl:w-full 2xl:px-8 2xl:py-8',
					)}
				>
					{isMobExtraMenuToggled && (
						<ModalCloserIcon handleToggle={handleToggle} />
					)}

					<p className="mb-4 text-lg font-semibold capitalize sm:mb-2">
						rooms options
					</p>

					<div className="mt-4 flex w-full gap-3 max-xl:flex-wrap xl:max-3xl:flex-col 3xl:flex-wrap">
						<Link to="/admin/rooms/createnew" className="">
							<Button
								size="lg"
								variant="highlight"
								className="w-full capitalize"
							>
								create new
							</Button>
						</Link>

						<Link to="/rooms/" target="_blank">
							<Button
								size="lg"
								variant="highlight"
								className="w-full capitalize max-sm:px-4 xl:max-3xl:px-1"
							>
								live room list
							</Button>
						</Link>

						<div className="my-3 w-full border-b border-highlight/20" />

						<p className="mb-1 w-full text-lg font-semibold capitalize">
							manage extras
						</p>

						<Link to="pricing" className="">
							<Button
								size="lg"
								variant="highlight"
								className="w-full capitalize"
							>
								pricing
							</Button>
						</Link>

						<Link to="facility" className="">
							<Button
								size="lg"
								variant="highlight"
								className="w-full capitalize"
							>
								facilities
							</Button>
						</Link>

						<Link to="gallery" className="">
							<Button
								size="lg"
								variant="highlight"
								className="w-full capitalize"
							>
								galleries
							</Button>
						</Link>

						<Link to="packagedeals" className="">
							<Button
								size="lg"
								variant="highlight"
								className="w-full capitalize"
							>
								package deals
							</Button>
						</Link>

						<Link to="discounts" className="">
							<Button
								size="lg"
								variant="highlight"
								className="w-full capitalize"
							>
								discounts
							</Button>
						</Link>
					</div>
				</div>
			</div>

			<Spacer size="lg" />
		</>
	)
}
