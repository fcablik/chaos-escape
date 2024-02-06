import { useNavigate } from '@remix-run/react'
import { modalBackdropLightClassList } from '#app/components/modal-backdrop.tsx'
import {
	RoomsGalleryEditor,
	action,
} from '#app/routes/resources+/__rooms-gallery-editor.tsx'

export { action }

export default function CreateNewGalleryFolder() {
	const navigate = useNavigate()
	const goBack = () => navigate(-1)

	return (
		<>
			<div onClick={goBack} className={modalBackdropLightClassList} />
			<div className="top-20 z-3001 w-full rounded-xl bg-white p-4 absolute left-1/2 -translate-x-1/2 dark:text-background">
				<RoomsGalleryEditor />
			</div>
		</>
	)
}
