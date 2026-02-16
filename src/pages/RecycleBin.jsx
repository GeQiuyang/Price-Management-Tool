import { useState, useEffect } from 'react'

const API_URL = 'http://localhost:3001/api'

const modalAnimationStyles = `
  @keyframes modalFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  
  @keyframes modalSlideIn {
    from { opacity: 0; transform: scale(0.9) translateY(-20px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  
  @keyframes modalFadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  
  @keyframes modalSlideOut {
    from { opacity: 1; transform: scale(1) translateY(0); }
    to { opacity: 0; transform: scale(0.9) translateY(-20px); }
  }
`

const TYPE_LABELS = {
  products: '产品',
  costs: '成本',
  currencies: '货币',
  customers: '客户分段',
  taxes: '税费',
  units: '计量单位',
  markets: '市场',
  channels: '销售渠道',
}

const TARGET_TABLE_MAP = {
  products: 'products',
  costs: 'costs',
  currencies: 'currencies',
  customers: 'customers',
  taxes: 'taxes',
  units: 'units',
  markets: 'markets',
  channels: 'channels',
}

export default function RecycleBin() {
  const [items, setItems] = useState([])
  const [showModal, setShowModal] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [selectedItem, setSelectedItem] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadRecycleBin()
  }, [])

  useEffect(() => {
    const handleRecycleBinUpdate = () => {
      loadRecycleBin()
    }
    window.addEventListener('recycleBin-updated', handleRecycleBinUpdate)
    return () => window.removeEventListener('recycleBin-updated', handleRecycleBinUpdate)
  }, [])

  const loadRecycleBin = async () => {
    try {
      setLoading(true)
      const response = await fetch(`${API_URL}/recycle-bin`)
      const data = await response.json()
      setItems(data)
    } catch (error) {
      console.error('加载回收站数据失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const getDaysRemaining = (expiresAt) => {
    const expiresDate = new Date(expiresAt)
    const now = new Date()
    const diffTime = expiresDate - now
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return diffDays > 0 ? diffDays : 0
  }

  const handleRestore = async (item) => {
    try {
      const targetTable = TARGET_TABLE_MAP[item.item_type]
      await fetch(`${API_URL}/recycle-bin/${item.id}/restore`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetTable }),
      })
      
      await loadRecycleBin()
      window.dispatchEvent(new CustomEvent('recycleBin-updated'))
      
      if (targetTable === 'products') {
        window.dispatchEvent(new CustomEvent('products-updated'))
      } else if (targetTable === 'costs') {
        window.dispatchEvent(new CustomEvent('costs-updated'))
      } else if (targetTable === 'currencies') {
        window.dispatchEvent(new CustomEvent('currencies-updated'))
      } else if (targetTable === 'customers') {
        window.dispatchEvent(new CustomEvent('customers-updated'))
      } else if (targetTable === 'taxes' || targetTable === 'units') {
        window.dispatchEvent(new CustomEvent('taxesUnits-updated'))
      } else if (targetTable === 'markets' || targetTable === 'channels') {
        window.dispatchEvent(new CustomEvent('marketsChannels-updated'))
      }
    } catch (error) {
      console.error('恢复数据失败:', error)
    }
  }

  const handlePermanentDelete = (item) => {
    setSelectedItem(item)
    setIsClosing(false)
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setIsClosing(true)
    setTimeout(() => {
      setShowModal(false)
      setIsClosing(false)
      setSelectedItem(null)
    }, 200)
  }

  const confirmPermanentDelete = async () => {
    if (selectedItem) {
      try {
        await fetch(`${API_URL}/recycle-bin/${selectedItem.id}`, {
          method: 'DELETE',
        })
        await loadRecycleBin()
        window.dispatchEvent(new CustomEvent('recycleBin-updated'))
      } catch (error) {
        console.error('永久删除失败:', error)
      }
    }
    handleCloseModal()
  }

  const getDisplayData = (item) => {
    const data = item.item_data
    const type = item.item_type
    
    if (type === 'products') {
      return { title: data.name, subtitle: `SKU: ${data.sku}`, extra: `¥${Number(data.price).toLocaleString()}` }
    } else if (type === 'costs') {
      return { title: data.productName || data.cost_type, subtitle: `SKU: ${data.sku || '-'}`, extra: `¥${Number(data.amount || data.totalCost || 0).toLocaleString()}` }
    } else if (type === 'currencies') {
      return { title: data.name, subtitle: `${data.code} (${data.symbol})`, extra: data.is_default ? '默认货币' : '' }
    } else if (type === 'customers') {
      return { title: data.name, subtitle: data.description, extra: `${data.discount > 0 ? `-${data.discount}%` : '无折扣'}` }
    } else if (type === 'taxes') {
      return { title: data.name, subtitle: `${data.rate || data.value}%`, extra: data.is_default ? '默认' : '' }
    } else if (type === 'units') {
      return { title: data.name, subtitle: `${data.code || ''} - ${data.category || ''}`, extra: '' }
    } else if (type === 'markets') {
      return { title: data.name, subtitle: `${data.code || ''} - ${data.currency || ''}`, extra: '' }
    } else if (type === 'channels') {
      return { title: data.name, subtitle: `${data.type === 'online' ? '线上' : '线下'} - ${data.commission}%佣金`, extra: '' }
    }
    return { title: '未知', subtitle: '', extra: '' }
  }

  return (
    <div style={styles.container}>
      <div style={styles.topBar}>
        <h2 style={styles.pageTitle}>回收站</h2>
        <div style={styles.topInfo}>
          <span style={styles.infoText}>数据保留 30 天</span>
        </div>
      </div>

      <div style={styles.infoCard}>
        <div style={styles.infoIcon}>ℹ️</div>
        <div style={styles.infoContent}>
          <div style={styles.infoTitle}>回收站说明</div>
          <div style={styles.infoDesc}>删除的数据会自动进入回收站，最多保留 30 天。您可以恢复或永久删除这些数据。</div>
        </div>
      </div>

      {loading ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyText}>加载中...</div>
        </div>
      ) : items.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>🗑️</div>
          <div style={styles.emptyText}>回收站为空</div>
          <div style={styles.emptyDesc}>删除的数据将显示在这里</div>
        </div>
      ) : (
        <div style={styles.tableCard}>
          <table style={styles.table}>
            <thead>
              <tr style={styles.tableHeader}>
                <th style={styles.th}>类型</th>
                <th style={styles.th}>名称</th>
                <th style={styles.th}>删除时间</th>
                <th style={styles.th}>剩余天数</th>
                <th style={styles.th}>操作</th>
              </tr>
            </thead>
            <tbody>
              {items.map((item) => {
                const displayData = getDisplayData(item)
                const daysRemaining = getDaysRemaining(item.expires_at)
                return (
                  <tr key={item.id} style={styles.tableRow}>
                    <td style={styles.td}>
                      <span style={styles.typeBadge}>{TYPE_LABELS[item.item_type] || item.item_type}</span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.itemInfo}>
                        <span style={styles.itemTitle}>{displayData.title}</span>
                        <span style={styles.itemDesc}>{displayData.subtitle}</span>
                      </div>
                    </td>
                    <td style={styles.tdSecondary}>
                      {new Date(item.deleted_at).toLocaleString('zh-CN')}
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.daysBadge,
                        color: daysRemaining <= 7 ? '#DC2626' : daysRemaining <= 14 ? '#F59E0B' : '#10B981',
                      }}>
                        {daysRemaining} 天
                      </span>
                    </td>
                    <td style={styles.td}>
                      <button style={styles.restoreButton} onClick={() => handleRestore(item)}>
                        恢复
                      </button>
                      <button style={styles.deleteButton} onClick={() => handlePermanentDelete(item)}>
                        永久删除
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

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
            <h3 style={styles.modalTitle}>确认永久删除</h3>
            <div style={styles.modalContent}>
              <p style={styles.warningText}>
                确定要永久删除 <strong>{selectedItem?.item_data?.name || selectedItem?.item_data?.productName || selectedItem?.item_data?.title}</strong> 吗？
              </p>
              <p style={styles.warningDesc}>此操作不可恢复，数据将被永久删除。</p>
            </div>
            <div style={styles.modalButtons}>
              <button type="button" style={styles.cancelButton} onClick={handleCloseModal}>
                取消
              </button>
              <button type="button" style={styles.confirmButton} onClick={confirmPermanentDelete}>
                确认删除
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
  topInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  infoText: {
    fontSize: '14px',
    color: 'var(--text-tertiary)',
  },
  infoCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    backgroundColor: '#EFF6FF',
    padding: '16px 20px',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid #BFDBFE',
  },
  infoIcon: {
    fontSize: '20px',
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: '14px',
    fontWeight: '700',
    color: '#1E40AF',
    marginBottom: '4px',
  },
  infoDesc: {
    fontSize: '13px',
    color: '#3B82F6',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-xl)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '16px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    marginBottom: '8px',
  },
  emptyDesc: {
    fontSize: '14px',
    color: 'var(--text-tertiary)',
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
  typeBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
    fontWeight: '500',
    backgroundColor: '#E5E7EB',
    color: 'var(--text-secondary)',
  },
  itemInfo: {
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'var(--shadow-xl)',
    gap: '2px',
  },
  itemTitle: {
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text-primary)',
  },
  itemDesc: {
    fontSize: '12px',
    color: 'var(--text-tertiary)',
  },
  daysBadge: {
    fontSize: '13px',
    fontWeight: '500',
  },
  restoreButton: {
    padding: '6px 14px',
    backgroundColor: 'var(--primary-bg)',
    color: 'var(--primary)',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    marginRight: '8px',
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
    borderRadius: 'var(--radius-xl)',
    border: '1px solid var(--border)',
    width: '400px',
    maxWidth: '90%',
  },
  modalTitle: {
    fontSize: '18px',
    fontWeight: '700',
    padding: '20px 24px',
    margin: 0,
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border)',
  },
  modalContent: {
    padding: '24px',
  },
  warningText: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
    marginBottom: '12px',
  },
  warningDesc: {
    fontSize: '13px',
    color: '#DC2626',
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    backgroundColor: 'var(--bg-tertiary)',
    borderTop: '1px solid var(--border)',
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
  },
  confirmButton: {
    padding: '10px 24px',
    backgroundColor: '#DC2626',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
  },
}
