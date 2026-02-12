import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import Layout from './components/Layout'
import Products from './pages/Products'
import Costs from './pages/Costs'
import Customers from './pages/Customers'
import Currencies from './pages/Currencies'
import TaxesUnits from './pages/TaxesUnits'
import MarketsChannels from './pages/MarketsChannels'

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Products />} />
          <Route path="/products" element={<Products />} />
          <Route path="/costs" element={<Costs />} />
          <Route path="/customers" element={<Customers />} />
          <Route path="/currencies" element={<Currencies />} />
          <Route path="/taxes-units" element={<TaxesUnits />} />
          <Route path="/markets-channels" element={<MarketsChannels />} />
        </Routes>
      </Layout>
    </Router>
  )
}

export default App
