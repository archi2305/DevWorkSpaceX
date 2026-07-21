/**
 * Safely converts API response errors into clean human-readable text.
 * Prevents React Error #31 (rendering objects directly as React children).
 */
export function formatApiError(err: any, fallbackMessage: string = 'An error occurred. Please try again.'): string {
  if (!err) return fallbackMessage

  const detail = err.response?.data?.detail ?? err.detail ?? err.message

  if (typeof detail === 'string') {
    return detail
  }

  if (Array.isArray(detail)) {
    const formattedMessages = detail
      .map((item: any) => {
        if (typeof item === 'string') return item
        if (item && typeof item === 'object') {
          const field = Array.isArray(item.loc) && item.loc.length > 0 ? item.loc[item.loc.length - 1] : ''
          const msg = item.msg ? String(item.msg).replace(/^Value error,\s*/i, '') : 'Invalid field'
          return field && field !== 'body' ? `${field}: ${msg}` : msg
        }
        return String(item)
      })
      .filter(Boolean)
    
    if (formattedMessages.length > 0) {
      return formattedMessages.join(' • ')
    }
  }

  if (detail && typeof detail === 'object') {
    if (typeof detail.message === 'string') {
      return detail.message
    }
  }

  return fallbackMessage
}
