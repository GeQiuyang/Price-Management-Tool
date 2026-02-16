import { useState, useEffect, useRef } from 'react'

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

export default function Products() {
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('导管类')
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deletedProduct, setDeletedProduct] = useState(null)
  const [showUndoToast, setShowUndoToast] = useState(false)
  const deleteTimerRef = useRef(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '导管类',
    sku: '',
    price: '',
    description: '',
    status: 'active',
  })
  const [hoveredTemplate, setHoveredTemplate] = useState(null)

  const categories = [
    { id: '钻具类', name: '钻具类' },
    { id: '导管类', name: '导管类' },
    { id: '配件类', name: '配件类' },
  ]

  const productTemplates = {
    '导管类': [
      { name: '300尖丝导管', sku: '300JSDG', description: '300尖丝导管，长度{m}，厚度3mm', price: 300 },
      { name: '260方丝导管', sku: '260FSDG', description: '260方丝导管，长度{m}，厚度3.5mm', price: 200 },
      { name: '273母扣接头', sku: '273CT', description: '273母扣', price: 80 },
      { name: '钢丝绳', sku: 'SR-', description: '钢丝绳，长度{m}米', price: 50 },
      { name: '密封圈', sku: '260-O-ring', description: '260密封圈，线径8mm', price: 1 },
      { name: '料斗', sku: 'HP-1200-', description: '容积1.2立方米，壁厚3.5mm', price: 1500 },
    ],
    '钻具类': [
      { name: '赛迈斯宝石截齿60', sku: 'SMSCCBS60', description: '合金直径28mm', price: 270 },
      { name: '捞沙斗', sku: 'DB', description: '{size}mm', price: 6500 },
      { name: '筒钻', sku: 'CB', description: '{size}mm', price: 13000 },
      { name: '螺旋钻头', sku: 'LZZT', description: '{size}mm高效螺旋钻头', price: 800 },
    ],
    '配件类': [
      { name: '泥浆管', sku: 'MT', description: '口径4英寸，长度18米', price: 330 },
      { name: '泥浆泵', sku: 'MP', description: '{power}千瓦', price: 6500 },
      { name: '钻杆', sku: 'ZG', description: '钻杆，长度{m}米', price: 400 },
      { name: '加重钻杆', sku: 'JZZG', description: '加重钻杆，长度{m}米', price: 600 },
    ],
  }

  const applyTemplate = (template) => {
    setFormData({
      ...formData,
      name: template.name,
      sku: template.sku,
      description: template.description,
      price: template.price,
    })
  }

  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`)
      const data = await response.json()
      setProducts(data)
      setLoading(false)
    } catch (error) {
      console.error('获取产品列表失败:', error)
      setLoading(false)
    }
  }

  const handleAdd = () => {
    setEditingProduct(null)
    setFormData({ name: '', category: activeCategory, sku: '', price: '', description: '', status: 'active' })
    setIsClosing(false)
    setShowModal(true)
  }

  const handleEdit = (product) => {
    setEditingProduct(product)
    setFormData(product)
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

  const handleDelete = (product) => {
    setDeletedProduct(product)
    setProducts(prev => prev.filter(p => p.id !== product.id))
    setShowUndoToast(true)

    deleteTimerRef.current = setTimeout(() => {
      confirmDelete(product)
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

  const confirmDelete = async (product) => {
    const itemToDelete = product || deletedProduct
    if (itemToDelete) {
      try {
        await fetch(`${API_URL}/products/${itemToDelete.id}`, {
          method: 'DELETE',
        })
        await addToRecycleBin(itemToDelete, 'products')
      } catch (error) {
        console.error('删除产品失败:', error)
      }
    }
    setDeletedProduct(null)
    setShowUndoToast(false)
  }

  const handleUndoDelete = () => {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current)
    }
    if (deletedProduct) {
      setProducts(prev => [...prev, deletedProduct])
      setDeletedProduct(null)
      setShowUndoToast(false)
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingProduct) {
        const response = await fetch(`${API_URL}/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })
        if (response.ok) {
          fetchProducts()
        }
      } else {
        const response = await fetch(`${API_URL}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData),
        })
        if (response.ok) {
          fetchProducts()
        }
      }
      handleCloseModal()
    } catch (error) {
      console.error('保存产品失败:', error)
    }
  }

  const getProductsByCategory = (category) => {
    return products.filter((p) => p.category === category)
  }

  const getDisplayProducts = () => {
    if (searchQuery.trim()) {
      const lowerQuery = searchQuery.toLowerCase()
      return products.filter((p) =>
        p.sku.toLowerCase().includes(lowerQuery) ||
        p.name.toLowerCase().includes(lowerQuery) ||
        (p.description && p.description.toLowerCase().includes(lowerQuery))
      )
    }
    return getProductsByCategory(activeCategory)
  }

  if (loading) {
    return <div style={styles.loading}>加载中...</div>
  }

  return (
    <div style={styles.container}>
      {showUndoToast && (
        <div
          style={styles.undoToast}
          onMouseEnter={() => deleteTimerRef.current && clearTimeout(deleteTimerRef.current)}
          onMouseLeave={() => {
            if (deletedProduct && !showUndoToast) return
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
              <div style={styles.undoToastTitle}>产品已删除</div>
              <div style={styles.undoToastDesc}>5秒后自动消失</div>
            </div>
          </div>
          <button style={styles.undoButton} onClick={handleUndoDelete}>
            撤销
          </button>
        </div>
      )}

      <div style={styles.topBar}>
        <h2 style={styles.pageTitle}>产品目录管理</h2>
        <div style={styles.topActions}>
          <input
            type="text"
            style={styles.searchInput}
            placeholder="搜索SKU、产品名称..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button style={styles.addButton} onClick={handleAdd}>
            添加产品
          </button>
        </div>
      </div>

      <div style={styles.tabsContainer}>
        {categories.map((cat) => (
          <button
            key={cat.id}
            style={{
              ...styles.tab,
              ...(activeCategory === cat.id ? styles.tabActive : {}),
            }}
            onClick={() => setActiveCategory(cat.id)}
          >
            {cat.name}
            <span style={styles.tabCount}>
              {getProductsByCategory(cat.id).length}
            </span>
          </button>
        ))}
      </div>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>SKU</th>
              <th style={styles.th}>产品</th>
              <th style={styles.th}>价格</th>
              <th style={styles.th}>操作</th>
            </tr>
          </thead>
          <tbody>
            {getDisplayProducts().map((product) => (
              <tr key={product.id} style={styles.tableRow}>
                <td style={styles.tdSecondary}>{product.sku}</td>
                <td style={styles.td}>
                  <span style={styles.productName}>{product.name}</span>
                  <span style={styles.productDesc}> · {product.description}</span>
                </td>
                <td style={styles.tdPrice}>¥{Number(product.price).toLocaleString()}</td>
                <td style={styles.td}>
                  <button style={styles.editButton} onClick={() => handleEdit(product)}>
                    编辑
                  </button>
                  <button style={styles.deleteButton} onClick={() => handleDelete(product)}>
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
            <h3 style={styles.modalTitle}>{editingProduct ? '编辑产品' : '添加产品'}</h3>
            {!editingProduct && (
              <div style={styles.templateSection}>
                <div style={styles.templateTitle}>快速添加模板</div>
                <div style={styles.templateList}>
                  {productTemplates[formData.category]?.map((template, index) => (
                    <button
                      key={index}
                      type="button"
                      style={{
                        ...styles.templateButton,
                        ...(hoveredTemplate === index ? styles.templateButtonHover : {}),
                      }}
                      onClick={() => applyTemplate(template)}
                      onMouseEnter={() => setHoveredTemplate(index)}
                      onMouseLeave={() => setHoveredTemplate(null)}
                    >
                      {template.name}
                    </button>
                  ))}
                </div>
              </div>
            )}
            <div style={styles.formScroll}>
              <form onSubmit={handleSubmit}>
                <div style={styles.formSection}>
                  <div style={styles.sectionTitle}>基础信息</div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>产品名称</label>
                    <input
                      style={styles.input}
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>分类</label>
                      <select
                        style={styles.input}
                        value={formData.category}
                        onChange={(e) => {
                          const newCategory = e.target.value
                          setFormData({ ...formData, category: newCategory, name: '', sku: '', description: '', price: '' })
                        }}
                      >
                        {categories.map((cat) => (
                          <option key={cat.id} value={cat.id}>{cat.name}</option>
                        ))}
                      </select>
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                      <label style={styles.label}>状态</label>
                      <select
                        style={styles.input}
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      >
                        <option value="active">启用</option>
                        <option value="inactive">禁用</option>
                      </select>
                    </div>
                  </div>
                </div>

                <div style={styles.formSection}>
                  <div style={styles.sectionTitle}>规格信息</div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>规格描述</label>
                    <input
                      style={styles.input}
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    />
                  </div>
                  <div style={styles.formGroup}>
                    <label style={styles.label}>价格</label>
                    <input
                      type="number"
                      style={styles.input}
                      value={formData.price}
                      onChange={(e) => setFormData({ ...formData, price: e.target.value })}
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
                {editingProduct ? '保存修改' : '添加'}
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
    backgroundColor: '#FFFFFF',
    borderRadius: '12px',
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    border: '1px solid #E5E7EB',
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
    color: '#111827',
  },
  undoToastDesc: {
    fontSize: '12px',
    color: '#9CA3AF',
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
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '200px',
    fontSize: '16px',
    color: 'var(--text-secondary)',
  },
  header: {
    display: 'flex',
    marginBottom: '28px',
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
  searchInput: {
    padding: '10px 16px',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-md)',
    fontSize: '14px',
    width: '260px',
    outline: 'none',
    backgroundColor: 'var(--bg-secondary)',
    transition: 'all var(--transition-fast)',
    boxShadow: 'var(--shadow-sm)',
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
    letterSpacing: '-0.1px',
  },
  tabsContainer: {
    display: 'flex',
    gap: '4px',
    backgroundColor: 'var(--bg-secondary)',
    padding: '6px',
    borderRadius: 'var(--radius-md)',
    border: '1px solid var(--border)',
    boxShadow: 'var(--shadow-sm)',
  },
  tab: {
    padding: '10px 20px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: 'var(--text-secondary)',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    transition: 'all var(--transition-fast)',
  },
  tabActive: {
    background: 'var(--gradient-primary)',
    color: '#fff',
    boxShadow: '0 2px 8px rgba(79, 70, 229, 0.3)',
  },
  tabCount: {
    fontSize: '12px',
    padding: '2px 8px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tableCard: {
    backgroundColor: 'var(--bg-secondary)',
    borderRadius: 'var(--radius-lg)',
    border: '1px solid var(--border)',
    overflow: 'hidden',
    boxShadow: 'var(--shadow-card)',
    transition: 'box-shadow var(--transition-base)',
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
    cursor: 'default',
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
  productDesc: {
    fontSize: '13px',
    fontWeight: '400',
    color: 'var(--text-tertiary)',
    marginTop: '2px',
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
  templateSection: {
    padding: '16px 24px',
    backgroundColor: 'var(--bg-tertiary)',
    borderBottom: '1px solid var(--border)',
  },
  templateTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: 'var(--text-tertiary)',
    marginBottom: '10px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  templateList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
  },
  templateButton: {
    padding: '6px 12px',
    backgroundColor: 'var(--bg-secondary)',
    border: '1px solid var(--border)',
    borderRadius: 'var(--radius-sm)',
    cursor: 'pointer',
    fontSize: '12px',
    color: 'var(--text-secondary)',
    transition: 'all var(--transition-fast)',
  },
  templateButtonHover: {
    backgroundColor: 'var(--primary-bg)',
    borderColor: 'var(--primary)',
    color: 'var(--primary)',
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
