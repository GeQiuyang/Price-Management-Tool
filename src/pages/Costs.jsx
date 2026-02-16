import { useState, useRef } from 'react'

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

export default function Costs() {
  const [costs, setCosts] = useState([
    { id: 1, productName: '智能手机 Pro', sku: 'SP-001', materialCost: 2800, laborCost: 800, overheadCost: 400, totalCost: 4000 },
    { id: 2, productName: '无线耳机', sku: 'SP-002', materialCost: 350, laborCost: 100, overheadCost: 50, totalCost: 500 },
    { id: 3, productName: '笔记本电脑', sku: 'SP-003', materialCost: 5200, laborCost: 1200, overheadCost: 800, totalCost: 7200 },
  ])

  const [showModal, setShowModal] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [editingCost, setEditingCost] = useState(null)
  const [deletedCost, setDeletedCost] = useState(null)
  const [showUndoToast, setShowUndoToast] = useState(false)
  const deleteTimerRef = useRef(null)
  const [formData, setFormData] = useState({
    productName: '',
    sku: '',
    materialCost: '',
    laborCost: '',
    overheadCost: '',
  })

  const handleAdd = () => {
    setEditingCost(null)
    setFormData({ productName: '', sku: '', materialCost: '', laborCost: '', overheadCost: '' })
    setIsClosing(false)
    setShowModal(true)
  }

  const handleEdit = (cost) => {
    setEditingCost(cost)
    setFormData(cost)
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

  const handleDelete = (cost) => {
    setDeletedCost(cost)
    setCosts(prev => prev.filter(c => c.id !== cost.id))
    setShowUndoToast(true)

    deleteTimerRef.current = setTimeout(() => {
      confirmDelete(cost)
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

  const confirmDelete = async (cost) => {
    const itemToDelete = cost || deletedCost
    if (itemToDelete) {
      await addToRecycleBin(itemToDelete, 'costs')
    }
    setDeletedCost(null)
    setShowUndoToast(false)
  }

  const handleUndoDelete = () => {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current)
    }
    if (deletedCost) {
      setCosts(prev => [...prev, deletedCost])
      setDeletedCost(null)
      setShowUndoToast(false)
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    const totalCost = Number(formData.materialCost) + Number(formData.laborCost) + Number(formData.overheadCost)
    const costData = { ...formData, totalCost }
    if (editingCost) {
      setCosts(costs.map((c) => (c.id === editingCost.id ? { ...costData, id: c.id } : c)))
    } else {
      setCosts([...costs, { ...costData, id: Date.now() }])
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
            if (deletedCost && !showUndoToast) return
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
              <div style={styles.undoToastTitle}>成本数据已删除</div>
              <div style={styles.undoToastDesc}>5秒后自动消失</div>
            </div>
          </div>
          <button style={styles.undoButton} onClick={handleUndoDelete}>
            撤销
          </button>
        </div>
      )}

      <div style={styles.topBar}>
        <h2 style={styles.pageTitle}>成本数据管理</h2>
        <div style={styles.topActions}>
          <button style={styles.addButton} onClick={handleAdd}>
            添加成本数据
          </button>
        </div>
      </div>

      <div style={styles.summaryCards}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>总材料成本</div>
          <div style={styles.summaryValue}>¥{costs.reduce((sum, c) => sum + c.materialCost, 0).toLocaleString()}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>总人工成本</div>
          <div style={styles.summaryValue}>¥{costs.reduce((sum, c) => sum + c.laborCost, 0).toLocaleString()}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>总间接成本</div>
          <div style={styles.summaryValue}>¥{costs.reduce((sum, c) => sum + c.overheadCost, 0).toLocaleString()}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>总成本</div>
          <div style={styles.summaryValue}>¥{costs.reduce((sum, c) => sum + c.totalCost, 0).toLocaleString()}</div>
        </div>
      </div>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>SKU</th>
              <th style={styles.th}>产品</th>
              <th style={styles.th}>材料成本</th>
              <th style={styles.th}>人工成本</th>
              <th style={styles.th}>间接成本</th>
              <th style={styles.th}>总成本</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {costs.map((cost) => (
              <tr key={cost.id} style={styles.tableRow}>
                <td style={styles.tdSecondary}>{cost.sku}</td>
                <td style={styles.td}>
                  <span style={styles.productName}>{cost.productName}</span>
                </td>
                <td style={styles.tdSecondary}>¥{cost.materialCost.toLocaleString()}</td>
                <td style={styles.tdSecondary}>¥{cost.laborCost.toLocaleString()}</td>
                <td style={styles.tdSecondary}>¥{cost.overheadCost.toLocaleString()}</td>
                <td style={styles.tdPrice}>¥{cost.totalCost.toLocaleString()}</td>
                <td style={styles.td}>
                  <button style={styles.editButton} onClick={() => handleEdit(cost)}>
                    编辑
                  </button>
                  <button style={styles.deleteButton} onClick={() => handleDelete(cost)}>
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
            <h3 style={styles.modalTitle}>{editingCost ? '编辑成本数据' : '添加成本数据'}</h3>
            <div style={styles.formScroll}>
              <form onSubmit={handleSubmit}>
                <div style={styles.formSection}>
                  <div style={styles.sectionTitle}>基础信息</div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>产品名称</label>
                    <input
                      style={styles.input}
                      value={formData.productName}
                      onChange={(e) => setFormData({ ...formData, productName: e.target.value })}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>SKU</label>
                    <input
                      style={styles.input}
                      value={formData.sku}
                      onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                      required
                    />
                  </div>
                </div>

                <div style={styles.formSection}>
                  <div style={styles.sectionTitle}>成本信息</div>
                  <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>材料成本</label>
                      <input
                        type="number"
                        style={styles.input}
                        value={formData.materialCost}
                        onChange={(e) => setFormData({ ...formData, materialCost: e.target.value })}
                        required
                      />
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>人工成本</label>
                      <input
                        type="number"
                        style={styles.input}
                        value={formData.laborCost}
                        onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
                        required
                      />
                    </div>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>间接成本</label>
                    <input
                      type="number"
                      style={styles.input}
                      value={formData.overheadCost}
                      onChange={(e) => setFormData({ ...formData, overheadCost: e.target.value })}
                      required
                    />
                  </div>
                </div>
              </form>
            </div>
            <div style={styles.modalButtons}>
              <button type="button" style={styles.cancelButton} onClick={handleCloseModal}>
                取消
              </button>
              <button type="button" style={styles.submitButton} onClick={handleSubmit}>
                {editingCost ? '保存修改' : '添加'}
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
    animation: 'fadeInUp 0.4s ease forwards',
  },
  undoToast: {
    position: 'fixed',
    top: '24px',
    right: '24px',
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-lg)',
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
    letterSpacing: '-0.5px',
  },
  topActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  addButton: {
    padding: '10px 22px',
    background: 'var(--gradient-primary)',
    color: '#fff',
    border: 'none',
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all var(--transition-fast)',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.3)',
  },
  summaryCards: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
  },
  summaryCard: {
    backgroundColor: 'var(--bg-secondary)',
    padding: '22px',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-card)',
    transition: 'all var(--transition-base)',
  },
  summaryLabel: {
    fontSize: '13px',
    color: 'var(--text-tertiary)',
    marginBottom: '8px',
    fontWeight: '500',
  },
  summaryValue: {
    fontSize: '28px',
    fontWeight: '800',
    color: 'var(--text-primary)',
    letterSpacing: '-0.5px',
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
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-tertiary)',
    borderBottom: '1px solid var(--border)',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tableRow: {
    borderBottom: '1px solid var(--border-light)',
    transition: 'background-color var(--transition-fast)',
  },
  td: {
    padding: '16px 20px',
    fontSize: '14px',
    color: 'var(--text-primary)',
  },
  tdSecondary: {
    padding: '16px 20px',
    fontSize: '14px',
    color: 'var(--text-secondary)',
  },
  productName: {
    fontSize: '15px',
    fontWeight: '600',
    color: 'var(--text-primary)',
  },
  tdPrice: {
    padding: '16px 20px',
    fontSize: '15px',
    fontWeight: '700',
    color: 'var(--primary)',
  },
  editButton: {
    padding: '7px 16px',
    backgroundColor: 'var(--primary-bg)',
    color: 'var(--primary)',
    border: '1px solid transparent',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '500',
    marginRight: '8px',
    transition: 'all var(--transition-fast)',
  },
  deleteButton: {
    padding: '7px 16px',
    backgroundColor: '#FEF2F2',
    color: '#EF4444',
    border: '1px solid transparent',
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
    fontWeight: '600',
    padding: '20px 24px',
    margin: 0,
    color: 'var(--text-primary)',
    borderBottom: '1px solid var(--border)',
    backgroundColor: 'var(--bg-tertiary)',
    flexShrink: 0,
    borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
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
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    padding: '16px 24px',
    backgroundColor: 'var(--bg-tertiary)',
    borderTop: '1px solid var(--border)',
    flexShrink: 0,
    borderRadius: '0 0 var(--radius-xl) var(--radius-xl)',
  },
  cancelButton: {
    padding: '10px 24px',
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
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
    borderRadius: 'var(--radius-md)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all var(--transition-fast)',
    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
  },
}

