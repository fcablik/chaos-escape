import { cn } from '#app/utils/misc.tsx'

const backdropClassList =
	'custom-fade-in d-block fixed left-0 top-0 w-full cursor-pointer overflow-hidden transition-all'

export const modalBackdropClassList = cn(
	backdropClassList,
	'backdrop-blur-sm',
	'h-[100vh] z-2000 bg-black/40 ',
)

export const modalBackdropLightClassList = cn(
	backdropClassList,
	'backdrop-blur-xs',
	'z-3001 h-[100vh] bg-black/10',
)

export const calendarBackdropClassList =
	'custom-fade-in d-block absolute rounded-xl left-0 top-0 z-99 h-full w-full overflow-hidden bg-black/70 cursor-pointer'

export const modalBackDropOnBackdropClassList = cn(
	backdropClassList,
	'backdrop-blur-sm',
	'bg-black/20 h-full z-3000',
)

export const modalBackDropOverMenuClassList = cn(
	backdropClassList,
	'backdrop-blur-sm',
	'bg-black/20 h-full z-4000',
)
