import { type UseFormRegister } from 'react-hook-form'
import 'twin.macro'

export type AllowedFormData = any

interface Props extends React.InputHTMLAttributes<HTMLInputElement> {
  register: UseFormRegister<AllowedFormData>
  label: string
  name: string
  inputClass?: string
  hasError?: string
}

export const TextInput: React.FC<Props> = ({
  label,
  hasError,
  register,
  name,
  inputClass,
  ...props
}) => {
  return (
    <div tw="w-full">
      {!!label && (
        <label tw="mb-4">
          <span tw="">{label}</span>
        </label>
      )}
      <input
        tw="w-full rounded-md border border-blue-400 bg-gray-700 py-1 px-2 outline-none"
        {...register(name)}
        {...props}
      />
      <TextInputError message={hasError} />
    </div>
  )
}

const TextInputError = ({ message }: { message?: string }) => {
  if (!message) {
    return null
  }

  return (
    <label tw="text-lg">
      <span tw="text-red-700">{message}</span>
    </label>
  )
}

interface TextAreaProps extends React.InputHTMLAttributes<HTMLTextAreaElement> {
  register: UseFormRegister<AllowedFormData>
  label: string
  name: string
  inputClass?: string
  hasError?: string
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  inputClass,
  hasError,
  register,
  name,
  ...props
}) => {
  return (
    <div tw="w-full">
      <label tw="mb-4">
        <span tw="">{label}</span>
      </label>
      <textarea
        tw="h-24 w-full rounded-md border border-blue-400 bg-gray-700 py-2 px-2 outline-none"
        {...register(name)}
        {...props}
      ></textarea>
      <TextInputError message={hasError} />
    </div>
  )
}
