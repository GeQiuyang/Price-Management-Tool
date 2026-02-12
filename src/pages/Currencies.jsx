import { useState, useEffect } from 'react'

export default function Currencies() {
  const [currencies, setCurrencies] = useState(() => {
    const saved = localStorage.getItem('currencies')
    if (saved) {
      return JSON.parse(saved)
    }
    return [
      { id: 1, code: 'CNY', name: '人民币', symbol: '¥', exchangeRate: 1.00, isDefault: true },
      { id: 2, code: 'USD', name: '美元', symbol: '$', exchangeRate: 0.14, isDefault: false },
      { id: 3, code: 'EUR', name: '欧元', symbol: '€', exchangeRate: 0.13, isDefault: false },
      { id: 4, code: 'VND', name: '越南盾', symbol: '₫', exchangeRate: 3450.00, isDefault: false },
    ]
  })

  useEffect(() => {
    localStorage.setItem('currencies', JSON.stringify(currencies))
    window.dispatchEvent(new CustomEvent('currencies-updated', { detail: currencies }))
  }, [currencies])

  const [showModal, setShowModal] = useState(false)
  const [editingCurrency, setEditingCurrency] = useState(null)
  const [formData, setFormData] = useState({
    code: '',
    name: '',
    symbol: '',
    exchangeRate: '',
    isDefault: false,
  })

  const [convertAmount, setConvertAmount] = useState('')
  const [baseCurrency, setBaseCurrency] = useState('CNY')

  const handleAdd = () => {
    setEditingCurrency(null)
    setFormData({ code: '', name: '', symbol: '', exchangeRate: '', isDefault: false })
    setShowModal(true)
  }

  const handleEdit = (currency) => {
    setEditingCurrency(currency)
    setFormData(currency)
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('确定要删除此货币吗？')) {
      setCurrencies(currencies.filter((c) => c.id !== id))
    }
  }

  const handleSetDefault = (id) => {
    setCurrencies(currencies.map((c) => ({ ...c, isDefault: c.id === id })))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (formData.isDefault) {
      setCurrencies(currencies.map((c) => ({ ...c, isDefault: false })))
    }
    if (editingCurrency) {
      setCurrencies(currencies.map((c) => (c.id === editingCurrency.id ? { ...formData, id: c.id } : c)))
    } else {
      setCurrencies([...currencies, { ...formData, id: Date.now() }])
    }
    setShowModal(false)
  }

  const getConvertedAmount = (targetCurrency) => {
    const baseCurrencyObj = currencies.find((c) => c.code === baseCurrency)
    const targetCurrencyObj = currencies.find((c) => c.code === targetCurrency)
    
    if (!baseCurrencyObj || !targetCurrencyObj || !convertAmount) {
      return '-'
    }

    const amountInCNY = Number(convertAmount) / baseCurrencyObj.exchangeRate
    const convertedAmount = amountInCNY * targetCurrencyObj.exchangeRate
    
    return convertedAmount.toFixed(2)
  }

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.pageTitle}>货币管理</h2>
        <button style={styles.addButton} onClick={handleAdd}>
          添加货币
        </button>
      </div>

      <div style={styles.convertCard}>
        <h3 style={styles.convertTitle}>货币换算</h3>
        <div style={styles.convertForm}>
          <div style={styles.convertInputGroup}>
            <label style={styles.convertLabel}>金额</label>
            <input
              type="number"
              style={styles.convertInput}
              value={convertAmount}
              onChange={(e) => setConvertAmount(e.target.value)}
              placeholder="输入金额"
            />
          </div>
          <div style={styles.convertInputGroup}>
            <label style={styles.convertLabel}>从</label>
            <select
              style={styles.convertSelect}
              value={baseCurrency}
              onChange={(e) => setBaseCurrency(e.target.value)}
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>
          <div style={styles.convertInputGroup}>
            <label style={styles.convertLabel}>到</label>
            <select
              style={styles.convertSelect}
              onChange={(e) => {
                const target = e.target.value
                const result = getConvertedAmount(target)
                if (result !== '-') {
                  setBaseCurrency(target)
                }
              }}
            >
              {currencies.map((c) => (
                <option key={c.code} value={c.code}>{c.code} - {c.name}</option>
              ))}
            </select>
          </div>
        </div>
        {convertAmount && baseCurrency && (
          <div style={styles.convertResult}>
            {currencies.filter((c) => c.code !== baseCurrency).map((c) => (
              <div key={c.code} style={styles.convertResultItem}>
                <span style={styles.convertResultLabel}>{c.code}:</span>
                <span style={styles.convertResultValue}>
                  {c.symbol} {getConvertedAmount(c.code)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={styles.summaryCards}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>货币种类</div>
          <div style={styles.summaryValue}>{currencies.length}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>默认货币</div>
          <div style={styles.summaryValue}>
            {currencies.find((c) => c.isDefault)?.code || '未设置'}
          </div>
        </div>
      </div>

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>货币代码</th>
              <th style={styles.th}>货币名称</th>
              <th style={styles.th}>符号</th>
              <th style={styles.th}>汇率 (对CNY)</th>
              <th style={styles.th}>状态</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {currencies.map((currency) => (
              <tr key={currency.id} style={styles.tableRow}>
                <td style={styles.td}>
                  <strong>{currency.code}</strong>
                </td>
                <td style={styles.td}>{currency.name}</td>
                <td style={styles.td}>{currency.symbol}</td>
                <td style={styles.td}>{Number(currency.exchangeRate).toFixed(4)}</td>
                <td style={styles.td}>
                  {currency.isDefault ? (
                    <span style={styles.defaultBadge}>默认</span>
                  ) : (
                    <button style={styles.setDefaultButton} onClick={() => handleSetDefault(currency.id)}>
                      设为默认
                    </button>
                  )}
                </td>
                <td style={styles.td}>
                  <button style={styles.editButton} onClick={() => handleEdit(currency)}>
                    编辑
                  </button>
                  <button
                    style={{
                      ...styles.deleteButton,
                      opacity: currency.isDefault ? 0.5 : 1,
                      cursor: currency.isDefault ? 'not-allowed' : 'pointer',
                    }}
                    onClick={() => !currency.isDefault && handleDelete(currency.id)}
                    disabled={currency.isDefault}
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>{editingCurrency ? '编辑货币' : '添加货币'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>货币代码</label>
                <input
                  style={styles.input}
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="例如: USD"
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>货币名称</label>
                <input
                  style={styles.input}
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="例如: 美元"
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>货币符号</label>
                <input
                  style={styles.input}
                  value={formData.symbol}
                  onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                  placeholder="例如: $"
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>汇率 (对人民币)</label>
                <input
                  type="number"
                  step="0.0001"
                  min="0"
                  style={styles.input}
                  value={formData.exchangeRate}
                  onChange={(e) => setFormData({ ...formData, exchangeRate: e.target.value })}
                  placeholder="1人民币 = ? 此货币"
                  required
                />
              </div>
              <div style={styles.checkboxGroup}>
                <input
                  type="checkbox"
                  id="isDefault"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                />
                <label htmlFor="isDefault" style={styles.checkboxLabel}>
                  设为默认货币
                </label>
              </div>
              <div style={styles.modalButtons}>
                <button type="button" style={styles.cancelButton} onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" style={styles.submitButton}>
                  {editingCurrency ? '更新' : '添加'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '24px',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    padding: '10px 20px',
    backgroundColor: '#4e73df',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  convertCard: {
    backgroundColor: '#FFFFFF',
    padding: '24px',
    borderRadius: '8px',
    border: '1px solid #E8ECF1',
    marginBottom: '24px',
  },
  convertTitle: {
    fontSize: '18px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#333',
  },
  convertForm: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '20px',
  },
  convertInputGroup: {
    display: 'flex',
    flexDirection: 'column',
  },
  convertLabel: {
    fontSize: '14px',
    color: '#5a6a85',
    marginBottom: '8px',
    fontWeight: '500',
  },
  convertInput: {
    padding: '10px',
    border: '1px solid #E8ECF1',
    borderRadius: '4px',
    fontSize: '14px',
  },
  convertSelect: {
    padding: '10px',
    border: '1px solid #E8ECF1',
    borderRadius: '4px',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
  },
  convertResult: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#FAFBFC',
    borderRadius: '8px',
  },
  convertResultItem: {
    display: 'flex',
    flexDirection: 'column',
    padding: '12px',
    backgroundColor: '#FFFFFF',
    borderRadius: '6px',
    border: '1px solid #E8ECF1',
  },
  convertResultLabel: {
    fontSize: '12px',
    color: '#5a6a85',
    marginBottom: '4px',
  },
  convertResultValue: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#4e73df',
  },
  summaryCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #E8ECF1',
  },
  summaryLabel: {
    fontSize: '14px',
    color: '#5a6a85',
    marginBottom: '8px',
  },
  summaryValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#333',
  },
  tableContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: '8px',
    border: '1px solid #E8ECF1',
    overflow: 'hidden',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#FAFBFC',
  },
  th: {
    padding: '16px',
    textAlign: 'left',
    fontSize: '14px',
    fontWeight: '600',
    color: '#5a6a85',
    borderBottom: '1px solid #E8ECF1',
  },
  tableRow: {
    borderBottom: '1px solid #E8ECF1',
  },
  td: {
    padding: '16px',
    fontSize: '14px',
    color: '#333',
  },
  defaultBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    backgroundColor: '#1cc88a',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '600',
  },
  setDefaultButton: {
    padding: '4px 12px',
    backgroundColor: '#f6c23e',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  editButton: {
    padding: '6px 12px',
    backgroundColor: '#4e73df',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    marginRight: '8px',
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#e74a3b',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    padding: '32px',
    borderRadius: '8px',
    border: '1px solid #E8ECF1',
    width: '400px',
    maxWidth: '90%',
  },
  modalTitle: {
    fontSize: '20px',
    fontWeight: '600',
    marginBottom: '24px',
    color: '#333',
  },
  formGroup: {
    marginBottom: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    color: '#5a6a85',
  },
  input: {
    width: '100%',
    padding: '10px',
    border: '1px solid #E8ECF1',
    borderRadius: '4px',
    fontSize: '14px',
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  checkboxLabel: {
    fontSize: '14px',
    color: '#5a6a85',
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
  },
  cancelButton: {
    padding: '10px 20px',
    backgroundColor: '#6c757d',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
  submitButton: {
    padding: '10px 20px',
    backgroundColor: '#4e73df',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
  },
}
