'use client'

import { useEffect } from 'react'
import * as Sentry from '@sentry/nextjs'

interface Props {
  userId:    string
  userEmail: string | undefined
}

/**
 * Sets Sentry user context after the authenticated layout mounts.
 * Rendered only when `getUser()` resolves in the root layout.
 */
export function SentryUserContext({ userId, userEmail }: Props) {
  useEffect(() => {
    Sentry.setUser({ id: userId, email: userEmail })
    return () => {
      // Clear user context on unmount (logout / layout teardown)
      Sentry.setUser(null)
    }
  }, [userId, userEmail])

  return null
}
