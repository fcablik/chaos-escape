import { json } from '@remix-run/node'
import { useLoaderData, useNavigate } from '@remix-run/react'
import { modalBackdropLightClassList } from '#app/components/modal-backdrop.tsx'
import {
	RoomMultiPackageEditor,
	action,
} from '#app/routes/resources+/__room-multipackage-editor.tsx'
import { prisma } from '#app/utils/db.server.ts'

export { action }

export async function loader() {
	// fetching dates for selector calendar
	const existingRoomMultiPackages = await prisma.roomMultiPackage.findMany({
		select: {
			id: true,
			dateFrom: true,
			dateTo: true,
		},
	})

	const rooms = await prisma.room.findMany({
		select: {
			id: true,
			title: true,
			url: true,
		},
	})
	const roomPackageItems = await prisma.roomPackageItem.findMany({
		where: {
			visibility: true
		},
		select: {
			id: true,
			name: true,
		},
	})
	return json({ existingRoomMultiPackages, rooms, roomPackageItems })
}

export default function CreateNewMultiPackage() {
	const data = useLoaderData<typeof loader>()
	const navigate = useNavigate()
	const goBack = () => navigate(-1)

	return (
		<>
			<div onClick={goBack} className={modalBackdropLightClassList} />
			<div className="absolute left-1/2 top-20 z-3001 w-full -translate-x-1/2 rounded-xl bg-white px-4 py-12 md:max-w-1/2">
				<h3 className="mb-8 text-center text-h3 dark:text-background">
					Create New Multi-Package Deals
				</h3>

				<RoomMultiPackageEditor
					existingRoomMultiPackages={data.existingRoomMultiPackages}
					rooms={data.rooms}
					packageItems={data.roomPackageItems}
				/>
			</div>
		</>
	)
}
