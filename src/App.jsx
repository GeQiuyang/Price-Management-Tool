import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import Layout from './components/Layout'
import Products from './pages/Products'
import Warehouses from './pages/Warehouses'
import QuoteGenerator from './pages/QuoteGenerator'
import SystemSettings from './pages/SystemSettings'
import AuditLogs from './pages/AuditLogs'
import BackupRestore from './pages/BackupRestore'
import Login from './pages/Login'
import Register from './pages/Register'
import ProductDocs from './pages/ProductDocs'

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
                <Route path="/" element={<Navigate to="/products" replace />} />
                <Route path="/products" element={<Products />} />
                <Route path="/warehouses" element={<Warehouses />} />
                <Route path="/quote-generator" element={<QuoteGenerator />} />
                <Route path="/system-settings" element={<SystemSettings />} />
                <Route path="/audit-logs" element={<AuditLogs />} />
                <Route path="/backup-restore" element={<BackupRestore />} />
                <Route path="/product-docs" element={<ProductDocs />} />
              </Routes>
            </Layout>
          </ProtectedRoute>
        } />
      </Routes>
    </Router>
  )
}

export default App
