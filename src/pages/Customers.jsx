import { useState, useEffect } from 'react'

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
  const [editingSegment, setEditingSegment] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    discount: '',
    description: '',
    customerCount: 0,
  })

  const handleAdd = () => {
    setEditingSegment(null)
    setFormData({ name: '', discount: '', description: '', customerCount: 0 })
    setShowModal(true)
  }

  const handleEdit = (segment) => {
    setEditingSegment(segment)
    setFormData(segment)
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('确定要删除此客户分段吗？')) {
      setSegments(segments.filter((s) => s.id !== id))
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
    <div>
      <div style={styles.header}>
        <h2 style={styles.pageTitle}>客户分段与客户属性</h2>
        <button style={styles.addButton} onClick={handleAdd}>
          添加客户分段
        </button>
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

      <div style={styles.tableContainer}>
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
                  <strong>{segment.name}</strong>
                </td>
                <td style={styles.td}>
                  <span style={{
                    ...styles.discountBadge,
                    backgroundColor: segment.discount > 0 ? '#1cc88a' : '#6c757d',
                  }}>
                    {segment.discount > 0 ? `-${segment.discount}%` : '无折扣'}
                  </span>
                </td>
                <td style={styles.td}>{segment.description}</td>
                <td style={styles.td}>{segment.customerCount.toLocaleString()}</td>
                <td style={styles.td}>
                  <button style={styles.editButton} onClick={() => handleEdit(segment)}>
                    编辑
                  </button>
                  <button style={styles.deleteButton} onClick={() => handleDelete(segment.id)}>
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
            <h3 style={styles.modalTitle}>{editingSegment ? '编辑客户分段' : '添加客户分段'}</h3>
            <form onSubmit={handleSubmit}>
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
              <div style={styles.formGroup}>
                <label style={styles.label}>描述</label>
                <textarea
                  style={styles.textarea}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows="3"
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>客户数量</label>
                <input
                  type="number"
                  min="0"
                  style={styles.input}
                  value={formData.customerCount}
                  onChange={(e) => setFormData({ ...formData, customerCount: e.target.value })}
                />
              </div>
              <div style={styles.modalButtons}>
                <button type="button" style={styles.cancelButton} onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" style={styles.submitButton}>
                  {editingSegment ? '更新' : '添加'}
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
  discountBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '600',
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
  textarea: {
    width: '100%',
    padding: '10px',
    border: '1px solid #E8ECF1',
    borderRadius: '4px',
    fontSize: '14px',
    resize: 'vertical',
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
