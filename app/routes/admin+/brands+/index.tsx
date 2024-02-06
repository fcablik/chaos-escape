import { type DataFunctionArgs, json } from '@remix-run/node'
import { Form, Link, useLoaderData } from '@remix-run/react'
import { Spacer } from '#app/components/spacer.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { generateShortString, useDoubleCheckInsideMap } from '#app/utils/misc.tsx'

export async function loader() {
	const carBrands = await prisma.carBrand.findMany({
		select: {
			id: true,
			title: true,
			url: true,
			visibility: true,
		},
	})
	if (!carBrands) {
		throw new Response('not found', { status: 404 })
	}
	return json({ carBrands })
}

export async function action({ request }: DataFunctionArgs) {
	const form = await request.formData()
	const carBrandId = form.get('carBrandId') as string

	if (carBrandId) {
		await duplicateCarBrand(carBrandId)
	} else {
		return json({ status: 'error' })	
	}

	return json({ status: 'success' })
}

async function duplicateCarBrand(carBrandId: string) {
	const carBrand = await prisma.carBrand.findUnique({
		where: { id: carBrandId },
	})

	if (!carBrand) {
		throw new Error('CarBrand not found')
	}

	const randomString = 'duplicated-' + carBrand.title + '-' + generateShortString(4)
	await prisma.carBrand.create({
		data: {
			...carBrand,
			id: undefined, //letting Prisma generate a new ID
			url: randomString,
			title: randomString,
			description: randomString,
			visibility: false,
		},
	})
}

export default function AdminCarBrandsIndex() {
	const data = useLoaderData<typeof loader>()
	const doubleCheckDuplicate = useDoubleCheckInsideMap()

	return (
		<div className="py-2 md:py-6">
			<div className="mb-8 px-2 max-sm:text-center md:px-6">
				<h2 className="mb-2 text-h2 capitalize text-foreground">
					car brands overview
				</h2>
				<p className="text-xl">Manage Your carBrands from here. 🤗</p>

				<div className="mt-8 flex gap-5 max-sm:justify-center">
					<Link to="/admin/brands/createnew">
						<Button variant="secondary">create new</Button>
					</Link>

					<Link to="/brands" target="_blank">
						<Button variant="outline">live brands list</Button>
					</Link>

					<Link to="facility">
						<Button variant="outline">facilities</Button>
					</Link>
				</div>
			</div>

			<Spacer size="2xs" />
			<div className="flex flex-row flex-wrap">
				{data.carBrands.map(carBrand => (
					<div
						key={carBrand.id}
						className="w-full p-2 text-center sm:w-1/2 md:p-6 xl:w-1/3"
					>
						<div className="flex min-h-full flex-col justify-center rounded-lg border-2 border-foreground px-2 py-6">
							<div className="p-2 2xl:p-4">
								<div className="overflow-hidden truncate pb-4 text-highlight dark:text-highlight">
									{' '}
									/{carBrand.url}{' '}
								</div>
								<div className="pb-4 capitalize">{carBrand.title}</div>

								{carBrand.visibility ? (
									<div>
										status:{' '}
										<span className="text-highlight dark:text-highlight">
											visible
										</span>
									</div>
								) : (
									<div>
										status:{' '}
										<span className="px-1 text-destructive dark:bg-foreground">
											hidden
										</span>
									</div>
								)}
							</div>

							<div className="flex justify-center gap-5">
								<Link to={carBrand.id} className="text-center">
									<Button variant="secondary">Detail</Button>
								</Link>

								{carBrand.visibility ? (
									<Link
										to={'/brands/' + carBrand.url}
										className="text-center"
										target="_blank"
									>
										<Button variant="outline">See Live</Button>
									</Link>
								) : null}

								<Form method="POST">
									<input type="hidden" name="carBrandId" value={carBrand.id} />

									<Button
										variant={
											doubleCheckDuplicate.doubleCheckStates[carBrand.id]
												? 'highlight-secondary'
												: 'outline'
										}
										{...doubleCheckDuplicate.getButtonProps(carBrand.id, {
											name: 'intent',
											value: 'submit',
										})}
									>
										{doubleCheckDuplicate.doubleCheckStates[carBrand.id] ? (
											'Are you sure?'
										) : (
											<Icon name="file-text">duplicate</Icon>
										)}
									</Button>
								</Form>
							</div>
						</div>
					</div>
				))}
			</div>
		</div>
	)
}
