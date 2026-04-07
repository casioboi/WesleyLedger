import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './context/AuthProvider'
import { ChurchProfileProvider } from './context/ChurchProfileProvider'
import { ToastProvider } from './context/ToastContext'
import { GriEligibilityProvider } from './gri/GriEligibilityProvider'
import { LedgerProvider } from './ledger/LedgerProvider'
import { ThemeProvider } from './theme/ThemeProvider'
import { AppShell } from './layout/AppShell'
import { ChurchProfileSetupPage } from './pages/ChurchProfileSetupPage'
import { DashboardPage } from './pages/DashboardPage'
import { LedgerPage } from './pages/LedgerPage'
import { ReportsPage } from './pages/ReportsPage'
import { SettingsPage } from './pages/SettingsPage'
import { SplashScreen } from './pages/SplashScreen'
import { AuthPage } from './pages/AuthPage'
import { RequireAuth } from './routes/RequireAuth'
import { RequireProfile } from './routes/RequireProfile'
import { LedgerCloudSync } from './sync/LedgerCloudSync'

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <ToastProvider>
        <ChurchProfileProvider>
        <GriEligibilityProvider>
        <LedgerProvider>
        <AuthProvider>
        <LedgerCloudSync />
        <Routes>
          <Route path="/" element={<SplashScreen />} />
          <Route path="/auth" element={<AuthPage />} />
          <Route path="/setup" element={<ChurchProfileSetupPage />} />
          <Route element={<RequireAuth />}>
            <Route element={<RequireProfile />}>
              <Route path="/app" element={<AppShell />}>
                <Route index element={<DashboardPage />} />
                <Route path="ledger" element={<LedgerPage />} />
                <Route path="reports" element={<ReportsPage />} />
                <Route path="settings" element={<SettingsPage />} />
              </Route>
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </AuthProvider>
        </LedgerProvider>
        </GriEligibilityProvider>
        </ChurchProfileProvider>
        </ToastProvider>
      </ThemeProvider>
    </BrowserRouter>
  )
}
