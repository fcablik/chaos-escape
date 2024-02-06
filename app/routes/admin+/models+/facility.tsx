import { json } from '@remix-run/node'
import { Link, Outlet, useLoaderData } from '@remix-run/react'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { action } from '#app/routes/resources+/__facility-editor.tsx'
import { prisma } from '#app/utils/db.server.ts'

export { action }

export async function loader() {
	const facilities = await prisma.carModelFacility.findMany({
		select: {
			id: true,
			name: true,
			iconName: true,
		},
	})
	if (!facilities) {
		throw new Response('not found', { status: 404 })
	}
	return json({ facilities })
}

export default function FacilitiesRoute() {
	const data = useLoaderData<typeof loader>()
	const reversedFacilities = data.facilities.slice().reverse()

	return (
		<div className="relative flex flex-col items-center justify-center gap-6 py-8">
			<Outlet />

			<div className="mb-12 w-full md:w-1/2">
				<h5 className="mb-4 text-h5 capitalize">create new facilities</h5>
				<Link to="createnew">
					<Button variant="highlight">createnew</Button>
				</Link>
			</div>

			{data.facilities.length ? (
				<div className="w-full md:w-1/2">
					<h5 className="mb-6 border-b border-foreground pb-4 text-h5 capitalize">
						existing facilities
					</h5>

					<div className="flex flex-col gap-2">
						{/* // !reversed mapping */}
						{reversedFacilities.map((facility, i) => (
							<div key={i} className="flex w-full">
								<div className="w-1/3">{facility.name}</div>

								<div className="w-1/3 text-center">
									{facility.iconName ? (
										<Icon name={facility.iconName} />
									) : (
										<>No Icon</>
									)}
								</div>

								<div className="w-1/3 text-right">
									<Link to={`${facility.id}/edit`}>
										<Button variant="primary">edit</Button>
									</Link>

									<Link to={facility.id + '/delete'}>
										<button className="text-destructive">
											<span aria-hidden>
												<Icon name="cross-1" />
											</span>{' '}
											<span className="sr-only">Remove image</span>
										</button>
									</Link>
								</div>
							</div>
						))}
					</div>
				</div>
			) : (
				<>
					<p className='text-lg'>no existing facilities, create your first</p>
				</>
			)}
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}
