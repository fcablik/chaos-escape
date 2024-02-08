import { Form, useSearchParams, useSubmit } from '@remix-run/react'
import { useId } from 'react'
import { useDebounce, useIsPending } from '#app/utils/misc.tsx'
import { Icon } from './ui/icon.tsx'
import { Input } from './ui/input.tsx'
import { Label } from './ui/label.tsx'
import { StatusButton } from './ui/status-button.tsx'

export function SearchBar({
	actionUrl,
	status,
	autoFocus = false,
	autoSubmit = false, //also hides the search status button if True
	carModelUrl,
	placeholder = 'search',
	classList,
	inputClassList,
}: {
	actionUrl: string //'' | 'search' | 'brands' | 'admin/users' | 'pages' | 'carmodels'
	status: 'idle' | 'pending' | 'success' | 'error'
	autoFocus?: boolean
	autoSubmit?: boolean
	carModelUrl?: string
	placeholder?: string
	classList?: string
	inputClassList?: string
}) {
	const id = useId()
	const additionalActionRoute = carModelUrl ? '/' + carModelUrl : ''
	const action = actionUrl + additionalActionRoute

	const [searchParams] = useSearchParams()
	const submit = useSubmit()
	const isSubmitting = useIsPending({
		formMethod: 'GET',
		formAction: action,
	})

	const handleFormChange = useDebounce((form: HTMLFormElement) => {
		submit(form)
	}, 400)

	return (
		<Form
			method="GET"
			action={'/' + action}
			className="flex flex-wrap items-center justify-center gap-2"
			onChange={e => autoSubmit && handleFormChange(e.currentTarget)}
		>
			<div className={classList}>
				<Label htmlFor={id} className="sr-only">
					Search
				</Label>
				<Input
					type="search"
					name="search"
					id={id}
					defaultValue={searchParams.get('search') ?? ''}
					placeholder={placeholder}
					className={inputClassList}
					autoFocus={autoFocus}
				/>
			</div>
			{!autoSubmit && (
				<div>
					<StatusButton
						type="submit"
						status={isSubmitting ? 'pending' : status}
						className="flex w-full items-center justify-center"
						size="sm"
					>
						<Icon name="magnifying-glass" size="sm" />
						<span className="sr-only">Search</span>
					</StatusButton>
				</div>
			)}
		</Form>
	)
}
