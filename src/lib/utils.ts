import { type ClassValue, clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number, currency = 'SYP'): string {
  return `${amount.toLocaleString('ar-SY')} ${currency}`
}

export function formatDuration(startedAt: string): string {
  const start = new Date(startedAt)
  const now = new Date()
  const diffMs = now.getTime() - start.getTime()
  const hours = Math.floor(diffMs / 3600000)
  const minutes = Math.floor((diffMs % 3600000) / 60000)
  const secs = Math.floor((diffMs % 60000) / 1000)
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(secs).padStart(2, '0')}`
}

export function calcSessionAmount(
  startedAt: string,
  pricePerHour: number,
  rounding = 0
): number {
  const start = new Date(startedAt)
  const now = new Date()
  const hours = (now.getTime() - start.getTime()) / 3600000
  const raw = hours * pricePerHour
  if (rounding === 0) return Math.round(raw)
  return Math.ceil(raw / rounding) * rounding
}

export function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ar-SY', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })
}
