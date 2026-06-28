 import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { useAuthBootstrap } from './hooks/useAuth'
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
  defaultOptions: { queries: { retry: 1, staleTime: 0, refetchOnWindowFocus: true } } 
})

function App() {
  useAuthBootstrap()
  registerServiceWorker()
  return <RouterProvider router={router} />
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
)

