import { useNavigate } from '@remix-run/react'
import { Button } from '#app/components/ui/button.tsx'
import { CarBrandEditor, action } from '../../resources+/__brand-editor.tsx'

export { action }

export default function CreateNewCarBrand() {
	const navigate = useNavigate()
	const goBack = () => navigate(-1)

	return (
		<div className="px-2 md:px-6 xl:mx-auto xl:max-w-[1200px] 2xl:max-w-[1300px]">
			<Button onClick={goBack} variant="secondary" className="text-xs">
				go back
			</Button>
			<hr className="my-8 border-secondary" />

			<div className="">
				<h3 className="mb-8 text-h3">Create New CarModel</h3>
				<CarBrandEditor />
			</div>
		</div>
	)
}
