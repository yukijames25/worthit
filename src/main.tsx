import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { SettingsProvider } from './context/SettingsContext'
import { AuthProvider } from './context/AuthContext'
import { CategoriesProvider } from './context/CategoriesContext'
import { HouseholdProvider } from './context/HouseholdContext'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <SettingsProvider>
      <AuthProvider>
        <HouseholdProvider>
          <CategoriesProvider>
            <App />
          </CategoriesProvider>
        </HouseholdProvider>
      </AuthProvider>
    </SettingsProvider>
  </StrictMode>,
)
