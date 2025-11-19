import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export interface HealthStatusInfo {
  label: string;
  className: string;
}

export function getHealthStatusInfo(status: string): HealthStatusInfo {
  switch (status) {
    case 'healthy':
      return {
        label: '健全',
        className: 'bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300 dark:border-green-800'
      };
    case 'warning':
      return {
        label: '注意',
        className: 'bg-yellow-50 text-yellow-700 border-yellow-200 dark:bg-yellow-950 dark:text-yellow-300 dark:border-yellow-800'
      };
    case 'critical':
      return {
        label: '要対応',
        className: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800'
      };
    default:
      return {
        label: '不明',
        className: ''
      };
  }
}
