import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import * as React from 'react'

import { cn } from '#app/utils/misc.tsx'

const buttonVariants = cva(
	'inline-flex items-center justify-center rounded-md text-sm font-medium bg-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:bg-background disabled:pointer-events-none disabled:opacity-50 transition duration-250',
	{
		variants: {
			variant: {
				default: 'bg-background text-foreground hover:bg-background/80',
				destructive:
					'bg-destructive text-destructive-foreground hover:bg-destructive/80',
				deactivating:
					'bg-destructive/80 text-destructive-foreground hover:bg-destructive',
				outline:
					'border border-input hover:bg-backgroundDashboard hover:text-highlight',
				'outline-contrast':
					'bg-transparent text-background border border-input hover:bg-backgroundDashboard hover:text-highlight',
				primary: 'rounded-lg bg-backgroundDashboard border-2 hover:border-highlight',
				secondary:
					'bg-secondary text-secondary-foreground hover:bg-highlight hover:text-highlight-foreground',
				ghost: 'hover:bg-accent hover:text-accent-foreground',
				link: 'text-primary underline-offset-4 hover:underline',
				
				// highlight w/o Hover
				highlight: 'rounded-lg shadow-highlight bg-highlight text-highlight-foreground',
				'highlight-static':
					'shadow-highlight bg-highlight text-highlight-foreground cursor-auto',
				'highlight-contrast': 'shadow-highlight bg-background text-highlight-foreground',
				// highlight w/ Hover
				'highlight-secondary': 'font-500 rounded-lg shadow-highlight bg-highlight text-highlight-foreground hover:text-highlight hover:bg-highlight/20 border-2 border-highlight',
				
				disabled: 'border border-input bg-background cursor-auto opacity-60',
				activedashboardSidebar: 'rounded-lg shadow-lg shadow-highlight bg-highlight text-highlight-foreground',
				dashboardSidebar: 'rounded-lg bg-transparent ',
			},
			size: {
				default: 'h-10 px-4 py-2',
				wide: 'px-24 py-5',
				sm: 'h-9 rounded-md px-3',
				lg: 'h-11 rounded-md px-8',
				xl: 'h-12 rounded-md px-6 py-2',
				pill: 'px-12 py-3 leading-3',
				icon: 'h-10 w-10',
				dashboardSidebar: 'pl-3 pr-6 py-3 text-lg',
			},
		},
		defaultVariants: {
			variant: 'default',
			size: 'default',
		},
	},
)

export interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : 'button'
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		)
	},
)
Button.displayName = 'Button'

export { Button, buttonVariants }
