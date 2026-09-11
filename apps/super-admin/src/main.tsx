import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useAuthBootstrap } from './hooks/useAuth'
import { AdminThemeProvider } from '@saccosphere/ui'
import './index.css'

function registerServiceWorker() {
  if (typeof window === 'undefined') return
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch(() => undefined)
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
  <QueryClientProvider client={queryClient}>
    <AdminThemeProvider defaultThemeId="indigo">
      <App />
    </AdminThemeProvider>
  </QueryClientProvider>
)

