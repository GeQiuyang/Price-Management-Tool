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
  const [currencies, setCurrencies] = useState([])

  useEffect(() => {
    fetchCurrencies()
  }, [])

  const fetchCurrencies = async () => {
    try {
      const res = await fetch(`${API_URL}/currencies`)
      const data = await res.json()
      const mapped = data.map(c => ({
        id: c.id,
        code: c.code,
        name: c.name,
        symbol: c.symbol,
        exchangeRate: c.exchange_rate,
        isDefault: !!c.is_default,
      }))
      setCurrencies(mapped)
    } catch (err) {
      console.error('获取货币失败:', err)
    }
  }

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
      try {
        await fetch(`${API_URL}/currencies/${itemToDelete.id}`, { method: 'DELETE' })
        await addToRecycleBin(itemToDelete, 'currencies')
      } catch (err) {
        console.error('删除失败:', err)
      }
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

  const handleSetDefault = async (id) => {
    setCurrencies(currencies.map((c) => ({ ...c, isDefault: c.id === id })))
    // Update on backend
    for (const c of currencies) {
      await fetch(`${API_URL}/currencies/${c.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: c.code, name: c.name, symbol: c.symbol,
          exchange_rate: c.exchangeRate,
          is_default: c.id === id,
        }),
      })
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      code: formData.code,
      name: formData.name,
      symbol: formData.symbol,
      exchange_rate: Number(formData.exchangeRate),
      is_default: formData.isDefault,
    }
    try {
      if (editingCurrency) {
        await fetch(`${API_URL}/currencies/${editingCurrency.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch(`${API_URL}/currencies`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      await fetchCurrencies()
      setShowModal(false)
    } catch (err) {
      console.error('保存货币失败:', err)
    }
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
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: '28px',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  topActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  addButton: {
    padding: '12px 26px',
    background: 'linear-gradient(135deg, #D4AF37 0%, #E8C547 50%, #D4AF37 100%)',
    color: '#0F172A',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 16px rgba(212, 175, 55, 0.35)',
    letterSpacing: '-0.1px',
    zIndex: 100,
    position: 'relative',
  },
  convertCard: {
    backgroundColor: '#FFFFFF',
    padding: '24px',
    borderRadius: '20px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 2px 8px rgba(30, 41, 59, 0.04)',
  },
  convertTitle: {
    fontSize: '16px',
    fontWeight: '700',
    marginBottom: '16px',
    color: '#1E293B',
  },
  convertForm: {
    display: 'flex',
    gap: '24px',
    marginBottom: '24px',
  },
  convertInputGroup: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
  },
  convertLabel: {
    fontSize: "13px",
    color: "#64748B",
    marginBottom: "8px",
    fontWeight: "600",
  },
  convertInput: {
    padding: '12px 16px',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  convertSelect: {
    padding: '12px 16px',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  convertResult: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '16px',
    padding: '20px',
    backgroundColor: '#F8FAFC',
    borderRadius: '16px',
  },
  convertResultItem: {
    display: 'flex',
    flexDirection: 'column',
    padding: '16px',
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 2px 8px rgba(30, 41, 59, 0.02)',
  },
  convertResultLabel: {
    fontSize: '13px',
    color: '#64748B',
    marginBottom: '6px',
  },
  convertResultValue: {
    fontSize: '20px',
    fontWeight: '700',
    color: '#D4AF37',
  },
  summaryCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  summaryCard: {
    backgroundColor: '#FFFFFF',
    padding: '24px',
    borderRadius: '20px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 2px 8px rgba(30, 41, 59, 0.04)',
  },
  summaryLabel: {
    fontSize: "13px",
    color: "#64748B",
    marginBottom: "8px",
    fontWeight: "500",
  },
  summaryValue: {
    fontSize: "26px",
    fontWeight: "700",
    color: "#1E293B",
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '18px',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(30, 41, 59, 0.04), 0 0 0 1px rgba(30, 41, 59, 0.02)',
    transition: 'box-shadow 0.3s ease, transform 0.3s ease',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#F8FAFC',
  },
  th: {
    padding: '16px 24px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748B',
    borderBottom: '1px solid #E2E8F0',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  tableRow: {
    borderBottom: "1px solid #F1F5F9",
    transition: "background-color 0.2s ease",
    cursor: "default",
  },
  td: {
    padding: '18px 24px',
    fontSize: '14px',
    color: '#1E293B',
  },
  tdSecondary: {
    padding: '18px 24px',
    fontSize: '14px',
    color: '#64748B',
  },
  productName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1E293B',
  },
  defaultBadge: {
    padding: '4px 12px',
    borderRadius: '10px',
    backgroundColor: '#ECFDF5',
    color: '#059669',
    fontSize: '12px',
    fontWeight: '600',
  },
  setDefaultButton: {
    padding: '6px 14px',
    backgroundColor: '#FFFBEB',
    color: '#D97706',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: '600',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  editButton: {
    padding: '8px 18px',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    color: '#B8860B',
    border: '1px solid rgba(212, 175, 55, 0.2)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    marginRight: '10px',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  deleteButton: {
    padding: '8px 18px',
    backgroundColor: 'rgba(225, 29, 72, 0.06)',
    color: '#E11D48',
    border: '1px solid rgba(225, 29, 72, 0.12)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    padding: '0',
    borderRadius: '20px',
    border: '1px solid rgba(30, 41, 59, 0.08)',
    width: '480px',
    maxWidth: '92%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 24px 48px rgba(30, 41, 59, 0.2), 0 0 0 1px rgba(212, 175, 55, 0.05)',
  },
  modalTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '20px',
    fontWeight: '600',
    padding: '24px 28px',
    margin: 0,
    color: '#1E293B',
    borderBottom: '1px solid #F1F5F9',
    backgroundColor: '#FDFCFB',
    flexShrink: 0,
    borderRadius: '20px 20px 0 0',
  },
  formScroll: {
    flex: 1,
    overflowY: 'auto',
  },
  formSection: {
    padding: '24px 28px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B',
    marginBottom: '18px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formRow: {
    display: 'flex',
    gap: '18px',
  },
  label: {
    display: "block",
    marginBottom: "10px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#334155",
  },
  input: {
    width: "100%",
    padding: '12px 16px',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    color: '#1E293B',
    boxSizing: 'border-box',
  },
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  checkboxLabel: {
    fontSize: '14px',
    color: '#1E293B',
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '14px',
    padding: '20px 28px',
    backgroundColor: '#F8FAFC',
    borderTop: '1px solid #F1F5F9',
    flexShrink: 0,
    borderRadius: '0 0 20px 20px',
  },
  cancelButton: {
    padding: '12px 28px',
    backgroundColor: '#FFFFFF',
    color: '#64748B',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  submitButton: {
    padding: '12px 28px',
    background: 'linear-gradient(135deg, #D4AF37 0%, #E8C547 50%, #D4AF37 100%)',
    color: '#0F172A',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 16px rgba(212, 175, 55, 0.35)',
  },
}
