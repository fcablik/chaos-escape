import { json, type DataFunctionArgs } from '@remix-run/node'
import { useLoaderData, useNavigate } from '@remix-run/react'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { GallerySelector, action } from '../../../resources+/__room-gallery-selector.tsx'

export { action }

export async function loader({ params }: DataFunctionArgs) {
	const room = await prisma.room.findFirst({
		where: {
			id: params.id,
		},
		select: {
			id: true,
			roomFacility: {
				select: {
					id: true,
					name: true,
					iconName: true,
				}
			},
            roomGalleryImages: {
                select: {
                    id: true,
                }
            }
		},
	})
    if (!room) {
		throw new Response('not found', { status: 404 })
	}

    const galleries = await prisma.roomsGallery.findMany({
		select: {
			id: true,
			name: true,
			images: {
                select: {
                    id: true,
                }
            },
		},
	})
	return json({ room: room, galleries })
}

export default function RoomEdit() {
	const data = useLoaderData<typeof loader>()
	const navigate = useNavigate()
	const goBack = () => navigate(-1)

	return (
		<div className="px-2 md:px-6 xl:mx-auto xl:max-w-[1200px] 2xl:max-w-[1300px]">
			<Button onClick={goBack} variant="secondary" className="text-xs">
				go back
			</Button>
			<hr className="my-8 border-secondary" />

			<div className="dark:text-background">
				<GallerySelector galleries={data.galleries} room={data.room} />
			</div>
		</div>
	)
}
