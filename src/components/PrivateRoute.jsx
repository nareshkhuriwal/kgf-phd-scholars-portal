// src/components/PrivateRoute.jsx
import React from 'react'
import { useSelector, useDispatch } from 'react-redux'
import { Navigate } from 'react-router-dom'
import { hydrateFromStorage } from '../store/authSlice'   // ✅ correct import

export default function PrivateRoute({ children }) {
  const dispatch = useDispatch()
  const { token, hydrated } = useSelector(s => s.auth || {})

  // Ensure we hydrate once if not hydrated
  React.useEffect(() => {
    if (!hydrated) dispatch(hydrateFromStorage())
  }, [hydrated, dispatch])

  // Until hydration completes, you can block or show a tiny loader
  if (!hydrated) return null

  if (!token) return <Navigate to="/login" replace />
  return children
}
