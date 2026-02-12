import { useState } from 'react'

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
  const [editingItem, setEditingItem] = useState(null)
  const [formData, setFormData] = useState({})

  const handleAdd = (type) => {
    setEditingItem(null)
    if (type === 'markets') {
      setFormData({ name: '', code: '', currency: 'CNY', description: '', isActive: true })
    } else {
      setFormData({ name: '', type: 'online', commission: 0, description: '', isActive: true })
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
      if (type === 'markets') {
        setMarkets(markets.filter((m) => m.id !== id))
      } else {
        setChannels(channels.filter((c) => c.id !== id))
      }
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
    <div>
      <div style={styles.header}>
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

          <div style={styles.tableContainer}>
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
                      <strong>{market.name}</strong>
                    </td>
                    <td style={styles.td}>{market.code}</td>
                    <td style={styles.td}>{market.currency}</td>
                    <td style={styles.td}>{market.description}</td>
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
                      <button style={styles.deleteButton} onClick={() => handleDelete(market.id, 'markets')}>
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

          <div style={styles.tableContainer}>
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
                      <strong>{channel.name}</strong>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.typeBadge,
                        backgroundColor: channel.type === 'online' ? '#4e73df' : '#36b9cc',
                      }}>
                        {channel.type === 'online' ? '线上' : '线下'}
                      </span>
                    </td>
                    <td style={styles.td}>{channel.commission}%</td>
                    <td style={styles.td}>{channel.description}</td>
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
                      <button style={styles.deleteButton} onClick={() => handleDelete(channel.id, 'channels')}>
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
              {editingItem ? '编辑' : '添加'}{activeTab === 'markets' ? '市场' : '销售渠道'}
            </h3>
            <form onSubmit={handleSubmit}>
              {activeTab === 'markets' ? (
                <>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>市场名称</label>
                    <input
                      style={styles.input}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      required
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>市场代码</label>
                    <input
                      style={styles.input}
                      value={formData.code}
                      onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                      placeholder="例如: CN"
                      required
                    />
                  </div>
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
                </>
              ) : (
                <>
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
                  <div style={styles.formGroup}>
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
                      启用此渠道
                    </label>
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
  typeBadge: {
    padding: '4px 12px',
    borderRadius: '12px',
    color: '#fff',
    fontSize: '12px',
  },
  statusButton: {
    padding: '4px 12px',
    border: 'none',
    borderRadius: '4px',
    color: '#fff',
    fontSize: '12px',
    cursor: 'pointer',
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
