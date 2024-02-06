// import { json, type DataFunctionArgs } from '@remix-run/node'
// import { useFetcher, useLoaderData, useNavigate } from '@remix-run/react'
// import { destructiveModalWrapperClassList } from '#app/components/classlists.tsx'
// import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
// import { modalBackdropLightClassList } from '#app/components/modal-backdrop.tsx'
// import { Button } from '#app/components/ui/button.tsx'
// import { Icon } from '#app/components/ui/icon.tsx'
// import { StatusButton } from '#app/components/ui/status-button.tsx'
// import { prisma } from '#app/utils/db.server.ts'
// import { invariantResponse } from '#app/utils/misc.tsx'
// import { createToastHeaders } from '#app/utils/toast.server.ts'

// export async function loader({ params }: DataFunctionArgs) {
// 	const translation = await prisma.translation.findFirst({
// 		where: {
// 			id: params.id,
// 		},
// 		select: {
// 			id: true,
// 			name: true,
// 			cs: true,
// 			en: true,
// 		},
// 	})

// 	invariantResponse(translation, 'Not found', { status: 404 })
// 	return json({ translation })
// }

// export async function action({ request }: DataFunctionArgs) {
// 	const formData = await request.formData()
// 	invariantResponse(
// 		formData.get('intent') === 'delete-translation',
// 		'Invalid intent',
// 	)
// 	const translationId = formData.get('translationId')
// 	invariantResponse(typeof translationId === 'string', 'Invalid translationId')

// 	const deletedTranslation = await prisma.translation.delete({
// 		select: { name: true },
// 		where: {
// 			id: translationId,
// 		},
// 	})

// 	const toastHeaders = await createToastHeaders({
// 		title: 'Deleted!',
// 		description: `The translation "${deletedTranslation.name}" deleted. 🫡`,
// 	})
// 	return json({ status: 'success' } as const, { headers: toastHeaders })
// }

// export default function TranslationDeletion() {
// 	const data = useLoaderData<typeof loader>()
// 	const navigate = useNavigate()
// 	const goBack = () => navigate(-1)

// 	const deleteFetcher = useFetcher<typeof action>()

// 	return (
// 		<>
// 			<div onClick={goBack} className={modalBackdropLightClassList} />
// 			<div className={destructiveModalWrapperClassList}>
// 				<div className="flex flex-col text-center items-center">
// 					<p className="text-md">Deleting Translation</p>
// 					<div className="my-6 text-sm flex justify-center gap-3 bg-backgroundDashboard py-2 px-4 w-fit rounded-lg">
// 						<div>
// 							cs: {data.translation.cs} / en: {data.translation.en}
// 						</div>

// 						<p>{data.translation.name}</p>
// 					</div>

// 					<deleteFetcher.Form method="POST" className="flex justify-center">
// 						<input name="translationId" value={data.translation.id} type="hidden" />
// 						<StatusButton
// 							name="intent"
// 							value="delete-translation"
// 							variant="destructive"
// 							size="sm"
// 							status={
// 								deleteFetcher.state !== 'idle'
// 									? 'pending'
// 									: deleteFetcher.data?.status ?? 'idle'
// 							}
// 						>
// 							<Icon name="cross-1" />
// 						</StatusButton>
// 					</deleteFetcher.Form>
// 				</div>
// 			</div>
// 		</>
// 	)
// }

// export function ErrorBoundary() {
// 	const navigate = useNavigate()
// 	const goBack = () => navigate(-1)

// 	return (
// 		<GeneralErrorBoundary
// 			statusHandlers={{
// 				404: ({ params }) => (
// 					<>
// 						<div onClick={goBack} className={modalBackdropLightClassList} />
// 						<div className="absolute left-1/2 top-20 z-3001 w-full md:max-w-1/2 -translate-x-1/2 rounded-xl bg-white p-4">
// 							<div className="flex flex-col justify-center gap-5 py-4">
// 								<p className="text-center text-sm font-bold">
// 									translation<br/>with id: "{params.id}"<br/>DELETED
// 								</p>
// 								<Button variant="primary" onClick={goBack} className='capitalize'>
// 									ok
// 								</Button>
// 							</div>
// 						</div>
// 					</>
// 				),
// 			}}
// 		/>
// 	)
// }
