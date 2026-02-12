import { useState } from 'react'

export default function TaxesUnits() {
  const [activeTab, setActiveTab] = useState('taxes')

  const [taxes, setTaxes] = useState([
    { id: 1, name: '增值税', rate: 13, type: 'percentage', description: '标准增值税率', isDefault: true },
    { id: 2, name: '消费税', rate: 5, type: 'percentage', description: '特定商品消费税', isDefault: false },
    { id: 3, name: '关税', rate: 10, type: 'percentage', description: '进口商品关税', isDefault: false },
  ])

  const [units, setUnits] = useState([
    { id: 1, name: '件', code: 'PCS', category: '数量', description: '按件计算' },
    { id: 2, name: '千克', code: 'KG', category: '重量', description: '按千克计算' },
    { id: 3, name: '米', code: 'M', category: '长度', description: '按米计算' },
    { id: 4, name: '升', code: 'L', category: '体积', description: '按升计算' },
    { id: 5, name: '箱', code: 'BOX', category: '数量', description: '按箱计算' },
  ])

  const [showModal, setShowModal] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({})

  const handleAdd = (type) => {
    setEditingItem(null)
    if (type === 'taxes') {
      setFormData({ name: '', rate: '', type: 'percentage', description: '', isDefault: false })
    } else {
      setFormData({ name: '', code: '', category: '数量', description: '' })
    }
    setShowModal(true)
  }

  const handleEdit = (item, type) => {
    setEditingItem(item)
    setFormData(item)
    setShowModal(true)
  }

  const handleDelete = (id, type) => {
    if (window.confirm('确定要删除此项吗？')) {
      if (type === 'taxes') {
        setTaxes(taxes.filter((t) => t.id !== id))
      } else {
        setUnits(units.filter((u) => u.id !== id))
      }
    }
  }

  const handleSetDefault = (id) => {
    setTaxes(taxes.map((t) => ({ ...t, isDefault: t.id === id })))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (activeTab === 'taxes') {
      if (formData.isDefault) {
        setTaxes(taxes.map((t) => ({ ...t, isDefault: false })))
      }
      if (editingItem) {
        setTaxes(taxes.map((t) => (t.id === editingItem.id ? { ...formData, id: t.id } : t)))
      } else {
        setTaxes([...taxes, { ...formData, id: Date.now() }])
      }
    } else {
      if (editingItem) {
        setUnits(units.map((u) => (u.id === editingItem.id ? { ...formData, id: u.id } : u)))
      } else {
        setUnits([...units, { ...formData, id: Date.now() }])
      }
    }
    setShowModal(false)
  }

  return (
    <div>
      <div style={styles.header}>
        <h2 style={styles.pageTitle}>税费与计量单位</h2>
      </div>

      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'taxes' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('taxes')}
        >
          税费管理
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'units' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('units')}
        >
          计量单位
        </button>
      </div>

      {activeTab === 'taxes' ? (
        <>
          <div style={styles.summaryCards}>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>税费类型</div>
              <div style={styles.summaryValue}>{taxes.length}</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>默认税费</div>
              <div style={styles.summaryValue}>
                {taxes.find((t) => t.isDefault)?.name || '未设置'}
              </div>
            </div>
          </div>

          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>税费列表</h3>
            <button style={styles.addButton} onClick={() => handleAdd('taxes')}>
              添加税费
            </button>
          </div>

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>税费名称</th>
                  <th style={styles.th}>税率</th>
                  <th style={styles.th}>类型</th>
                  <th style={styles.th}>描述</th>
                  <th style={styles.th}>状态</th>
                  <th style={styles.th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {taxes.map((tax) => (
                  <tr key={tax.id} style={styles.tableRow}>
                    <td style={styles.td}>
                      <strong>{tax.name}</strong>
                    </td>
                    <td style={styles.td}>{tax.rate}%</td>
                    <td style={styles.td}>{tax.type === 'percentage' ? '百分比' : '固定金额'}</td>
                    <td style={styles.td}>{tax.description}</td>
                    <td style={styles.td}>
                      {tax.isDefault ? (
                        <span style={styles.defaultBadge}>默认</span>
                      ) : (
                        <button style={styles.setDefaultButton} onClick={() => handleSetDefault(tax.id)}>
                          设为默认
                        </button>
                      )}
                    </td>
                    <td style={styles.td}>
                      <button style={styles.editButton} onClick={() => handleEdit(tax, 'taxes')}>
                        编辑
                      </button>
                      <button
                        style={{
                          ...styles.deleteButton,
                          opacity: tax.isDefault ? 0.5 : 1,
                          cursor: tax.isDefault ? 'not-allowed' : 'pointer',
                        }}
                        onClick={() => !tax.isDefault && handleDelete(tax.id, 'taxes')}
                        disabled={tax.isDefault}
                      >
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          <div style={styles.summaryCards}>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>计量单位数</div>
              <div style={styles.summaryValue}>{units.length}</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>单位分类</div>
              <div style={styles.summaryValue}>
                {[...new Set(units.map((u) => u.category))].length}
              </div>
            </div>
          </div>

          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>计量单位列表</h3>
            <button style={styles.addButton} onClick={() => handleAdd('units')}>
              添加单位
            </button>
          </div>

          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>单位名称</th>
                  <th style={styles.th}>单位代码</th>
                  <th style={styles.th}>分类</th>
                  <th style={styles.th}>描述</th>
                  <th style={styles.th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {units.map((unit) => (
                  <tr key={unit.id} style={styles.tableRow}>
                    <td style={styles.td}>
                      <strong>{unit.name}</strong>
                    </td>
                    <td style={styles.td}>{unit.code}</td>
                    <td style={styles.td}>
                      <span style={styles.categoryBadge}>{unit.category}</span>
                    </td>
                    <td style={styles.td}>{unit.description}</td>
                    <td style={styles.td}>
                      <button style={styles.editButton} onClick={() => handleEdit(unit, 'units')}>
                        编辑
                      </button>
                      <button style={styles.deleteButton} onClick={() => handleDelete(unit.id, 'units')}>
                        删除
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {showModal && (
        <div style={styles.modalOverlay} onClick={() => setShowModal(false)}>
          <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
            <h3 style={styles.modalTitle}>
              {editingItem ? '编辑' : '添加'}{activeTab === 'taxes' ? '税费' : '计量单位'}
            </h3>
            <form onSubmit={handleSubmit}>
              {activeTab === 'taxes' ? (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>税费名称</label>
                    <input
                      style={styles.input}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>税率 (%)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      max="100"
                      style={styles.input}
                      value={formData.rate}
                      onChange={(e) => setFormData({ ...formData, rate: e.target.value })}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>类型</label>
                    <select
                      style={styles.input}
                      value={formData.type}
                      onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                    >
                      <option value="percentage">百分比</option>
                      <option value="fixed">固定金额</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>描述</label>
                    <input
                      style={styles.input}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
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
                      设为默认税费
                    </label>
                  </div>
                </>
              ) : (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>单位名称</label>
                    <input
                      style={styles.input}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>单位代码</label>
                    <input
                      style={styles.input}
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="例如: KG"
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>分类</label>
                    <select
                      style={styles.input}
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    >
                      <option value="数量">数量</option>
                      <option value="重量">重量</option>
                      <option value="长度">长度</option>
                      <option value="体积">体积</option>
                      <option value="面积">面积</option>
                    </select>
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>描述</label>
                    <input
                      style={styles.input}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                </>
              )}
              <div style={styles.modalButtons}>
                <button type="button" style={styles.cancelButton} onClick={() => setShowModal(false)}>
                  取消
                </button>
                <button type="submit" style={styles.submitButton}>
                  {editingItem ? '更新' : '添加'}
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
    marginBottom: '24px',
  },
  pageTitle: {
    fontSize: '24px',
    fontWeight: '600',
    color: '#333',
  },
  tabs: {
    display: 'flex',
    gap: '8px',
    marginBottom: '24px',
    borderBottom: '1px solid #E8ECF1',
  },
  tab: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    marginBottom: '-1px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#5a6a85',
  },
  tabActive: {
    borderBottomColor: '#4e73df',
    color: '#4e73df',
    fontWeight: '600',
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
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
  },
  sectionTitle: {
    fontSize: '18px',
    fontWeight: '600',
    color: '#333',
  },
  addButton: {
    padding: '8px 16px',
    backgroundColor: '#4e73df',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
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
  defaultBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    backgroundColor: '#1cc88a',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '600',
  },
  categoryBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    backgroundColor: '#36b9cc',
    color: '#fff',
    fontSize: '12px',
  },
  setDefaultButton: {
    padding: '4px 12px',
    backgroundColor: '#f6c23e',
    color: '#fff',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px',
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
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '16px',
  },
  checkboxLabel: {
    fontSize: '14px',
    color: '#5a6a85',
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
