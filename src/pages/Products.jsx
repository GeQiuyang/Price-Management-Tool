import { useState, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const API_URL = 'http://localhost:3001/api'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

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
  const [activeCategory, setActiveCategory] = useState('钻具类')
  const [searchQuery, setSearchQuery] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [deletedProduct, setDeletedProduct] = useState(null)
  const [showUndoToast, setShowUndoToast] = useState(false)
  const [deletingProductIds, setDeletingProductIds] = useState([])
  const deleteTimerRef = useRef(null)
  const [formData, setFormData] = useState({
    name: '',
    category: '钻具类',
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

  const generateSKUTable = () => {
    const tableData = []
    
    const pipeModels = [300, 260, 273]
    const pipeThicknesses = { 300: [3, 3.5, 4], 260: [3, 3.5, 4], 273: [0] }
    const pipeLengths = [1.5, 2, 2.5, 3, 4, 6]
    const pipePrices = {
      '300-S': 351,
      '300-Q': 356,
      '260-S': 280,
      '260-Q': 285,
      '273-S': 80,
    }
    
    pipeModels.forEach(model => {
      pipeThicknesses[model].forEach(thickness => {
        pipeLengths.forEach(length => {
          const threadCodes = model === 273 ? ['S'] : ['S', 'Q']
          threadCodes.forEach(thread => {
            const sku = `TP${model}-${thickness}-${length}m-${thread}`
            const threadName = thread === 'S' ? '尖丝' : '方丝'
            const productName = `${model}导管 (${threadName}) · ${length}m`
            const price = pipePrices[`${model}-${thread}`] || 0
            const specDescription = thickness > 0 ? `壁厚${thickness}mm，长度${length}m` : '母扣接头'
            
            tableData.push({
              sku,
              product: productName,
              price: `¥${price}`,
              specDescription,
            })
          })
        })
      })
    })
    
    const bitTypes = [
      { sku: 'BT-60-60-24', product: '赛迈斯宝石截齿60 · 60-24', price: '¥270', specDescription: '合金直径28mm，适合土层' },
      { sku: 'BT-60-60-24-R', product: '赛迈斯宝石截齿60 · 60-24', price: '¥290', specDescription: '合金直径28mm，适合岩层' },
    ]
    tableData.push(...bitTypes)
    
    const toolTypes = [
      { sku: 'DB-1200-20', product: '捞沙斗 · 1200mm', price: '¥6500', specDescription: '1200mm，壁厚20mm' },
      { sku: 'DB-1500-20', product: '捞沙斗 · 1500mm', price: '¥7500', specDescription: '1500mm，壁厚20mm' },
      { sku: 'CB-1200-20', product: '筒钻 · 1200mm', price: '¥13000', specDescription: '1200mm，壁厚20mm' },
      { sku: 'CB-1500-20', product: '筒钻 · 1500mm', price: '¥15000', specDescription: '1500mm，壁厚20mm' },
      { sku: 'LZZT-1200-20', product: '螺旋钻头 · 1200mm', price: '¥800', specDescription: '1200mm，壁厚20mm高效螺旋钻头' },
    ]
    tableData.push(...toolTypes)
    
    const accessoryTypes = [
      { sku: 'MT-18-4', product: '泥浆管 · 18m', price: '¥330', specDescription: '口径4英寸，长度18m' },
      { sku: 'MP-75', product: '泥浆泵 · 75kW', price: '¥6500', specDescription: '75千瓦' },
      { sku: 'ZG-3-89', product: '钻杆 · 3m', price: '¥400', specDescription: '钻杆，长度3m，直径89mm' },
      { sku: 'JZZG-3-89', product: '加重钻杆 · 3m', price: '¥600', specDescription: '加重钻杆，长度3m，直径89mm' },
    ]
    tableData.push(...accessoryTypes)
    
    return tableData
  }

  const productTemplates = {
    '导管类': [
      { name: '300导管 (尖丝)', sku: 'TP3-{thickness}-{length}m-S', description: '壁厚{thickness}mm，尖丝', price: 351 },
      { name: '300导管 (方丝)', sku: 'TP3-{thickness}-{length}m-Q', description: '壁厚{thickness}mm，方丝', price: 356 },
      { name: '260导管 (尖丝)', sku: 'TP26-{thickness}-{length}m-S', description: '壁厚{thickness}mm，尖丝', price: 291 },
      { name: '260导管 (方丝)', sku: 'TP26-{thickness}-{length}m-Q', description: '壁厚{thickness}mm，方丝', price: 296 },
      { name: '273母扣接头', sku: 'TP27-0-0m-S', description: '母扣接头', price: 80 },
    ],
    '钻具类': [
      { name: '捞沙斗', sku: 'DB-{size}-{thickness}', description: '{size}mm，壁厚{thickness}mm', price: 6500 },
      { name: '筒钻', sku: 'CB-{size}-{thickness}', description: '{size}mm，壁厚{thickness}mm', price: 13000 },
      { name: '螺旋钻头', sku: 'LZZT-{size}-{thickness}', description: '{size}mm，壁厚{thickness}mm高效螺旋钻头', price: 800 },
    ],
    '配件类': [
      { name: '泥浆管', sku: 'MT-18-4', description: '口径4英寸，长度18m', price: 330 },
      { name: '泥浆泵', sku: 'MP-{power}', description: '{power}千瓦', price: 6500 },
      { name: '钻杆', sku: 'ZG-{m}-{diameter}', description: '钻杆，长度{m}，直径{diameter}mm', price: 400 },
      { name: '加重钻杆', sku: 'JZZG-{m}-{diameter}', description: '加重钻杆，长度{m}，直径{diameter}mm', price: 600 },
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
    const savedDeletingIds = localStorage.getItem('deletingProductIds')
    if (savedDeletingIds) {
      const parsedIds = JSON.parse(savedDeletingIds)
      setDeletingProductIds(parsedIds)
    }
  }, [])

  useEffect(() => {
    fetchProducts()
  }, [deletingProductIds])

  useEffect(() => {
    if (deletingProductIds.length > 0) {
      localStorage.setItem('deletingProductIds', JSON.stringify(deletingProductIds))
    } else {
      localStorage.removeItem('deletingProductIds')
    }
  }, [deletingProductIds])

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`)
      const data = await response.json()
      const filteredData = data.filter(p => !deletingProductIds.includes(p.id))
      setProducts(filteredData)
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
    setDeletingProductIds(prev => [...prev, product.id])
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
          headers: {
            ...getAuthHeaders(),
          },
        })
        await addToRecycleBin(itemToDelete, 'products')
      } catch (error) {
        console.error('删除产品失败:', error)
      }
    }
    setDeletedProduct(null)
    setDeletingProductIds(prev => prev.filter(id => id !== itemToDelete?.id))
    setShowUndoToast(false)
  }

  const handleUndoDelete = () => {
    if (deleteTimerRef.current) {
      clearTimeout(deleteTimerRef.current)
    }
    if (deletedProduct) {
      setProducts(prev => [...prev, deletedProduct])
      setDeletingProductIds(prev => prev.filter(id => id !== deletedProduct.id))
      setDeletedProduct(null)
      setShowUndoToast(false)
    }
  }

  const parseSKU = (sku) => {
    if (!sku) return null
    
    const parts = sku.split('-')
    const prefix = parts[0]
    
    if (prefix.startsWith('TP')) {
      const seriesCode = parts[1] || ''
      const modelMap = { '3': 300, '26': 260, '27': 273 }
      return {
        type: 'pipe',
        model: modelMap[seriesCode] || seriesCode,
        thickness: parts[2] || '',
        length: parts[3] || '',
        thread: parts[4] || '',
      }
    } else if (prefix.startsWith('BT')) {
      return {
        type: 'bit',
        series: parts[1] || '',
        model: parts[2] || '',
      }
    } else if (prefix === 'DB' || prefix === 'CB' || prefix.startsWith('LZZT')) {
      return {
        type: 'tool',
        code: prefix,
        size: parts[1] || '',
        thickness: parts[2] || '',
      }
    } else if (prefix === 'SR' || prefix === 'MT' || prefix === 'MP' || prefix === 'ZG' || prefix === 'JZZG') {
      return {
        type: 'accessory',
        code: prefix,
        param1: parts[1] || '',
        param2: parts[2] || '',
      }
    }
    return null
  }

  const updateSKUFromDescription = (description, currentSKU) => {
    if (!currentSKU) return currentSKU
    
    const parsed = parseSKU(currentSKU)
    if (!parsed) return currentSKU
    
    let newSKU = currentSKU
    
    if (parsed.type === 'pipe') {
      const thicknessMatch = description.match(/壁厚(\d+(?:\.\d+)?)mm/)
      const lengthMatch = description.match(/长度(\d+(?:\.\d+)?)m/)
      
      if (thicknessMatch || lengthMatch) {
        const thickness = thicknessMatch ? thicknessMatch[1] : parsed.thickness
        const length = lengthMatch ? lengthMatch[1] : parsed.length
        newSKU = `TP${parsed.model}-${thickness}-${length}m-${parsed.thread}`
      }
    } else if (parsed.type === 'tool') {
      const thicknessMatch = description.match(/壁厚(\d+(?:\.\d+)?)mm/)
      
      if (thicknessMatch) {
        const thickness = thicknessMatch[1]
        newSKU = `${parsed.code}-${parsed.size}-${thickness}`
      }
    } else if (parsed.type === 'accessory') {
      if (parsed.code === 'SR') {
        const lengthMatch = description.match(/长度(\d+(?:\.\d+)?)m/)
        if (lengthMatch) {
          newSKU = `SR-${lengthMatch[1]}`
        }
      } else if (parsed.code === 'MT') {
        const lengthMatch = description.match(/长度(\d+(?:\.\d+)?)m/)
        const diameterMatch = description.match(/直径(\d+(?:\.\d+)?)mm/)
        if (lengthMatch || diameterMatch) {
          const length = lengthMatch ? lengthMatch[1] : parsed.param1
          const diameter = diameterMatch ? diameterMatch[1] : parsed.param2
          newSKU = `MT-${length}-${diameter}`
        }
      } else if (parsed.code === 'MP') {
        const powerMatch = description.match(/(\d+(?:\.\d+)?)千瓦/)
        if (powerMatch) {
          newSKU = `MP-${powerMatch[1]}`
        }
      } else if (parsed.code === 'ZG' || parsed.code === 'JZZG') {
        const lengthMatch = description.match(/长度(\d+(?:\.\d+)?)m/)
        const diameterMatch = description.match(/直径(\d+(?:\.\d+)?)mm/)
        if (lengthMatch || diameterMatch) {
          const length = lengthMatch ? lengthMatch[1] : parsed.param1
          const diameter = diameterMatch ? diameterMatch[1] : parsed.param2
          newSKU = `${parsed.code}-${length}-${diameter}`
        }
      }
    }
    
    return newSKU
  }

  const handleDescriptionChange = (value) => {
    const newSKU = updateSKUFromDescription(value, formData.sku)
    setFormData({ ...formData, description: value, sku: newSKU })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    try {
      if (editingProduct) {
        const response = await fetch(`${API_URL}/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
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
            ...getAuthHeaders(),
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

  const getCleanDescription = (product) => {
    if (!product.description) return ''
    let desc = product.description
    if (product.name) {
      const lengthMatch = product.name.match(/(\d+(?:\.\d+)?)m/)
      if (lengthMatch) {
        desc = desc.replace(/长度\d+(?:\.\d+)?m/, '')
      }
      if (product.name.includes('尖丝')) {
        desc = desc.replace(/，?尖丝$/, '').replace(/尖丝，?/, '')
      } else if (product.name.includes('方丝')) {
        desc = desc.replace(/，?方丝$/, '').replace(/方丝，?/, '')
      }
    }
    return desc.replace(/，+$/, '').replace(/^，/, '')
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
          <button 
            type="button" 
            style={styles.addButton}
            onClick={(e) => { 
              e.preventDefault();
              e.stopPropagation();
              handleAdd();
            }}
          >
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
                  {getCleanDescription(product) && (
                    <span style={styles.productDesc}> · {getCleanDescription(product)}</span>
                  )}
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

      {showModal && createPortal(
        <div 
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px'
          }} 
          onClick={handleCloseModal}
        >
          <div 
            style={{
              backgroundColor: 'white',
              borderRadius: '16px',
              width: '100%',
              maxWidth: '600px',
              maxHeight: '90vh',
              overflow: 'auto',
              boxShadow: '0 25px 50px rgba(0, 0, 0, 0.25)'
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ padding: '24px 28px', borderBottom: '1px solid #e5e7eb' }}>
              <h3 style={{ margin: 0, fontSize: '20px', fontWeight: '600', color: '#111827' }}>
                {editingProduct ? '编辑产品' : '添加产品'}
              </h3>
            </div>
            
            <div style={{ padding: '24px 28px' }}>
              {!editingProduct && productTemplates[formData.category] && (
                <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase' }}>
                    快速添加模板
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
                    {productTemplates[formData.category].map((template, index) => (
                      <button
                        key={index}
                        type="button"
                        style={{
                          padding: '8px 12px',
                          backgroundColor: hoveredTemplate === index ? '#f3f4f6' : 'white',
                          border: '1px solid #d1d5db',
                          borderRadius: '6px',
                          cursor: 'pointer',
                          fontSize: '13px',
                          color: '#374151'
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
              
              <form onSubmit={handleSubmit}>
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    产品名称
                  </label>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    required
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    SKU
                  </label>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    value={formData.sku}
                    onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                    required
                  />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '20px' }}>
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      分类
                    </label>
                    <select
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
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
                  <div>
                    <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                      状态
                    </label>
                    <select
                      style={{
                        width: '100%',
                        padding: '10px 12px',
                        border: '1px solid #d1d5db',
                        borderRadius: '8px',
                        fontSize: '14px',
                        backgroundColor: 'white'
                      }}
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    >
                      <option value="active">启用</option>
                      <option value="inactive">禁用</option>
                    </select>
                  </div>
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    规格描述
                  </label>
                  <input
                    type="text"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    value={formData.description}
                    onChange={(e) => handleDescriptionChange(e.target.value)}
                  />
                </div>
                
                <div style={{ marginBottom: '20px' }}>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                    价格
                  </label>
                  <input
                    type="number"
                    style={{
                      width: '100%',
                      padding: '10px 12px',
                      border: '1px solid #d1d5db',
                      borderRadius: '8px',
                      fontSize: '14px'
                    }}
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                    required
                  />
                </div>
              </form>
            </div>
            
            <div style={{ padding: '20px 28px', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button 
                type="button" 
                style={{
                  padding: '10px 20px',
                  backgroundColor: 'white',
                  color: '#6b7280',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }} 
                onClick={handleCloseModal}
              >
                取消
              </button>
              <button 
                type="button" 
                style={{
                  padding: '10px 20px',
                  backgroundColor: '#D4AF37',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '14px',
                  fontWeight: '500'
                }} 
                onClick={handleSubmit}
              >
                {editingProduct ? '保存修改' : '添加'}
              </button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '16px',
    position: 'relative',
    zIndex: 100,
  },
  undoToast: {
    position: 'fixed',
    top: '28px',
    right: '28px',
    backgroundColor: '#FFFFFF',
    borderRadius: '14px',
    padding: '18px 24px',
    display: 'flex',
    alignItems: 'center',
    gap: '18px',
    border: '1px solid rgba(212, 175, 55, 0.15)',
    boxShadow: '0 8px 30px rgba(30, 41, 59, 0.12), 0 0 0 1px rgba(212, 175, 55, 0.05)',
    zIndex: 1001,
    animation: 'toastSlideIn 0.4s cubic-bezier(0.22, 1, 0.36, 1)',
  },
  undoToastContent: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
  },
  undoToastIcon: {
    width: '36px',
    height: '36px',
    borderRadius: '10px',
    backgroundColor: 'rgba(5, 150, 105, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  undoToastText: {
    display: 'flex',
    flexDirection: 'column',
    gap: '3px',
  },
  undoToastTitle: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1E293B',
  },
  undoToastDesc: {
    fontSize: '12px',
    color: '#94A3B8',
  },
  undoButton: {
    backgroundColor: 'transparent',
    color: '#B8860B',
    border: 'none',
    padding: '8px 18px',
    borderRadius: '8px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '240px',
    fontSize: '15px',
    color: 'var(--text-secondary)',
  },
  header: {
    display: 'flex',
    marginBottom: '8px',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  pageTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '32px',
    fontWeight: '600',
    color: '#1E293B',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  topActions: {
    display: 'flex',
    alignItems: 'center',
    gap: '14px',
    position: 'relative',
    zIndex: 100,
  },
  searchInput: {
    padding: '12px 18px',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    fontSize: '14px',
    width: '280px',
    outline: 'none',
    backgroundColor: '#FFFFFF',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 1px 3px rgba(30, 41, 59, 0.04)',
    color: '#1E293B',
  },
  addButton: {
    padding: '12px 26px',
    background: 'linear-gradient(135deg, #D4AF37 0%, #E8C547 50%, #D4AF37 100%)',
    color: '#0F172A',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 16px rgba(212, 175, 55, 0.35)',
    letterSpacing: '-0.1px',
    zIndex: 100,
    position: 'relative',
  },
  tabsContainer: {
    display: 'flex',
    gap: '6px',
    backgroundColor: '#FFFFFF',
    padding: '6px',
    borderRadius: '14px',
    border: '1px solid #E2E8F0',
    boxShadow: '0 2px 8px rgba(30, 41, 59, 0.04)',
  },
  tab: {
    padding: '12px 24px',
    backgroundColor: 'transparent',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    color: '#64748B',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  tabActive: {
    background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
    color: '#FFFFFF',
    boxShadow: '0 4px 12px rgba(30, 41, 59, 0.25)',
  },
  tabCount: {
    fontSize: '11px',
    padding: '3px 9px',
    borderRadius: '10px',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '18px',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
    boxShadow: '0 2px 12px rgba(30, 41, 59, 0.04), 0 0 0 1px rgba(30, 41, 59, 0.02)',
    transition: 'box-shadow 0.3s ease, transform 0.3s ease',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
  },
  tableHeader: {
    backgroundColor: '#F8FAFC',
  },
  th: {
    padding: '16px 24px',
    textAlign: 'left',
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748B',
    borderBottom: '1px solid #E2E8F0',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  tableRow: {
    borderBottom: '1px solid #F1F5F9',
    transition: 'background-color 0.2s ease',
    cursor: 'default',
  },
  td: {
    padding: '18px 24px',
    fontSize: '14px',
    color: '#1E293B',
  },
  tdSecondary: {
    padding: '18px 24px',
    fontSize: '14px',
    color: '#64748B',
  },
  productName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1E293B',
  },
  productDesc: {
    fontSize: '13px',
    fontWeight: '400',
    color: '#94A3B8',
    marginTop: '4px',
  },
  tdPrice: {
    padding: '18px 24px',
    fontSize: '16px',
    fontWeight: '700',
    color: '#D4AF37',
  },
  editButton: {
    padding: '8px 18px',
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    color: '#B8860B',
    border: '1px solid rgba(212, 175, 55, 0.2)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    marginRight: '10px',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  deleteButton: {
    padding: '8px 18px',
    backgroundColor: 'rgba(225, 29, 72, 0.06)',
    color: '#E11D48',
    border: '1px solid rgba(225, 29, 72, 0.12)',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    backdropFilter: 'blur(6px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 9999,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    padding: '0',
    borderRadius: '20px',
    border: '1px solid rgba(30, 41, 59, 0.08)',
    width: '500px',
    maxWidth: '92%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 24px 48px rgba(30, 41, 59, 0.2), 0 0 0 1px rgba(212, 175, 55, 0.05)',
  },
  modalTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '20px',
    fontWeight: '600',
    padding: '24px 28px',
    margin: 0,
    color: '#1E293B',
    borderBottom: '1px solid #F1F5F9',
    backgroundColor: '#FDFCFB',
    flexShrink: 0,
    borderRadius: '20px 20px 0 0',
  },
  formScroll: {
    flex: 1,
    overflowY: 'auto',
  },
  templateSection: {
    padding: '18px 28px',
    backgroundColor: '#F8FAFC',
    borderBottom: '1px solid #F1F5F9',
  },
  templateTitle: {
    fontSize: '11px',
    fontWeight: '600',
    color: '#64748B',
    marginBottom: '12px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  templateList: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '10px',
  },
  templateButton: {
    padding: '8px 14px',
    backgroundColor: '#FFFFFF',
    border: '1px solid #E2E8F0',
    borderRadius: '10px',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#64748B',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  templateButtonHover: {
    backgroundColor: 'rgba(212, 175, 55, 0.08)',
    borderColor: 'rgba(212, 175, 55, 0.3)',
    color: '#B8860B',
  },
  formSection: {
    padding: '24px 28px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B',
    marginBottom: '18px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  formGroup: {
    marginBottom: '20px',
  },
  formRow: {
    display: 'flex',
    gap: '18px',
  },
  label: {
    display: 'block',
    marginBottom: '10px',
    fontSize: '14px',
    fontWeight: '600',
    color: '#334155',
  },
  input: {
    width: '100%',
    padding: '12px 16px',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    color: '#1E293B',
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '14px',
    padding: '20px 28px',
    backgroundColor: '#F8FAFC',
    borderTop: '1px solid #F1F5F9',
    flexShrink: 0,
    borderRadius: '0 0 20px 20px',
  },
  cancelButton: {
    padding: '12px 28px',
    backgroundColor: '#FFFFFF',
    color: '#64748B',
    border: '1px solid #E2E8F0',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  submitButton: {
    padding: '12px 28px',
    background: 'linear-gradient(135deg, #D4AF37 0%, #E8C547 50%, #D4AF37 100%)',
    color: '#0F172A',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 16px rgba(212, 175, 55, 0.35)',
  },
}
