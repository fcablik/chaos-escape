import { json, type DataFunctionArgs } from '@remix-run/node'
import { useLoaderData, useNavigate } from '@remix-run/react'
import { modalBackdropLightClassList } from '#app/components/modal-backdrop.tsx'
import {
	WeekPartEditor,
	action,
} from '#app/routes/resources+/__weekpart-editor.tsx'
import { prisma } from '#app/utils/db.server.ts'

export { action }

export async function loader({ params }: DataFunctionArgs) {
	const weekDivision = await prisma.weekDivision.findFirst({
		where: {
			id: params.id,
		},
		select: {
			id: true,
			partOfTheWeek: {
				select: {
					id: true,
					dayInAWeek: true,
					divisionAssignmentId: true,
				},
			},
		},
	})
	const weekDays = await prisma.weekDay.findMany({
		select: {
			id: true,
			dayInAWeek: true,
			divisionAssignmentId: true,
		},
	})

	if (!weekDivision || !weekDays) {
		throw new Response('not found', { status: 404 })
	}
	return json({ weekDivision, weekDays })
}

export default function WeekPartEdit() {
	const data = useLoaderData<typeof loader>()
	const navigate = useNavigate()
	const goBack = () => navigate(-1)

	return (
		<>
			<div onClick={goBack} className={modalBackdropLightClassList} />
			<div className="absolute left-1/2 top-20 z-3001 w-full -translate-x-1/2 rounded-xl bg-white px-2 py-8 md:max-w-1/2">
				<h3 className="mb-8 text-center capitalize text-h3 dark:text-background">
					Edit week part {data.weekDivision.id}
				</h3>
				<WeekPartEditor
					weekDivision={data.weekDivision}
					weekDays={data.weekDays}
				/>
			</div>
		</>
	)
}
