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
    price: '',
    dealer_price: '',
    description: '',
    status: 'active',
  })
  const [hoveredTemplate, setHoveredTemplate] = useState(null)

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isReadOnly = user.role === 'foreign_trade'

  // 支持双价格（终端价+经销商价）的分类
  const dualPriceCategories = ['导管类', '水泵类']
  const hasDualPrice = (cat) => dualPriceCategories.includes(cat)

  const categories = [
    { id: '钻具类', name: '钻具类' },
    { id: '导管类', name: '导管类' },
    { id: '水泵类', name: '水泵类' },
    { id: '配件类', name: '配件类' },
  ]



  const productTemplates = {
    '导管类': [
      { name: '300尖丝导管', description: '壁厚{thickness}mm，尖丝', price: 351 },
      { name: '300方丝导管', description: '壁厚{thickness}mm，方丝', price: 356 },
      { name: '260尖丝导管', description: '壁厚{thickness}mm，尖丝', price: 291 },
      { name: '260方丝导管', description: '壁厚{thickness}mm，方丝', price: 296 },
      { name: '273母扣接头', description: '母扣接头', price: 80 },
    ],
    '水泵类': [
      { name: '潜水泵', description: '功率{power}kW，流量{flow}m³/h', price: 5000 },
      { name: '离心泵', description: '功率{power}kW，扬程{head}m', price: 3500 },
      { name: '泥浆泵', description: '{power}千瓦', price: 6500 },
    ],
    '钻具类': [
      { name: '捞沙斗', description: '{size}mm，壁厚{thickness}mm', price: 6500 },
      { name: '筒钻', description: '{size}mm，壁厚{thickness}mm', price: 13000 },
      { name: '螺旋钻头', description: '{size}mm，壁厚{thickness}mm高效螺旋钻头', price: 800 },
    ],
    '配件类': [
      { name: '泥浆管', description: '口径4英寸，长度18m', price: 330 },
      { name: '泥浆泵', description: '{power}千瓦', price: 6500 },
      { name: '钻杆', description: '钻杆，长度{m}，直径{diameter}mm', price: 400 },
      { name: '加重钻杆', description: '加重钻杆，长度{m}，直径{diameter}mm', price: 600 },
    ],
  }

  const applyTemplate = (template) => {
    setFormData({
      ...formData,
      name: template.name,
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
    setFormData({ name: '', category: activeCategory, price: '', dealer_price: '', description: '', status: 'active' })
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

  const handleDescriptionChange = (value) => {
    setFormData({ ...formData, description: value })
  }

  const handleSubmit = async (e) => {
    if (e) e.preventDefault()
    if (!formData.name || !formData.name.trim()) {
      alert('请输入产品名称')
      return
    }
    if (!formData.price && formData.price !== 0) {
      alert('请输入价格')
      return
    }
    try {
      let response

      if (editingProduct) {
        response = await fetch(`${API_URL}/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(formData),
        })
      } else {
        response = await fetch(`${API_URL}/products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(formData),
        })
      }

      if (!response.ok) {
        let errorMessage = '保存产品失败'
        try {
          const data = await response.json()
          if (data?.error) {
            errorMessage = data.error
          }
        } catch (parseError) {
          // ignore json parse error and use default message
        }
        alert(errorMessage)
        return
      }

      fetchProducts()
      handleCloseModal()
    } catch (error) {
      console.error('保存产品失败:', error)
      alert('保存产品失败，请稍后重试')
    }
  }

  const getProductsByCategory = (category) => {
    return products.filter((p) => p.category === category)
  }

  // 导管类智能搜索：将自然语言提取为结构化 JSON
  const parsePipeQuery = (keyword) => {
    // 提取型号与丝型
    const pipeTypeMatch = keyword.match(/(300|260|273|219)/)
    const pipeType = pipeTypeMatch ? pipeTypeMatch[1] : null

    let threadType = null
    if (/尖丝|尖/.test(keyword)) threadType = '尖丝'
    else if (/方丝|方/.test(keyword)) threadType = '方丝'

    let name = null
    if (pipeType && threadType) {
      name = `${pipeType}${threadType}导管`
    }

    // 接头规格
    let jointSpec = null
    if (/公扣/.test(keyword)) jointSpec = '公扣'
    else if (/母扣/.test(keyword)) jointSpec = '母扣'
    else if (/衬套/.test(keyword)) jointSpec = '衬套'
    const isJointQuery = /接头/.test(keyword) || jointSpec !== null

    // 长度 (L)：支持 "1米"/"1m"/"0.5米"/"1.5m" 等 (排除了 mm)
    const lengthMatch = keyword.match(/(\d+\.?\d*)\s*(?:m|米)(?!m|毫米)/i)
    const L = lengthMatch ? parseFloat(lengthMatch[1]) : null

    // 壁厚 (T)：支持 "3.5mm"/"3.5毫米"/"3.5厚"/"3.5壁厚"/"厚度3.5"/"壁厚3.5" 等
    let T = null
    const thickMatch1 = keyword.match(/(\d+\.?\d*)\s*(?:mm|毫米|厚|壁厚)/i)
    const thickMatch2 = keyword.match(/(?:厚度|壁厚)\s*(\d+\.?\d*)/)
    const thickMatch3 = keyword.match(/(?:(?:米|m)(?!m|毫米)[^+]*\+\s*|\+\s*)(\d+\.?\d*)\s*(?:mm|毫米)?\s*$/i)

    if (thickMatch1) T = parseFloat(thickMatch1[1])
    else if (thickMatch2) T = parseFloat(thickMatch2[1])
    else if (thickMatch3) T = parseFloat(thickMatch3[1])

    const hasPipeKeywords = pipeType || keyword.includes('导管') || isJointQuery || L !== null || T !== null
    return { name, pipeType, threadType, L, T, hasPipeKeywords, isJointQuery, jointSpec }
  }

  const getDisplayProducts = () => {
    if (searchQuery.trim()) {
      const keyword = searchQuery.trim().replace(/-/g, '')
      const lowerKeyword = keyword.toLowerCase()
      const numbers = keyword.match(/\d+/g)
      // 提取中文部分和数字部分，用于组合匹配
      const chinesePart = keyword.replace(/[\d\s]+/g, '').toLowerCase()
      const numberPart = numbers ? numbers.join('') : ''

      const isNumericOnly = /^\d+$/.test(keyword)

      // 导管类智能搜索（最高优先级）
      const pipeQuery = parsePipeQuery(keyword)
      if (pipeQuery.hasPipeKeywords && (pipeQuery.pipeType || pipeQuery.threadType || pipeQuery.L !== null || pipeQuery.T !== null || pipeQuery.isJointQuery)) {
        const pipeResults = products.filter((p) => {
          if (p.category !== '导管类') return false

          // 严禁返回钻宝、SMS6系、钻金 (除非用户输入包含)
          const excludeWords = ['钻宝', 'SMS6系', '钻金']
          for (const word of excludeWords) {
            if (p.name.includes(word) && !keyword.includes(word)) return false
          }

          // 接头搜索模式
          if (pipeQuery.isJointQuery) {
            if (!p.name.includes('接头') && !p.name.includes('衬套')) return false
            if (pipeQuery.pipeType && !p.name.includes(pipeQuery.pipeType)) return false
            if (pipeQuery.threadType && !p.name.includes(pipeQuery.threadType)) return false
            if (pipeQuery.jointSpec && !p.name.includes(pipeQuery.jointSpec)) return false

            // 匹配外径
            if (pipeQuery.T !== null && !(p.description && p.description.includes(`外径：${pipeQuery.T}`))) return false
            return true
          }

          // 导管搜索模式
          if (pipeQuery.name) {
            if (!p.name.includes(pipeQuery.name)) return false
          } else {
            if (pipeQuery.pipeType && !p.name.includes(pipeQuery.pipeType)) return false
            if (pipeQuery.threadType && !p.name.includes(pipeQuery.threadType)) return false
          }
          if (pipeQuery.L !== null && !p.name.includes(`${pipeQuery.L}m`)) return false

          // 匹配壁厚
          if (pipeQuery.T !== null && !(p.description && p.description.includes(`壁厚：${pipeQuery.T}`))) return false
          return true
        })
        if (pipeResults.length > 0) return pipeResults
      }

      // 钻具类专有搜索规则：提取【产品名称】和【型号】，组合后作为搜索关键词
      const drillKeyword = keyword.replace(/[\s\-]+/g, '').toLowerCase()
      const drillSegments = drillKeyword.match(/[\u4e00-\u9fff]+|[a-zA-Z0-9]+/g) || [drillKeyword]

      const levelDrill = products.filter(p => {
        if (p.category !== '钻具类') return false

        const specMatch = p.description && p.description.match(/(?:规格)?型号[：:]?\s*([a-zA-Z0-9\-]+)/)
        const model = specMatch ? specMatch[1].replace(/[\s\-]+/g, '').toLowerCase() : ''
        const productName = p.name.replace(/[\s\-]+/g, '').toLowerCase()
        const targetString = productName + model

        return drillSegments.every(seg => targetString.includes(seg))
      })

      // Level 0: 名称+型号组合精准匹配（支持正反序）
      const level0 = (chinesePart && numberPart)
        ? products.filter((p) => {
          if (p.category === '钻具类') return false
          const nameMatch = p.name.toLowerCase().includes(chinesePart)
          const specMatch = p.description && p.description.match(/(?:规格)?型号(\d+)/)
          return nameMatch && specMatch && specMatch[1] === numberPart
        })
        : []

      // Level 1: 纯数字搜索 → 只匹配规格型号；否则精确匹配产品规格全文
      const level1 = isNumericOnly
        ? products.filter((p) => {
          if (p.category === '钻具类') return false
          const specMatch = p.description && p.description.match(/(?:规格)?型号(\d+)/)
          return specMatch && specMatch[1] === keyword
        })
        : products.filter((p) => {
          if (p.category === '钻具类') return false
          return p.description && p.description === keyword
        })

      // Level 2: 名称+型号宽松匹配（数字匹配规格型号）
      const level2 = (chinesePart && numberPart)
        ? products.filter((p) => {
          if (p.category === '钻具类') return false
          const nameMatch = p.name.toLowerCase().includes(chinesePart)
          const specMatch = p.description && p.description.match(/(?:规格)?型号(\d+)/)
          return nameMatch && specMatch && specMatch[1] === numberPart
        })
        : []

      // Level 3: 名称前缀匹配
      const level3 = products.filter((p) => {
        if (p.category === '钻具类') return false
        return p.name.toLowerCase().startsWith(lowerKeyword)
      })

      // Level 4: 全字段模糊匹配（纯数字时仍只匹配型号）
      const level4 = isNumericOnly
        ? []
        : products.filter((p) => {
          if (p.category === '钻具类') return false
          return p.name.toLowerCase().includes(lowerKeyword) ||
            (p.description && p.description.toLowerCase().includes(lowerKeyword))
        })

      // Level 5: 拆词匹配 — 将查询拆为多个片段，所有片段都在name+description中出现即命中
      const segments = keyword.match(/[\u4e00-\u9fff]+|\d+[\-\.]\d+[\-\.\d]*|\d+/g) || []
      const level5 = (segments.length > 1)
        ? products.filter((p) => {
          if (p.category === '钻具类') return false
          const haystack = `${p.name} ${p.description || ''}`.toLowerCase()
          return segments.every(seg => haystack.includes(seg.toLowerCase()))
        })
        : []

      // 按优先级合并去重
      const seen = new Set()
      const result = []
      for (const list of [levelDrill, level0, level1, level2, level3, level4, level5]) {
        for (const p of list) {
          if (!seen.has(p.id)) {
            seen.add(p.id)
            result.push(p)
          }
        }
      }
      return result
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
            placeholder="搜索产品名称、规格型号..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {!isReadOnly && (
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
          )}
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
              <th style={styles.th}>产品名称</th>
              <th style={styles.th}>产品规格</th>
              <th style={styles.th}>{hasDualPrice(activeCategory) ? '终端价' : '价格'}</th>
              {hasDualPrice(activeCategory) && <th style={styles.th}>经销商价</th>}
              {!isReadOnly && <th style={styles.th}>操作</th>}
            </tr>
          </thead>
          <tbody>
            {getDisplayProducts().map((product) => (
              <tr key={product.id} style={styles.tableRow}>
                <td style={styles.td}>
                  <span style={styles.productName}>{product.name}</span>
                </td>
                <td style={styles.tdSecondary}>
                  {getCleanDescription(product) || product.description || '-'}
                </td>
                <td style={styles.tdPrice}>¥{Number(product.price).toLocaleString()}</td>
                {hasDualPrice(activeCategory) && (
                  <td style={styles.tdPrice}>
                    {product.dealer_price ? `¥${Number(product.dealer_price).toLocaleString()}` : '-'}
                  </td>
                )}
                {!isReadOnly && (
                  <td style={styles.td}>
                    <button style={styles.editButton} onClick={() => handleEdit(product)}>
                      编辑
                    </button>
                    <button style={styles.deleteButton} onClick={() => handleDelete(product)}>
                      删除
                    </button>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && createPortal(
        <>
          <style>{`
          @keyframes modalOverlayIn {
            from { opacity: 0; backdrop-filter: blur(0px); }
            to { opacity: 1; backdrop-filter: blur(8px); }
          }
          @keyframes modalOverlayOut {
            from { opacity: 1; backdrop-filter: blur(8px); }
            to { opacity: 0; backdrop-filter: blur(0px); }
          }
          @keyframes modalSlideIn {
            from { opacity: 0; transform: translateY(32px) scale(0.95); }
            to { opacity: 1; transform: translateY(0) scale(1); }
          }
          @keyframes modalSlideOut {
            from { opacity: 1; transform: translateY(0) scale(1); }
            to { opacity: 0; transform: translateY(24px) scale(0.97); }
          }
          .product-template-chip {
            transition: all 0.15s ease;
          }
          .product-template-chip:hover {
            transform: scale(1.05);
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
            border-color: #9ca3af !important;
          }
          .product-template-chip:active {
            transform: scale(0.97);
          }
        `}</style>
          <div
            style={{
              position: 'fixed',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              backgroundColor: 'rgba(0, 0, 0, 0.5)',
              backdropFilter: 'blur(8px)',
              WebkitBackdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              zIndex: 9999,
              padding: '20px',
              animation: isClosing ? 'modalOverlayOut 0.2s ease forwards' : 'modalOverlayIn 0.25s ease forwards'
            }}
            onClick={handleCloseModal}
          >
            <div
              style={{
                backgroundColor: 'white',
                borderRadius: '24px',
                width: '100%',
                maxWidth: '600px',
                maxHeight: '90vh',
                overflow: 'auto',
                boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.1)',
                animation: isClosing ? 'modalSlideOut 0.2s ease forwards' : 'modalSlideIn 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards'
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
                          className="product-template-chip"
                          style={{
                            padding: '8px 14px',
                            backgroundColor: hoveredTemplate === index ? '#f3f4f6' : 'white',
                            border: '1px solid #d1d5db',
                            borderRadius: '20px',
                            cursor: 'pointer',
                            fontSize: '13px',
                            color: '#374151',
                            fontWeight: '500'
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
                      {hasDualPrice(formData.category) ? '终端价' : '价格'}
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

                  {hasDualPrice(formData.category) && (
                    <div style={{ marginBottom: '20px' }}>
                      <label style={{ display: 'block', marginBottom: '6px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                        经销商价
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
                        value={formData.dealer_price}
                        onChange={(e) => setFormData({ ...formData, dealer_price: e.target.value })}
                      />
                    </div>
                  )}

                  <div style={{ padding: '20px 0', borderTop: '1px solid #e5e7eb', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '4px' }}>
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
                      type="submit"
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
                    >
                      {editingProduct ? '保存修改' : '添加'}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        </>,
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
