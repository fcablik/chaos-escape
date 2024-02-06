import { useNavigate } from '@remix-run/react'
import { Button } from '#app/components/ui/button.tsx'
import { DealerEditor, action } from '../../resources+/__dealer-editor.tsx'

export { action }

export default function DealerCreateNewRoute() {
	const navigate = useNavigate()
	const goBack = () => navigate(-1)

	return (
		<div className="px-2 md:px-6 xl:mx-auto xl:max-w-[1200px] 2xl:max-w-[1300px]">
			<Button onClick={goBack} variant="secondary" className="text-xs">
				go back
			</Button>
			<hr className="my-8 border-secondary" />

			<div className="container m-auto mb-36 mt-16 max-w-3xl">
				<h3 className="mb-8 text-center text-h3">Create New Dealer</h3>
				<DealerEditor />
			</div>
		</div>
	)
}
