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
      confirmDelete()
    }, 5000)
  }

  const confirmDelete = () => {
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
        <div style={styles.undoToast}>
          <style>{modalAnimationStyles}</style>
          <span>客户分段已删除</span>
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
  discountBadge: {
    padding: '4px 12px',
    borderRadius: '4px',
    color: '#fff',
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
  textarea: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid #E8ECF1',
    borderRadius: '6px',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
    resize: 'vertical',
    fontFamily: 'inherit',
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
