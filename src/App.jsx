import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Dashboard from './pages/Dashboard'
import Products from './pages/Products'
import Costs from './pages/Costs'
import Customers from './pages/Customers'
import Currencies from './pages/Currencies'
import TaxesUnits from './pages/TaxesUnits'
import MarketsChannels from './pages/MarketsChannels'
import RecycleBin from './pages/RecycleBin'
import FreightSimulator from './pages/FreightSimulator'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/costs" element={<Costs />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/currencies" element={<Currencies />} />
          <Route path="/taxes-units" element={<TaxesUnits />} />
          <Route path="/markets-channels" element={<MarketsChannels />} />
          <Route path="/recycle-bin" element={<RecycleBin />} />
          <Route path="/freight-simulator" element={<FreightSimulator />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
