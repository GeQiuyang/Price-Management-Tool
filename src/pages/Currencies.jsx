import { useState, useEffect, useRef } from 'react'

const modalAnimationStyles = `
  @keyframes modalFadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
  
  @keyframes modalSlideIn {
    from {
      opacity: 0;
      transform: scale(0.9) translateY(-20px);
    }
    to {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
  }
  
  @keyframes modalFadeOut {
    from {
      opacity: 1;
    }
    to {
      opacity: 0;
    }
  }
  
  @keyframes modalSlideOut {
    from {
      opacity: 1;
      transform: scale(1) translateY(0);
    }
    to {
      opacity: 0;
      transform: scale(0.9) translateY(-20px);
    }
  }
  
  @keyframes toastSlideIn {
    from {
      opacity: 0;
      transform: translateX(-50%) translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateX(-50%) translateY(0);
    }
  }
`

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
  const [isClosing, setIsClosing] = useState(false)
  const [editingCurrency, setEditingCurrency] = useState(null)
  const [deletedCurrency, setDeletedCurrency] = useState(null)
  const [showUndoToast, setShowUndoToast] = useState(false)
  const deleteTimerRef = useRef(null)
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
    setIsClosing(false)
    setShowModal(true)
  }

  const handleEdit = (currency) => {
    setEditingCurrency(currency)
    setFormData(currency)
    setIsClosing(false)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setIsClosing(true)
    setTimeout(() => {
      setShowModal(false)
      setIsClosing(false)
    }, 200)
  }

  const handleDelete = (currency) => {
    if (currency.isDefault) return
    setDeletedCurrency(currency)
    setCurrencies(prev => prev.filter(c => c.id !== currency.id))
    setShowUndoToast(true)
    
    deleteTimerRef.current = setTimeout(() => {
      confirmDelete()
    }, 5000)
  }

  const confirmDelete = () => {
    setDeletedCurrency(null)
    setShowUndoToast(false)
  }

  const handleUndoDelete = () => {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current)
    }
    if (deletedCurrency) {
      setCurrencies(prev => [...prev, deletedCurrency])
      setDeletedCurrency(null)
      setShowUndoToast(false)
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
    <div style={styles.container}>
      {showUndoToast && (
        <div style={styles.undoToast}>
          <style>{modalAnimationStyles}</style>
          <span>货币已删除</span>
          <button style={styles.undoButton} onClick={handleUndoDelete}>
            撤销
          </button>
        </div>
      )}
      
      <div style={styles.topBar}>
        <h2 style={styles.pageTitle}>货币管理</h2>
        <div style={styles.topActions}>
          <button style={styles.addButton} onClick={handleAdd}>
            添加货币
          </button>
        </div>
      </div>

      <div style={styles.convertCard}>
        <div style={styles.convertTitle}>货币换算</div>
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
        </div>
        {convertAmount && baseCurrency && (
          <div style={styles.convertResult}>
            {currencies.filter((c) => c.code !== baseCurrency).map((c) => (
              <div key={c.code} style={styles.convertResultItem}>
                <span style={styles.convertResultLabel}>{c.code}</span>
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

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>货币代码</th>
              <th style={styles.th}>货币</th>
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
                  <span style={styles.productName}>{currency.code}</span>
                </td>
                <td style={styles.tdSecondary}>{currency.name}</td>
                <td style={styles.tdSecondary}>{currency.symbol}</td>
                <td style={styles.tdSecondary}>{Number(currency.exchangeRate).toFixed(4)}</td>
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
                    onClick={() => !currency.isDefault && handleDelete(currency)}
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
        <div 
          style={{
            ...styles.modalOverlay,
            animation: isClosing ? 'modalFadeOut 0.2s ease-out forwards' : 'modalFadeIn 0.2s ease-out forwards',
          }} 
          onClick={handleCloseModal}
        >
          <style>{modalAnimationStyles}</style>
          <div 
            style={{
              ...styles.modal,
              animation: isClosing ? 'modalSlideOut 0.2s ease-out forwards' : 'modalSlideIn 0.2s ease-out forwards',
            }} 
            onClick={(e) => e.stopPropagation()}
          >
            <h3 style={styles.modalTitle}>{editingCurrency ? '编辑货币' : '添加货币'}</h3>
            <div style={styles.formScroll}>
              <form onSubmit={handleSubmit}>
                <div style={styles.formSection}>
                  <div style={styles.sectionTitle}>基础信息</div>
                  <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>货币代码</label>
                      <input
                        style={styles.input}
                        value={formData.code}
                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                        placeholder="例如: USD"
                        required
                      />
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>货币符号</label>
                      <input
                        style={styles.input}
                        value={formData.symbol}
                        onChange={(e) => setFormData({ ...formData, symbol: e.target.value })}
                        placeholder="例如: $"
                        required
                      />
                    </div>
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
                </div>

                <div style={styles.formSection}>
                  <div style={styles.sectionTitle}>汇率设置</div>
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
                </div>
              </form>
            </div>
            <div style={styles.modalButtons}>
              <button type="button" style={styles.cancelButton} onClick={handleCloseModal}>
                取消
              </button>
              <button type="button" style={styles.submitButton} onClick={handleSubmit}>
                {editingCurrency ? '保存修改' : '添加'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
  },
  undoToast: {
    position: 'fixed',
    bottom: '24px',
    left: '50%',
    transform: 'translateX(-50%)',
    backgroundColor: '#333',
    color: '#fff',
    padding: '12px 24px',
    borderRadius: '8px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    border: '1px solid rgba(255,255,255,0.1)',
    zIndex: 1001,
    animation: 'toastSlideIn 0.3s ease-out',
  },
  undoButton: {
    backgroundColor: '#4e73df',
    color: '#fff',
    border: 'none',
    padding: '6px 16px',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#1a1a2e',
    margin: 0,
  },
  topActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  addButton: {
    padding: '10px 20px',
    backgroundColor: '#4e73df',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
  },
  convertCard: {
    backgroundColor: '#FFFFFF',
    padding: '24px',
    borderRadius: '8px',
    border: '1px solid #E8ECF1',
  },
  convertTitle: {
    fontSize: '16px',
    fontWeight: '600',
    marginBottom: '16px',
    color: '#111827',
  },
  convertForm: {
    display: 'flex',
    gap: '16px',
    marginBottom: '20px',
  },
  convertInputGroup: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  convertLabel: {
    fontSize: '13px',
    color: '#6B7280',
    marginBottom: '8px',
    fontWeight: '500',
  },
  convertInput: {
    padding: '10px 14px',
    border: '1px solid #E8ECF1',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
  },
  convertSelect: {
    padding: '10px 14px',
    border: '1px solid #E8ECF1',
    borderRadius: '6px',
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
    color: '#6B7280',
    marginBottom: '4px',
  },
  convertResultValue: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#2563EB',
  },
  summaryCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: '20px',
    borderRadius: '8px',
    border: '1px solid #E8ECF1',
  },
  summaryLabel: {
    fontSize: '13px',
    color: '#6B7280',
    marginBottom: '8px',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: '24px',
    fontWeight: '700',
    color: '#111827',
  },
  tableCard: {
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
    padding: '14px 20px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '500',
    color: '#6B7280',
    borderBottom: '1px solid #E8ECF1',
  },
  tableRow: {
    borderBottom: '1px solid #E8ECF1',
    transition: 'background-color 0.15s',
  },
  td: {
    padding: '14px 20px',
    fontSize: '14px',
    color: '#333',
  },
  tdSecondary: {
    padding: '14px 20px',
    fontSize: '14px',
    color: '#6B7280',
  },
  productName: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#111827',
  },
  defaultBadge: {
    padding: '4px 12px',
    borderRadius: '4px',
    backgroundColor: '#1cc88a',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '500',
  },
  setDefaultButton: {
    padding: '4px 12px',
    backgroundColor: '#FEF3C7',
    color: '#D97706',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
  },
  editButton: {
    padding: '6px 14px',
    backgroundColor: '#EEF2FF',
    color: '#4e73df',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    marginRight: '8px',
    transition: 'background-color 0.2s',
  },
  deleteButton: {
    padding: '6px 14px',
    backgroundColor: '#FEF2F2',
    color: '#e74a3b',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
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
    padding: '0',
    borderRadius: '12px',
    border: '1px solid #E8ECF1',
    width: '480px',
    maxWidth: '90%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '600',
    padding: '20px 24px',
    margin: 0,
    color: '#111827',
    borderBottom: '1px solid #E8ECF1',
    backgroundColor: '#FAFBFC',
    flexShrink: 0,
  },
  formScroll: {
    flex: 1,
    overflowY: 'auto',
  },
  formSection: {
    padding: '20px 24px',
  },
  sectionTitle: {
    fontSize: '13px',
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: '16px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  formGroup: {
    marginBottom: '16px',
  },
  formRow: {
    display: 'flex',
    gap: '16px',
  },
  label: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500',
    color: '#5a6a85',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #E8ECF1',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
    transition: 'border-color 0.2s',
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  checkboxLabel: {
    fontSize: '14px',
    color: '#5a6a85',
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    backgroundColor: '#FAFBFC',
    borderTop: '1px solid #E8ECF1',
    flexShrink: 0,
  },
  cancelButton: {
    padding: '10px 24px',
    backgroundColor: '#FFFFFF',
    color: '#374151',
    border: '1px solid #D1D5DB',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.15s',
  },
  submitButton: {
    padding: '10px 24px',
    backgroundColor: '#2563EB',
    color: '#fff',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'background-color 0.15s',
  },
}
