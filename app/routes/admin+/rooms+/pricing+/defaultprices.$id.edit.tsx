import { json, type DataFunctionArgs } from '@remix-run/node'
import { useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { modalBackdropLightClassList } from '#app/components/modal-backdrop.tsx'
import { useRedirectWithScrollToTop } from '#app/components/reservation-modal-animation.tsx'
import {
	action,
	RoomPricesEditor,
} from '#app/routes/resources+/__room-price-editor.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { invariant } from '#app/utils/misc.tsx'

export { action }

export async function loader({ params }: DataFunctionArgs) {
	invariant(params.id, 'Missing room id')
	const room = await prisma.room.findUnique({
		where: { id: params.id },
		select: {
			id: true,
			title: true,
			price1: true,
			additionalNightPrice1: true,
			price2: true,
			additionalNightPrice2: true,
			price3: true,
			additionalNightPrice3: true,
		},
	})
	if (!room) {
		throw new Response('not found', { status: 404 })
	}

	const weekParts = await prisma.weekDivision.findMany({
		select: {
			id: true,
			partOfTheWeek: true,
		},
	})

	return json({ room, weekParts })
}

export default function EditRoomDefaultPrice() {
	const data = useLoaderData<typeof loader>()

	const navigateAndScroll = useRedirectWithScrollToTop()
	const goBack = () => {
		navigateAndScroll('back')
	}

	const numberOfWeekParts: number = data.weekParts.filter(
		division => division.partOfTheWeek.length > 0,
	).length

	return (
		<>
			<div onClick={goBack} className={modalBackdropLightClassList} />
			<div className="absolute left-1/2 top-20 z-3001 w-full -translate-x-1/2 rounded-xl bg-white py-8 px-2">
				<h3 className="mb-8 text-center text-h3 dark:text-background capitalize">{data.room.title}'s default price</h3>
				<RoomPricesEditor
					room={data.room}
					weekParts={numberOfWeekParts}
				/>
			</div>
		</>
	)
}

export function ErrorBoundary() {
	return (
		<GeneralErrorBoundary
			statusHandlers={{
				404: ({ params }) => (
					<div className="container mx-auto flex h-5/6 flex-col justify-center pb-32 pt-20 text-center">
						<h3 className="text-h3">
							No room with the id "{params.id}" exists
						</h3>
					</div>
				),
			}}
		/>
	)
}
