import { json } from '@remix-run/node'
import { useLoaderData, useNavigate } from '@remix-run/react'
import { modalBackdropLightClassList } from '#app/components/modal-backdrop.tsx'
import {
	SeasonListEditor,
	action,
} from '#app/routes/resources+/__seasonlist-editor.tsx'
import { prisma } from '#app/utils/db.server.ts'

export { action }

export async function loader() {
	// fetching selected dates for selector calendar
	const seasonLists = await prisma.seasonList.findMany({
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
			price1: true,
			price2: true,
			price3: true,
			additionalNightPrice1: true,
			additionalNightPrice2: true,
			additionalNightPrice3: true,
			seasonalPrices: {
				select: {
					id: true,
					seasonId: true,
					roomId: true,
					nightPrice: true,
					additionalNightPrice: true,
					weekDivisionId: true,
				}
			},
		},
	})
	const weekParts = await prisma.weekDivision.findMany({
		select: {
			id: true,
			partOfTheWeek: true,
		},
	})
	return json({ seasonLists, rooms, weekParts })
}

export default function CreateNewSeason() {
	const data = useLoaderData<typeof loader>()
	const navigate = useNavigate()
	const goBack = () => navigate(-1)

	const numberOfWeekParts: number = data.weekParts.filter(
		division => division.partOfTheWeek.length > 0,
	).length

	return (
		<>
			<div onClick={goBack} className={modalBackdropLightClassList} />
			<div className="absolute left-1/2 top-20 z-3001 w-full -translate-x-1/2 rounded-xl bg-white px-4 py-12 md:max-w-1/2">
				<h3 className="mb-8 text-center text-h3 dark:text-background capitalize">
					Create New season
				</h3>
				<SeasonListEditor
					existingSeasonLists={data.seasonLists}
					rooms={data.rooms}
					weekParts={numberOfWeekParts}
				/>
			</div>
		</>
	)
}
