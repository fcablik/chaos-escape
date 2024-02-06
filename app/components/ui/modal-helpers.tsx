import { Icon } from '#app/components/ui/icon.tsx'
import { cn } from '#app/utils/misc.tsx'
import { modalBackdropClassList } from '../modal-backdrop.tsx'
import { Button } from './button.tsx'

export function MobileModalCaretOpener({
	isMobExtraMenuToggled,
	triggerTitle,
	handleToggle,
	classList,
}: {
	isMobExtraMenuToggled: boolean
	triggerTitle?: string
	handleToggle: () => void
	classList?: string
}) {
	return (
		<>
			{!isMobExtraMenuToggled ? (
				!triggerTitle ? (
					<Icon
						name="plus"
						className={cn(
							classList,
							'fixed bottom-[4.5rem] right-3 z-1999 h-8 w-8 cursor-pointer gap-3 rounded-lg bg-foreground p-[.15rem] text-background transition-colors hover:bg-highlight hover:text-foreground',
						)}
						onClick={handleToggle}
					/>
				) : (
					<>
						<Button
							onClick={handleToggle}
							size="xs"
							variant="highlight-static"
							className={cn(
								classList,
								'fixed bottom-[4.5rem] right-3 z-1999 cursor-pointer capitalize',
							)}
						>
							{triggerTitle}
						</Button>
					</>
				)
			) : (
				<div onClick={handleToggle} className={modalBackdropClassList} />
			)}
		</>
	)
}

export function ModalCloserIcon({
	handleToggle,
	iconName = 'cross-1',
}: {
	handleToggle: () => void
	iconName?: string
}) {
	return (
		<Icon
			name={iconName}
			size="md"
			className="absolute right-6 top-6 z-4001 cursor-pointer text-foreground transition-opacity hover:opacity-70"
			onClick={handleToggle}
		/>
	)
}
