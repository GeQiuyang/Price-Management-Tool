import { useState, useEffect } from 'react'

const API_URL = 'http://localhost:3001/api'

const TRADE_TERMS = [
  { value: 'EXW', label: 'EXW - 工厂交货' },
  { value: 'FOB', label: 'FOB - 离岸价' },
  { value: 'CIF', label: 'CIF - 到岸价' },
]

const COST_TYPES = [
  { value: 'packing', label: '打包费' },
  { value: 'landFreight', label: '国内陆运费' },
  { value: 'customsFee', label: '出口报关费' },
  { value: 'portCharge', label: '港杂费' },
  { value: 'oceanFreight', label: '海运费' },
  { value: 'insurance', label: '保险费' },
  { value: 'destinationFee', label: '目的港费用' },
]

export default function FreightSimulator() {
  const [tradeTerm, setTradeTerm] = useState('FOB')
  const [cargoDetails, setCargoDetails] = useState({
    volume: 0,
    weight: 0,
    value: 0,
  })
  const [route, setRoute] = useState({
    originPort: '',
    destinationPort: '',
  })
  const [costs, setCosts] = useState([
    { type: 'packing', amount: 0, payer: 'seller' },
    { type: 'landFreight', amount: 0, payer: 'seller' },
    { type: 'customsFee', amount: 0, payer: 'seller' },
    { type: 'portCharge', amount: 0, payer: 'seller' },
    { type: 'oceanFreight', amount: 0, payer: 'buyer' },
    { type: 'insurance', amount: 0, payer: 'buyer' },
    { type: 'destinationFee', amount: 0, payer: 'buyer' },
  ])
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(false)
  const [originPorts, setOriginPorts] = useState([])
  const [destinationPorts, setDestinationPorts] = useState([])
  const [freightRates, setFreightRates] = useState([])

  useEffect(() => {
    loadPorts()
    loadFreightRates()
  }, [])

  useEffect(() => {
    if (route.originPort && route.destinationPort) {
      loadFreightRates()
    }
  }, [route.originPort, route.destinationPort])

  const loadPorts = async () => {
    try {
      const originRes = await fetch(`${API_URL}/freight/ports?type=origin`)
      const destRes = await fetch(`${API_URL}/freight/ports?type=destination`)
      const originData = await originRes.json()
      const destData = await destRes.json()
      setOriginPorts(originData)
      setDestinationPorts(destData)
    } catch (error) {
      console.error('加载港口失败:', error)
    }
  }

  const loadFreightRates = async () => {
    try {
      const params = new URLSearchParams()
      if (route.originPort) params.append('originPort', route.originPort)
      if (route.destinationPort) params.append('destinationPort', route.destinationPort)
      const res = await fetch(`${API_URL}/freight/rates?${params}`)
      const data = await res.json()
      setFreightRates(data)
    } catch (error) {
      console.error('加载运价失败:', error)
    }
  }

  const handleCalculate = async () => {
    setLoading(true)
    try {
      const response = await fetch(`${API_URL}/freight/calculate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tradeTerm,
          cargoDetails,
          route,
          costs,
        }),
      })
      const data = await response.json()
      setResult(data)
    } catch (error) {
      console.error('计算失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const applyFreightRate = (rate) => {
    const updatedCosts = costs.map(c => {
      if (c.type === 'oceanFreight') {
        return { ...c, amount: rate.price }
      }
      return c
    })
    setCosts(updatedCosts)
  }

  const addCost = () => {
    setCosts([...costs, { type: 'packing', amount: 0, payer: 'seller' }])
  }

  const updateCost = (index, field, value) => {
    const newCosts = [...costs]
    newCosts[index][field] = field === 'amount' ? Number(value) : value
    setCosts(newCosts)
  }

  const removeCost = (index) => {
    setCosts(costs.filter((_, i) => i !== index))
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.title}>海运费模拟器</h2>
      </div>

      <div style={styles.content}>
        <div style={styles.inputSection}>
          <div style={styles.card}>
            <h3 style={styles.cardTitle}>基本信息</h3>
            
            <div style={styles.field}>
              <label style={styles.label}>贸易条款</label>
              <select
                style={styles.select}
                value={tradeTerm}
                onChange={(e) => setTradeTerm(e.target.value)}
              >
                {TRADE_TERMS.map((term) => (
                  <option key={term.value} value={term.value}>{term.label}</option>
                ))}
              </select>
            </div>

            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>起运港</label>
                <select
                  style={styles.select}
                  value={route.originPort}
                  onChange={(e) => setRoute({ ...route, originPort: e.target.value })}
                >
                  <option value="">请选择</option>
                  {originPorts.map((port) => (
                    <option key={port.code} value={port.code}>{port.name} ({port.code})</option>
                  ))}
                </select>
              </div>
              <div style={styles.field}>
                <label style={styles.label}>目的港</label>
                <select
                  style={styles.select}
                  value={route.destinationPort}
                  onChange={(e) => setRoute({ ...route, destinationPort: e.target.value })}
                >
                  <option value="">请选择</option>
                  {destinationPorts.map((port) => (
                    <option key={port.code} value={port.code}>{port.name} ({port.code})</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>货物信息</h3>
            <div style={styles.row}>
              <div style={styles.field}>
                <label style={styles.label}>体积 (CBM)</label>
                <input
                  type="number"
                  style={styles.input}
                  value={cargoDetails.volume}
                  onChange={(e) => setCargoDetails({ ...cargoDetails, volume: Number(e.target.value) })}
                  placeholder="请输入体积"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>重量 (KG)</label>
                <input
                  type="number"
                  style={styles.input}
                  value={cargoDetails.weight}
                  onChange={(e) => setCargoDetails({ ...cargoDetails, weight: Number(e.target.value) })}
                  placeholder="请输入重量"
                />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>货值 (USD)</label>
                <input
                  type="number"
                  style={styles.input}
                  value={cargoDetails.value}
                  onChange={(e) => setCargoDetails({ ...cargoDetails, value: Number(e.target.value) })}
                  placeholder="请输入货值"
                />
              </div>
            </div>
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>运价参考</h3>
            {freightRates.length > 0 ? (
              <div style={styles.rateList}>
                {freightRates.map((rate) => (
                  <div key={rate.id} style={styles.rateItem} onClick={() => applyFreightRate(rate)}>
                    <span style={styles.rateContainer}>{rate.container_type}</span>
                    <span style={styles.ratePrice}>${rate.price}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.noData}>请选择起运港和目的港查看运价</p>
            )}
          </div>

          <div style={styles.card}>
            <h3 style={styles.cardTitle}>费用明细</h3>
            {costs.map((cost, index) => (
              <div key={index} style={styles.costRow}>
                <select
                  style={styles.select}
                  value={cost.type}
                  onChange={(e) => updateCost(index, 'type', e.target.value)}
                >
                  {COST_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <input
                  type="number"
                  style={styles.input}
                  value={cost.amount}
                  onChange={(e) => updateCost(index, 'amount', e.target.value)}
                  placeholder="金额"
                />
                <select
                  style={styles.select}
                  value={cost.payer}
                  onChange={(e) => updateCost(index, 'payer', e.target.value)}
                >
                  <option value="seller">卖方</option>
                  <option value="buyer">买方</option>
                </select>
                <button style={styles.deleteBtn} onClick={() => removeCost(index)}>×</button>
              </div>
            ))}
            <button style={styles.addBtn} onClick={addCost}>+ 添加费用</button>
          </div>

          <button style={styles.calcBtn} onClick={handleCalculate} disabled={loading}>
            {loading ? '计算中...' : '开始计算'}
          </button>
        </div>

        <div style={styles.resultSection}>
          {result ? (
            <>
              <div style={styles.card}>
                <h3 style={styles.cardTitle}>柜型匹配结果</h3>
                {result.container.type === 'LCL' ? (
                  <div style={styles.resultItem}>
                    <div style={styles.resultLabel}>运输方式</div>
                    <div style={styles.resultValue}>拼箱运输 (LCL)</div>
                  </div>
                ) : result.container.type === 'FCL_MULTI' ? (
                  <div style={styles.warningBox}>
                    <div style={styles.warningTitle}>⚠️ 体积超限</div>
                    <div style={styles.warningText}>{result.container.message}</div>
                  </div>
                ) : (
                  <>
                    <div style={styles.resultItem}>
                      <div style={styles.resultLabel}>运输方式</div>
                      <div style={styles.resultValue}>整箱运输 (FCL)</div>
                    </div>
                    <div style={styles.resultItem}>
                      <div style={styles.resultLabel}>推荐柜型</div>
                      <div style={styles.resultValue}>{result.container.containerType}</div>
                    </div>
                    <div style={styles.resultItem}>
                      <div style={styles.resultLabel}>柜子容量</div>
                      <div style={styles.resultValue}>{result.container.usedVolume} CBM</div>
                    </div>
                    <div style={styles.resultItem}>
                      <div style={styles.resultLabel}>限重</div>
                      <div style={styles.resultValue}>{result.container.usedWeight / 1000} 吨</div>
                    </div>
                    <div style={styles.resultItem}>
                      <div style={styles.resultLabel}>利用率</div>
                      <div style={styles.resultValue}>{result.container.utilization?.toFixed(1)}%</div>
                    </div>
                    {result.container.warnings?.length > 0 && (
                      <div style={styles.warningBox}>
                        {result.container.warnings.map((w, i) => (
                          <div key={i} style={styles.warningText}>⚠️ {w}</div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>

              <div style={styles.card}>
                <h3 style={styles.cardTitle}>成本分摊</h3>
                <div style={styles.costSection}>
                  <div style={styles.costHeader}>
                    <span style={styles.costTitle}>卖方承担</span>
                    <span style={styles.costAmount}>${result.sellerTotal?.toLocaleString()}</span>
                  </div>
                  {result.costBreakdown?.seller?.map((cost, i) => (
                    <div key={i} style={styles.costLine}>
                      <span>{cost.name}</span>
                      <span>${cost.amount?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div style={styles.costSection}>
                  <div style={styles.costHeader}>
                    <span style={styles.costTitle}>买方承担</span>
                    <span style={styles.costAmount}>${result.buyerTotal?.toLocaleString()}</span>
                  </div>
                  {result.costBreakdown?.buyer?.map((cost, i) => (
                    <div key={i} style={styles.costLine}>
                      <span>{cost.name}</span>
                      <span>${cost.amount?.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
                <div style={styles.totalSection}>
                  <span>总计</span>
                  <span style={styles.totalAmount}>${((result.sellerTotal || 0) + (result.buyerTotal || 0)).toLocaleString()}</span>
                </div>
              </div>

              <div style={styles.card}>
                <h3 style={styles.cardTitle}>条款说明</h3>
                <div style={styles.termDesc}>
                  {tradeTerm === 'EXW' && 'EXW - 工厂交货：卖方在工厂交付货物，买方承担全部运输费用和风险。'}
                  {tradeTerm === 'FOB' && 'FOB - 离岸价：卖方承担货物装上船前的费用，买方承担海运费和保险费。'}
                  {tradeTerm === 'CIF' && 'CIF - 到岸价：卖方承担海运费和保险费，买方承担目的港费用。'}
                </div>
              </div>
            </>
          ) : (
            <div style={styles.emptyResult}>
              <div style={styles.emptyIcon}>📦</div>
              <div style={styles.emptyText}>请填写信息并点击计算</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    padding: '24px',
  },
  header: {
    marginBottom: '8px',
  },
  title: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1a1a2e',
    margin: 0,
  },
  content: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '24px',
  },
  inputSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  resultSection: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #E8ECF1',
    padding: '20px',
  },
  cardTitle: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#374151',
    margin: '0 0 16px 0',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    flex: 1,
  },
  row: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: '12px',
    marginBottom: '12px',
  },
  label: {
    fontSize: '13px',
    color: '#6B7280',
  },
  input: {
    padding: '8px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box',
  },
  select: {
    padding: '8px 12px',
    border: '1px solid #E5E7EB',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: '#fff',
    width: '100%',
    boxSizing: 'border-box',
  },
  rateList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  rateItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    padding: '8px 12px',
    backgroundColor: '#F3F4F6',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'all 0.2s',
  },
  rateContainer: {
    fontSize: '13px',
    fontWeight: '500',
    color: '#374151',
  },
  ratePrice: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#2563EB',
  },
  noData: {
    fontSize: '13px',
    color: '#9CA3AF',
    textAlign: 'center',
    padding: '20px',
  },
  costRow: {
    display: 'grid',
    gridTemplateColumns: '2fr 1fr 80px 40px',
    gap: '8px',
    alignItems: 'center',
    marginBottom: '8px',
  },
  addBtn: {
    padding: '8px',
    backgroundColor: '#F3F4F6',
    border: '1px dashed #D1D5DB',
    borderRadius: '6px',
    cursor: 'pointer',
    color: '#6B7280',
    fontSize: '13px',
    marginTop: '8px',
  },
  deleteBtn: {
    padding: '4px 8px',
    backgroundColor: '#FEE2E2',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    color: '#DC2626',
    fontSize: '16px',
  },
  calcBtn: {
    padding: '14px',
    backgroundColor: '#3B82F6',
    color: '#fff',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600',
  },
  resultItem: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '10px 0',
    borderBottom: '1px solid #F3F4F6',
  },
  resultLabel: {
    fontSize: '13px',
    color: '#6B7280',
  },
  resultValue: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
  },
  warningBox: {
    backgroundColor: '#FEF3C7',
    border: '1px solid #F59E0B',
    borderRadius: '6px',
    padding: '12px',
    marginTop: '12px',
  },
  warningTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#B45309',
    marginBottom: '4px',
  },
  warningText: {
    fontSize: '13px',
    color: '#B45309',
  },
  costSection: {
    marginBottom: '16px',
  },
  costHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 0',
    borderBottom: '1px solid #E5E7EB',
    marginBottom: '8px',
  },
  costTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#374151',
  },
  costAmount: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#111827',
  },
  costLine: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '13px',
    color: '#6B7280',
    padding: '4px 0',
  },
  totalSection: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 0 0 0',
    borderTop: '2px solid #E5E7EB',
    fontSize: '16px',
    fontWeight: '600',
  },
  totalAmount: {
    fontSize: '18px',
    fontWeight: '700',
    color: '#2563EB',
  },
  termDesc: {
    fontSize: '13px',
    color: '#6B7280',
    lineHeight: '1.6',
  },
  emptyResult: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #E5E7EB',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '14px',
    color: '#9CA3AF',
  },
}
