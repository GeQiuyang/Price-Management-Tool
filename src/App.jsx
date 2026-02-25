import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'

import Customers from './pages/Customers'
import Currencies from './pages/Currencies'
import TaxesUnits from './pages/TaxesUnits'

import RecycleBin from './pages/RecycleBin'
import FreightSimulator from './pages/FreightSimulator'
import QuoteGenerator from './pages/QuoteGenerator'
import SystemSettings from './pages/SystemSettings'
import AuditLogs from './pages/AuditLogs'
import BackupRestore from './pages/BackupRestore'
import Login from './pages/Login'
import Register from './pages/Register'

function ProtectedRoute({ children }) {
  const token = localStorage.getItem('token')
  if (!token) {
    return <Navigate to="/login" replace />
  }
  return children
}

function PublicRoute({ children }) {
  const token = localStorage.getItem('token')
  if (token) {
    return <Navigate to="/" replace />
  }
  return children
}

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/login" element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        } />
        <Route path="/register" element={
          <PublicRoute>
            <Register />
          </PublicRoute>
        } />
        <Route path="/*" element={
          <ProtectedRoute>
            <Layout>
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/products" element={<Products />} />

                <Route path="/customers" element={<Customers />} />
                <Route path="/currencies" element={<Currencies />} />
                <Route path="/tax-rules" element={<TaxesUnits />} />

                <Route path="/recycle-bin" element={<RecycleBin />} />
                <Route path="/freight-simulator" element={<FreightSimulator />} />
                <Route path="/quote-generator" element={<QuoteGenerator />} />
                <Route path="/system-settings" element={<SystemSettings />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                <Route path="/backup-restore" element={<BackupRestore />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  )
}

export default App
