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

export default function MarketsChannels() {
  const [activeTab, setActiveTab] = useState('markets')

  const [markets, setMarkets] = useState([
    { id: 1, name: '中国大陆', code: 'CN', currency: 'CNY', description: '国内市场', isActive: true },
    { id: 2, name: '美国', code: 'US', currency: 'USD', description: '北美市场', isActive: true },
    { id: 3, name: '欧洲', code: 'EU', currency: 'EUR', description: '欧洲市场', isActive: true },
    { id: 4, name: '东南亚', code: 'SEA', currency: 'USD', description: '东南亚市场', isActive: false },
  ])

  const [channels, setChannels] = useState([
    { id: 1, name: '官方网站', type: 'online', commission: 0, description: '公司自营网站', isActive: true },
    { id: 2, name: '天猫旗舰店', type: 'online', commission: 5, description: '天猫平台', isActive: true },
    { id: 3, name: '京东自营', type: 'online', commission: 8, description: '京东平台', isActive: true },
    { id: 4, name: '线下门店', type: 'offline', commission: 0, description: '实体零售店', isActive: true },
    { id: 5, name: '分销商', type: 'offline', commission: 15, description: '第三方分销渠道', isActive: true },
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
    if (type === 'markets') {
      setFormData({ name: '', code: '', currency: 'CNY', description: '', isActive: true })
    } else {
      setFormData({ name: '', type: 'online', commission: 0, description: '', isActive: true })
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
    setDeletedItem(item)
    setDeletedType(type)
    if (type === 'markets') {
      setMarkets(prev => prev.filter(m => m.id !== item.id))
    } else {
      setChannels(prev => prev.filter(c => c.id !== item.id))
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
      if (deletedType === 'markets') {
        setMarkets(prev => [...prev, deletedItem])
      } else {
        setChannels(prev => [...prev, deletedItem])
      }
      setDeletedItem(null)
      setDeletedType(null)
      setShowUndoToast(false)
    }
  }

  const handleToggleActive = (id, type) => {
    if (type === 'markets') {
      setMarkets(markets.map((m) => (m.id === id ? { ...m, isActive: !m.isActive } : m)))
    } else {
      setChannels(channels.map((c) => (c.id === id ? { ...c, isActive: !c.isActive } : c)))
    }
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (activeTab === 'markets') {
      if (editingItem) {
        setMarkets(markets.map((m) => (m.id === editingItem.id ? { ...formData, id: m.id } : m)))
      } else {
        setMarkets([...markets, { ...formData, id: Date.now() }])
      }
    } else {
      if (editingItem) {
        setChannels(channels.map((c) => (c.id === editingItem.id ? { ...formData, id: c.id } : c)))
      } else {
        setChannels([...channels, { ...formData, id: Date.now() }])
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
              <div style={styles.undoToastTitle}>{deletedType === 'markets' ? '市场已删除' : '销售渠道已删除'}</div>
              <div style={styles.undoToastDesc}>5秒后自动消失</div>
            </div>
          </div>
          <button style={styles.undoButton} onClick={handleUndoDelete}>
            撤销
          </button>
        </div>
      )}

      <div style={styles.topBar}>
        <h2 style={styles.pageTitle}>市场与渠道管理</h2>
      </div>

      <div style={styles.tabs}>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'markets' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('markets')}
        >
          市场管理
        </button>
        <button
          style={{
            ...styles.tab,
            ...(activeTab === 'channels' ? styles.tabActive : {}),
          }}
          onClick={() => setActiveTab('channels')}
        >
          销售渠道
        </button>
      </div>

      {activeTab === 'markets' ? (
        <>
          <div style={styles.summaryCards}>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>市场总数</div>
              <div style={styles.summaryValue}>{markets.length}</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>活跃市场</div>
              <div style={styles.summaryValue}>{markets.filter((m) => m.isActive).length}</div>
            </div>
          </div>

          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>市场列表</h3>
            <button style={styles.addButton} onClick={() => handleAdd('markets')}>
              添加市场
            </button>
          </div>

          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>市场名称</th>
                  <th style={styles.th}>市场代码</th>
                  <th style={styles.th}>货币</th>
                  <th style={styles.th}>描述</th>
                  <th style={styles.th}>状态</th>
                  <th style={styles.th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {markets.map((market) => (
                  <tr key={market.id} style={styles.tableRow}>
                    <td style={styles.td}>
                      <span style={styles.productName}>{market.name}</span>
                    </td>
                    <td style={styles.tdSecondary}>{market.code}</td>
                    <td style={styles.tdSecondary}>{market.currency}</td>
                    <td style={styles.tdSecondary}>{market.description}</td>
                    <td style={styles.td}>
                      <button
                        style={{
                          ...styles.statusButton,
                          backgroundColor: market.isActive ? '#1cc88a' : '#6c757d',
                        }}
                        onClick={() => handleToggleActive(market.id, 'markets')}
                      >
                        {market.isActive ? '活跃' : '停用'}
                      </button>
                    </td>
                    <td style={styles.td}>
                      <button style={styles.editButton} onClick={() => handleEdit(market, 'markets')}>
                        编辑
                      </button>
                      <button style={styles.deleteButton} onClick={() => handleDelete(market, 'markets')}>
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
              <div style={styles.summaryLabel}>渠道总数</div>
              <div style={styles.summaryValue}>{channels.length}</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>活跃渠道</div>
              <div style={styles.summaryValue}>{channels.filter((c) => c.isActive).length}</div>
            </div>
            <div style={styles.summaryCard}>
              <div style={styles.summaryLabel}>平均佣金率</div>
              <div style={styles.summaryValue}>
                {(channels.reduce((sum, c) => sum + c.commission, 0) / channels.length || 0).toFixed(1)}%
              </div>
            </div>
          </div>

          <div style={styles.sectionHeader}>
            <h3 style={styles.sectionTitle}>销售渠道列表</h3>
            <button style={styles.addButton} onClick={() => handleAdd('channels')}>
              添加渠道
            </button>
          </div>

          <div style={styles.tableCard}>
            <table style={styles.table}>
              <thead>
                <tr style={styles.tableHeader}>
                  <th style={styles.th}>渠道名称</th>
                  <th style={styles.th}>类型</th>
                  <th style={styles.th}>佣金率</th>
                  <th style={styles.th}>描述</th>
                  <th style={styles.th}>状态</th>
                  <th style={styles.th}>操作</th>
                </tr>
              </thead>
              <tbody>
                {channels.map((channel) => (
                  <tr key={channel.id} style={styles.tableRow}>
                    <td style={styles.td}>
                      <span style={styles.productName}>{channel.name}</span>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.typeBadge,
                        backgroundColor: channel.type === 'online' ? '#DBEAFE' : '#D1FAE5',
                        color: channel.type === 'online' ? '#2563EB' : '#059669',
                      }}>
                        {channel.type === 'online' ? '线上' : '线下'}
                      </span>
                    </td>
                    <td style={styles.tdPrice}>{channel.commission}%</td>
                    <td style={styles.tdSecondary}>{channel.description}</td>
                    <td style={styles.td}>
                      <button
                        style={{
                          ...styles.statusButton,
                          backgroundColor: channel.isActive ? '#1cc88a' : '#6c757d',
                        }}
                        onClick={() => handleToggleActive(channel.id, 'channels')}
                      >
                        {channel.isActive ? '活跃' : '停用'}
                      </button>
                    </td>
                    <td style={styles.td}>
                      <button style={styles.editButton} onClick={() => handleEdit(channel, 'channels')}>
                        编辑
                      </button>
                      <button style={styles.deleteButton} onClick={() => handleDelete(channel, 'channels')}>
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
              {editingItem ? '编辑' : '添加'}{activeTab === 'markets' ? '市场' : '销售渠道'}
            </h3>
            <div style={styles.formScroll}>
              <form onSubmit={handleSubmit}>
                {activeTab === 'markets' ? (
                  <>
                    <div style={styles.formSection}>
                      <div style={styles.sectionTitle}>基础信息</div>
                      <div style={styles.formRow}>
                        <div style={{ ...styles.formGroup, flex: 1 }}>
                          <label style={styles.label}>市场名称</label>
                          <input
                            style={styles.input}
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            required
                          />
                        </div>
                        <div style={{ ...styles.formGroup, flex: 1 }}>
                          <label style={styles.label}>市场代码</label>
                          <input
                            style={styles.input}
                            value={formData.code}
                            onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                            placeholder="例如: CN"
                            required
                          />
                        </div>
                      </div>
                    </div>

                    <div style={styles.formSection}>
                      <div style={styles.sectionTitle}>市场设置</div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>货币</label>
                        <select
                          style={styles.input}
                          value={formData.currency}
                          onChange={(e) => setFormData({ ...formData, currency: e.target.value })}
                        >
                          <option value="CNY">人民币 (CNY)</option>
                          <option value="USD">美元 (USD)</option>
                          <option value="EUR">欧元 (EUR)</option>
                          <option value="JPY">日元 (JPY)</option>
                          <option value="GBP">英镑 (GBP)</option>
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
                          id="isActive"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        />
                        <label htmlFor="isActive" style={styles.checkboxLabel}>
                          启用此市场
                        </label>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div style={styles.formSection}>
                      <div style={styles.sectionTitle}>基础信息</div>
                      <div style={styles.formGroup}>
                        <label style={styles.label}>渠道名称</label>
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
                      <div style={styles.sectionTitle}>渠道设置</div>
                      <div style={styles.formRow}>
                        <div style={{ ...styles.formGroup, flex: 1 }}>
                          <label style={styles.label}>渠道类型</label>
                          <select
                            style={styles.input}
                            value={formData.type}
                            onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                          >
                            <option value="online">线上</option>
                            <option value="offline">线下</option>
                          </select>
                        </div>
                        <div style={{ ...styles.formGroup, flex: 1 }}>
                          <label style={styles.label}>佣金率 (%)</label>
                          <input
                            type="number"
                            step="0.01"
                            min="0"
                            max="100"
                            style={styles.input}
                            value={formData.commission}
                            onChange={(e) => setFormData({ ...formData, commission: e.target.value })}
                            required
                          />
                        </div>
                      </div>
                      <div style={styles.checkboxGroup}>
                        <input
                          type="checkbox"
                          id="isActive"
                          checked={formData.isActive}
                          onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                        />
                        <label htmlFor="isActive" style={styles.checkboxLabel}>
                          启用此渠道
                        </label>
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
  typeBadge: {
    padding: '4px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '12px',
    fontWeight: '500',
  },
  statusButton: {
    padding: '4px 12px',
    border: 'none',
    borderRadius: 'var(--radius-sm)',
    color: '#fff',
    fontSize: '12px',
    fontWeight: '500',
    cursor: 'pointer',
    transition: 'opacity 0.15s',
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
