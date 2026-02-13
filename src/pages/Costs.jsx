import { useState, useRef } from 'react'

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
      confirmDelete()
    }, 5000)
  }

  const confirmDelete = () => {
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
        <div style={styles.undoToast}>
          <style>{modalAnimationStyles}</style>
          <span>成本数据已删除</span>
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
  tdPrice: {
    padding: '14px 20px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#2563EB',
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
