import { useEffect } from 'react'

export function SetBodyToOpenModalState() {
	useEffect(() => {
		const body = document.body
		body.classList.add('fixed', 'w-full', 'h-full')

		return () => {
			body.classList.remove('fixed', 'w-full', 'h-full')
		}
	}, [])
}

