import { useInputEvent } from '@conform-to/react'
import * as RadioGroupPrimitive from '@radix-ui/react-radio-group'
import React, { useId, useRef } from 'react'
import { cn } from '#app/utils/misc.tsx'
import { Checkbox, type CheckboxProps } from './ui/checkbox.tsx'
import { Input } from './ui/input.tsx'
import { Label } from './ui/label.tsx'
import { Textarea } from './ui/textarea.tsx'

export type ListOfErrors = Array<string | null | undefined> | null | undefined

export function ErrorList({
	id,
	errors,
}: {
	errors?: ListOfErrors
	id?: string
}) {
	const errorsToRender = errors?.filter(Boolean)
	if (!errorsToRender?.length) return null
	return (
		<ul id={id} className="flex flex-col gap-1">
			{errorsToRender.map(e => (
				<li key={e} className="text-[10px] text-foreground-destructive">
					{e}
				</li>
			))}
		</ul>
	)
}

export function Field({
	labelProps,
	inputProps,
	errors,
	className,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	inputProps: React.InputHTMLAttributes<HTMLInputElement>
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = inputProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	return (
		<div className={className}>
			<Label htmlFor={id} {...labelProps} />
			<Input
				id={id}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				{...inputProps}
			/>
			<div className="min-h-[16px] px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function TextareaField({
	labelProps,
	textareaProps,
	errors,
	className,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	textareaProps: React.TextareaHTMLAttributes<HTMLTextAreaElement>
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const id = textareaProps.id ?? textareaProps.name ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	return (
		<div className={className}>
			<Label htmlFor={id} {...labelProps} />
			<Textarea
				id={id}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				{...textareaProps}
			/>
			<div className="min-h-[32px] px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function CheckboxField({
	labelProps,
	buttonProps,
	errors,
	className,
}: {
	labelProps: JSX.IntrinsicElements['label']
	buttonProps: CheckboxProps
	errors?: ListOfErrors
	className?: string
}) {
	const fallbackId = useId()
	const buttonRef = useRef<HTMLButtonElement>(null)
	// To emulate native events that Conform listen to:
	// See https://conform.guide/integrations
	const control = useInputEvent({
		// Retrieve the checkbox element by name instead as Radix does not expose the internal checkbox element
		// See https://github.com/radix-ui/primitives/discussions/874
		ref: () =>
			buttonRef.current?.form?.elements.namedItem(buttonProps.name ?? ''),
		onFocus: () => buttonRef.current?.focus(),
	})
	const id = buttonProps.id ?? buttonProps.name ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	return (
		<div className={className}>
			<div className="flex gap-2">
				<Checkbox
					id={id}
					ref={buttonRef}
					aria-invalid={errorId ? true : undefined}
					aria-describedby={errorId}
					{...buttonProps}
					onCheckedChange={state => {
						control.change(Boolean(state.valueOf()))
						buttonProps.onCheckedChange?.(state)
					}}
					onFocus={event => {
						control.focus()
						buttonProps.onFocus?.(event)
					}}
					onBlur={event => {
						control.blur()
						buttonProps.onBlur?.(event)
					}}
					type="button"
				/>
				<label
					htmlFor={id}
					{...labelProps}
					className="self-center text-body-xs text-muted-foreground"
				/>
			</div>
			<div className="px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function SelectBox({
	labelProps,
	inputProps,
	errors,
	className,
	selectClassName,
	options,
	defaultOption,
	onChange,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	inputProps: React.InputHTMLAttributes<HTMLInputElement>
	errors?: ListOfErrors
	className?: string
	selectClassName?: string
	options: string[]
	defaultOption: string
	onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void // Define the type for onChange
}) {
	const fallbackId = useId()
	const id = inputProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	const name = inputProps.name

	return (
		<div className={className}>
			<Label htmlFor={id} {...labelProps} />

			<select
				name={name}
				defaultValue={defaultOption}
				id={id}
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				className={cn(
					'flex h-10 w-full rounded-md border border-input bg-background px-6 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 aria-[invalid]:border-input-invalid',
					selectClassName,
				)}
				onChange={onChange}
			>
				<option></option> {/* init. empty option */}
				{options.map((name, i) => (
					<option key={i} value={name}>
						{name}
					</option>
				))}
			</select>
			<div className="min-h-[16px] px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}

export function RadioSelect({
	labelProps,
	inputProps,
	errors,
	className,
	optionsInObject,
	defaultOption,
}: {
	labelProps: React.LabelHTMLAttributes<HTMLLabelElement>
	inputProps: React.InputHTMLAttributes<HTMLInputElement>
	errors?: ListOfErrors
	className?: string
	optionsInObject: object
	defaultOption: string
}) {
	const fallbackId = useId()
	const id = inputProps.id ?? fallbackId
	const errorId = errors?.length ? `${id}-error` : undefined
	const name = inputProps.name

	const [value, setValue] = React.useState(defaultOption)

	return (
		<div className={className}>
			<Label htmlFor={id} {...labelProps} />

			<Input
				id={id}
				type="hidden"
				aria-invalid={errorId ? true : undefined}
				aria-describedby={errorId}
				{...inputProps}
				defaultValue={value}
			/>

			<RadioGroupPrimitive.Root
				aria-label={name}
				defaultValue={defaultOption}
				onValueChange={setValue}
			>
				<div className="mt-3 space-y-3">
					{Object.values(optionsInObject).map(option => (
						<div key={option.id} className="flex items-center">
							<RadioGroupPrimitive.Item
								id={option.id}
								value={option.id}
								className={cn(
									'peer relative h-4 w-4 rounded-full',
									// Setting the background in dark properly requires a workaround (see css/tailwind.css)
									'border border-transparent text-background',
									'radix-state-checked:bg-highlight',
									'radix-state-unchecked:bg-gray-100',
									'focus:outline-none focus:ring-0 focus:ring-offset-0 focus-visible:ring focus-visible:ring-highlight focus-visible:ring-opacity-75 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-800',
								)}
							>
								<RadioGroupPrimitive.Indicator className="leading-0 absolute inset-0 flex items-center justify-center">
									<div className="h-1.5 w-1.5 rounded-full bg-white"></div>
								</RadioGroupPrimitive.Indicator>
							</RadioGroupPrimitive.Item>
							<label
								htmlFor={option.id}
								className="ml-2 text-sm font-medium text-gray-700 dark:text-gray-400"
							>
								<div className="inline-block">
									{Object.entries(option).map(([key, value], j) => (
										<div
											key={j}
											className={`w-[${Math.floor(
												100 / Object.values(option).length,
											)}%]`}
										>
											{key !== 'id' ? <>{value}</> : null}
										</div>
									))}
								</div>
							</label>
						</div>
					))}
				</div>
			</RadioGroupPrimitive.Root>

			<div className="min-h-[16px] px-4 pb-3 pt-1">
				{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
			</div>
		</div>
	)
}
