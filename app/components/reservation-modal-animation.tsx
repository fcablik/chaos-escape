import { useNavigate } from '@remix-run/react'

// !this is still problematic on Safari/iOS devices when in lowe-batter-mode, otherwise works fine everywhere
export function useRedirectWithScrollToTop() {
	const navigate = useNavigate()

	function scrollToTop(duration = 500) {
		return new Promise<void>(resolve => {
			const start = window.scrollY
			const end = 0
			const startTime = performance.now()

			function scroll() {
				if (window.scrollY !== 0) {
					const currentTime = performance.now()
					const timeElapsed = currentTime - startTime
					const scrollPosition = easeInOutQuad(
						timeElapsed,
						start,
						end - start,
						duration,
					)
					window.scrollTo(0, scrollPosition)

					if (timeElapsed < duration) {
						requestAnimationFrame(scroll)
					} else {
						resolve()
					}
				} else {
					resolve()
				}
			}

			requestAnimationFrame(scroll)
		})
	}

	function easeInOutQuad(
		timeElapsed: number,
		start: number,
		endMinusStart: number,
		duration: number,
	) {
		timeElapsed /= duration / 2
		if (timeElapsed < 1) return (endMinusStart / 2) * timeElapsed * timeElapsed + start
		timeElapsed--
		return (-endMinusStart / 2) * (timeElapsed * (timeElapsed - 2) - 1) + start
	}

	const navigateAndScroll = async (
		navigateTo: string, // target path of redirect (string | back(-1))
	) => {
		await scrollToTop()

		if (navigateTo !== 'back') {
			navigate(navigateTo)
		} else {
			navigate(-1)
		}
	}

	return navigateAndScroll
}

export function useRedirectWithoutScrollToTop() {
	const navigate = useNavigate()
	const navigateAndScroll = (
		navigateTo: string, // target path of redirect (string | back(-1))
	) => {
		if (navigateTo !== 'back') {
			navigate(navigateTo)
		} else {
			navigate(-1)
		}
	}

	return navigateAndScroll
}
