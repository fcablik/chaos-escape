import { json, type DataFunctionArgs } from '@remix-run/node'
import { useLoaderData, useNavigate } from '@remix-run/react'
import { modalBackdropLightClassList } from '#app/components/modal-backdrop.tsx'
import {
	SeasonListEditor,
	action,
} from '#app/routes/resources+/__seasonlist-editor.tsx'
import { prisma } from '#app/utils/db.server.ts'

export { action }

export async function loader({ params }: DataFunctionArgs) {
	const seasonList = await prisma.seasonList.findFirst({
		where: {
			id: params.id,
		},
		select: {
			id: true,
			name: true,
			dateFrom: true,
			dateTo: true,
			rooms: {
				select: {
					id: true,
					title: true,
					seasonalPrices: {
						where: {
							seasonId: params.id,
						},
						select: {
							id: true,
							seasonId: true,
							roomId: true,
							nightPrice: true,
							additionalNightPrice: true,
							weekDivisionId: true,
						}
					},
				}
			},
		},
	})
	if (!seasonList) {
		throw new Response('not found', { status: 404 })
	}

	// fetching selected dates for selector calendar
	const existingSeasonLists = await prisma.seasonList.findMany({
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
		},
	})

	const weekParts = await prisma.weekDivision.findMany({
		select: {
			id: true,
			partOfTheWeek: true,
		},
	})

	return json({ seasonList, existingSeasonLists, rooms, weekParts })
}

export default function SeasonEdit() {
	const data = useLoaderData<typeof loader>()
	const navigate = useNavigate()
	const goBack = () => navigate(-1)

	const numberOfWeekParts: number = data.weekParts.filter(
		division => division.partOfTheWeek.length > 0,
	).length

	return (
		<>
			<div onClick={goBack} className={modalBackdropLightClassList} />
			<div className="absolute left-1/2 top-20 z-3001 w-full -translate-x-1/2 rounded-xl bg-white px-2 py-8 md:max-w-1/2">
				<h3 className="mb-8 text-center text-h3 dark:text-background capitalize">
					edit season
				</h3>
				<SeasonListEditor
					existingSeasonList={data.seasonList}
					existingSeasonLists={data.existingSeasonLists}
					rooms={data.rooms}
					weekParts={numberOfWeekParts}
				/>
			</div>
		</>
	)
}
