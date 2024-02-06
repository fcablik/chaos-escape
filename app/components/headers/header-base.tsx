import { Link, NavLink } from '@remix-run/react'
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '#app/components/ui/tooltip.tsx'
import { cn } from '#app/utils/misc.tsx'
import { useOptionalUser } from "#app/utils/user.ts"
import { baseContainerWidthClassList } from '../classlists.tsx'
import UserDropdown from "../dropdowns/dropdown-user.tsx"
import ThemeSwitcher from '../theme-switch.tsx'
import { Button } from '../ui/button.tsx'
import { Icon } from '../ui/icon.tsx'

export function HeaderBase({ routeAdmin }: { routeAdmin?: boolean }) {
	const user = useOptionalUser()
	const headerHeight = 'md:min-h-[60px]'

	return (
		<header className={cn('max-md:absolute', routeAdmin && 'max-lg:hidden')}>
			<div className="fixed z-9999 w-full max-md:bottom-2 md:top-0">
				<div
					className={cn(
						'bg-background max-md:mx-2 max-md:rounded-xl',
						headerHeight,
						'shadow-header-menu',
					)}
				>
					<nav
						className={cn(
							'space-between flex items-center justify-between max-md:py-3 max-md:px-4 py-2',
							baseContainerWidthClassList,
						)}
					>
						<Link to="/" className='max-md:hidden'>
							<div className="font-light">ChaosEscape</div>
						</Link>

						<div className="md:absolute md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2">
							<div className="flex justify-center gap-7 md:gap-5">
								<NavLink to="">
									{({ isActive }) => (
										<>
											<Button
												variant={isActive ? 'highlight' : 'secondary'}
												className="max-md:hidden"
											>
												home
											</Button>
											<Icon size="lg" className={cn(isActive && "text-purple-500", "md:hidden")} name="home" />
										</>
									)}
								</NavLink>

								<NavLink to="brands">
									{({ isActive }) => (
										<>
											<Button
												variant={isActive ? 'highlight' : 'secondary'}
												className="max-md:hidden"
											>
												brands
											</Button>

											<Icon size="lg" className={cn(isActive && "text-purple-500", "md:hidden")} name="file-text" />
										</>
									)}
								</NavLink>

								<NavLink to="pages">
									{({ isActive }) => (
										<>
											<Button
												variant={isActive ? 'highlight' : 'secondary'}
												className="max-md:hidden"
											>
												pages
											</Button>

											<Icon size="lg" className={cn(isActive && "text-purple-500", "md:hidden")} name="file-text" />
										</>
									)}
								</NavLink>

								<NavLink to="contact">
									{({ isActive }) => (
										<>
											<Button
												variant={isActive ? 'highlight' : 'secondary'}
												className="max-md:hidden"
											>
												contact
											</Button>

											<Icon size="lg" className={cn(isActive && "text-purple-500", "md:hidden")} name="envelope-closed" />
										</>
									)}
								</NavLink>
							</div>
						</div>

						<div className="flex items-center gap-3">
							<TooltipProvider>
								<Tooltip>
									<TooltipTrigger asChild>
										<a
											href="https://github.com/fcablik/chaos-escape"
											target="_blank"
											rel="noreferrer"
											className="mb-[.1rem] transition hover:text-highlight"
										>
											<Icon name="github-logo" size="lg" />
										</a>
									</TooltipTrigger>
									<TooltipContent>GitHub Repository</TooltipContent>
								</Tooltip>
							</TooltipProvider>

							<ThemeSwitcher />

							<div className='max-md:absolute max-md:bottom-16 max-md:right-2'>
								{user ? (
									<UserDropdown />
								) : (
									<Button asChild variant="default" size="sm">
										<Link to="/login">Log In</Link>
									</Button>
								)}
							</div>
						</div>
					</nav>
				</div>
			</div>

			<div className={headerHeight} />
		</header>
	)
}
