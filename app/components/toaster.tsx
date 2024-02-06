import { useEffect } from 'react'
import { Toaster, toast as showToast } from 'sonner'
import { type Toast } from '#app/utils/toast.server.ts'

export function ChaosEscapeToaster({ toast }: { toast?: Toast | null }) {
	return (
		<>
			<Toaster duration={3000} richColors closeButton position="top-right" />
			{toast ? <ShowToast toast={toast} /> : null}
		</>
	)
}

function ShowToast({ toast }: { toast: Toast }) {
	const { id, type, title, description } = toast
	useEffect(() => {
		setTimeout(() => {
			showToast[type](title, { id, description })
		}, 0)
	}, [description, id, title, type])
	return null
}
