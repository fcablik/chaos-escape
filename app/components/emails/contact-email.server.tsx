import { Container, Html, Tailwind, Text } from '@react-email/components'
import tailwindConfig from '#app/../tailwind.config.ts'

export function ContactFormEmail({
	email,
	name,
	message,
}: {
	email: string,
	name: string,
	message: string,
}) {
	return (
		<Tailwind config={tailwindConfig}>
			<Html lang="en" dir="ltr">
				<Container>
					<p>
						<Text>
							New message from: <strong>{email}</strong>
						</Text>
					</p>
					<p>
						<Text>
							Name: <strong>{name}</strong>
						</Text>
					</p>
					<p>
						<Text>
							Message: {message}
						</Text>
					</p>
				</Container>
			</Html>
		</Tailwind>
	)
}