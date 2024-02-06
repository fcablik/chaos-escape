import { json } from '@remix-run/node'
import { Link, useLoaderData } from '@remix-run/react'
import { Spacer } from '#app/components/spacer.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'

export async function loader() {
	const dealers = await prisma.dealer.findMany({
		select: {
			id: true,
			name: true,
			url: true,
		},
	})
	if (!dealers) {
		throw new Response('not found', { status: 404 })
	}
	return json({ dealers })
}

export default function AdminDealersIndex() {
	const data = useLoaderData<typeof loader>()

	return (
		<div className="py-2 md:py-6">
			<div className="mb-8 px-2 max-sm:text-center md:px-6">
				<h2 className="mb-2 text-h2 capitalize text-foreground">
					dealers overview
				</h2>
				<p className="text-xl">Manage Your dealers from here. 🤗</p>

				<div className="mt-8 flex gap-5 max-sm:justify-center">
					<Link to="/admin/dealers/createnew">
						<Button variant="secondary">create new</Button>
					</Link>

					<Link to="/dealers/" target="_blank">
						<Button variant="outline">live dealers list</Button>
					</Link>
				</div>
			</div>

			<Spacer size="2xs" />
			<div className="flex flex-row flex-wrap">
				{data.dealers.map(dealer => (
					<div
						key={dealer.id}
						className="w-full p-2 text-center sm:w-1/2 md:p-6 xl:w-1/3"
					>
						<div className="flex min-h-full flex-col justify-center rounded-lg border-2 border-foreground px-2 py-6">
							<div className="p-2 2xl:p-4">
								<div className="overflow-hidden truncate pb-4 text-highlight dark:text-highlight">
									{' '}
									/{dealer.url}{' '}
								</div>
								<div className="pb-4 capitalize">{dealer.name}</div>
							</div>

							<div className="flex justify-center gap-5">
								<Link to={dealer.id} className="text-center">
									<Button variant="secondary">Detail</Button>
								</Link>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
