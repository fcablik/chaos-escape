import { conform, useForm } from '@conform-to/react'
import { getFieldsetConstraint, parse } from '@conform-to/zod'
import { json, type DataFunctionArgs, type MetaFunction } from '@remix-run/node'
import { Form, useActionData, useFormAction, useNavigation } from '@remix-run/react'
import { safeRedirect } from 'remix-utils/safe-redirect'
import { z } from 'zod'
import { ContactFormEmail } from '#app/components/emails/contact-email.server.tsx'
import { GeneralErrorBoundary } from '#app/components/error-boundary.tsx'
import { ErrorList, Field, TextareaField } from '#app/components/forms.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { sendEmail } from '#app/utils/email.server.ts'
import { requireUserWithRole } from '#app/utils/permissions.ts'
import { redirectWithToast } from '#app/utils/toast.server.ts'
import { EmailSchema } from '#app/utils/user-validation.ts'


export async function loader({ request }: DataFunctionArgs) {
	await requireUserWithRole(request, 'admin') // Temporary DEVelopment Phase
	return null
}

const contactFormSchema = z.object({
	email: EmailSchema,
	name: z.string().min(1),
	message: z.string().min(1),
	redirectTo: z.string().optional(),
})

export async function action({ request }: DataFunctionArgs) {
	const formData = await request.formData()
	
    
    const submission = await parse(formData, {
		schema: contactFormSchema,
		// acceptMultipleErrors: () => true,
		async: true,
	})


	if (submission.intent !== 'submit') {
		return json({ status: 'idle', submission } as const)
	}
	if (!submission.value) {
		return json(
			{
				status: 'error',
				submission,
			} as const,
			{ status: 400 },
		)
	}
	const { email, name, message, redirectTo } = submission.value

	const response = await sendEmail({
		from: "Contact Form from Chaos Escape <noreply@wochdev.com>",
		to: 'filip.cablik@icloud.com', // mail of preference where the message should be delivered to (owner of web, admin, etc.)
		reply_to: email,
		subject: `Web Form message from ` + email,
		react: <ContactFormEmail email={email} name={name} message={message} />,
	})

	if (response.status === 'success') {
        return redirectWithToast(
            safeRedirect(redirectTo, '/'),
            { 
                title: 'Contact Form',
                description: 'Your message was sent! 👍.'
            },
        )
	} else {
		submission.error[''] = [response.error.message]
		return json(
			{
				status: 'error',
				submission,
			} as const,
			{ status: 500 },
		)
	}
}

export const meta: MetaFunction = () => {
	return [{ title: 'Contact Us | Chaos Escape' }]
}

export default function ContactForm() {
	const actionData = useActionData<typeof action>()
	const formAction = useFormAction()
	const navigation = useNavigation()
	const isSubmitting = navigation.formAction === formAction
	const [form, fields] = useForm({
		id: 'contact-form',
		constraint: getFieldsetConstraint(contactFormSchema),
		lastSubmission: actionData?.submission,
		onValidate({ formData }) {
			const result = parse(formData, { schema: contactFormSchema })
			return result
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<div className="container mx-auto flex flex-col justify-center pb-32 pt-20">
			<div className="text-center">
				<h1 className="text-h1">Contact Us!</h1>
				<p className="mt-3 text-body-md text-muted-foreground">
					Please enter your details & message.
				</p>
			</div>
			<Form
				method="POST"
				className="mx-auto mt-16 lg:min-w-[768px] min-w-full max-w-md"
				{...form.props}
			>
				<Field
					labelProps={{
						htmlFor: fields.email.id,
						children: 'Email',
					}}
					inputProps={{ ...conform.input(fields.email), autoFocus: true }}
					errors={fields.email.errors}
				/>
				<Field
					labelProps={{
						htmlFor: fields.name.id,
						children: 'Full Name',
					}}
					inputProps={{ ...conform.input(fields.name) }}
					errors={fields.name.errors}
				/>
				<TextareaField
					className="col-span-6"
					labelProps={{ children: 'message' }}
					textareaProps={{
						...conform.textarea(fields.message),
						autoComplete: 'message',
					}}
					errors={fields.message.errors}
				/>
				<ErrorList errors={form.errors} id={form.errorId} />
				<StatusButton
					className="w-full"
					status={isSubmitting ? 'pending' : actionData?.status ?? 'idle'}
					type="submit"
					disabled={isSubmitting}
				>
					Submit
				</StatusButton>
			</Form>
		</div>
	)
}

export function ErrorBoundary() {
	return <GeneralErrorBoundary />
}