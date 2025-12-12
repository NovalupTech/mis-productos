'use client'

import { useToastStore } from '@/store/toast/toast-store'
import { IoCheckmarkCircle, IoCloseCircle, IoInformationCircle, IoWarning } from 'react-icons/io5'

export const Toast = () => {
  const { toasts, removeToast } = useToastStore()

  const getIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <IoCheckmarkCircle className="w-5 h-5 text-green-600" />
      case 'error':
        return <IoCloseCircle className="w-5 h-5 text-red-600" />
      case 'warning':
        return <IoWarning className="w-5 h-5 text-yellow-600" />
      default:
        return <IoInformationCircle className="w-5 h-5 text-blue-600" />
    }
  }

  const getBgColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-50 border-green-200'
      case 'error':
        return 'bg-red-50 border-red-200'
      case 'warning':
        return 'bg-yellow-50 border-yellow-200'
      default:
        return 'bg-blue-50 border-blue-200'
    }
  }

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-20 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`
            ${getBgColor(toast.type)}
            border rounded-lg shadow-lg p-4 min-w-[300px] max-w-[400px]
            flex items-start gap-3
            animate-slide-in-right
          `}
        >
          <div className="flex-shrink-0 mt-0.5">
            {getIcon(toast.type)}
          </div>
          <div className="flex-1">
            <p className="text-sm font-medium text-gray-900">{toast.message}</p>
          </div>
          <button
            onClick={() => removeToast(toast.id)}
            className="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
            aria-label="Cerrar notificación"
          >
            <IoCloseCircle className="w-5 h-5" />
          </button>
        </div>
      ))}
    </div>
  )
}
