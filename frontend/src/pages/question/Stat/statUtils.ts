type ChoiceOption = {
  value: string
  text: string
}

type ChoiceProps = {
  options?: ChoiceOption[]
  list?: ChoiceOption[]
}

function getOptionText(value: unknown, options: ChoiceOption[]) {
  const normalizedValue = String(value ?? '')
  return options.find(option => option.value === normalizedValue)?.text || normalizedValue
}

export function formatAnswerValue(type: string, value: unknown, componentProps: ChoiceProps) {
  if (value == null || value === '') return '-'

  if (type === 'questionRadio') {
    return getOptionText(value, componentProps.options || [])
  }

  if (type === 'questionCheckbox') {
    const values = Array.isArray(value)
      ? value
      : String(value)
          .split(',')
          .map(item => item.trim())
          .filter(Boolean)
    return values.map(item => getOptionText(item, componentProps.list || [])).join('、') || '-'
  }

  if (Array.isArray(value)) return value.join('、')
  return String(value)
}

function isSameDay(first: Date, second: Date) {
  return (
    first.getFullYear() === second.getFullYear() &&
    first.getMonth() === second.getMonth() &&
    first.getDate() === second.getDate()
  )
}

function pad(value: number) {
  return String(value).padStart(2, '0')
}

export function formatDate(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  if (isSameDay(date, new Date())) return '今天'
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function formatDateTime(value?: string | null) {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(
    date.getHours()
  )}:${pad(date.getMinutes())}`
}
