import { useLoaderData, useNavigate } from '@remix-run/react'
import { json } from '@remix-run/router'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { CarModelEditor, action } from '../../resources+/__model-editor.tsx'

export async function loader() {
	const existingFacilities = await prisma.carModelFacility.findMany({
		select: {
			id: true,
			name: true,
			iconName: true,
		},
	})

	const availableBrands = await prisma.carBrand.findMany({
		select: {
			id: true,
		},
	})

	return json({ existingFacilities, availableBrands })
}

export { action }

export default function CreateNewCarModel() {
	const data = useLoaderData<{
		existingFacilities: {
			id: string
			name: string
			iconName: string
		}[]
		availableBrands: {
			id: string
		}[]
	}>()
	const navigate = useNavigate()
	const goBack = () => navigate(-1)

	const availableBrands = data.availableBrands.map(brand=>brand.id)

	return (
		<div className="px-2 md:px-6 xl:mx-auto xl:max-w-[1200px] 2xl:max-w-[1300px]">
			<Button onClick={goBack} variant="secondary" className="text-xs">
				go back
			</Button>
			<hr className="my-8 border-secondary" />

			<div className="">
				<h3 className="mb-8 text-h3">Create New CarModel</h3>
				<CarModelEditor
					facilities={data.existingFacilities}
					availableBrands={availableBrands}
				/>
			</div>
		</div>
	)
}
