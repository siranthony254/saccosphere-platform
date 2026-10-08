import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { router } from './router'
import { useAuthBootstrap } from './hooks/useAuth'
import { AdminThemeProvider } from '@saccosphere/ui'
import { ErrorBoundary } from './components/error/ErrorBoundary'
import './index.css'

function registerServiceWorker() {
  // Temporarily disable service worker to debug 404 errors
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    // Commented out to debug routing issues
    // navigator.serviceWorker
    //   .register('/sw.js')
    //   .catch((error) => {
    //     console.warn('Service worker registration failed:', error)
    //   })
  })
}


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Never retry a 4xx (403/404/400 won't fix themselves); retry
      // 5xx / network once.
      retry: (failureCount, error) => {
        const status = (error as { status?: number })?.status
        if (status && status >= 400 && status < 500) return false
        return failureCount < 1
      },
      staleTime: 0,
      refetchOnWindowFocus: true,
    },
  },
})

function App() {
  useAuthBootstrap()
  registerServiceWorker()
  return <RouterProvider router={router} />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <AdminThemeProvider defaultThemeId="mint">
        <ErrorBoundary>
          <App />
          <Toaster position="top-right" toastOptions={{ duration: 4000 }} />
        </ErrorBoundary>
      </AdminThemeProvider>
    </QueryClientProvider>
  </React.StrictMode>
)

