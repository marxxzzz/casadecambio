import { lazy, Suspense } from 'react'
import { Routes, Route } from 'react-router-dom'
import PrivateRoute from './components/PrivateRoute'
import PublicRoute from './components/PublicRoute'

const Landing   = lazy(() => import('./pages/Landing'))
const Login     = lazy(() => import('./pages/Login'))
const Cadastro  = lazy(() => import('./pages/Cadastro'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const Contas    = lazy(() => import('./pages/Contas'))
const Converter = lazy(() => import('./pages/Converter'))
const Status    = lazy(() => import('./pages/Status'))
const TaxaIOF   = lazy(() => import('./pages/TaxaIOF'))

const Spinner = () => (
  <div className="min-h-screen bg-black flex items-center justify-center">
    <div className="w-6 h-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
  </div>
)

export default function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/"          element={<Landing />} />
        <Route path="/login"     element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/cadastro"  element={<PublicRoute><Cadastro /></PublicRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/contas"    element={<PrivateRoute><Contas /></PrivateRoute>} />
        <Route path="/converter" element={<PrivateRoute><Converter /></PrivateRoute>} />
        <Route path="/status"    element={<PrivateRoute><Status /></PrivateRoute>} />
        <Route path="/taxa-iof"  element={<PrivateRoute><TaxaIOF /></PrivateRoute>} />
        <Route path="*"          element={<Landing />} />
      </Routes>
    </Suspense>
  )
}
