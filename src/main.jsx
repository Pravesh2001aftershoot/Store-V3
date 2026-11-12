import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { BrowserRouter } from 'react-router-dom'
import '@fontsource-variable/geist'
import './index.css'
import App from './App'
import { StoreProvider } from './state/store'
import setupLocatorUI from '@locator/runtime'

if (process.env.NODE_ENV === 'development') {
  setupLocatorUI()
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <BrowserRouter>
      <StoreProvider>
        <App />
      </StoreProvider>
    </BrowserRouter>
  </StrictMode>
)
