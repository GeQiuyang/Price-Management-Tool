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
  const [isClosing, setIsClosing] = useState(false)
  const [editingItem, setEditingItem] = useState(null)
  const [deletedItem, setDeletedItem] = useState(null)
  const [deletedType, setDeletedType] = useState(null)
  const [showUndoToast, setShowUndoToast] = useState(false)
  const deleteTimerRef = useRef(null)
  const [formData, setFormData] = useState({})

  const handleAdd = (type) => {
    setEditingItem(null)
    if (type === 'taxes') {
      setFormData({ name: '', rate: '', type: 'percentage', description: '', isDefault: false })
    } else {
      setFormData({ name: '', code: '', category: '数量', description: '' })
    }
    setIsClosing(false)
    setShowModal(true)
  }

  const handleEdit = (item, type) => {
    setEditingItem(item)
    setFormData(item)
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

  const handleDelete = (item, type) => {
    if (type === 'taxes' && item.isDefault) return
    setDeletedItem(item)
    setDeletedType(type)
    if (type === 'taxes') {
      setTaxes(prev => prev.filter(t => t.id !== item.id))
    } else {
      setUnits(prev => prev.filter(u => u.id !== item.id))
    }
    setShowUndoToast(true)

    deleteTimerRef.current = setTimeout(() => {
      confirmDelete(item, type)
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

  const confirmDelete = async (item, type) => {
    const itemToDelete = item || deletedItem
    const typeToDelete = type || deletedType
    if (itemToDelete) {
      await addToRecycleBin(itemToDelete, typeToDelete)
    }
    setDeletedItem(null)
    setDeletedType(null)
    setShowUndoToast(false)
  }

  const handleUndoDelete = () => {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current)
    }
    if (deletedItem && deletedType) {
      if (deletedType === 'taxes') {
        setTaxes(prev => [...prev, deletedItem])
      } else {
        setUnits(prev => [...prev, deletedItem])
      }
      setDeletedItem(null)
      setDeletedType(null)
      setShowUndoToast(false)
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
    <div style={styles.container}>
      {showUndoToast && (
        <div
          style={styles.undoToast}
          onMouseEnter={() => deleteTimerRef.current && clearTimeout(deleteTimerRef.current)}
          onMouseLeave={() => {
            if (deletedItem && !showUndoToast) return
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
              <div style={styles.undoToastTitle}>{deletedType === 'taxes' ? '税费已删除' : '计量单位已删除'}</div>
              <div style={styles.undoToastDesc}>5秒后自动消失</div>
            </div>
          </div>
          <button style={styles.undoButton} onClick={handleUndoDelete}>
            撤销
          </button>
        </div>
      )}

      <div style={styles.topBar}>
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

          <div style={styles.tableCard}>
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
                      <span style={styles.productName}>{tax.name}</span>
                    </td>
                    <td style={styles.tdPrice}>{tax.rate}%</td>
                    <td style={styles.tdSecondary}>{tax.type === 'percentage' ? '百分比' : '固定金额'}</td>
                    <td style={styles.tdSecondary}>{tax.description}</td>
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
                        onClick={() => !tax.isDefault && handleDelete(tax, 'taxes')}
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

          <div style={styles.tableCard}>
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
                      <span style={styles.productName}>{unit.name}</span>
                    </td>
                    <td style={styles.tdSecondary}>{unit.code}</td>
                    <td style={styles.td}>
                      <span style={styles.categoryBadge}>{unit.category}</span>
                    </td>
                    <td style={styles.tdSecondary}>{unit.description}</td>
                    <td style={styles.td}>
                      <button style={styles.editButton} onClick={() => handleEdit(unit, 'units')}>
                        编辑
                      </button>
                      <button style={styles.deleteButton} onClick={() => handleDelete(unit, 'units')}>
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
            <h3 style={styles.modalTitle}>
              {editingItem ? '编辑' : '添加'}{activeTab === 'taxes' ? '税费' : '计量单位'}
            </h3>
            <div style={styles.formScroll}>
              <form onSubmit={handleSubmit}>
                {activeTab === 'taxes' ? (
                  <>
                    <div style={styles.formSection}>
                      <div style={styles.sectionTitle}>基础信息</div>
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
                        <label style={styles.label}>描述</label>
                        <input
                          style={styles.input}
                          value={formData.description}
                          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        />
                      </div>
                    </div>

                    <div style={styles.formSection}>
                      <div style={styles.sectionTitle}>税率设置</div>
                      <div style={styles.formRow}>
                        <div style={{ ...styles.formGroup, flex: 1 }}>
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
                        <div style={{ ...styles.formGroup, flex: 1 }}>
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
                    </div>
                  </>
                ) : (
                  <>
                    <div style={styles.formSection}>
                      <div style={styles.sectionTitle}>基础信息</div>
                      <div style={styles.formRow}>
                        <div style={{ ...styles.formGroup, flex: 1 }}>
                          <label style={styles.label}>单位名称</label>
                          <input
                            style={styles.input}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>
                        <div style={{ ...styles.formGroup, flex: 1 }}>
                          <label style={styles.label}>单位代码</label>
                          <input
                            style={styles.input}
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            placeholder="例如: KG"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div style={styles.formSection}>
                      <div style={styles.sectionTitle}>分类设置</div>
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
                    </div>
                  </>
                )}
              </form>
            </div>
            <div style={styles.modalButtons}>
              <button type="button" style={styles.cancelButton} onClick={handleCloseModal}>
                取消
              </button>
              <button type="button" style={styles.submitButton} onClick={handleSubmit}>
                {editingItem ? '保存修改' : '添加'}
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
  tabs: {
    display: 'flex',
    gap: '4px',
    backgroundColor: '#F3F4F6',
    padding: '4px',
    borderRadius: 'var(--radius-lg)',
    width: 'fit-content',
  },
  tab: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text-tertiary)',
    transition: 'all var(--transition-fast)',
  },
  tabActive: {
    backgroundColor: 'var(--bg-secondary)',
    color: 'var(--text-primary)',
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
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
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: '16px',
    fontWeight: '700',
    color: 'var(--text-primary)',
    margin: 0,
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
  tdPrice: {
    padding: '14px 20px',
    fontSize: '14px',
    fontWeight: '700',
    color: 'var(--primary)',
  },
  defaultBadge: {
    padding: '4px 12px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: '#1cc88a',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '500',
  },
  categoryBadge: {
    padding: '4px 12px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: '#DBEAFE',
    color: 'var(--primary)',
    fontSize: '12px',
    fontWeight: '500',
  },
  setDefaultButton: {
    padding: '4px 12px',
    backgroundColor: '#FEF3C7',
    color: '#D97706',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
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
  checkboxGroup: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
  },
  checkboxLabel: {
    fontSize: '14px',
    color: 'var(--text-secondary)',
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
