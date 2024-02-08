// import { useForm } from '@conform-to/react'
import { parse } from '@conform-to/zod'
import { cssBundleHref } from '@remix-run/css-bundle'
import {
	json,
	type DataFunctionArgs,
	type HeadersFunction,
	type LinksFunction,
	type MetaFunction,
} from '@remix-run/node'
import {
	Links,
	LiveReload,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
	useMatches,
} from '@remix-run/react'
import { withSentry } from '@sentry/remix'
import { AuthenticityTokenProvider } from 'remix-utils/csrf/react'
import { HoneypotProvider } from 'remix-utils/honeypot/react'
import { z } from 'zod'
import { Confetti } from './components/confetti.tsx'
import { GeneralErrorBoundary } from './components/error-boundary.tsx'
import { FooterBase } from './components/footers/footer-base.tsx'
import { HeaderBase } from './components/headers/header-base.tsx'
import { ChaosEscapeProgress } from './components/progress-bar.tsx'
import { useTheme } from './components/theme-switch.tsx'
import { ChaosEscapeToaster } from './components/toaster.tsx'
import { href as iconsHref } from './components/ui/icon.tsx'
import customComponentsStylesheetUrl from './styles/customComponents.css'
import fontStyleSheetUrl from './styles/font.css'
import tailwindStyleSheetUrl from './styles/tailwind.css'
import { getUserId, logout } from './utils/auth.server.ts'
import { ClientHintCheck, getHints } from './utils/client-hints.tsx'
import { getConfetti } from './utils/confetti.server.ts'
import { csrf } from './utils/csrf.server.ts'
import { prisma } from './utils/db.server.ts'
import { getEnv } from './utils/env.server.ts'
import { honeypot } from './utils/honeypot.server.ts'
import { combineHeaders, getDomainUrl } from './utils/misc.tsx'
import { useNonce } from './utils/nonce-provider.ts'
import { type Theme, setTheme, getTheme } from './utils/theme.server.ts'
import { makeTimings, time } from './utils/timing.server.ts'
import { getToast } from './utils/toast.server.ts'

export const links: LinksFunction = () => {
	return [
		// Preload svg sprite as a resource to avoid render blocking
		{ rel: 'preload', href: iconsHref, as: 'image' },
		// Preload CSS as a resource to avoid render blocking
		{ rel: 'preload', href: fontStyleSheetUrl, as: 'style' },
		{ rel: 'preload', href: tailwindStyleSheetUrl, as: 'style' },
		{ rel: 'preload', href: customComponentsStylesheetUrl, as: 'style' },
		cssBundleHref ? { rel: 'preload', href: cssBundleHref, as: 'style' } : null,
		{ rel: 'mask-icon', href: '/favicons/mask-icon.svg' },
		{
			rel: 'alternate icon',
			type: 'image/png',
			href: '/favicons/favicon-32x32.png',
		},
		{ rel: 'apple-touch-icon', href: '/favicons/apple-touch-icon.png' },
		{
			rel: 'manifest',
			href: '/site.webmanifest',
			crossOrigin: 'use-credentials',
		} as const, // necessary to make typescript happy
		//These should match the css preloads above to avoid css as render blocking resource
		{ rel: 'icon', type: 'image/svg+xml', href: '/favicons/favicon.svg' },
		{ rel: 'stylesheet', href: fontStyleSheetUrl },
		{ rel: 'stylesheet', href: tailwindStyleSheetUrl },
		{ rel: 'stylesheet', href: customComponentsStylesheetUrl },
		cssBundleHref ? { rel: 'stylesheet', href: cssBundleHref } : null,
	].filter(Boolean)
}

export const meta: MetaFunction<typeof loader> = ({ data }) => {
	return [
		{ title: data ? 'Chaos Escape' : 'Error | Chaos Escape' },
		{ name: 'description', content: `Your own captain's log` },
	]
}

const SearchResultSchema = z.object({
	id: z.string(),
	url: z.string(),
	title: z.string().nullable(),
	type: z.enum(['CarBrand', 'CarModel', 'Dealer']),
	carBrandTitle: z.string().nullable(),
})

const SearchResultsSchema = z.array(SearchResultSchema)

export async function loader({ request }: DataFunctionArgs) {
	const timings = makeTimings('root loader')
	const userId = await time(() => getUserId(request), {
		timings,
		type: 'getUserId',
		desc: 'getUserId in root',
	})

	const user = userId
		? await time(
				() =>
					prisma.user.findUniqueOrThrow({
						select: {
							id: true,
							name: true,
							username: true,
							image: { select: { id: true } },
							roles: {
								select: {
									name: true,
									permissions: {
										select: { entity: true, action: true, access: true },
									},
								},
							},
						},
						where: { id: userId },
					}),
				{ timings, type: 'find user', desc: 'find user in root' },
		  )
		: null
	if (userId && !user) {
		console.info('something weird happened')
		// something weird happened... The user is authenticated but we can't find
		// them in the database. Maybe they were deleted? Let's log them out.
		await logout({ request, redirectTo: '/' })
	}
	const { toast, headers: toastHeaders } = await getToast(request)
	const { confettiId, headers: confettiHeaders } = getConfetti(request)
	const honeyProps = honeypot.getInputProps()
	const [csrfToken, csrfCookieHeader] = await csrf.commitToken()

	const searchTerm = new URL(request.url).searchParams.get('search')
	//return all dat //!+ empty seach
	if (!searchTerm) {
		return json(
			{
				user,
				requestInfo: {
					hints: getHints(request),
					origin: getDomainUrl(request),
					path: new URL(request.url).pathname,
					userPrefs: {
						theme: getTheme(request),
					},
				},
				ENV: getEnv(),
				toast,
				confettiId,
				honeyProps,
				csrfToken,

				//empty search
				status: 'idle',
				searchResults: null,
			},
			{
				headers: combineHeaders(
					{ 'Server-Timing': timings.toString() },
					toastHeaders,
					confettiHeaders,
					csrfCookieHeader ? { 'set-cookie': csrfCookieHeader } : null,
				),
			},
		)
	}

	const like = `%${searchTerm ?? ''}%`
	const likeParts = searchTerm.split(' ').map(part => `%${part}%`)

	// TODO: in future, extend search params to look for individual string parts - e.g. "500 speciale" and "speciale 500" should find the same item.. (TBD)
	const rawSearchResults = await prisma.$queryRaw`
		SELECT 
			m.id, 
			m.url, 
			m.title, 
			'CarModel' as type,
			b.title as carBrandTitle
		FROM CarModel m
		JOIN CarBrand b ON m.carBrandId = b.id
			WHERE (m.visibility = true)
			AND (
				m.title LIKE ${like}
				OR m.url LIKE ${like}
				OR m.carBrandId LIKE ${like}
				OR m.carBrandId LIKE ${likeParts[0]} AND m.title LIKE ${likeParts[1]}
				OR m.title LIKE ${likeParts[0]} AND m.carBrandId LIKE ${likeParts[1]}
			)
		UNION
		SELECT id, url, title, 'CarBrand' as type, NULL as carBrandTitle
		FROM CarBrand
			WHERE (visibility = true AND title LIKE ${like})
		UNION
		SELECT id, url, name as title, 'Dealer' as type, NULL as carBrandTitle
		FROM Dealer
			WHERE name LIKE ${like}
		LIMIT 20
	`

	const result = SearchResultsSchema.safeParse(rawSearchResults)
	//return all dat //!+ empty seach
	if (!result.success) {
		return json(
			{
				user,
				requestInfo: {
					hints: getHints(request),
					origin: getDomainUrl(request),
					path: new URL(request.url).pathname,
					userPrefs: {
						theme: getTheme(request),
					},
				},
				ENV: getEnv(),
				toast,
				confettiId,
				honeyProps,
				csrfToken,

				//empty search //TODOerror instead of idle?
				status: 'idle',
				searchResults: null,
			},
			{
				headers: combineHeaders(
					{ 'Server-Timing': timings.toString() },
					toastHeaders,
					confettiHeaders,
					csrfCookieHeader ? { 'set-cookie': csrfCookieHeader } : null,
				),
			},
		)
	}

	//return all dat //!+seach
	return json(
		{
			user,
			requestInfo: {
				hints: getHints(request),
				origin: getDomainUrl(request),
				path: new URL(request.url).pathname,
				userPrefs: {
					theme: getTheme(request),
				},
			},
			ENV: getEnv(),
			toast,
			confettiId,
			honeyProps,
			csrfToken,

			//search data
			status: 'idle',
			searchResults: result.data,
		},
		{
			headers: combineHeaders(
				{ 'Server-Timing': timings.toString() },
				toastHeaders,
				confettiHeaders,
				csrfCookieHeader ? { 'set-cookie': csrfCookieHeader } : null,
			),
		},
	)
}

export const headers: HeadersFunction = ({ loaderHeaders }) => {
	const headers = {
		'Server-Timing': loaderHeaders.get('Server-Timing') ?? '',
	}
	return headers
}

const ThemeFormSchema = z.object({
	theme: z.enum(['system', 'light', 'dark']),
})

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.formData()
	const submission = parse(formData, {
		schema: ThemeFormSchema,
	})
	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json({ status: 'error', submission } as const, { status: 400 })
	}
	const { theme } = submission.value

	const responseInit = {
		headers: { 'set-cookie': setTheme(theme) },
	}
	return json({ success: true, submission }, responseInit)
}

function Document({
	children,
	nonce,
	theme = 'light',
	env = {},
}: {
	children: React.ReactNode
	nonce: string
	theme?: Theme
	env?: Record<string, string>
}) {
	return (
		<html lang="en" className={`${theme} h-full overflow-x-hidden`}>
			<head>
				<ClientHintCheck nonce={nonce} />
				<Meta />
				<meta charSet="utf-8" />
				<meta
					name="viewport"
					content="width=device-width,initial-scale=1,maximum-scale=1"
				/>
				<Links />
			</head>
			<body className="max-2xl:text-body-base">
				{children}
				<script
					nonce={nonce}
					dangerouslySetInnerHTML={{
						__html: `window.ENV = ${JSON.stringify(env)}`,
					}}
				/>
				<ScrollRestoration nonce={nonce} />
				<Scripts nonce={nonce} />
				<LiveReload nonce={nonce} />
			</body>
		</html>
	)
}

function App() {
	const data = useLoaderData<typeof loader>()
	const nonce = useNonce()
	const theme = useTheme()

	const matches = useMatches()
	const { id } = matches[matches.length - 1]
	const routeAdmin = id.includes('admin')

	const status: 'error' | 'idle' | 'success' | 'pending' =
		data.status === 'error' ||
		data.status === 'success' ||
		data.status === 'pending'
			? data.status
			: 'idle'

	const searchData = {
		status: status,
		searchResults: data.searchResults,
	}

	return (
		<Document nonce={nonce} theme={theme} env={data.ENV}>
			<HeaderBase searchData={searchData} routeAdmin={routeAdmin} />

			<div className="main-custom-height bg-main-gradient-light dark:bg-main-gradient-dark">
				<Outlet />
			</div>

			{!routeAdmin && <FooterBase />}
			<Confetti id={data.confettiId} />
			<ChaosEscapeToaster toast={data.toast} />
			<ChaosEscapeProgress />
		</Document>
	)
}

function AppWithProviders() {
	const data = useLoaderData<typeof loader>()
	return (
		<AuthenticityTokenProvider token={data.csrfToken}>
			<HoneypotProvider {...data.honeyProps}>
				<App />
			</HoneypotProvider>
		</AuthenticityTokenProvider>
	)
}

export default withSentry(AppWithProviders)

export function ErrorBoundary() {
	// the nonce doesn't rely on the loader so we can access that
	const nonce = useNonce()

	// NOTE: you cannot use useLoaderData in an ErrorBoundary because the loader
	// likely failed to run so we have to do the best we can.
	// We could probably do better than this (it's possible the loader did run).
	// This would require a change in Remix.

	// Just make sure your root route never errors out and you'll always be able
	// to give the user a better UX.

	return (
		<Document nonce={nonce}>
			<GeneralErrorBoundary />
		</Document>
	)
}
