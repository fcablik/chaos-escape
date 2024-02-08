// import { useLocation } from '@remix-run/react'
// import { useLayoutEffect, useRef, useMemo } from 'react'

// export function CustomScrollRestoration() {
// 	const { pathname, search } = useLocation()
// 	const scrollPositions = useRef<{ [key: string]: number }>({})

// 	const paths = useMemo(() => ['/', '', '/?search='], [])

// 	// Only store scroll position for the specific routes
// 	useLayoutEffect(() => {
// 		if (paths.includes(pathname)) {
// 			scrollPositions.current[pathname + search] = window.scrollY
// 		}
// 	}, [pathname, search, paths])

// 	// Only restore scroll position for the specific routes
// 	useLayoutEffect(() => {
// 		if (paths.includes(pathname)) {
// 			const storedPosition = scrollPositions.current[pathname + search]
// 			window.scrollTo(0, storedPosition || 0)
// 		} else {
// 			window.scrollTo(0, 0) // Scroll to top in other routes than "paths"
// 		}
// 	}, [pathname, search, paths])

// 	return null
// }
