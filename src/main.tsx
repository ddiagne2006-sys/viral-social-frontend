import '@fontsource/roboto/400.css'
import '@fontsource/roboto/500.css'
import '@fontsource/roboto/700.css'
import '@fortawesome/fontawesome-svg-core/styles.css'
import './styles/index.css'

import { config as faConfig } from '@fortawesome/fontawesome-svg-core'
import { QueryClientProvider } from '@tanstack/react-query'
import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createBrowserRouter, RouterProvider } from 'react-router-dom'

import { createQueryClient } from './api/queryClient'
import { ToastProvider } from './components/toast/ToastProvider'
import { routes } from './routes'

// Les styles Font Awesome sont importés ci-dessus par le build : pas d'injection à l'exécution
faConfig.autoAddCss = false

const queryClient = createQueryClient()
const router = createBrowserRouter(routes)

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <RouterProvider router={router} />
      </ToastProvider>
    </QueryClientProvider>
  </StrictMode>,
)
