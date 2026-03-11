import { useState, useEffect } from 'react'
import Modal from '../components/Modal'
import { API_URL } from '../lib/api'

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
  
`

export default function Products() {
  const ITEMS_PER_PAGE = 10
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCategory, setActiveCategory] = useState('钻具类')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [hoveredProductId, setHoveredProductId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [pendingDeleteProduct, setPendingDeleteProduct] = useState(null)
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
    fetchProducts()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeCategory, searchQuery])

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/products`)
      if (!response.ok) {
        if (response.status === 401 || response.status === 403) {
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/login'
          return
        }
      }
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
    setShowModal(false)
    setIsClosing(false)
  }

  const handleDelete = (product) => {
    setPendingDeleteProduct(product)
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

  const confirmDelete = async () => {
    if (!pendingDeleteProduct) return
    try {
      await fetch(`${API_URL}/products/${pendingDeleteProduct.id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        },
      })
      await addToRecycleBin(pendingDeleteProduct, 'products')
      setProducts(prev => prev.filter((p) => p.id !== pendingDeleteProduct.id))
    } catch (error) {
      console.error('删除产品失败:', error)
    }
    setPendingDeleteProduct(null)
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
        if (response.status === 401 || response.status === 403) {
          alert('登录已过期，请重新登录')
          localStorage.removeItem('token')
          localStorage.removeItem('user')
          window.location.href = '/login'
          return
        }

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


  const getDisplayProducts = () => {
    const trimmedQuery = searchQuery.trim()
    if (trimmedQuery) {
      // 全局排除 "SMSCC" 品牌干扰项：在处理关键词和匹配目标时均忽略它
      const keyword = trimmedQuery.replace(/SMSCC/gi, '').trim().replace(/-/g, '')

      // 如果剔除品牌名后关键词为空，且原始输入包含品牌名，则认为无有效搜索内容（不显示全列表）
      if (!keyword && trimmedQuery.toLowerCase().includes('smscc')) {
        return []
      }

      const lowerKeyword = keyword.toLowerCase()
      const numbers = keyword.match(/\d+/g)
      // 提取中文部分和数字部分，用于组合匹配
      const chinesePart = keyword.replace(/[\d\s]+/g, '').toLowerCase()
      const numberPart = numbers ? numbers.join('') : ''

      const isNumericOnly = /^\d+$/.test(keyword)

      // 导管类严格搜索：基于【产品名称】+【产品描述中的长度和厚度】
      // 导管搜索格式：300+尖丝+导管+长度+厚度
      // 料斗搜索格式：料斗+尺寸+厚度
      // 接头搜索格式：300+尖丝+接头+公扣/母扣/衬套
      const levelPipe = (() => {
        // 渐进消费法：去掉空格后依次提取各字段，每次提取后移除已匹配部分
        let remaining = keyword.replace(/[\s+]+/g, '')
        // 1. 提取直径 (如 300, 300/288, 260)
        let queryDiameter = null
        const dm = remaining.match(/^(\d{3}(?:\/\d{3})?)/)
        if (dm) { queryDiameter = dm[1]; remaining = remaining.slice(dm[1].length) }
        // 2. 提取中文关键词
        let queryThread = null
        const tm = remaining.match(/(小方丝|大方丝|尖丝|方丝)/)
        if (tm) { queryThread = tm[1]; remaining = remaining.replace(tm[1], '') }
        let queryType = null
        const tym = remaining.match(/(导管|接头|衬套|公扣|母扣|料斗)/)
        if (tym) { queryType = tym[1]; remaining = remaining.replace(tym[1], '') }
        // 3. 先提取厚度 Xmm（更具体，避免被长度 Xm 抢走）
        let queryThickness = null
        const thm = remaining.match(/(\d+\.?\d*)mm/)
        if (thm) { queryThickness = thm[1]; remaining = remaining.replace(thm[0], '') }
        // 4. 提取长度 Xm（mm 已被消费，不会冲突）
        let queryLength = null
        const lm = remaining.match(/(\d+\.?\d*)m/)
        if (lm) { queryLength = lm[1]; remaining = remaining.replace(lm[0], '') }
        // 5. 剩余的裸数字：料斗→尺寸+厚度，导管→厚度
        const remainingNums = remaining.match(/\d+\.?\d*/g) || []
        let queryHopperSize = null
        if (queryType === '料斗') {
          // 料斗裸数字解析：优先用空格分隔的原始数字（避免 "3 3.5" 合并成 "33.5"）
          const hopperNums = keyword.match(/\d+\.?\d*/g) || []
          if (hopperNums.length >= 2) {
            queryHopperSize = hopperNums[0]
            if (!queryThickness) queryThickness = hopperNums[1]
          } else if (hopperNums.length === 1) {
            queryHopperSize = hopperNums[0]
          }
        } else {
          if (!queryThickness && remainingNums.length > 0) queryThickness = remainingNums[0]
        }

        return products.filter(p => {
          if (p.category !== '导管类') return false

          const excludeWords = ['钻宝', 'SMS6系', '钻金']
          for (const word of excludeWords) {
            if (p.name.includes(word) && !keyword.includes(word)) return false
          }

          const name = p.name
          const desc = p.description || ''
          const isHopper = name.includes('料斗')
          const isPipe = name.includes('导管')
          const isJoint = name.includes('接头') || name.includes('公扣') || name.includes('母扣') || name.includes('衬套')

          const searchableText = `${name} ${desc}`.toLowerCase()
          const segments = keyword.toLowerCase().match(/[\u4e00-\u9fff]+|[a-z0-9.]+/gi) || [keyword.toLowerCase()]
          const textMatch = segments.every(seg => searchableText.includes(seg))

          // ── 料斗匹配 ──
          if (isHopper) {
            if (queryType && queryType !== '料斗') return false
            // 匹配料斗尺寸：name 开头的数字 (如 "3方料斗" → 3)
            if (queryHopperSize) {
              const nameSize = name.match(/^(\d+\.?\d*)/)
              if (!nameSize || nameSize[1] !== queryHopperSize) return false
            }
            // 匹配厚度：description 中的 "厚度: Xmm" 或 "厚度：Xmm"
            if (queryThickness) {
              const descThickness = desc.match(/厚度[：:]?\s*(\d+\.?\d*)mm/)
              if (!descThickness || descThickness[1] !== queryThickness) return false
            }
            // 如果搜索词包含导管/接头特有关键词，跳过料斗
            if (queryDiameter || queryThread) return false
            return textMatch
          }

          // ── 导管匹配 ──
          if (isPipe) {
            if (queryType && queryType !== '导管') return false
            // 匹配直径：name 开头的匹配项，支持 300/288 等格式
            if (queryDiameter) {
              const matchDiameter = `${name} ${desc}`.match(/(\d{3}(?:\/\d{3})?)/)
              if (!matchDiameter || matchDiameter[1] !== queryDiameter) return false
            }
            // 匹配丝类型
            if (queryThread && !`${name} ${desc}`.includes(queryThread)) return false
            // 匹配长度：严格匹配 description 中的 "长度: Xm" 或 "长度：Xm"
            if (queryLength) {
              const descLength = desc.match(/长度[：:]?\s*(\d+\.?\d*)m/)
              if (!descLength || descLength[1] !== queryLength) return false
            }
            // 匹配厚度：严格匹配 description 中的壁厚值
            if (queryThickness) {
              const descThickness = desc.match(/壁厚[：:]?\s*(\d+\.?\d*)mm/)
              if (!descThickness || descThickness[1] !== queryThickness) return false
            }
            return textMatch
          }

          // ── 接头匹配 ──
          if (isJoint) {
            if (queryType && !name.includes(queryType)) return false
            // 匹配直径
            if (queryDiameter) {
              const matchDiameter = `${name} ${desc}`.match(/(\d{3}(?:\/\d{3})?)/)
              if (!matchDiameter || matchDiameter[1] !== queryDiameter) return false
            }
            // 匹配丝类型
            if (queryThread && !`${name} ${desc}`.includes(queryThread)) return false
            // 接头没有长度/厚度，如果搜索了这些就不匹配
            if (queryLength || queryThickness) return false
            return textMatch
          }

          // ── 兜底：其他导管类产品，用通用文本匹配 ──
          return textMatch
        })
      })()

      // 钻具类专有搜索规则：提取【产品名称】和【型号】，组合后作为搜索关键词
      const levelDrill = products.filter(p => {
        if (p.category !== '钻具类') return false
        // 钻具类搜索：合并名称和完整描述进行搜索
        // 匹配目标也排除 "SMSCC" 以保持一致
        const searchTarget = `${p.name} ${p.description || ''}`.replace(/SMSCC/gi, '').replace(/[\s\-]+/g, '').toLowerCase()
        const drillSegments = keyword.match(/[\u4e00-\u9fff]+|[a-zA-Z0-9]+/g) || [keyword]

        return drillSegments.every(seg => searchTarget.includes(seg.toLowerCase()))
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
      for (const list of [levelPipe, levelDrill, level0, level1, level2, level3, level4, level5]) {
        for (const p of list) {
          if (!seen.has(p.id)) {
            seen.add(p.id)
            result.push(p)
          }
        }
      }

      // 额外逻辑：如果用户输入包含 SMSCC 但过滤后没有任何有效片段，则返回空结果（防止显示全列表）
      const hasSmscc = searchQuery.toLowerCase().includes('smscc')
      if (hasSmscc && result.length > 0) {
        // 验证结果中是否真的匹配了除 SMSCC 以外的内容
        // 这里我们信任各 level 内部的过滤，但如果最终结果是因为 SMSCC 导致的匹配（虽然逻辑上不应该），
        // 可以在这里做二次检查。不过目前各 level 已有 category 隔离或其他检查。
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

  const displayProducts = getDisplayProducts()
  const totalPages = Math.max(1, Math.ceil(displayProducts.length / ITEMS_PER_PAGE))
  const paginatedProducts = displayProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  // 动态决定是否显示双价格列：如果当前显示的列表中有任何一个产品属于双价格分类，就显示
  const shouldShowDualPrice = displayProducts.some(p => hasDualPrice(p.category))

  return (
    <div style={styles.container}>
      <style>{modalAnimationStyles}</style>

      <div style={styles.stickyHeader}>
        <div style={styles.topBar}>
          <h2 style={styles.pageTitle}>产品管理</h2>
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
      </div>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={{ ...styles.th, width: shouldShowDualPrice ? '18%' : '26%' }}>产品名称</th>
              <th style={{ ...styles.th, width: shouldShowDualPrice ? '24%' : '30%' }}>产品规格</th>
              <th style={{ ...styles.th, width: shouldShowDualPrice ? '20%' : '26%', textAlign: 'left' }}>{shouldShowDualPrice ? '终端价' : '价格'}</th>
              {shouldShowDualPrice && <th style={{ ...styles.th, width: '20%', textAlign: 'left' }}>经销商价</th>}
              {!isReadOnly && <th style={{ ...styles.th, width: shouldShowDualPrice ? '18%' : '18%', textAlign: 'center' }}>操作</th>}
            </tr>
          </thead>
          <tbody>
            {paginatedProducts.map((product) => (
              <tr
                key={product.id}
                style={{
                  ...styles.tableRow,
                  ...(hoveredProductId === product.id ? styles.tableRowHover : {}),
                }}
                onMouseEnter={() => setHoveredProductId(product.id)}
                onMouseLeave={() => setHoveredProductId(null)}
              >
                <td style={styles.td}>
                  <span style={styles.productName}>{product.name}</span>
                </td>
                <td style={styles.tdSecondary}>
                  {getCleanDescription(product) || product.description ? (
                    getCleanDescription(product) || product.description
                  ) : (
                    <span style={styles.emptyValue}>-</span>
                  )}
                </td>
                <td style={styles.tdPrice}><span style={styles.currencySymbol}>¥</span>{Number(product.price).toLocaleString()}</td>
                {shouldShowDualPrice && (
                  <td style={styles.tdPrice}>
                    {hasDualPrice(product.category) && product.dealer_price ? <><span style={styles.currencySymbol}>¥</span>{Number(product.dealer_price).toLocaleString()}</> : '-'}
                  </td>
                )}
                {!isReadOnly && (
                  <td style={styles.tdActions}>
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

      {displayProducts.length > ITEMS_PER_PAGE && (
        <div style={styles.paginationWrap}>
          <button
            type="button"
            style={{ ...styles.pageButton, ...(currentPage === 1 ? styles.pageButtonDisabled : {}) }}
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
          >
            上一页
          </button>
          <div style={styles.pageInfo}>
            第 {currentPage} / {totalPages} 页
          </div>
          <button
            type="button"
            style={{ ...styles.pageButton, ...(currentPage === totalPages ? styles.pageButtonDisabled : {}) }}
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
          >
            下一页
          </button>
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingProduct ? '编辑产品' : '添加产品'}
        width={600}
        footer={null}
      >
        <div style={{ padding: '0 4px', paddingBottom: '24px' }}>
          {!editingProduct && productTemplates[formData.category] && (
            <div style={{ marginBottom: '24px', padding: '16px', backgroundColor: '#f9fafb', borderRadius: '8px' }}>
              <div style={{ fontSize: '12px', fontWeight: '600', color: '#6b7280', marginBottom: '12px', textTransform: 'uppercase' }}>
                快速添加模板
              </div>
              <div className="sf-capsule-group">
                {productTemplates[formData.category].map((template, index) => (
                  <button
                    key={index}
                    type="button"
                    className={`sf-capsule ${hoveredTemplate === index ? 'active' : ''}`}
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
                className="sf-input"
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
                className="sf-input"
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
                className="sf-input"
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
                  className="sf-input"
                  value={formData.dealer_price}
                  onChange={(e) => setFormData({ ...formData, dealer_price: e.target.value })}
                />
              </div>
            )}

            <div style={{ paddingTop: '20px', borderTop: '1px solid #EBEDF0', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '16px' }}>
              <button
                type="button"
                className="sf-btn sf-btn-cancel"
                onClick={handleCloseModal}
              >
                取消
              </button>
              <button
                type="submit"
                className="sf-btn sf-btn-confirm"
              >
                {editingProduct ? '保存修改' : '添加'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(pendingDeleteProduct)}
        onClose={() => setPendingDeleteProduct(null)}
        title="确认删除"
        width={600}
        footer={null}
      >
        <div style={{ padding: '8px 4px 4px' }}>
          <p style={styles.confirmMessage}>
            确定要删除产品 <strong>{pendingDeleteProduct?.name}</strong> 吗？
          </p>
          <p style={styles.confirmHint}>删除后数据将进入回收站，可在回收站中恢复或永久删除。</p>
          <div style={styles.confirmActions}>
            <button type="button" className="sf-btn sf-btn-cancel" onClick={() => setPendingDeleteProduct(null)}>
              取消
            </button>
            <button type="button" className="sf-btn sf-btn-confirm" onClick={confirmDelete}>
              确认删除
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
  },
  stickyHeader: {
    display: 'flex',
    flexDirection: 'column',
    gap: '24px',
    paddingBottom: '4px',
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
    border: '1px solid rgba(65, 105, 225, 0.15)',
    boxShadow: '0 8px 30px rgba(30, 41, 59, 0.12), 0 0 0 1px rgba(65, 105, 225, 0.05)',
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
    color: '#3355C0',
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
    fontSize: '42px',
    fontWeight: '700',
    color: '#111111',
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
    borderRadius: '999px',
    fontSize: '14px',
    width: '280px',
    outline: 'none',
    backgroundColor: '#FFFFFF',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    color: '#1E293B',
  },
  addButton: {
    padding: '12px 26px',
    background: '#111111',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '999px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
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
    background: '#111111',
    color: '#FFFFFF',
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
    transition: 'box-shadow 0.3s ease, transform 0.3s ease',
  },
  paginationWrap: {
    display: 'flex',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: '12px',
  },
  pageInfo: {
    padding: '10px 14px',
    borderRadius: '999px',
    backgroundColor: '#f5f5f7',
    color: '#64748B',
    fontSize: '13px',
    fontWeight: '600',
  },
  pageButton: {
    padding: '10px 16px',
    border: '1px solid #E2E8F0',
    borderRadius: '999px',
    backgroundColor: '#FFFFFF',
    color: '#111111',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  pageButtonDisabled: {
    opacity: 0.45,
    cursor: 'not-allowed',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    tableLayout: 'fixed',
  },
  tableHeader: {
    backgroundColor: '#FFFFFF',
  },
  th: {
    position: 'sticky',
    top: '20px',
    zIndex: 90,
    padding: '10px 24px 18px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '700',
    color: '#64748B',
    borderBottom: '1px solid #E2E8F0',
    letterSpacing: '1px',
    backgroundColor: '#FFFFFF',
  },
  tableRow: {
    borderBottom: '1px solid #F1F5F9',
    transition: 'background-color 0.2s ease, box-shadow 0.2s ease',
    cursor: 'default',
  },
  tableRowHover: {
    backgroundColor: '#f8fafc',
  },
  td: {
    padding: '18px 24px',
    fontSize: '14px',
    color: '#1E293B',
    verticalAlign: 'middle',
  },
  tdSecondary: {
    padding: '18px 24px',
    fontSize: '14px',
    color: '#64748B',
    verticalAlign: 'middle',
    wordBreak: 'break-word',
    textAlign: 'left',
  },
  productName: {
    fontSize: '15px',
    fontWeight: '600',
    color: '#1E293B',
    lineHeight: '1.5',
    wordBreak: 'keep-all',
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
    color: '#111111',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    textAlign: 'left',
    fontVariantNumeric: 'tabular-nums',
    fontFamily: '"SFMono-Regular", "SF Mono", "Roboto Mono", "Menlo", monospace',
  },
  currencySymbol: {
    fontSize: '0.82em',
    color: '#94A3B8',
    marginRight: '2px',
    fontWeight: '600',
  },
  emptyValue: {
    color: '#c0c7d4',
  },
  tdActions: {
    padding: '18px 32px 18px 24px',
    fontSize: '14px',
    color: '#1E293B',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
  },
  editButton: {
    padding: '8px 18px',
    backgroundColor: 'transparent',
    color: '#2563eb',
    border: '1px solid transparent',
    borderRadius: '999px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  deleteButton: {
    padding: '8px 18px',
    backgroundColor: 'transparent',
    color: '#fca5a5',
    border: '1px solid transparent',
    borderRadius: '999px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  confirmMessage: {
    margin: 0,
    fontSize: '16px',
    lineHeight: '1.7',
    color: '#111111',
  },
  confirmHint: {
    margin: '12px 0 0',
    fontSize: '13px',
    lineHeight: '1.7',
    color: '#64748B',
  },
  confirmActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '24px',
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
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
    boxShadow: '0 24px 48px rgba(30, 41, 59, 0.2), 0 0 0 1px rgba(65, 105, 225, 0.05)',
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
    backgroundColor: 'rgba(65, 105, 225, 0.08)',
    borderColor: 'rgba(65, 105, 225, 0.3)',
    color: '#3355C0',
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
    borderRadius: '999px',
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
    borderRadius: '999px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  submitButton: {
    padding: '12px 28px',
    background: '#111111',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '999px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 16px rgba(65, 105, 225, 0.35)',
  },
}
