import { useState, useEffect, useRef } from 'react'

const API_URL = 'http://localhost:3001/api'

const modalAnimationStyles = `
  @keyframes modalFadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes modalSlideIn {
    from { opacity: 0; transform: scale(0.9) translateY(-20px); }
    to { opacity: 1; transform: scale(1) translateY(0); }
  }
  @keyframes modalFadeOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  @keyframes modalSlideOut {
    from { opacity: 1; transform: scale(1) translateY(0); }
    to { opacity: 0; transform: scale(0.9) translateY(-20px); }
  }
  @keyframes toastSlideIn {
    from { opacity: 0; transform: translateX(20px); }
    to { opacity: 1; transform: translateX(0); }
  }
`

const CUSTOMER_TYPES = ['终端', '经销商']

const COUNTRIES = ['中国', '马来西亚', '新加坡', '越南', '印度尼西亚', '泰国', '澳大利亚']

const CITIES_BY_COUNTRY = {
  '中国': [
    '北京', '上海', '广州', '深圳', '天津', '重庆', '成都', '杭州', '武汉', '南京',
    '苏州', '西安', '长沙', '沈阳', '青岛', '郑州', '大连', '东莞', '宁波', '厦门',
    '福州', '无锡', '合肥', '昆明', '哈尔滨', '济南', '佛山', '长春', '温州', '石家庄',
    '南宁', '常州', '泉州', '南昌', '贵阳', '太原', '烟台', '嘉兴', '南通', '金华',
    '珠海', '惠州', '徐州', '海口', '乌鲁木齐', '绍兴', '中山', '台州', '兰州', '洛阳',
    '潍坊', '保定', '镇江', '扬州', '桂林', '唐山', '三亚', '湖州', '呼和浩特', '廊坊',
    '银川', '西宁', '芜湖', '漳州', '连云港', '淄博', '衡阳', '柳州', '汕头', '遵义',
    '邯郸', '江门', '泰州', '株洲', '包头', '威海', '宜昌', '鞍山', '临沂', '常德',
    '咸阳', '盐城', '济宁', '岳阳', '湛江', '秦皇岛', '许昌', '赣州', '九江', '新乡',
    '德阳', '绵阳', '宜宾', '南充', '达州', '襄阳', '荆州', '大庆', '拉萨',
  ],
  '马来西亚': [
    '吉隆坡', '槟城', '新山', '马六甲', '怡保', '亚庇', '古晋', '关丹', '芙蓉', '莎阿南',
    '八打灵再也', '梳邦再也', '巴生', '太平', '民都鲁', '诗巫', '山打根',
  ],
  '新加坡': ['新加坡'],
  '越南': [
    '胡志明市', '河内', '海防', '岘港', '芽庄', '头顿', '顺化', '大叻', '富国岛', '归仁',
    '芹苴', '太原', '平阳', '同奈', '隆安', '永福',
  ],
  '印度尼西亚': [
    '雅加达', '泗水', '万隆', '棉兰', '三宝垄', '望加锡', '巴淡', '巨港', '日惹', '登巴萨',
    '万鸦老', '坤甸', '巴厘巴板', '马辰', '北干巴鲁',
  ],
  '泰国': [
    '曼谷', '清迈', '普吉', '芭提雅', '素叻他尼', '合艾', '呵叻', '孔敬', '乌汶', '清莱',
    '罗勇', '春武里', '北柳', '暖武里', '巴吞他尼',
  ],
  '澳大利亚': [
    '悉尼', '墨尔本', '布里斯班', '珀斯', '阿德莱德', '堪培拉', '黄金海岸', '纽卡斯尔',
    '霍巴特', '达尔文', '凯恩斯', '汤斯维尔', '伍伦贡',
  ],
}

export default function Customers() {
  const [customers, setCustomers] = useState([])

  useEffect(() => {
    fetchCustomers()
  }, [])

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_URL}/customers`)
      const data = await res.json()
      setCustomers(data)
    } catch (err) {
      console.error('获取客户失败:', err)
    }
  }

  const [showModal, setShowModal] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [editingCustomer, setEditingCustomer] = useState(null)
  const [deletedCustomer, setDeletedCustomer] = useState(null)
  const [showUndoToast, setShowUndoToast] = useState(false)
  const deleteTimerRef = useRef(null)
  const [formData, setFormData] = useState({
    customer_type: '终端',
    country: '中国',
    city: '',
    contact: '',
    deal_count: 0,
  })

  const handleAdd = () => {
    setEditingCustomer(null)
    setFormData({ customer_type: '终端', country: '中国', city: '', contact: '', deal_count: 0 })
    setIsClosing(false)
    setShowModal(true)
  }

  const handleEdit = (customer) => {
    setEditingCustomer(customer)
    setFormData(customer)
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

  const handleDelete = (customer) => {
    setDeletedCustomer(customer)
    setCustomers(prev => prev.filter(c => c.id !== customer.id))
    setShowUndoToast(true)
    deleteTimerRef.current = setTimeout(() => {
      confirmDelete(customer)
    }, 5000)
  }

  const addToRecycleBin = async (item, type) => {
    try {
      await fetch(`${API_URL}/recycle-bin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ itemType: type, itemId: item.id, itemData: item }),
      })
      window.dispatchEvent(new CustomEvent('recycleBin-updated'))
    } catch (error) {
      console.error('添加到回收站失败:', error)
    }
  }

  const confirmDelete = async (customer) => {
    const itemToDelete = customer || deletedCustomer
    if (itemToDelete) {
      try {
        await fetch(`${API_URL}/customers/${itemToDelete.id}`, { method: 'DELETE' })
        await addToRecycleBin(itemToDelete, 'customers')
      } catch (err) {
        console.error('删除失败:', err)
      }
    }
    setDeletedCustomer(null)
    setShowUndoToast(false)
  }

  const handleUndoDelete = () => {
    if (deleteTimerRef.current) clearTimeout(deleteTimerRef.current)
    if (deletedCustomer) {
      setCustomers(prev => [...prev, deletedCustomer])
      setDeletedCustomer(null)
      setShowUndoToast(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    const payload = {
      customer_type: formData.customer_type,
      country: formData.country,
      city: formData.city,
      contact: formData.contact,
      deal_count: Number(formData.deal_count) || 0,
    }
    try {
      if (editingCustomer) {
        await fetch(`${API_URL}/customers/${editingCustomer.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      } else {
        await fetch(`${API_URL}/customers`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        })
      }
      await fetchCustomers()
      setShowModal(false)
    } catch (err) {
      console.error('保存客户失败:', err)
    }
  }

  const handleCountryChange = (country) => {
    setFormData({ ...formData, country, city: '' })
  }

  const availableCities = CITIES_BY_COUNTRY[formData.country] || []

  const terminalCount = customers.filter(c => c.customer_type === '终端').length
  const distributorCount = customers.filter(c => c.customer_type === '经销商').length
  const totalDeals = customers.reduce((sum, c) => sum + (Number(c.deal_count) || 0), 0)

  return (
    <div style={styles.container}>
      {showUndoToast && (
        <div
          style={styles.undoToast}
          onMouseEnter={() => deleteTimerRef.current && clearTimeout(deleteTimerRef.current)}
          onMouseLeave={() => {
            if (deletedCustomer && !showUndoToast) return
            deleteTimerRef.current = setTimeout(() => confirmDelete(), 5000)
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
              <div style={styles.undoToastTitle}>客户已删除</div>
              <div style={styles.undoToastDesc}>5秒后自动消失</div>
            </div>
          </div>
          <button style={styles.undoButton} onClick={handleUndoDelete}>撤销</button>
        </div>
      )}

      <div style={styles.topBar}>
        <h2 style={styles.pageTitle}>客户类型</h2>
        <div style={styles.topActions}>
          <button style={styles.addButton} onClick={handleAdd}>添加客户</button>
        </div>
      </div>

      <div style={styles.summaryCards}>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>客户总数</div>
          <div style={styles.summaryValue}>{customers.length}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>终端客户</div>
          <div style={styles.summaryValue}>{terminalCount}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>经销商</div>
          <div style={styles.summaryValue}>{distributorCount}</div>
        </div>
        <div style={styles.summaryCard}>
          <div style={styles.summaryLabel}>总成交次数</div>
          <div style={styles.summaryValue}>{totalDeals}</div>
        </div>
      </div>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>客户类型</th>
              <th style={styles.th}>国家</th>
              <th style={styles.th}>城市</th>
              <th style={styles.th}>联系方式</th>
              <th style={styles.th}>成交次数</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr key={customer.id} style={styles.tableRow}>
                <td style={styles.td}>
                  <span style={{
                    ...styles.typeBadge,
                    backgroundColor: customer.customer_type === '终端' ? '#DBEAFE' : '#FEF3C7',
                    color: customer.customer_type === '终端' ? '#1D4ED8' : '#92400E',
                  }}>
                    {customer.customer_type}
                  </span>
                </td>
                <td style={styles.td}>{customer.country}</td>
                <td style={styles.td}>{customer.city}</td>
                <td style={styles.tdSecondary}>{customer.contact}</td>
                <td style={styles.td}>
                  <span style={styles.dealBadge}>{customer.deal_count}</span>
                </td>
                <td style={styles.td}>
                  <button style={styles.editButton} onClick={() => handleEdit(customer)}>编辑</button>
                  <button style={styles.deleteButton} onClick={() => handleDelete(customer)}>删除</button>
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
            <h3 style={styles.modalTitle}>{editingCustomer ? '编辑客户' : '添加客户'}</h3>
            <div style={styles.formScroll}>
              <form onSubmit={handleSubmit}>
                <div style={styles.formSection}>
                  <div style={styles.sectionTitle}>客户信息</div>

                  <div style={styles.formGroup}>
                    <label style={styles.label}>客户类型</label>
                    <select
                      style={styles.select}
                      value={formData.customer_type}
                      onChange={(e) => setFormData({ ...formData, customer_type: e.target.value })}
                      required
                    >
                      {CUSTOMER_TYPES.map(t => (
                        <option key={t} value={t}>{t}</option>
                      ))}
                    </select>
                  </div>

                  <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>国家</label>
                      <select
                        style={styles.select}
                        value={formData.country}
                        onChange={(e) => handleCountryChange(e.target.value)}
                        required
                      >
                        {COUNTRIES.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>城市</label>
                      <select
                        style={styles.select}
                        value={formData.city}
                        onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                        required
                      >
                        <option value="">请选择城市</option>
                        {availableCities.map(c => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>联系方式</label>
                      <input
                        style={styles.input}
                        value={formData.contact}
                        onChange={(e) => setFormData({ ...formData, contact: e.target.value })}
                        placeholder="电话/邮箱"
                      />
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>成交次数</label>
                      <input
                        type="number"
                        min="0"
                        style={styles.input}
                        value={formData.deal_count}
                        onChange={(e) => setFormData({ ...formData, deal_count: e.target.value })}
                      />
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div style={styles.modalButtons}>
              <button type="button" style={styles.cancelButton} onClick={handleCloseModal}>取消</button>
              <button type="button" style={styles.submitButton} onClick={handleSubmit}>
                {editingCustomer ? '保存修改' : '添加'}
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
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
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
  typeBadge: {
    padding: '4px 12px',
    borderRadius: 'var(--radius-sm)',
    fontSize: '13px',
    fontWeight: '600',
  },
  dealBadge: {
    padding: '4px 12px',
    borderRadius: 'var(--radius-sm)',
    backgroundColor: '#ECFDF5',
    color: '#059669',
    fontSize: '13px',
    fontWeight: '600',
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
    width: '540px',
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
    boxSizing: 'border-box',
  },
  select: {
    width: '100%',
    padding: '10px 14px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    fontSize: '14px',
    backgroundColor: 'var(--bg-secondary)',
    transition: 'all var(--transition-fast)',
    cursor: 'pointer',
    boxSizing: 'border-box',
    appearance: 'auto',
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
