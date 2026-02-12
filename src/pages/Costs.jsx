import { useState } from 'react'

export default function Costs() {
  const [costs, setCosts] = useState([
    { id: 1, productName: '智能手机 Pro', sku: 'SP-001', materialCost: 2800, laborCost: 800, overheadCost: 400, totalCost: 4000 },
    { id: 2, productName: '无线耳机', sku: 'SP-002', materialCost: 350, laborCost: 100, overheadCost: 50, totalCost: 500 },
    { id: 3, productName: '笔记本电脑', sku: 'SP-003', materialCost: 5200, laborCost: 1200, overheadCost: 800, totalCost: 7200 },
  ])

  const [showModal, setShowModal] = useState(false)
  const [editingCost, setEditingCost] = useState(null)
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
    setShowModal(true)
  }

  const handleEdit = (cost) => {
    setEditingCost(cost)
    setFormData(cost)
    setShowModal(true)
  }

  const handleDelete = (id) => {
    if (window.confirm('确定要删除此成本数据吗？')) {
      setCosts(costs.filter((c) => c.id !== id))
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
    <div>
      <div style={styles.header}>
        <h2 style={styles.pageTitle}>成本数据管理</h2>
        <button style={styles.addButton} onClick={handleAdd}>
          添加成本数据
        </button>
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

      <div style={styles.tableContainer}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>SKU</th>
              <th style={styles.th}>产品名称</th>
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
                <td style={styles.td}>{cost.sku}</td>
                <td style={styles.td}>{cost.productName}</td>
                <td style={styles.td}>¥{cost.materialCost.toLocaleString()}</td>
                <td style={styles.td}>¥{cost.laborCost.toLocaleString()}</td>
                <td style={styles.td}>¥{cost.overheadCost.toLocaleString()}</td>
                <td style={styles.td}><strong>¥{cost.totalCost.toLocaleString()}</strong></td>
                <td style={styles.td}>
                  <button style={styles.editButton} onClick={() => handleEdit(cost)}>
                    编辑
                  </button>
                  <button style={styles.deleteButton} onClick={() => handleDelete(cost.id)}>
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
            <h3 style={styles.modalTitle}>{editingCost ? '编辑成本数据' : '添加成本数据'}</h3>
            <form onSubmit={handleSubmit}>
              <div style={styles.formGroup}>
                <label style={styles.label}>SKU</label>
                <input
                  style={styles.input}
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                  required
                />
              </div>
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
                <label style={styles.label}>材料成本</label>
                <input
                  type="number"
                  style={styles.input}
                  value={formData.materialCost}
                  onChange={(e) => setFormData({ ...formData, materialCost: e.target.value })}
                  required
                />
              </div>
              <div style={styles.formGroup}>
                <label style={styles.label}>人工成本</label>
                <input
                  type="number"
                  style={styles.input}
                  value={formData.laborCost}
                  onChange={(e) => setFormData({ ...formData, laborCost: e.target.value })}
                  required
                />
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
              <div style={styles.modalButtons}>
                <button type="button" style={styles.cancelButton} onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" style={styles.submitButton}>
                  {editingCost ? '更新' : '添加'}
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
