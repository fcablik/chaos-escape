import { Container, Html, Tailwind, Text } from '@react-email/components'
import tailwindConfig from '#app/../tailwind.config.ts'

export function ReservationFormEmail({
	email,
	name,
	message,
	reservationDateFrom,
	reservationDateTo,
}: {
	email: string,
	name: string,
	message?: string | undefined,
	reservationDateFrom: string,
	reservationDateTo: string,
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
					{message ? 
						<p>
							<Text>
								Message: {message}
							</Text>
						</p>
					: null }
					<p>
						<Text>
							Your Reservation Dates: {reservationDateFrom} - {reservationDateTo}
						</Text>
					</p>
				</Container>
			</Html>
		</Tailwind>
	)
}