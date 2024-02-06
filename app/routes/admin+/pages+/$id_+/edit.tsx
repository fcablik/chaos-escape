import { json, type DataFunctionArgs } from '@remix-run/node'
import { useLoaderData, useNavigate } from '@remix-run/react'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { invariantResponse } from '#app/utils/misc.tsx'
import { PageEditor, action } from '../../../resources+/__page-editor.tsx'

export { action }

export async function loader({ params }: DataFunctionArgs) {
	const page = await prisma.page.findFirst({
		where: {
			id: params.id,
		},
		select: {
			id: true,
			url: true,
			title: true,
			content: true,
			seo: true,
			visibility: true,
			images: {
				select: {
					id: true,
					altText: true,
				},
			},
		},
	})
	invariantResponse(page, 'Not found', { status: 404 })
	return json({ page: page })
}

export default function PageEdit() {
	const data = useLoaderData<typeof loader>()
	const navigate = useNavigate()
	const goBack = () => navigate(-1)

	return (
		<div className="px-2 md:px-6 xl:mx-auto xl:max-w-[1200px] 2xl:max-w-[1300px]">
			<Button onClick={goBack} variant="secondary" className="text-xs">
				go back
			</Button>
			<hr className="my-8 border-secondary" />

			<div className="">
				<h3 className="mb-8 text-center text-h3 text-background">Editing: {data.page.title}</h3>
				<PageEditor page={data.page} />
			</div>
		</div>
	)
}
