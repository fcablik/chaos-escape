import { useState } from 'react'
import { cn, getCarModelsGalleryImgSrc } from '#app/utils/misc.tsx'
import { Icon } from './ui/icon.tsx'

export function GallerySlider({
	images,
	carModelSeo,
	carModelTitle,
}: {
	images: object
	carModelSeo?: string
	carModelTitle: string
}) {
	const slides = Object.values(images).map(image =>
		getCarModelsGalleryImgSrc(image.id),
	)
	const slidesAltTexts = Object.values(images).map(image => image.altText)

	const [currentIndex, setCurrentIndex] = useState(0)
	const goToPrevious = () => {
		const isFirstSlide = currentIndex === 0
		const newIndex = isFirstSlide ? slides.length - 1 : currentIndex - 1
		setCurrentIndex(newIndex)
	}
	const goToNext = () => {
		const isLastSlide = currentIndex === slides.length - 1
		const newIndex = isLastSlide ? 0 : currentIndex + 1
		setCurrentIndex(newIndex)
	}

	return (
		<div className="flex items-center justify-center">
			<div className="order-first" onClick={goToPrevious}>
				<Icon
					className="cursor-pointer hover:opacity-70"
					name="caret-left"
					size="4xl"
				/>
			</div>
			<div className="order-last" onClick={goToNext}>
				<Icon
					className="cursor-pointer hover:opacity-70"
					name="caret-right"
					size="4xl"
				/>
			</div>

			<div className="min-w-2/3">
				{slides.map((slide, index) => (
					<img
						key={index}
						className={cn(
							'pointer-events-none max-h-[300px] w-full object-contain',
							index === currentIndex ? '' : 'hidden',
						)}
						src={slide}
						alt={slidesAltTexts[index] ?? carModelSeo ?? carModelTitle}
					/>
				))}
			</div>
		</div>
	)
}

export function CarModelPreviewImagesSlider({
	images,
	carModelSeo,
	carModelTitle,
}: {
	images: object
	carModelSeo?: string
	carModelTitle: string
}) {
	const slides = Object.values(images).map(image =>
		getCarModelsGalleryImgSrc(image.id),
	)
	const slidesAltTexts = Object.values(images).map(image => image.altText)

	const [currentIndex, setCurrentIndex] = useState(0)
	const goToPrevious = () => {
		const isFirstSlide = currentIndex === 0
		const newIndex = isFirstSlide ? slides.length - 1 : currentIndex - 1
		setCurrentIndex(newIndex)
	}
	const goToNext = () => {
		const isLastSlide = currentIndex === slides.length - 1
		const newIndex = isLastSlide ? 0 : currentIndex + 1
		setCurrentIndex(newIndex)
	}

	return (
		<div className="relative flex h-[50vh] max-h-[550px] min-h-[350px] justify-center">
			<div className="absolute z-1000 left-5 top-5 order-first" onClick={goToPrevious}>
				<Icon
					className="cursor-pointer hover:opacity-70 text-background"
					name="caret-left"
					size="4xl"
				/>
			</div>
			<div className="absolute z-1000 right-5 top-5 order-last" onClick={goToNext}>
				<Icon
					className="cursor-pointer hover:opacity-70 text-background"
					name="caret-right"
					size="4xl"
				/>
			</div>

			<div className="z-100 w-full">
				{slides.map((slide, index) => (
					<img
						key={index}
						className={cn(
							'pointer-events-none h-full w-full rounded-2xl bg-cover bg-center object-cover',
							index === currentIndex ? '' : 'hidden',
						)}
						src={slide}
						alt={slidesAltTexts[index] ?? carModelSeo ?? carModelTitle}
					/>
				))}
			</div>
			<div className=" absolute inset-0 z-100 rounded-2xl bg-gradient-to-l from-transparent to-black opacity-60"></div>
		</div>
	)
}
