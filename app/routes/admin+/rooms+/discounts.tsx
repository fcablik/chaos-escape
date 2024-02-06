import { type DataFunctionArgs, json } from '@remix-run/node'
import { Link, Outlet, useFetcher, useLoaderData } from '@remix-run/react'
import { useState } from 'react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { cn } from '#app/utils/misc.tsx'

export async function loader() {
	const roomDiscounts = await prisma.roomDiscount.findMany({
		orderBy: {
			createdAt: 'desc',
		},
		select: {
			id: true,
			type: true,
			nights: true,
			code: true,
			value: true,
			valueType: true,
			rooms: {
				select: {
					id: true,
					title: true,
				},
			},
			visibility: true,
		},
	})

	if (!roomDiscounts) {
		throw new Response('not found', { status: 404 })
	}
	return json({
		roomDiscounts,
	})
}

export default function RoomDiscountsRoute() {
	const data = useLoaderData<typeof loader>()

	const currency = '€' //#later dynamic

	return (
		<div className="relative flex flex-col items-center justify-center gap-6 py-8">
			<Outlet />

			<div className="mb-8 w-full max-sm:text-center">
				<h2 className="mb-2 text-h2 capitalize text-black dark:text-foreground">
					room discounts
				</h2>
				<p className="text-xl">
					Create and manage Your special deals from here. 🤗
				</p>

				<div className="mt-4">
					<Link to="createnew">
						<Button variant="highlight">create new</Button>
					</Link>
				</div>
			</div>

			<div className="flex w-full justify-between gap-10">
				<div className="w-full">
					{data.roomDiscounts.length ? (
						<RoomDiscountsTable
							roomDiscounts={data.roomDiscounts}
							currency={currency}
						/>
					) : (
						<>
							<p className="text-lg">
								no existing discounts, create your first
							</p>
						</>
					)}
				</div>
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}

function RoomDiscountsTable({
	roomDiscounts,
	currency,
}: {
	roomDiscounts: {
		id: string
		type: string
		nights: string | null
		code: string | null
		value: number
		valueType: string
		rooms: {
			id: string
			title: string
		}[]
		visibility: boolean
	}[]
	currency: string
}) {
	return (
		<div className="rounded-xl border-2 border-highlight p-2 md:p-4">
			<h5 className="text-h5 capitalize">existing discounts</h5>

			<div className="my-6 flex flex-col gap-2 border-b border-foreground py-4">
				<div className="flex w-full">
					<div className="w-[16%]">type</div>

					<div className="w-[16%]">nights/promo code</div>

					<div className="w-[16%]">discount value</div>

					<div className="w-[16%]">value type</div>

					<div className="w-[18%]">rooms</div>

					<div className="w-[18%] text-right">options</div>
				</div>
			</div>

			<div className="flex flex-col gap-2">
				{roomDiscounts.map((roomDiscount, i) => (
					<div key={i}>
						<ExtendedRoomDiscountsTable
							roomDiscount={roomDiscount}
							currency={currency}
						/>
					</div>
				))}
			</div>
		</div>
	)
}

export async function action({ request }: DataFunctionArgs) {
	const form = await request.formData()
	const roomDiscountId = form.get('roomDiscountId') as string | undefined

	const isRoomDiscountIdVisible = form.get('isVisible') === 'true'

	if (roomDiscountId) {
		await updateVisibility(roomDiscountId, isRoomDiscountIdVisible)
	}

	if (!roomDiscountId) {
		return json({ status: 'error' })
	}

	return json({ status: 'success' })
}

async function updateVisibility(id: string, visibility: boolean) {
	return prisma.roomDiscount.update({
		where: { id },
		data: { visibility },
		select: { id: true },
	})
}

function ExtendedRoomDiscountsTable({
	roomDiscount,
	currency,
}: {
	roomDiscount: {
		id: string
		type: string
		nights: string | null
		code: string | null
		value: number
		valueType: string
		rooms: {
			id: string
			title: string
		}[]
		visibility: boolean
	}
	currency: string
}) {
	const visibilityFetcher = useFetcher()
	const pendingVisible = visibilityFetcher.state !== 'idle'
	const isVisible = pendingVisible
		? visibilityFetcher.formData?.get('isVisible') === 'true'
		: roomDiscount?.visibility

	const [isButtonVisible, setIsButtonVisible] = useState(true)
	if (pendingVisible && isButtonVisible) {
		setIsButtonVisible(false)
		setTimeout(() => setIsButtonVisible(true), 2000)
	}

	return (
		<div className={cn('flex w-full items-center rounded-lg p-2')}>
			<div className="w-[16%]">{roomDiscount.type}</div>

			<div className="w-[16%]">
				{roomDiscount.nights !== "0" && roomDiscount.nights}
				{roomDiscount.code !== "0" && roomDiscount.code}
			</div>

			<div className="w-[16%]">
				{roomDiscount.valueType === '- fixed value' && currency}
				{roomDiscount.value}
				{roomDiscount.valueType === '% percentage' && "%"}
			</div>

			<div className="w-[16%]">
				{roomDiscount.valueType}
			</div>

			<div className="w-[18%]">
				{roomDiscount.rooms.length ? (
					<ul className="list-disc pl-5">
						{roomDiscount.rooms.map((room, i) => (
							<li key={i}>
								<Link to={'/admin/rooms/' + room.id}>
									<span className="underline hover:no-underline">
										{room.title}
									</span>
								</Link>
							</li>
						))}
					</ul>
				) : (
					'no rooms selected'
				)}
			</div>

			<div className="w-[18%] flex flex-col items-end justify-end gap-2">
				<div
					className={cn(
						'rounded-sm px-2 py-1 dark:text-background',
						roomDiscount?.visibility ? 'bg-highlight text-background' : 'bg-destructive',
					)}
				>
					{roomDiscount?.visibility ? 'active' : 'disabled'}
				</div>

				<visibilityFetcher.Form method="POST">
					<input type="hidden" name="roomDiscountId" value={roomDiscount.id} />
					<input
						type="hidden"
						name="isVisible"
						value={(!isVisible).toString()}
					/>
					<div className="min-w-[8em] min-h-[3em]">
						{!pendingVisible && isButtonVisible && (
							<Button variant={isVisible ? "destructive" : "secondary"} className="w-full" type="submit">
								{isVisible ? 'deactivate' : 'activate'}
							</Button>
						)}
					</div>
				</visibilityFetcher.Form>

				<Link to={`${roomDiscount.id}/edit`}>
					<Button variant="primary">edit</Button>
				</Link>
			</div>
		</div>
	)
}
