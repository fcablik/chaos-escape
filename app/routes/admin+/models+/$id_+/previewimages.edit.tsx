import { json, type DataFunctionArgs } from '@remix-run/node'
import { useLoaderData, useNavigate } from '@remix-run/react'
import { Button } from '#app/components/ui/button.tsx'
import { prisma } from '#app/utils/db.server.ts'
import { PreviewImagesSelector, action } from '../../../resources+/__model-preview-images-selector.tsx'

export { action }

export async function loader({ params }: DataFunctionArgs) {
	const carModel = await prisma.carModel.findFirst({
		where: {
			id: params.id,
		},
		select: {
			id: true,
			carModelFacility: {
				select: {
					id: true,
					name: true,
					iconName: true,
				}
			},
            carModelPreviewImages: {
                select: {
                    id: true,
                }
            }
		},
	})
    if (!carModel) {
		throw new Response('not found', { status: 404 })
	}

    const galleries = await prisma.carModelsGallery.findMany({
		select: {
			id: true,
			name: true,
			images: {
                select: {
                    id: true,
                }
            },
		},
	})
	return json({ carModel: carModel, galleries })
}

export default function CarModelEdit() {
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
				<PreviewImagesSelector galleries={data.galleries} carModel={data.carModel} />
			</div>
		</div>
	)
}
