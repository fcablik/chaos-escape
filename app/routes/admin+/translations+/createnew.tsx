import { useNavigate } from '@remix-run/react'
import { modalBackdropLightClassList } from '#app/components/modal-backdrop.tsx'
import {
	TranslationEditor,
	action,
} from '#app/routes/resources+/__translation-editor.tsx'

export { action }

export default function CreateNewTranslation() {
	const navigate = useNavigate()
	const goBack = () => navigate(-1)

	return (
		<>
			<div onClick={goBack} className={modalBackdropLightClassList} />
			<div className="top-20 z-3001 w-full rounded-xl bg-white p-4 absolute left-1/2 -translate-x-1/2">
				<TranslationEditor />
			</div>
		</>
	)
}
