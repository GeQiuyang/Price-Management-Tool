import { useState, useEffect } from 'react'
import Modal from '../components/Modal'
import { API_URL } from '../lib/api'

const getAuthHeaders = () => {
  const token = localStorage.getItem('token')
  return token ? { 'Authorization': `Bearer ${token}` } : {}
}

const WAREHOUSE_INFOS = {
  '广州': '广州仓库工作时间:8:30AM-11.30AM，1:00PM-6:00PM((特殊情况提前沟通)需要开顶的车,仓库负责人:陈金峰17352688572',
  '武汉': '武汉仓库工作时间:8:00AM-6:00PM(特殊情况提前沟通)，周日正常发货，仓库负责人杨:17786446669'
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

export default function Warehouses() {
  const ITEMS_PER_PAGE = 10
  const [products, setProducts] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeWarehouse, setActiveWarehouse] = useState('广州')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [hoveredProductId, setHoveredProductId] = useState(null)
  const [showModal, setShowModal] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [editingProduct, setEditingProduct] = useState(null)
  const [pendingDeleteProduct, setPendingDeleteProduct] = useState(null)
  const [formData, setFormData] = useState({
    name: '',
    warehouse: '广州',
    price: '',
    description: '',
    status: 'active',
  })

  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isReadOnly = user.role === 'foreign_trade'

  const warehouses = [
    { id: '广州', name: '广州' },
    { id: '武汉', name: '武汉' },
    { id: '长沙&邵阳', name: '长沙&邵阳' },
    { id: '大连', name: '大连' },
    { id: '成都', name: '成都' },
    { id: '浙江', name: '浙江' },
    { id: '洛阳', name: '洛阳' },
  ]

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    setCurrentPage(1)
  }, [activeWarehouse, searchQuery])

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${API_URL}/warehouse-products`)
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
    setFormData({ name: '', warehouse: activeWarehouse, price: '', description: '', status: 'active' })
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

  const confirmDelete = async () => {
    if (!pendingDeleteProduct) return
    try {
      await fetch(`${API_URL}/warehouse-products/${pendingDeleteProduct.id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        },
      })
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
        response = await fetch(`${API_URL}/warehouse-products/${editingProduct.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify(formData),
        })
      } else {
        response = await fetch(`${API_URL}/warehouse-products`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...getAuthHeaders(),
          },
          body: JSON.stringify({ ...formData, warehouse: activeWarehouse }), // Ensure new creations match active tab
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

  const getProductsByWarehouse = (warehouseId) => {
    if (warehouseId === '长沙&邵阳') {
      return products.filter((p) => p.warehouse === '长沙' || p.warehouse === '邵阳' || p.warehouse === '长沙&邵阳')
    }
    return products.filter((p) => p.warehouse === warehouseId)
  }

  const getDisplayProducts = () => {
    const trimmedQuery = searchQuery.trim()
    const currentWarehouseProducts = getProductsByWarehouse(activeWarehouse)

    if (trimmedQuery) {
      // 全局排除 "SMSCC" 品牌干扰项：在处理关键词和匹配目标时均忽略它
      const keyword = trimmedQuery.replace(/SMSCC/gi, '').trim().replace(/-/g, '')

      // 如果剔除品牌名后关键词为空，且原始输入包含品牌名，则认为无有效搜索内容
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

        return currentWarehouseProducts.filter(p => {
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

      // 钻具类等没有特定category，尝试按 drill matching logic 或者通用匹配
      const levelDrill = currentWarehouseProducts.filter(p => {
        // 简单复写一下，因为仓库里的产品没有category字段，所以默认所有非导管判断走钻具逻辑或fallback
        const searchTarget = `${p.name} ${p.description || ''}`.replace(/SMSCC/gi, '').replace(/[\s\-]+/g, '').toLowerCase()
        const drillSegments = keyword.match(/[\u4e00-\u9fff]+|[a-zA-Z0-9]+/g) || [keyword]

        return drillSegments.every(seg => searchTarget.includes(seg.toLowerCase()))
      })

      // Level 0: 名称+全数字型号组合匹配
      const level0 = (chinesePart && numberPart)
        ? currentWarehouseProducts.filter((p) => {
          const nameMatch = p.name.toLowerCase().includes(chinesePart)
          const specMatch = p.description && p.description.match(/(?:规格)?型号(\d+)/)
          return nameMatch && specMatch && specMatch[1] === numberPart
        })
        : []

      // Level 1: 纯数字搜索
      const level1 = isNumericOnly
        ? currentWarehouseProducts.filter((p) => {
          const specMatch = p.description && p.description.match(/(?:规格)?型号(\d+)/)
          return specMatch && specMatch[1] === keyword
        })
        : []

      // Fallback
      const genericMatch = currentWarehouseProducts.filter((p) => {
        return p.name.toLowerCase().includes(lowerKeyword) ||
          (p.description && p.description.toLowerCase().includes(lowerKeyword))
      })

      // 去重合并
      let result = []
      if (levelPipe.length > 0) {
        result = [...levelPipe]
      } else if (level0.length > 0) {
        result = [...level0]
      } else if (level1.length > 0) {
        result = [...level1]
      } else if (levelDrill.length > 0) {
        result = [...levelDrill]
      } else {
        result = [...genericMatch]
      }

      // 如果有smscc且没有效搜索则略过（上方已处理）
      return Array.from(new Set(result))
    }

    return currentWarehouseProducts
  }

  if (loading) {
    return <div style={styles.loading}>加载中...</div>
  }

  const displayProducts = getDisplayProducts()
  const totalPages = Math.max(1, Math.ceil(displayProducts.length / ITEMS_PER_PAGE))
  const paginatedProducts = displayProducts.slice((currentPage - 1) * ITEMS_PER_PAGE, currentPage * ITEMS_PER_PAGE)

  return (
    <div style={styles.container}>
      <style>{modalAnimationStyles}</style>

      <div style={styles.stickyHeader}>
        <div style={styles.topBar}>
          <h2 style={styles.pageTitle}>仓库管理</h2>
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
          {warehouses.map((warehouse) => (
            <button
              key={warehouse.id}
              style={{
                ...styles.tab,
                ...(activeWarehouse === warehouse.id ? styles.tabActive : {}),
              }}
              onClick={() => setActiveWarehouse(warehouse.id)}
            >
              {warehouse.name}
              <span style={styles.tabCount}>
                {getProductsByWarehouse(warehouse.id).length}
              </span>
            </button>
          ))}
        </div>
      </div>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={{ ...styles.th, width: '25%' }}>产品名称</th>
              <th style={{ ...styles.th, width: '45%' }}>产品规格</th>
              <th style={{ ...styles.th, width: '15%', textAlign: 'right' }}>价格</th>
              {!isReadOnly && <th style={{ ...styles.th, width: '15%', textAlign: 'center' }}>操作</th>}
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
                  {product.description ? (
                    product.description
                  ) : (
                    <span style={styles.emptyValue}>-</span>
                  )}
                </td>
                <td style={styles.tdPrice}><span style={styles.currencySymbol}>¥</span>{Number(product.price).toLocaleString()}</td>
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
            {paginatedProducts.length === 0 && (
              <tr>
                <td colSpan={isReadOnly ? 3 : 4} style={{ textAlign: 'center', padding: '40px', color: '#94A3B8' }}>
                  当前仓库还没有产品
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '24px', gap: '20px' }}>
        <div style={{ flex: 1, fontSize: '13px', color: '#64748B', lineHeight: '1.6', backgroundColor: '#F8FAFC', padding: '12px 16px', borderRadius: '12px', border: '1px solid #E2E8F0' }}>
          {WAREHOUSE_INFOS[activeWarehouse] || '暂无详细信息'}
        </div>

        {displayProducts.length > ITEMS_PER_PAGE && (
          <div style={{ ...styles.paginationWrap, marginTop: 0 }}>
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
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingProduct ? '编辑产品' : '添加产品'}
        width={600}
        footer={null}
      >
        <div style={{ padding: '0 24px', paddingBottom: '24px' }}>
          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                所属仓库
              </label>
              <select
                className="sf-input"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }}
                value={formData.warehouse}
                onChange={(e) => setFormData({ ...formData, warehouse: e.target.value })}
                disabled={!editingProduct} // Disable changing warehouse on add mode to stick to current tab
              >
                {warehouses.map(w => (
                  <option key={w.id} value={w.id}>{w.name}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                产品名称
              </label>
              <input
                type="text"
                className="sf-input"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }}
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                规格描述
              </label>
              <textarea
                className="sf-input"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none', resize: 'vertical', minHeight: '80px' }}
                value={formData.description}
                onChange={(e) => handleDescriptionChange(e.target.value)}
              />
            </div>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', marginBottom: '8px', fontSize: '14px', fontWeight: '500', color: '#374151' }}>
                价格 (¥)
              </label>
              <input
                type="number"
                step="0.01"
                className="sf-input"
                style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid #E2E8F0', outline: 'none' }}
                value={formData.price}
                onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                required
              />
            </div>

            <div style={{ paddingTop: '20px', borderTop: '1px solid #EBEDF0', display: 'flex', justifyContent: 'flex-end', gap: '12px', marginTop: '8px' }}>
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
                {editingProduct ? '保存修改' : '添加产品'}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(pendingDeleteProduct)}
        onClose={() => setPendingDeleteProduct(null)}
        title="确认删除"
        width={500}
        footer={null}
      >
        <div style={{ padding: '8px 24px 24px' }}>
          <p style={styles.confirmMessage}>
            确定要删除产品 <strong>{pendingDeleteProduct?.name}</strong> 吗？
          </p>
          <p style={styles.confirmHint}>此操作不可撤销。</p>
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
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    height: '240px',
    fontSize: '15px',
    color: 'var(--text-secondary)',
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
    overflowX: 'auto', // For small screens
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
    whiteSpace: 'nowrap',
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
  tdPrice: {
    padding: '18px 24px',
    fontSize: '16px',
    fontWeight: '700',
    color: '#111111',
    whiteSpace: 'nowrap',
    verticalAlign: 'middle',
    textAlign: 'right',
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
    justifyContent: 'center',
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
}
