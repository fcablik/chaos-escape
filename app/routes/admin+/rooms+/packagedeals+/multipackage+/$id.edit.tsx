import { json, type DataFunctionArgs } from '@remix-run/node'
import { useLoaderData, useNavigate } from '@remix-run/react'
import { modalBackdropLightClassList } from '#app/components/modal-backdrop.tsx'
import {
	RoomMultiPackageEditor,
	action,
} from '#app/routes/resources+/__room-multipackage-editor.tsx'
import { prisma } from '#app/utils/db.server.ts'

export { action }

export async function loader({ params }: DataFunctionArgs) {
	// fetching dates for selector calendar
	const existingRoomMultiPackages = await prisma.roomMultiPackage.findMany({
		select: {
			id: true,
			dateFrom: true,
			dateTo: true,
		},
	})

	const roomMultiPackage = await prisma.roomMultiPackage.findFirst({
		where: {
			id: params.id,
		},
		select: {
			id: true,
			name: true,
			price: true,
			rooms: true,
			packageItems: true,
			dateFrom: true,
			dateTo: true,
		},
	})

	if (!roomMultiPackage) {
		throw new Response('not found', { status: 404 })
	}

	const rooms = await prisma.room.findMany({
		select: {
			id: true,
			title: true,
			url: true,
		},
	})
	const roomPackageItems = await prisma.roomPackageItem.findMany({
		where: {
			visibility: true,
		},
		select: {
			id: true,
			name: true,
		},
	})
	return json({ existingRoomMultiPackages, roomMultiPackage, rooms, roomPackageItems })
}

export default function MultiPackageEdit() {
	const data = useLoaderData<typeof loader>()
	const navigate = useNavigate()
	const goBack = () => navigate(-1)

	return (
		<>
			<div onClick={goBack} className={modalBackdropLightClassList} />
			<div className="absolute left-1/2 top-20 z-3001 w-full -translate-x-1/2 rounded-xl bg-white px-2 py-8 md:max-w-1/2">
				<h3 className="mb-8 text-center text-h3 dark:text-background">
					Edit Season / Event
				</h3>

				<RoomMultiPackageEditor
					existingRoomMultiPackage={data.roomMultiPackage}
					existingRoomMultiPackages={data.existingRoomMultiPackages}
					rooms={data.rooms}
					packageItems={data.roomPackageItems}
				/>
			</div>
		</>
	)
}
