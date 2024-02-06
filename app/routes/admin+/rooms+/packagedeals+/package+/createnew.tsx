import { json } from '@remix-run/node'
import { useLoaderData, useNavigate } from '@remix-run/react'
import { modalBackdropLightClassList } from '#app/components/modal-backdrop.tsx'
import {
	RoomPackageItemEditor,
	action,
} from '#app/routes/resources+/__room-packageitem-editor.tsx'
import { prisma } from '#app/utils/db.server.ts'

export { action }

export async function loader() {
	const rooms = await prisma.room.findMany({
		select: {
			id: true,
			title: true,
			url: true,
		},
	})
	return json({ rooms })
}

export default function CreateNewPackageItem() {
	const data = useLoaderData<typeof loader>()
	const navigate = useNavigate()
	const goBack = () => navigate(-1)

	return (
		<>
			<div onClick={goBack} className={modalBackdropLightClassList} />
			<div className="absolute left-1/2 top-20 z-3001 w-full -translate-x-1/2 rounded-xl bg-white px-4 py-12 md:max-w-1/2">
				<h3 className="mb-8 text-center text-h3 dark:text-background">
					Create New Package Items
				</h3>
				<RoomPackageItemEditor rooms={data.rooms} />
			</div>
		</>
	)
}
