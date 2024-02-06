import { json, type DataFunctionArgs } from '@remix-run/node'
import { useLoaderData, useNavigate } from '@remix-run/react'
import { modalBackDropOnBackdropClassList } from '#app/components/modal-backdrop.tsx'
import {
	RoomsGalleryEditor,
	action,
} from '#app/routes/resources+/__rooms-gallery-editor.tsx'

import { prisma } from '#app/utils/db.server.ts'

export { action }

export async function loader({ params }: DataFunctionArgs) {
	const roomsGallery = await prisma.roomsGallery.findFirst({
		where: {
			id: params.id,
		},
		select: {
			id: true,
			name: true,
			images: {
				select: {
					id: true,
					altText: true,
				},
			},
		},
	})
	if (!roomsGallery) {
		throw new Response('not found', { status: 404 })
	}
	return json({ roomsGallery })
}

export default function RoomsGalleryFolderEdit() {
	const data = useLoaderData<typeof loader>()
	const navigate = useNavigate()
	const goBack = () => navigate(-1)

	return (
		<>
			<div onClick={goBack} className={modalBackDropOnBackdropClassList} />
			<div className="absolute left-1/2 top-20 z-3001 w-full -translate-x-1/2 rounded-xl bg-white p-4 border-foreground border-2">
				<RoomsGalleryEditor roomsGallery={data.roomsGallery} />
			</div>
		</>
	)
}
