import { json, type DataFunctionArgs } from '@remix-run/node'
import { useLoaderData, useNavigate } from '@remix-run/react'
import { modalBackdropLightClassList } from '#app/components/modal-backdrop.tsx'
import {
	TranslationEditor,
	action,
} from '#app/routes/resources+/__translation-editor.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { invariantResponse } from '#app/utils/misc.tsx'

export { action }

export async function loader({ params }: DataFunctionArgs) {
	const translation = await prisma.translation.findFirst({
		where: {
			id: params.id,
		},
		select: {
			id: true,
			tid: true,
			cs: true,
			en: true,
		},
	})

	invariantResponse(translation, 'Not found', { status: 404 })
	return json({ translation })
}

export default function TranslationEdit() {
	const data = useLoaderData<typeof loader>()
	const navigate = useNavigate()
	const goBack = () => navigate(-1)

	return (
		<>
			<div onClick={goBack} className={modalBackdropLightClassList} />
			<div className="top-20 z-3001 w-full rounded-xl bg-white p-4 absolute left-1/2 -translate-x-1/2">
				<TranslationEditor translation={data.translation} />
			</div>
		</>
	)
}
