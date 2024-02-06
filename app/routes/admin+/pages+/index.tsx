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
	const pages = await prisma.page.findMany({
		select: {
			id: true,
			title: true,
			url: true,
			visibility: true,
		},
	})
	if (!pages) {
		throw new Response('not found', { status: 404 })
	}
	return json({ pages })
}

export async function action({ request }: DataFunctionArgs) {
	const form = await request.formData()
	const pageId = form.get('pageId') as string

	if (pageId) {
		await duplicatePage(pageId)
	} else {
		return json({ status: 'error' })
	}

	return json({ status: 'success' })
}

async function duplicatePage(pageId: string) {
	const page = await prisma.page.findUnique({
		where: { id: pageId },
	})

	if (!page) {
		throw new Error('Page not found')
	}

	const randomString = 'duplicated-' + page.title + '-' + generateShortString(4)
	await prisma.page.create({
		data: {
			...page,
			id: undefined, //letting Prisma generate a new ID
			url: randomString,
			title: randomString,
			content: randomString,
			visibility: false,
		},
	})
}

export default function AdminPagesIndex() {
	const data = useLoaderData<typeof loader>()
	const doubleCheckDuplicate = useDoubleCheckInsideMap()

	return (
		<div className="py-2 md:py-6">
			<div className="mb-8 px-2 max-sm:text-center md:px-6">
				<h2 className="mb-2 text-h2 capitalize text-foreground">
					pages overview
				</h2>
				<p className="text-xl">Manage Your pages from here. 🤗</p>

				<div className="mt-8 flex gap-5 max-sm:justify-center">
					<Link to="/admin/pages/createnew">
						<Button variant="secondary">create new</Button>
					</Link>

					<Link to="/pages/" target="_blank">
						<Button variant="outline">live pages list</Button>
					</Link>
				</div>
			</div>

			<Spacer size="2xs" />
			<div className="flex flex-row flex-wrap">
				{data.pages.map(page => (
					<div
						key={page.id}
						className="w-full p-2 text-center sm:w-1/2 md:p-6 xl:w-1/3"
					>
						<div className="flex min-h-full flex-col justify-center rounded-lg border-2 border-foreground px-2 py-6">
							<div className="p-2 2xl:p-4">
								<div className="overflow-hidden truncate pb-4 text-highlight dark:text-highlight">
									{' '}
									/{page.url}{' '}
								</div>
								<div className="pb-4 capitalize">{page.title}</div>

								<div>
									status:
									{page.visibility ? (
										<span className="text-highlight dark:text-highlight">
											visible
										</span>
									) : (
										<span className="px-1 text-destructive dark:bg-foreground">
											hidden
										</span>
									)}
								</div>
							</div>

							<div className="flex justify-center gap-5">
								<Link to={page.id} className="text-center">
									<Button variant="secondary">Detail</Button>
								</Link>

								{page.visibility ? (
									<Link
										to={'/pages/' + page.url}
										className="text-center"
										target="_blank"
									>
										<Button variant="outline">See Live</Button>
									</Link>
								) : null}

								<Form method="POST">
									<input type="hidden" name="pageId" value={page.id} />

									<Button
										variant={
											doubleCheckDuplicate.doubleCheckStates[page.id]
												? 'highlight-secondary'
												: 'outline'
										}
										{...doubleCheckDuplicate.getButtonProps(page.id, {
											name: 'intent',
											value: 'submit',
										})}
									>
										{doubleCheckDuplicate.doubleCheckStates[page.id] ? (
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
