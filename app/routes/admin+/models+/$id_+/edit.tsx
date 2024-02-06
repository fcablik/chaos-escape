import { json, type DataFunctionArgs } from '@remix-run/node'
import { useLoaderData, useNavigate } from '@remix-run/react'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { invariantResponse } from '#app/utils/misc.tsx'
import { 
	CarModelEditor, 
	action } from '../../../resources+/__model-editor.tsx'

export { action }

export async function loader({ params }: DataFunctionArgs) {
	const carModel = await prisma.carModel.findFirst({
		where: {
			id: params.id,
		},
		select: {
			id: true,
			url: true,
			title: true,
			year: true,
			description: true,
			seo: true,
			visibility: true,
			carBrandId: true,
			carModelFacility: {
				select: {
					id: true,
					name: true,
					iconName: true,
				},
			},
		},
	})
	invariantResponse(carModel, 'Not found', { status: 404 })

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

	return json({ carModel: carModel, existingFacilities, availableBrands })
}

export default function CarModelEdit() {
	const data = useLoaderData<typeof loader>()
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
				<h3 className="mb-8 text-center text-h3 text-background">Editing: {data.carModel.title}</h3>
				<CarModelEditor
					carModel={data.carModel}
					facilities={data.existingFacilities}
					availableBrands={availableBrands}
				/>
			</div>
		</div>
	)
}
