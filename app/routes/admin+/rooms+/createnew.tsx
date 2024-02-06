import { useLoaderData, useNavigate } from '@remix-run/react'
import { json } from '@remix-run/router'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { RoomEditor, action } from '../../resources+/__room-editor.tsx'

export async function loader() {
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

	return json({ existingFacilities, weekParts })
}

export { action }

export default function CreateNewRoom() {
	const data = useLoaderData<{
		existingFacilities: {
			id: string
			name: string
			iconName: string
		}[]
		weekParts: {
			id: string
			partOfTheWeek: string
		}[]
	}>()
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
				<h3 className="mb-8 text-h3">Create New Room</h3>
				<RoomEditor
					facilities={data.existingFacilities}
					weekParts={numberOfWeekParts}
				/>
			</div>
		</div>
	)
}
