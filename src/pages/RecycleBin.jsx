import { useState, useEffect } from 'react'
import Modal from '../components/Modal'
const API_URL = 'http://localhost:3001/api'



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
    setShowModal(false)
    setIsClosing(false)
    setSelectedItem(null)
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
      return { title: data.name, subtitle: data.description || '-', extra: `¥${Number(data.price).toLocaleString()}` }
    } else if (type === 'costs') {
      return { title: data.productName || data.cost_type, subtitle: '', extra: `¥${Number(data.amount || data.totalCost || 0).toLocaleString()}` }
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

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title="确认永久删除"
        width={400}
        footer={null}
      >
        <div style={styles.modalContent}>
          <p style={styles.warningText}>
            确定要永久删除 <strong>{selectedItem?.item_data?.name || selectedItem?.item_data?.productName || selectedItem?.item_data?.title}</strong> 吗？
          </p>
          <p style={styles.warningDesc}>此操作不可恢复，数据将被永久删除。</p>
        </div>
        <div style={{ padding: '0 28px 24px', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
          <button type="button" className="sf-btn sf-btn-cancel" onClick={handleCloseModal}>
            取消
          </button>
          <button type="button" className="sf-btn sf-btn-confirm" style={{ backgroundColor: '#E11D48', color: '#fff', border: 'none' }} onClick={confirmPermanentDelete}>
            确认删除
          </button>
        </div>
      </Modal>
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
    fontFamily: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
    fontSize: '28px',
    fontWeight: '700',
    color: '#0F172A',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  topInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  infoText: {
    fontSize: '14px',
    color: '#64748B',
  },
  infoCard: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '16px',
    backgroundColor: '#EFF6FF',
    padding: '16px 20px',
    borderRadius: '16px',
    border: '1px solid #BFDBFE',
    boxShadow: '0 2px 8px rgba(30, 41, 59, 0.04)',
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
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    backgroundColor: '#FFFFFF',
    borderRadius: '18px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 2px 12px rgba(30, 41, 59, 0.04), 0 0 0 1px rgba(30, 41, 59, 0.02)',
  },
  emptyIcon: {
    fontSize: '48px',
    marginBottom: '16px',
  },
  emptyText: {
    fontSize: '16px',
    fontWeight: '600',
    color: '#64748B',
    marginBottom: '8px',
  },
  emptyDesc: {
    fontSize: '14px',
    color: '#94A3B8',
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
    borderBottom: '1px solid #F1F5F9',
    transition: 'background-color 0.2s ease',
    cursor: 'default',
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
  typeBadge: {
    display: 'inline-block',
    padding: '4px 10px',
    borderRadius: '10px',
    fontSize: '12px',
    fontWeight: '600',
    backgroundColor: '#F1F5F9',
    color: '#64748B',
  },
  itemInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px',
  },
  itemTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1E293B',
  },
  itemDesc: {
    fontSize: '13px',
    color: '#94A3B8',
  },
  daysBadge: {
    fontSize: '13px',
    fontWeight: '600',
  },
  restoreButton: {
    padding: '8px 18px',
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    color: '#2563EB',
    border: '1px solid rgba(59, 130, 246, 0.2)',
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
    width: '400px',
    maxWidth: '92%',
    boxShadow: '0 24px 48px rgba(30, 41, 59, 0.2), 0 0 0 1px rgba(65, 105, 225, 0.05)',
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
  modalContent: {
    padding: '24px 28px',
  },
  warningText: {
    fontSize: '14px',
    color: '#334155',
    marginBottom: '12px',
    lineHeight: '1.5',
  },
  warningDesc: {
    fontSize: '13px',
    color: '#E11D48',
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
  confirmButton: {
    padding: '12px 28px',
    backgroundColor: '#E11D48',
    color: '#fff',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 16px rgba(225, 29, 72, 0.35)',
  },
}
