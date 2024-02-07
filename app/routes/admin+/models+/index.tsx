import { type DataFunctionArgs, json } from '@remix-run/node'
import { Form, Link, useLoaderData } from '@remix-run/react'
import { Spacer } from '#app/components/spacer.tsx'
import { Button } from '#app/components/ui/button.tsx'
import { Icon } from '#app/components/ui/icon.tsx'
import { prisma } from '#app/utils/db.server.ts'
import {
	generateShortString,
	useDoubleCheckInsideMap,
} from '#app/utils/misc.tsx'

export async function loader() {
	const carModels = await prisma.carModel.findMany({
		select: {
			id: true,
			title: true,
			url: true,
			visibility: true,
			carBrand: {
				select: {
					url: true,
				},
			},
		},
	})
	if (!carModels) {
		throw new Response('not found', { status: 404 })
	}
	return json({ carModels })
}

export async function action({ request }: DataFunctionArgs) {
	const form = await request.formData()
	const carModelId = form.get('carModelId') as string

	if (carModelId) {
		await duplicateCarModel(carModelId)
	} else {
		return json({ status: 'error' })
	}

	return json({ status: 'success' })
}

async function duplicateCarModel(carModelId: string) {
	const carModel = await prisma.carModel.findUnique({
		where: { id: carModelId },
	})

	if (!carModel) {
		throw new Error('CarModel not found')
	}

	const randomString =
		'duplicated-' + carModel.title + '-' + generateShortString(4)
	await prisma.carModel.create({
		data: {
			...carModel,
			id: undefined, //letting Prisma generate a new ID
			url: randomString,
			title: randomString,
			description: randomString,
			visibility: false,
		},
	})
}

export default function AdminCarModelsIndex() {
	const data = useLoaderData<typeof loader>()
	const doubleCheckDuplicate = useDoubleCheckInsideMap()

	return (
		<div className="py-2 md:py-6">
			<div className="mb-8 px-2 max-sm:text-center md:px-6">
				<h2 className="mb-2 text-h2 capitalize text-foreground">
					car models overview
				</h2>
				<p className="text-xl">Manage Your carModels from here. 🤗</p>

				<div className="mt-8 flex gap-5 max-sm:justify-center">
					<Link to="/admin/models/createnew">
						<Button variant="secondary">create new</Button>
					</Link>

					<Link to="facility">
						<Button variant="outline">facilities</Button>
					</Link>
				</div>
			</div>

			<Spacer size="2xs" />
			<div className="flex flex-row flex-wrap">
				{data.carModels.map(carModel => (
					<div
						key={carModel.id}
						className="w-full p-2 text-center sm:w-1/2 md:p-6 xl:w-1/3"
					>
						<div className="flex min-h-full flex-col justify-center rounded-lg border-2 border-foreground px-2 py-6">
							<div className="p-2 2xl:p-4">
								<div className="overflow-hidden truncate pb-4 text-highlight dark:text-highlight">
									{' '}
									/{carModel.url}{' '}
								</div>
								<div className="pb-4 capitalize">{carModel.title}</div>

								{carModel.visibility ? (
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
								<Link to={carModel.id} className="text-center">
									<Button variant="secondary">Detail</Button>
								</Link>

								{carModel.visibility ? (
									<Link
										to={'/models/' + carModel.url}
										className="text-center"
										target="_blank"
									>
										<Button variant="outline">See Live</Button>
									</Link>
								) : null}

								<Form method="POST">
									<input type="hidden" name="carModelId" value={carModel.id} />

									<Button
										variant={
											doubleCheckDuplicate.doubleCheckStates[carModel.id]
												? 'highlight-secondary'
												: 'outline'
										}
										{...doubleCheckDuplicate.getButtonProps(carModel.id, {
											name: 'intent',
											value: 'submit',
										})}
									>
										{doubleCheckDuplicate.doubleCheckStates[carModel.id] ? (
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
