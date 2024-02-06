import { json, type DataFunctionArgs } from '@remix-run/node'
import { useLoaderData, useNavigate } from '@remix-run/react'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { invariantResponse } from '#app/utils/misc.tsx'
import { RoomEditor, action } from '../../../resources+/__room-editor.tsx'

export { action }

export async function loader({ params }: DataFunctionArgs) {
	const room = await prisma.room.findFirst({
		where: {
			id: params.id,
		},
		select: {
			id: true,
			url: true,
			title: true,
			description: true,
			seo: true,
			price1: true,
			price2: true,
			price3: true,
			additionalNightPrice1: true,
			additionalNightPrice2: true,
			additionalNightPrice3: true,
			numberOfGuestsForDefaultPrice: true,
			maxGuests: true,
			visibility: true,
			roomFacility: {
				select: {
					id: true,
					name: true,
					iconName: true,
				},
			},
		},
	})
	invariantResponse(room, 'Not found', { status: 404 })

	const existingFacilities = await prisma.roomFacility.findMany({
		select: {
			id: true,
			name: true,
			iconName: true,
		},
	})

	const weekParts = await prisma.weekDivision.findMany({
		select: {
			id: true,
			partOfTheWeek: true,
		},
	})

	return json({ room: room, existingFacilities, weekParts })
}

export default function RoomEdit() {
	const data = useLoaderData<typeof loader>()
	const navigate = useNavigate()
	const goBack = () => navigate(-1)

	const numberOfWeekParts: number = data.weekParts.filter(
		division => division.partOfTheWeek.length > 0,
	).length


	return (
		<div className="px-2 md:px-6 xl:mx-auto xl:max-w-[900px] 2xl:max-w-[1000px]">
			<Button onClick={goBack} variant="secondary" className="text-xs">
				go back
			</Button>
			<hr className="my-8 border-secondary" />

			<div className="">
				<h3 className="mb-8 text-center text-h3 text-background">Editing: {data.room.title}</h3>
				<RoomEditor
					room={data.room}
					facilities={data.existingFacilities}
					weekParts={numberOfWeekParts}
				/>
			</div>
		</div>
	)
}
