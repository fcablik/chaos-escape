import { json, type DataFunctionArgs } from '@remix-run/node'
import { useLoaderData, useNavigate } from '@remix-run/react'
import { modalBackdropLightClassList } from '#app/components/modal-backdrop.tsx'
import {
	RoomDiscountEditor,
	action,
} from '#app/routes/resources+/__room-discount-editor.tsx'
import { prisma } from '#app/utils/db.server.ts'

export { action }

export async function loader({ params }: DataFunctionArgs) {
	const roomDiscount = await prisma.roomDiscount.findFirst({
		where: {
			id: params.id,
		},
		select: {
			id: true,
			type: true,
			nights: true,
			code: true,
			value: true,
			rooms: true,
			valueType: true,
		},
	})

	if (!roomDiscount) {
		throw new Response('not found', { status: 404 })
	}

	const rooms = await prisma.room.findMany({
		select: {
			id: true,
			title: true,
			url: true,
		},
	})
	// fetching existing discounts to not create new ones
	const existingRoomDiscounts = await prisma.roomDiscount.findMany({
		select: {
			id: true,
		},
	})
	return json({ roomDiscount, rooms, existingRoomDiscounts })
}

export default function RoomDiscountEdit() {
	const data = useLoaderData<typeof loader>()
	const navigate = useNavigate()
	const goBack = () => navigate(-1)

	return (
		<>
			<div onClick={goBack} className={modalBackdropLightClassList} />
			<div className="absolute left-1/2 top-20 z-3001 w-full -translate-x-1/2 rounded-xl bg-white px-2 py-8 md:max-w-1/2">
				<h3 className="mb-8 text-center text-h3 dark:text-background">
					Edit Discount
				</h3>

				<RoomDiscountEditor
					existingRoomDiscount={data.roomDiscount}
					existingRoomDiscounts={data.existingRoomDiscounts}
					rooms={data.rooms}
				/>
			</div>
		</>
	)
}
