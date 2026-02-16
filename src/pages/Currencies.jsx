import { useState, useEffect, useRef } from 'react'

const API_URL = 'http://localhost:3001/api'

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
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
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
      confirmDelete(currency)
    }, 5000)
  }

  const addToRecycleBin = async (item, type) => {
    try {
      await fetch(`${API_URL}/recycle-bin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          itemType: type,
          itemId: item.id,
          itemData: item,
        }),
      })
      window.dispatchEvent(new CustomEvent('recycleBin-updated'))
    } catch (error) {
      console.error('添加到回收站失败:', error)
    }
  }

  const confirmDelete = async (currency) => {
    const itemToDelete = currency || deletedCurrency
    if (itemToDelete) {
      await addToRecycleBin(itemToDelete, 'currencies')
    }
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
        <div
          style={styles.undoToast}
          onMouseEnter={() => deleteTimerRef.current && clearTimeout(deleteTimerRef.current)}
          onMouseLeave={() => {
            if (deletedCurrency && !showUndoToast) return
            deleteTimerRef.current = setTimeout(() => {
              confirmDelete()
            }, 5000)
          }}
        >
          <style>{modalAnimationStyles}</style>
          <div style={styles.undoToastContent}>
            <div style={styles.undoToastIcon}>
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M8 0C3.6 0 0 3.6 0 8s3.6 8 8 8 8-3.6 8-8-3.6-8-8-8zm4 10.4H4c-.4 0-.8-.4-.8-.8s.4-.8.8-.8h8c.4 0 .8.4.8.8s-.4.8-.8.8z" fill="#10B981" />
              </svg>
            </div>
            <div style={styles.undoToastText}>
              <div style={styles.undoToastTitle}>货币已删除</div>
              <div style={styles.undoToastDesc}>5秒后自动消失</div>
            </div>
          </div>
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
    boxShadow: 'var(--shadow-xl)',
    gap: '20px',
  },
  undoToast: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-xl)',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    border: '1px solid var(--border)',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
    zIndex: 1001,
    animation: 'toastSlideIn 0.3s ease-out',
  },
  undoToastContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  undoToastIcon: {
    width: '32px',
    height: '32px',
    borderRadius: '50%',
    backgroundColor: '#ECFDF5',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  undoToastText: {
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-xl)',
    gap: '2px',
  },
  undoToastTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text-primary)',
  },
  undoToastDesc: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
  },
  undoButton: {
    backgroundColor: 'transparent',
    color: 'var(--primary)',
    border: 'none',
    padding: '8px 16px',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all var(--transition-fast)',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontSize: '26px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
  },
  topActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  addButton: {
    padding: '10px 20px',
    background: 'var(--gradient-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all var(--transition-fast)',
  },
  convertCard: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '24px',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  },
  convertTitle: {
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '16px',
    color: 'var(--text-primary)',
  },
  convertForm: {
    display: 'flex',
    gap: '16px',
    marginBottom: '20px',
  },
  convertInputGroup: {
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-xl)',
    flex: 1,
  },
  convertLabel: {
    fontSize: '13px',
    color: 'var(--text-tertiary)',
    marginBottom: '8px',
    fontWeight: '500',
  },
  convertInput: {
    padding: '10px 14px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '14px',
    backgroundColor: 'var(--bg-secondary)',
  },
  convertSelect: {
    padding: '10px 14px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '14px',
    backgroundColor: 'var(--bg-secondary)',
  },
  convertResult: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '12px',
    padding: '16px',
    backgroundColor: 'var(--bg-tertiary)',
    borderRadius: 'var(--radius-lg)',
  },
  convertResultItem: {
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-xl)',
    padding: '12px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-sm)',
    border: '1px solid var(--border)',
  },
  convertResultLabel: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
    marginBottom: '4px',
  },
  convertResultValue: {
    fontSize: '18px',
    fontWeight: '700',
    color: 'var(--primary)',
  },
  summaryCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  summaryCard: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '20px',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  },
  summaryLabel: {
    fontSize: '13px',
    color: 'var(--text-tertiary)',
    marginBottom: '8px',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: '26px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  tableCard: {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-card)',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: 'var(--bg-tertiary)',
  },
  th: {
    padding: '14px 20px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '500',
    color: 'var(--text-tertiary)',
    borderBottom: '1px solid var(--border)',
  },
  tableRow: {
    borderBottom: '1px solid var(--border)',
    transition: 'all var(--transition-fast)',
  },
  td: {
    padding: '14px 20px',
    fontSize: '14px',
    color: 'var(--text-primary)',
  },
  tdSecondary: {
    padding: '14px 20px',
    fontSize: '14px',
    color: 'var(--text-tertiary)',
  },
  productName: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--text-primary)',
  },
  defaultBadge: {
    padding: '4px 12px',
    borderRadius: 'var(--radius-sm)',
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
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '500',
  },
  editButton: {
    padding: '6px 14px',
    backgroundColor: 'var(--primary-bg)',
    color: 'var(--primary)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    marginRight: '8px',
    transition: 'all var(--transition-fast)',
  },
  deleteButton: {
    padding: '6px 14px',
    backgroundColor: '#FEF2F2',
    color: '#EF4444',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    transition: 'all var(--transition-fast)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '0',
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border)',
    width: '480px',
    maxWidth: '90%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-xl)',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    padding: '20px 24px',
    margin: 0,
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border)',
    backgroundColor: 'var(--bg-tertiary)',
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
    fontWeight: '700',
    color: 'var(--text-tertiary)',
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
    color: 'var(--text-secondary)',
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '14px',
    backgroundColor: 'var(--bg-secondary)',
    transition: 'all var(--transition-fast)',
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  checkboxLabel: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    backgroundColor: 'var(--bg-tertiary)',
    borderTop: '1px solid var(--border)',
    flexShrink: 0,
  },
  cancelButton: {
    padding: '10px 24px',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all var(--transition-fast)',
  },
  submitButton: {
    padding: '10px 24px',
    background: 'var(--gradient-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all var(--transition-fast)',
  },
}
