import {
	type ErrorResponse,
	Link,
	isRouteErrorResponse,
	useParams,
	useRouteError,
} from '@remix-run/react'
import { captureRemixErrorBoundaryError } from '@sentry/remix'
import { getErrorMessage } from '#app/utils/misc.tsx'
import { Button } from './ui/button.tsx'
import { Icon } from './ui/icon.tsx'

type StatusHandler = (info: {
	error: ErrorResponse
	params: Record<string, string | undefined>
}) => JSX.Element | null

export function GeneralErrorBoundary({
	defaultStatusHandler = ({ error }) => (
		// <p>{error.status} {error.data}</p>
		<>
		<div className='flex flex-col justify-center mx-auto text-center h-[80vh]'>
			<p className='text-h5'>
				Woch is sorry 🙁
			</p>

			<p className='text-h5 font-normal mt-4'>
				You either don't have permission to access this page or it doesn't exist.
				{/* {error.status} {error.data} */}
			</p>

			<p className='mt-8'>
				<Button asChild variant="secondary">
					<Link to="/" className='inline-flex items-center justify-center rounded-md text-sm font-medium transition-colorsh-10 px-4 py-2 gap-2'>
						<Icon name="arrow-left">Back Home</Icon>
					</Link>
				</Button>
			</p>
		</div>
	</>
	),
	statusHandlers,
	unexpectedErrorHandler = error => <p>{getErrorMessage(error)}</p>,
}: {
	defaultStatusHandler?: StatusHandler
	statusHandlers?: Record<number, StatusHandler>
	unexpectedErrorHandler?: (error: unknown) => JSX.Element | null
}) {
	const error = useRouteError()
	captureRemixErrorBoundaryError(error)
	const params = useParams()

	if (typeof document !== 'undefined') {
		console.error(error)
	}

	return (
		<>
			{isRouteErrorResponse(error)
				? (statusHandlers?.[error.status] ?? defaultStatusHandler)({
						error,
						params,
				  })
				: unexpectedErrorHandler(error)}
		</>
	)
}
