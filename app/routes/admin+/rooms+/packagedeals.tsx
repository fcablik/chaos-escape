import { type DataFunctionArgs, json } from '@remix-run/node'
import { Link, Outlet, useFetcher, useLoaderData } from '@remix-run/react'
import { format } from 'date-fns'
import { useState } from 'react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { cn } from '#app/utils/misc.tsx'

export async function loader() {
	const roomPackageItems = await prisma.roomPackageItem.findMany({
		orderBy: {
			createdAt: 'desc',
		},
		select: {
			visibility: true,
			id: true,
			name: true,
			price: true,
			rooms: {
				select: {
					id: true,
					title: true,
				},
			},
			roomMultiPackages: {
				select: {
					name: true,
				},
			},
		},
	})

	const roomMultiPackages = await prisma.roomMultiPackage.findMany({
		orderBy: {
			createdAt: 'desc',
		},
		select: {
			id: true,
			name: true,
			price: true,
			rooms: {
				select: {
					id: true,
					title: true,
				},
			},
			packageItems: {
				select: {
					name: true,
				},
			},
			dateFrom: true,
			dateTo: true,
			visibility: true,
		},
	})

	if (!roomPackageItems || !roomMultiPackages) {
		throw new Response('not found', { status: 404 })
	}
	return json({
		roomPackageItems,
		roomMultiPackages,
	})
}

export default function PackageDealsRoute() {
	const data = useLoaderData<typeof loader>()

	const currency = '€' //#later dynamic

	return (
		<div className="relative flex flex-col items-center justify-center gap-6 py-8">
			<Outlet />

			<div className="mb-8 w-full max-sm:text-center">
				<h2 className="mb-2 text-h2 capitalize text-black dark:text-foreground">
					Benefits, Items & Packages
				</h2>
				<p className="text-xl">
					Create and manage Your special benefits, items or deals from here. 🤗
				</p>
			</div>

			<div className="mb-8 flex w-full justify-between gap-10">
				<div className="w-full">
					<div className="mb-6">
						<h5 className="mb-1 text-h5 capitalize">package items</h5>
						<p className="mb-2">
							These items will be available to add to guest's reservation (e.g.
							+breakfast - price per person)
						</p>
						<Link to="package/createnew">
							<Button variant="highlight">create new</Button>
						</Link>
					</div>

					{data.roomPackageItems.length ? (
						<PackageItemsTable roomPackageItems={data.roomPackageItems} />
					) : (
						<>
							<p className="text-lg">no existing seasons, create your first</p>
						</>
					)}
				</div>
			</div>

			<div className="flex w-full justify-between gap-10">
				<div className="w-full">
					<div className="mb-6">
						<h5 className="mb-1 text-h5 capitalize">multi-package deals</h5>
						<p className="mb-2">
							You can build a custom multi-package from your existing packages
						</p>

						{data.roomPackageItems.length || data.roomMultiPackages.length ? (
							<Link to="multipackage/createnew">
								<Button variant="highlight">create new</Button>
							</Link>
						) : (
							<div className="flex items-center gap-5">
								<Button variant="disabled">create new</Button>
								(no package items available)
							</div>
						)}
					</div>

					{data.roomMultiPackages.length ? (
						<MultiPackagesTable
							roomMultiPackages={data.roomMultiPackages}
							currency={currency}
						/>
					) : data.roomPackageItems.length ? (
						<>
							<p className="text-lg">
								no existing multi packages, create your first
							</p>
						</>
					) : null}
				</div>
			</div>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}

function PackageItemsTable({
	roomPackageItems,
}: {
	roomPackageItems: {
		id: string
		name: string
		price: number
		visibility: boolean
		// status: string
		rooms: {
			id: string
			title: string
		}[]
		roomMultiPackages: {
			name: string
		}[]
	}[]
}) {
	return (
		<div className="rounded-xl border-2 border-highlight p-2 md:p-4">
			<h5 className="text-h5 capitalize">existing package items</h5>

			<div className="my-6 flex flex-col gap-2 border-b border-foreground py-4">
				<div className="flex w-full">
					<div className="w-[20%]">name</div>

					<div className="w-[20%]">price</div>

					<div className="w-[20%]">rooms</div>

					<div className="w-[20%]">connected to</div>

					<div className="w-[20%] text-right">options</div>
				</div>
			</div>

			<div className="flex flex-col gap-2">
				{roomPackageItems.map((roomPackageItem, i) => (
					<div key={i}>
						<ExtendePackageItemsTable roomPackageItem={roomPackageItem} />
					</div>
				))}
			</div>
		</div>
	)
}

function MultiPackagesTable({
	roomMultiPackages,
	currency,
}: {
	roomMultiPackages: {
		id: string
		name: string
		price: number
		rooms: {
			id: string
			title: string
		}[]
		dateFrom: string
		dateTo: string
		packageItems: {
			name: string
		}[]
		visibility: boolean
	}[]
	currency: string
}) {
	return (
		<div className="rounded-xl border-2 border-highlight p-2 md:p-4">
			<h5 className="text-h5 capitalize">existing packages</h5>

			<div className="my-6 flex flex-col gap-2 border-b border-foreground py-4">
				<div className="flex w-full">
					<div className="w-[18%]">name</div>

					<div className="w-[10%]">price</div>

					<div className="w-[18%]">package items</div>

					<div className="w-[18%]">rooms</div>

					<div className="w-[18%]">date range</div>

					<div className="w-[18%] text-right">options</div>
				</div>
			</div>

			<div className="flex flex-col gap-2">
				{roomMultiPackages.map((roomMultiPackage, i) => (
					<div key={i}>
						<ExtendedMultiPackagesTable
							roomMultiPackage={roomMultiPackage}
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
	const roomMultiPackageId = form.get('roomMultiPackageId') as
		| string
		| undefined
	const roomPackageId = form.get('roomPackageItemId') as string | undefined

	const isRoomMultiPackageIdVisible = form.get('isVisible') === 'true'
	const isRoomPackageVisible = form.get('isVisible') === 'true'

	if (roomMultiPackageId) {
		await updateVisibility(roomMultiPackageId, isRoomMultiPackageIdVisible)
	}
	if (roomPackageId) {
		await updatePackageItemVisibility(roomPackageId, isRoomPackageVisible)
	}

	if ( !(roomMultiPackageId && roomPackageId) ) {
		return json({ status: 'error' })
	}

	return json({ status: 'success' })
}

async function updateVisibility(id: string, visibility: boolean) {
	return prisma.roomMultiPackage.update({
		where: { id },
		data: { visibility },
		select: { id: true },
	})
}

async function updatePackageItemVisibility(id: string, visibility: boolean) {
	return prisma.roomPackageItem.update({
		where: { id },
		data: { visibility },
		select: { id: true },
	})
}

function ExtendedMultiPackagesTable({
	roomMultiPackage,
	currency,
}: {
	roomMultiPackage: {
		id: string
		name: string
		price: number
		rooms: {
			id: string
			title: string
		}[]
		dateFrom: string
		dateTo: string
		packageItems: {
			name: string
		}[]
		visibility: boolean
	}
	currency: string
}) {
	const visibilityFetcher = useFetcher()
	const [isButtonVisible, setIsButtonVisible] = useState(true)
	const pendingVisible = visibilityFetcher.state !== 'idle'
	const isVisible = pendingVisible
		? visibilityFetcher.formData?.get('isVisible') === 'true'
		: roomMultiPackage?.visibility

	if (pendingVisible && isButtonVisible) {
		setIsButtonVisible(false)
		setTimeout(() => setIsButtonVisible(true), 2000)
	}

	return (
		<div className={cn('flex w-full items-center rounded-lg p-2')}>
			<div className="w-[18%]">{roomMultiPackage.name}</div>

			<div className="w-[10%]">
				{currency}
				{roomMultiPackage.price}
			</div>

			<div className="w-[18%]">
				{roomMultiPackage.packageItems.length ? (
					<ul className="list-disc pl-5">
						{roomMultiPackage.packageItems.map((packageitem, i) => (
							<li key={i}>{packageitem.name}</li>
						))}
					</ul>
				) : (
					'no package items selected'
				)}
			</div>

			<div className="w-[18%]">
				{roomMultiPackage.rooms.length ? (
					<ul className="list-disc pl-5">
						{roomMultiPackage.rooms.map((room, i) => (
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

			<div className="w-[18%]">
				<div>from: {format(new Date(roomMultiPackage.dateFrom), 'PPP')}</div>
				<div>to: {format(new Date(roomMultiPackage.dateTo), 'PPP')}</div>
			</div>

			<div className="flex items-center justify-end gap-2">
				<div
					className={cn(
						'rounded-sm px-2 py-1',
						roomMultiPackage?.visibility
							? 'bg-highlight text-background'
							: 'bg-destructive',
					)}
				>
					{roomMultiPackage?.visibility ? 'active' : 'disabled'}
				</div>

				<visibilityFetcher.Form method="POST">
					<input
						type="hidden"
						name="roomMultiPackageId"
						value={roomMultiPackage.id}
					/>
					<input
						type="hidden"
						name="isVisible"
						value={(!isVisible).toString()}
					/>
					<div className="min-w-[8em]">
						{!pendingVisible && isButtonVisible && (
							<Button variant="secondary" className="w-full" type="submit">
								{isVisible ? 'deactivate' : 'activate'}
							</Button>
						)}
					</div>
				</visibilityFetcher.Form>

				<Link to={`multipackage/${roomMultiPackage.id}/edit`}>
					<Button variant="primary">edit</Button>
				</Link>
			</div>
		</div>
	)
}

function ExtendePackageItemsTable({
	roomPackageItem,
}: {
	roomPackageItem: {
		id: string
		name: string
		visibility: boolean
		price: number
		rooms: {
			id: string
			title: string
		}[]
		roomMultiPackages: {
			name: string
		}[]
	}
}) {
	const visibilityFetcher = useFetcher()
	const [isButtonVisible, setIsButtonVisible] = useState(true)
	const pendingVisible = visibilityFetcher.state !== 'idle'
	const isVisible = pendingVisible
		? visibilityFetcher.formData?.get('isVisible') === 'true'
		: roomPackageItem?.visibility

	if (pendingVisible && isButtonVisible) {
		setIsButtonVisible(false)
		setTimeout(() => setIsButtonVisible(true), 2000)
	}

	return (
		<div
			className={cn(
				'flex w-full items-center',
				// roomPackageItem.status === 'deactivated' ? 'bg-destructive' : '',
			)}
		>
			<div className="w-[20%]">{roomPackageItem.name}</div>

			<div className="w-[20%]">{roomPackageItem.price}</div>

			<div className="w-[20%]">
				{roomPackageItem.rooms.length ? (
					<ul className="list-disc pl-5">
						{roomPackageItem.rooms.map((room, i) => (
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

			<div className="w-[20%]">
				{roomPackageItem.roomMultiPackages.length ? (
					<ul className="list-disc pl-5">
						{roomPackageItem.roomMultiPackages.map((roomMultiPackage, i) => (
							<li key={i}>{roomMultiPackage.name}</li>
						))}
					</ul>
				) : (
					'no connections'
				)}
			</div>

			<div className="flex items-center justify-end gap-2">
				<div
					className={cn(
						'rounded-sm px-2 py-1',
						roomPackageItem?.visibility
							? 'bg-highlight text-background'
							: 'bg-destructive',
					)}
				>
					{roomPackageItem?.visibility ? 'active' : 'disabled'}
				</div>

				<visibilityFetcher.Form method="POST">
					<input
						type="hidden"
						name="roomPackageItemId"
						value={roomPackageItem.id}
					/>
					<input
						type="hidden"
						name="isVisible"
						value={(!isVisible).toString()}
					/>
					<div className="min-w-[8em]">
						{!pendingVisible && isButtonVisible && (
							<Button variant="secondary" className="w-full" type="submit">
								{isVisible ? 'deactivate' : 'activate'}
							</Button>
						)}
					</div>
				</visibilityFetcher.Form>
				<Link to={`package/${roomPackageItem.id}/edit`}>
					<Button variant="primary">edit</Button>
				</Link>
			</div>
		</div>
	)
}
