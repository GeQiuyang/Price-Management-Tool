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

export default function Customers() {
  const [segments, setSegments] = useState(() => {
    const saved = localStorage.getItem('customers')
    if (saved) {
      return JSON.parse(saved)
    }
    return [
      { id: 1, name: 'VIP客户', discount: 15, description: '高价值客户，享受15%折扣', customerCount: 45 },
      { id: 2, name: '企业客户', discount: 10, description: '企业采购客户，享受10%折扣', customerCount: 128 },
      { id: 3, name: '普通客户', discount: 0, description: '标准定价客户', customerCount: 1250 },
      { id: 4, name: '新客户', discount: 5, description: '首次购买客户，享受5%折扣', customerCount: 89 },
    ]
  })

  useEffect(() => {
    localStorage.setItem('customers', JSON.stringify(segments))
    window.dispatchEvent(new CustomEvent('customers-updated', { detail: segments }))
  }, [segments])

  const [showModal, setShowModal] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [editingSegment, setEditingSegment] = useState(null)
  const [deletedSegment, setDeletedSegment] = useState(null)
  const [showUndoToast, setShowUndoToast] = useState(false)
  const deleteTimerRef = useRef(null)
  const [formData, setFormData] = useState({
    name: '',
    discount: '',
    description: '',
    customerCount: 0,
  })

  const handleAdd = () => {
    setEditingSegment(null)
    setFormData({ name: '', discount: '', description: '', customerCount: 0 })
    setIsClosing(false)
    setShowModal(true)
  }

  const handleEdit = (segment) => {
    setEditingSegment(segment)
    setFormData(segment)
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

  const handleDelete = (segment) => {
    setDeletedSegment(segment)
    setSegments(prev => prev.filter(s => s.id !== segment.id))
    setShowUndoToast(true)

    deleteTimerRef.current = setTimeout(() => {
      confirmDelete(segment)
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

  const confirmDelete = async (segment) => {
    const itemToDelete = segment || deletedSegment
    if (itemToDelete) {
      await addToRecycleBin(itemToDelete, 'customers')
    }
    setDeletedSegment(null)
    setShowUndoToast(false)
  }

  const handleUndoDelete = () => {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current)
    }
    if (deletedSegment) {
      setSegments(prev => [...prev, deletedSegment])
      setDeletedSegment(null)
      setShowUndoToast(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (editingSegment) {
      setSegments(segments.map((s) => (s.id === editingSegment.id ? { ...formData, id: s.id } : s)))
    } else {
      setSegments([...segments, { ...formData, id: Date.now() }])
    }
    setShowModal(false)
  }

  return (
    <div style={styles.container}>
      {showUndoToast && (
        <div
          style={styles.undoToast}
          onMouseEnter={() => deleteTimerRef.current && clearTimeout(deleteTimerRef.current)}
          onMouseLeave={() => {
            if (deletedSegment && !showUndoToast) return
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
              <div style={styles.undoToastTitle}>客户分段已删除</div>
              <div style={styles.undoToastDesc}>5秒后自动消失</div>
            </div>
          </div>
          <button style={styles.undoButton} onClick={handleUndoDelete}>
            撤销
          </button>
        </div>
      )}

      <div style={styles.topBar}>
        <h2 style={styles.pageTitle}>客户分段与客户属性</h2>
        <div style={styles.topActions}>
          <button style={styles.addButton} onClick={handleAdd}>
            添加客户分段
          </button>
        </div>
      </div>

      <div style={styles.summaryCards}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>客户分段数</div>
          <div style={styles.summaryValue}>{segments.length}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>总客户数</div>
          <div style={styles.summaryValue}>{segments.reduce((sum, s) => sum + s.customerCount, 0).toLocaleString()}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>平均折扣</div>
          <div style={styles.summaryValue}>
            {(segments.reduce((sum, s) => sum + s.discount, 0) / segments.length || 0).toFixed(1)}%
          </div>
        </div>
      </div>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>分段名称</th>
              <th style={styles.th}>折扣率</th>
              <th style={styles.th}>描述</th>
              <th style={styles.th}>客户数量</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {segments.map((segment) => (
              <tr key={segment.id} style={styles.tableRow}>
                <td style={styles.td}>
                  <span style={styles.productName}>{segment.name}</span>
                </td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.discountBadge,
                    backgroundColor: segment.discount > 0 ? '#1cc88a' : '#6c757d',
                  }}>
                    {segment.discount > 0 ? `-${segment.discount}%` : '无折扣'}
                  </span>
                </td>
                <td style={styles.tdSecondary}>{segment.description}</td>
                <td style={styles.tdSecondary}>{segment.customerCount.toLocaleString()}</td>
                <td style={styles.td}>
                  <button style={styles.editButton} onClick={() => handleEdit(segment)}>
                    编辑
                  </button>
                  <button style={styles.deleteButton} onClick={() => handleDelete(segment)}>
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
            <h3 style={styles.modalTitle}>{editingSegment ? '编辑客户分段' : '添加客户分段'}</h3>
            <div style={styles.formScroll}>
              <form onSubmit={handleSubmit}>
                <div style={styles.formSection}>
                  <div style={styles.sectionTitle}>基础信息</div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>分段名称</label>
                    <input
                      style={styles.input}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>描述</label>
                    <textarea
                      style={styles.textarea}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      rows="3"
                    />
                  </div>
                </div>

                <div style={styles.formSection}>
                  <div style={styles.sectionTitle}>折扣设置</div>
                  <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>折扣率 (%)</label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        style={styles.input}
                        value={formData.discount}
                        onChange={(e) => setFormData({ ...formData, discount: e.target.value })}
                        required
                      />
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>客户数量</label>
                      <input
                        type="number"
                        min="0"
                        style={styles.input}
                        value={formData.customerCount}
                        onChange={(e) => setFormData({ ...formData, customerCount: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div style={styles.modalButtons}>
              <button type="button" style={styles.cancelButton} onClick={handleCloseModal}>
                取消
              </button>
              <button type="button" style={styles.submitButton} onClick={handleSubmit}>
                {editingSegment ? '保存修改' : '添加'}
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
  discountBadge: {
    padding: '4px 12px',
    borderRadius: 'var(--radius-sm)',
    color: '#fff',
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
  textarea: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '14px',
    backgroundColor: 'var(--bg-secondary)',
    resize: 'vertical',
    fontFamily: 'inherit',
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
