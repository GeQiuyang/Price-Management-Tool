import { useState, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'
import Modal from '../components/Modal'

const API_URL = 'http://localhost:3001/api'

const modalAnimationStyles = `
  @keyframes modalOverlayIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes modalOverlayOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  @keyframes modalSlideIn {
    from { opacity: 0; transform: translateY(32px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes modalSlideOut {
    from { opacity: 1; transform: translateY(0) scale(1); }
    to { opacity: 0; transform: translateY(24px) scale(0.97); }
  }
  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  @keyframes warningPulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  .quote-product-row:hover {
    background: var(--bg-tertiary) !important;
  }
  .quote-search-input:focus {
    border-color: #1E293B !important;
    box-shadow: 0 0 0 3px rgba(30, 41, 59, 0.1) !important;
  }
  .product-quantity-input:focus {
    border-color: #1E293B !important;
    box-shadow: 0 0 0 3px rgba(30, 41, 59, 0.1) !important;
  }
  .quote-desc-cell {
    position: relative;
    cursor: default;
  }
  .quote-desc-tooltip {
    visibility: hidden;
    opacity: 0;
    position: absolute;
    left: 0;
    top: 100%;
    margin-top: 6px;
    background: #1e293b;
    color: #f1f5f9;
    padding: 10px 14px;
    border-radius: 8px;
    font-size: 13px;
    line-height: 1.5;
    white-space: pre-wrap;
    word-break: break-all;
    min-width: 160px;
    max-width: 320px;
    width: max-content;
    box-shadow: 0 8px 24px rgba(0,0,0,0.2);
    z-index: 1000;
    pointer-events: none;
    transition: opacity 0.15s ease, visibility 0.15s ease, transform 0.15s ease;
    transform: translateY(4px);
  }
  .quote-desc-tooltip::before {
    content: '';
    position: absolute;
    bottom: 100%;
    left: 20px;
    border: 6px solid transparent;
    border-bottom-color: #1e293b;
  }
  .quote-desc-cell:hover .quote-desc-tooltip {
    visibility: visible;
    opacity: 1;
    transform: translateY(0);
  }
`

export default function QuoteGenerator() {
    // 报价单列表
    const [quoteLists, setQuoteLists] = useState([])
    const [activeQuoteListId, setActiveQuoteListId] = useState(null)
    const [isEditingListName, setIsEditingListName] = useState(null)
    const [editingNameValue, setEditingNameValue] = useState('')

    // 产品报价行
    const [quoteItems, setQuoteItems] = useState([])
    // 产品数据源
    const [products, setProducts] = useState([])
    // 添加产品弹窗
    const [showProductModal, setShowProductModal] = useState(false)
    const [isClosing, setIsClosing] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [useDealerPrice, setUseDealerPrice] = useState(false)

    // 自定义产品弹窗
    const [showCustomProductModal, setShowCustomProductModal] = useState(false)
    const [customProduct, setCustomProduct] = useState({ name: '', description: '', price: '', quantity: 1 })

    // Excel 导入相关
    const [importedData, setImportedData] = useState([])
    const [importedSheets, setImportedSheets] = useState([])
    const [activeSheet, setActiveSheet] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const [importing, setImporting] = useState(false)
    const [fileName, setFileName] = useState('')
    const [showPreview, setShowPreview] = useState(false)
    const [isPreviewClosing, setIsPreviewClosing] = useState(false)
    // Tab 切换
    const [activeTab, setActiveTab] = useState('products') // 'products' | 'import'
    const fileInputRef = useRef(null)
    // 清除确认对话框
    const [showClearModal, setShowClearModal] = useState(false)
    const [isClearClosing, setIsClearClosing] = useState(false)

    // 拖拽排序
    const [dragIndex, setDragIndex] = useState(null)
    const [dragOverIndex, setDragOverIndex] = useState(null)
    const [showMoreActions, setShowMoreActions] = useState(false)
    const moreActionsRef = useRef(null)

    // 初始化加载基础数据
    useEffect(() => {
        fetchProducts()
        fetchQuoteLists()
    }, [])

    // 当活动的报价单切换时，重新获取其数据
    useEffect(() => {
        if (activeQuoteListId) {
            fetchQuoteItems(activeQuoteListId)
            fetchImportedData(activeQuoteListId)
        } else {
            setQuoteItems([])
            setImportedData([])
        }
    }, [activeQuoteListId])

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (moreActionsRef.current && !moreActionsRef.current.contains(event.target)) {
                setShowMoreActions(false)
            }
        }

        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const fetchQuoteLists = async () => {
        try {
            const res = await fetch(`${API_URL}/quote-lists`)
            const data = await res.json()
            setQuoteLists(data)
            if (data.length > 0 && !activeQuoteListId) {
                setActiveQuoteListId(data[0].id)
            } else if (data.length === 0) {
                // 如果后端为空，自动创建一个默认的
                handleCreateQuoteList()
            }
        } catch (err) {
            console.error('获取报价单列表失败:', err)
        }
    }

    const handleCreateQuoteList = async () => {
        if (quoteLists.length >= 3) {
            alert('最多只能新增 2 个报价单')
            return
        }
        try {
            const res = await fetch(`${API_URL}/quote-lists`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: `报价单 ${quoteLists.length + 1}` })
            })
            const newList = await res.json()
            setQuoteLists([...quoteLists, newList])
            setActiveQuoteListId(newList.id)
        } catch (err) {
            console.error('创建报价单失败:', err)
        }
    }

    const handleDeleteQuoteListClick = async (id, e) => {
        e.stopPropagation()
        if (quoteLists.length <= 1) {
            alert('必须保留至少一个报价单')
            return
        }

        try {
            await fetch(`${API_URL}/quote-lists/${id}`, { method: 'DELETE' })
            const newLists = quoteLists.filter(list => list.id !== id)
            setQuoteLists(newLists)
            if (activeQuoteListId === id) {
                setActiveQuoteListId(newLists[0].id)
            }
        } catch (err) {
            console.error('删除报价单失败:', err)
        }
    }

    const handleUpdateListName = async (id) => {
        if (!editingNameValue.trim()) return
        try {
            await fetch(`${API_URL}/quote-lists/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ name: editingNameValue.trim() })
            })
            setQuoteLists(quoteLists.map(list =>
                list.id === id ? { ...list, name: editingNameValue.trim() } : list
            ))
            setIsEditingListName(null)
        } catch (err) {
            console.error('更新报价单名称失败:', err)
        }
    }

    const fetchQuoteItems = async (listId) => {
        try {
            const res = await fetch(`${API_URL}/quote-items?list_id=${listId}`)
            const data = await res.json()
            setQuoteItems(data)
        } catch (err) {
            console.error('获取报价项失败:', err)
        }
    }

    const fetchImportedData = async (listId) => {
        try {
            const res = await fetch(`${API_URL}/quote-imported-data?list_id=${listId}`)
            const data = await res.json()
            setImportedData(data)
        } catch (err) {
            console.error('获取导入数据失败:', err)
        }
    }

    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API_URL}/products`)
            const data = await res.json()
            setProducts(data)
        } catch (err) {
            console.error('获取产品失败:', err)
        }
    }

    const dualPriceCategories = ['导管类', '水泵类']
    const getProductPrice = (product) => {
        if (useDealerPrice && product.dealer_price && dualPriceCategories.includes(product.category)) {
            return product.dealer_price
        }
        return product.price
    }

    const insertItemAndReorder = async (newItem) => {
        let targetIdx = -1;
        for (let i = quoteItems.length - 1; i >= 0; i--) {
            if (quoteItems[i].name === newItem.name) {
                targetIdx = i;
                break;
            }
        }

        if (targetIdx !== -1) {
            const newItems = [...quoteItems];
            newItems.splice(targetIdx + 1, 0, newItem);
            setQuoteItems(newItems);

            try {
                // 触发重新排序同步到数据库
                await fetch(`${API_URL}/quote-items/reorder`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ itemIds: newItems.map(i => i.id) })
                })
            } catch (err) {
                console.error('排序同步失败:', err)
            }
        } else {
            setQuoteItems(prev => [...prev, newItem]);
        }
    }

    const handleAddProduct = async (product) => {
        const selectedPrice = getProductPrice(product)
        const existing = quoteItems.find(item => item.productId === product.id)
        if (existing) {
            const newQty = existing.quantity + 1
            setQuoteItems(quoteItems.map(item =>
                item.productId === product.id ? { ...item, quantity: newQty } : item
            ))
            fetch(`${API_URL}/quote-items/${existing.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price: existing.price, quantity: newQty }),
            })
        } else {
            try {
                const res = await fetch(`${API_URL}/quote-items`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        productId: product.id,
                        name: product.name,
                        description: product.description || '',
                        price: selectedPrice,
                        quantity: 1,
                        list_id: activeQuoteListId,
                    }),
                })
                const newItem = await res.json()
                await insertItemAndReorder(newItem)
            } catch (err) {
                console.error('添加报价项失败:', err)
            }
        }
    }

    const handleAddCustomProduct = async () => {
        if (!customProduct.name.trim()) return alert('请输入产品名称')
        if (!customProduct.price || isNaN(customProduct.price)) return alert('请输入有效的单价')
        if (!customProduct.quantity || customProduct.quantity < 1) return alert('请输入有效的数量')

        try {
            // 获取当前列表的最大 order_index
            let nextOrder = 0;
            if (quoteItems.length > 0) {
                nextOrder = Math.max(...quoteItems.map(i => i.order_index || 0)) + 1;
            }

            const res = await fetch(`${API_URL}/quote-items`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    productId: '', // 自定义产品没有在产品库中的ID
                    name: customProduct.name.trim(),
                    description: customProduct.description.trim(),
                    price: parseFloat(customProduct.price),
                    quantity: parseInt(customProduct.quantity, 10),
                    order_index: nextOrder,
                    list_id: activeQuoteListId,
                }),
            })
            const newItem = await res.json()
            await insertItemAndReorder(newItem)
            setShowCustomProductModal(false)
            setCustomProduct({ name: '', description: '', price: '', quantity: 1 })
            setShowProductModal(false) // 添加成功后也可以顺便关掉主弹窗
        } catch (err) {
            console.error('添加自定义产品失败:', err)
        }
    }

    const handleIncreaseFromModal = (product, e) => {
        e.stopPropagation()
        const existing = quoteItems.find(item => item.productId === product.id)
        if (existing) {
            const newQty = existing.quantity + 1
            setQuoteItems(quoteItems.map(item =>
                item.productId === product.id ? { ...item, quantity: newQty } : item
            ))
            fetch(`${API_URL}/quote-items/${existing.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price: existing.price, quantity: newQty }),
            })
        }
    }

    const handleDecreaseFromModal = (product, e) => {
        e.stopPropagation()
        const existing = quoteItems.find(item => item.productId === product.id)
        if (existing) {
            const newQty = existing.quantity - 1
            if (newQty <= 0) {
                handleRemoveItem(existing.id)
            } else {
                setQuoteItems(quoteItems.map(item =>
                    item.productId === product.id ? { ...item, quantity: newQty } : item
                ))
                fetch(`${API_URL}/quote-items/${existing.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ price: existing.price, quantity: newQty }),
                })
            }
        }
    }

    const handleQuantityInputChange = (product, value, e) => {
        e.stopPropagation()
        setQuoteItems(quoteItems.map(item =>
            item.productId === product.id ? { ...item, qtyInput: value } : item
        ))
    }

    const handleQuantityInputBlur = (product, value, e) => {
        e.stopPropagation()
        const existing = quoteItems.find(item => item.productId === product.id)
        if (existing) {
            const num = Math.max(0, parseInt(value) || 0)
            if (num <= 0) {
                handleRemoveItem(existing.id)
            } else {
                setQuoteItems(quoteItems.map(item =>
                    item.productId === product.id ? { ...item, quantity: num, qtyInput: undefined } : item
                ))
                fetch(`${API_URL}/quote-items/${existing.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ price: existing.price, quantity: num }),
                })
            }
        }
    }

    const handleQuantityChange = (id, value) => {
        setQuoteItems(quoteItems.map(item =>
            item.id === id ? { ...item, qtyInput: value } : item
        ))
    }

    const handleQuantityBlur = (id, value) => {
        const num = Math.max(0, parseInt(value) || 0)
        if (num <= 0) {
            handleRemoveItem(id)
        } else {
            setQuoteItems(quoteItems.map(item =>
                item.id === id ? { ...item, quantity: num, qtyInput: undefined } : item
            ))
            const item = quoteItems.find(i => i.id === id)
            if (item) {
                fetch(`${API_URL}/quote-items/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ price: item.price, quantity: num }),
                })
            }
        }
    }

    const handleIncreaseQuantity = (id) => {
        const item = quoteItems.find(i => i.id === id)
        if (item) {
            const newQty = item.quantity + 1
            setQuoteItems(quoteItems.map(i =>
                i.id === id ? { ...i, quantity: newQty } : i
            ))
            fetch(`${API_URL}/quote-items/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price: item.price, quantity: newQty }),
            })
        }
    }

    const handleDecreaseQuantity = (id) => {
        const item = quoteItems.find(i => i.id === id)
        if (item) {
            const newQty = item.quantity - 1
            if (newQty <= 0) {
                handleRemoveItem(id)
            } else {
                setQuoteItems(quoteItems.map(i =>
                    i.id === id ? { ...i, quantity: newQty } : i
                ))
                fetch(`${API_URL}/quote-items/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ price: item.price, quantity: newQty }),
                })
            }
        }
    }

    const handlePriceChange = (id, value) => {
        setQuoteItems(quoteItems.map(item =>
            item.id === id ? { ...item, priceInput: value } : item
        ))
    }

    const handlePriceBlur = (id, value) => {
        const num = Math.max(0, parseFloat(value) || 0)
        setQuoteItems(quoteItems.map(item =>
            item.id === id ? { ...item, price: num, priceInput: undefined } : item
        ))
        const item = quoteItems.find(i => i.id === id)
        if (item) {
            fetch(`${API_URL}/quote-items/${id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ price: num, quantity: item.quantity }),
            })
        }
    }

    const handleRemoveItem = (id) => {
        setQuoteItems(quoteItems.filter(item => item.id !== id))
        fetch(`${API_URL}/quote-items/${id}`, { method: 'DELETE' })
    }

    const handleClearAll = () => {
        setShowClearModal(true)
    }

    const handleConfirmClear = () => {
        const urlParams = activeQuoteListId ? `?list_id=${activeQuoteListId}` : ''
        fetch(`${API_URL}/quote-items${urlParams}`, { method: 'DELETE' })
        setQuoteItems([])
        handleCloseClearModal()
    }

    const handleCloseClearModal = () => {
        setIsClearClosing(true)
        setTimeout(() => {
            setShowClearModal(false)
            setIsClearClosing(false)
        }, 200)
    }

    const totalAmount = quoteItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

    const handleCloseProductModal = () => {
        setIsClosing(true)
        setTimeout(() => {
            setShowProductModal(false)
            setIsClosing(false)
            setSearchTerm('')
        }, 200)
    }

    const filteredProducts = (() => {
        const trimmedQuery = searchTerm.trim()
        if (!trimmedQuery) return products

        // 全局排除 "SMSCC" 品牌干扰项
        const keyword = trimmedQuery.replace(/SMSCC/gi, '').trim().replace(/-/g, '')

        // 如果剔除品牌名后关键词为空，且原始输入包含品牌名，则认为无有效搜索内容
        if (!keyword && trimmedQuery.toLowerCase().includes('smscc')) {
            return []
        }

        const lowerKeyword = keyword.toLowerCase()
        const numbers = keyword.match(/\d+/g)
        const chinesePart = keyword.replace(/[\d\s]+/g, '').toLowerCase()
        const numberPart = numbers ? numbers.join('') : ''
        const isNumericOnly = /^\d+$/.test(keyword)


        // 导管类严格搜索：基于【产品名称】+【产品描述中的长度和厚度】
        // 导管搜索格式：300+尖丝+导管+长度+厚度
        // 料斗搜索格式：料斗+尺寸+厚度
        // 接头搜索格式：300+尖丝+接头+公扣/母扣/衬套
        const levelPipe = (() => {
            let remaining = keyword.replace(/[\s+]+/g, '')
            let queryDiameter = null
            const dm = remaining.match(/^(\d{3})/)
            if (dm) { queryDiameter = dm[1]; remaining = remaining.slice(3) }
            let queryThread = null
            const tm = remaining.match(/(尖丝|方丝)/)
            if (tm) { queryThread = tm[1]; remaining = remaining.replace(tm[1], '') }
            let queryType = null
            const tym = remaining.match(/(导管|接头|衬套|公扣|母扣|料斗)/)
            if (tym) { queryType = tym[1]; remaining = remaining.replace(tym[1], '') }
            let queryThickness = null
            const thm = remaining.match(/(\d+\.?\d*)mm/)
            if (thm) { queryThickness = thm[1]; remaining = remaining.replace(thm[0], '') }
            let queryLength = null
            const lm = remaining.match(/(\d+\.?\d*)m/)
            if (lm) { queryLength = lm[1]; remaining = remaining.replace(lm[0], '') }
            const remainingNums = remaining.match(/\d+\.?\d*/g) || []
            let queryHopperSize = null
            if (queryType === '料斗') {
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

                if (isHopper) {
                    if (queryType && queryType !== '料斗') return false
                    if (queryHopperSize) {
                        const nameSize = name.match(/^(\d+\.?\d*)/)
                        if (!nameSize || nameSize[1] !== queryHopperSize) return false
                    }
                    if (queryThickness) {
                        const descThickness = desc.match(/厚度[：:]?\s*(\d+\.?\d*)mm/)
                        if (!descThickness || descThickness[1] !== queryThickness) return false
                    }
                    if (queryDiameter || queryThread) return false
                    return textMatch
                }

                if (isPipe) {
                    if (queryType && queryType !== '导管') return false
                    if (queryDiameter) {
                        const nameDiameter = name.match(/^(\d+)/)
                        if (!nameDiameter || nameDiameter[1] !== queryDiameter) return false
                    }
                    if (queryThread && !name.includes(queryThread)) return false
                    if (queryLength) {
                        const descLength = desc.match(/长度[：:]?\s*(\d+\.?\d*)m/)
                        if (!descLength || descLength[1] !== queryLength) return false
                    }
                    if (queryThickness) {
                        const descThickness = desc.match(/壁厚[：:]?\s*(\d+\.?\d*)mm/)
                        if (!descThickness || descThickness[1] !== queryThickness) return false
                    }
                    return textMatch
                }

                if (isJoint) {
                    if (queryType && !name.includes(queryType)) return false
                    if (queryDiameter) {
                        const nameDiameter = name.match(/^(\d+)/)
                        if (!nameDiameter || nameDiameter[1] !== queryDiameter) return false
                    }
                    if (queryThread && !name.includes(queryThread)) return false
                    if (queryLength || queryThickness) return false
                    return textMatch
                }

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

        // Level 0: 名称+型号组合精准匹配
        const level0 = (chinesePart && numberPart)
            ? products.filter(p => {
                if (p.category === '钻具类') return false
                const nameMatch = p.name.toLowerCase().includes(chinesePart)
                const specMatch = p.description && p.description.match(/(?:规格)?型号(\d+)/)
                return nameMatch && specMatch && specMatch[1] === numberPart
            })
            : []

        // Level 1: 纯数字 → 只匹配规格型号；否则精确匹配规格全文
        const level1 = isNumericOnly
            ? products.filter(p => {
                if (p.category === '钻具类') return false
                const specMatch = p.description && p.description.match(/(?:规格)?型号(\d+)/)
                return specMatch && specMatch[1] === keyword
            })
            : products.filter(p => {
                if (p.category === '钻具类') return false
                return p.description && p.description === keyword
            })

        // Level 2: 名称+型号宽松匹配（数字匹配规格型号）
        const level2 = (chinesePart && numberPart)
            ? products.filter(p => {
                if (p.category === '钻具类') return false
                const nameMatch = p.name.toLowerCase().includes(chinesePart)
                const specMatch = p.description && p.description.match(/(?:规格)?型号(\d+)/)
                return nameMatch && specMatch && specMatch[1] === numberPart
            })
            : []

        // Level 3: 名称前缀匹配
        const level3 = products.filter(p => {
            if (p.category === '钻具类') return false
            return p.name.toLowerCase().startsWith(lowerKeyword)
        })

        // Level 4: 全字段模糊匹配（纯数字时禁用）
        const level4 = isNumericOnly
            ? []
            : products.filter(p => {
                if (p.category === '钻具类') return false
                return p.name.toLowerCase().includes(lowerKeyword) ||
                    (p.description && p.description.toLowerCase().includes(lowerKeyword))
            })

        const seen = new Set()
        const result = []
        for (const list of [levelPipe, levelDrill, level0, level1, level2, level3, level4]) {
            for (const p of list) {
                if (!seen.has(p.id)) {
                    seen.add(p.id)
                    result.push(p)
                }
            }
        }
        return result
    })()

    // ─── Excel 导入相关 ───
    const processExcelFile = (file) => {
        if (!file) return
        setImporting(true)
        setFileName(file.name)

        const reader = new FileReader()
        reader.onload = (e) => {
            try {
                const data = new Uint8Array(e.target.result)
                const workbook = XLSX.read(data, { type: 'array' })
                const sheets = workbook.SheetNames.map((name) => {
                    const sheet = workbook.Sheets[name]
                    const jsonData = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' })
                    return {
                        name,
                        headers: jsonData[0] || [],
                        rows: jsonData.slice(1).filter(row => row.some(cell => cell !== '')),
                        rawData: XLSX.utils.sheet_to_json(sheet),
                    }
                })
                setImportedSheets(sheets)
                setActiveSheet(0)
                setShowPreview(true)
                setImporting(false)
            } catch {
                alert('Excel 文件解析失败，请检查文件格式')
                setImporting(false)
            }
        }
        reader.readAsArrayBuffer(file)
    }

    const handleFileSelect = (e) => {
        processExcelFile(e.target.files[0])
        e.target.value = ''
    }

    const handleDrop = (e) => {
        e.preventDefault()
        setIsDragging(false)
        const file = e.dataTransfer.files[0]
        if (file && (file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv'))) {
            processExcelFile(file)
        } else {
            alert('请上传 .xlsx / .xls / .csv 格式的文件')
        }
    }

    const handleConfirmImport = async () => {
        const newData = importedSheets.flatMap((sheet) =>
            sheet.rawData.map((row, i) => ({ sheetName: sheet.name, ...row }))
        )
        try {
            const res = await fetch(`${API_URL}/quote-imported-data`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ items: newData, list_id: activeQuoteListId }),
            })
            const saved = await res.json()
            setImportedData(prev => [...prev, ...saved])
        } catch (err) {
            console.error('保存导入数据失败:', err)
            // fallback: still update UI
            const fallback = newData.map((row, i) => ({ id: Date.now() + i, ...row, listId: activeQuoteListId }))
            setImportedData(prev => [...prev, ...fallback])
        }
        handleClosePreview()
    }

    const handleClosePreview = () => {
        setIsPreviewClosing(true)
        setTimeout(() => {
            setShowPreview(false)
            setIsPreviewClosing(false)
            setImportedSheets([])
            setFileName('')
        }, 200)
    }

    // ─── 导出 ───
    const handleExportQuote = () => {
        const activeItems = quoteItems.filter(item => item.quantity > 0)
        if (activeItems.length === 0) {
            alert('没有数量大于0的产品，无法导出')
            return
        }
        const exportData = activeItems.map(item => ({
            产品名称: item.name,
            产品规格: item.description || '',
            单价: item.price,
            数量: item.quantity,
            合计: item.price * item.quantity,
        }))
        exportData.push({ 产品名称: '', 产品规格: '', 单价: '', 数量: '总计', 合计: totalAmount })
        const ws = XLSX.utils.json_to_sheet(exportData)
        const wb = XLSX.utils.book_new()

        const activeList = quoteLists.find(l => l.id === activeQuoteListId)
        const sheetName = activeList ? activeList.name : '报价单'

        XLSX.utils.book_append_sheet(wb, ws, sheetName)
        XLSX.writeFile(wb, `${sheetName}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`)
    }

    // ─── 拖拽排序 ───
    const handleDragStart = (e, index) => {
        setDragIndex(index)
        setDragOverIndex(null)
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', index)
    }

    const handleDragEnter = (e, index) => {
        e.preventDefault()
        if (dragIndex !== null && dragIndex !== index) {
            setDragOverIndex(index)
        }
    }

    const handleDropItem = async (e, dropIndex) => {
        e.preventDefault()
        const startIndex = dragIndex
        setDragIndex(null)
        setDragOverIndex(null)

        if (startIndex === null || startIndex === dropIndex) return

        const newItems = [...quoteItems]
        const [movedItem] = newItems.splice(startIndex, 1)
        newItems.splice(dropIndex, 0, movedItem)

        setQuoteItems(newItems)

        try {
            await fetch(`${API_URL}/quote-items/reorder`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ itemIds: newItems.map(i => i.id) })
            })
        } catch (err) {
            console.error('排序更新失败:', err)
        }
    }

    const handleDragEnd = () => {
        setDragIndex(null)
        setDragOverIndex(null)
    }

    const currentSheet = importedSheets[activeSheet]
    const importColumns = importedData.length > 0
        ? [...new Set(importedData.flatMap(q => Object.keys(q).filter(k => k !== '_dbId' && k !== 'sheetName')))]
        : []

    return (
        <div style={styles.container}>
            <style>{modalAnimationStyles}</style>

            <div style={styles.topBar}>
                <div style={styles.topBarContent}>
                    <div style={styles.topBarRow}>
                        <h2 style={styles.pageTitle}>报价中心</h2>
                        <div style={styles.topActions}>
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept=".xlsx,.xls,.csv"
                                onChange={handleFileSelect}
                                style={{ display: 'none' }}
                            />
                        </div>
                    </div>

                    {/* 报价单列表 Tabs */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflowX: 'auto', paddingBottom: '4px' }}>
                        {quoteLists.map(list => (
                            <div
                                key={list.id}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    width: '168px',
                                    minWidth: '168px',
                                    padding: '10px 18px',
                                    borderRadius: '999px',
                                    cursor: 'pointer',
                                    backgroundColor: activeQuoteListId === list.id ? '#111111' : 'white',
                                    color: activeQuoteListId === list.id ? 'white' : '#4b5563',
                                    border: `1px solid ${activeQuoteListId === list.id ? '#111111' : '#e5e7eb'}`,
                                    boxShadow: 'none',
                                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                                    whiteSpace: 'nowrap',
                                    fontSize: '14px',
                                    fontWeight: activeQuoteListId === list.id ? '500' : '400',
                                    boxSizing: 'border-box',
                                    flexShrink: 0,
                                }}
                                onClick={() => setActiveQuoteListId(list.id)}
                            >
                                {isEditingListName === list.id ? (
                                    <input
                                        autoFocus
                                        value={editingNameValue}
                                        onChange={(e) => setEditingNameValue(e.target.value)}
                                        onBlur={() => handleUpdateListName(list.id)}
                                        onKeyDown={(e) => {
                                            if (e.key === 'Enter') handleUpdateListName(list.id)
                                            if (e.key === 'Escape') setIsEditingListName(null)
                                        }}
                                        onClick={(e) => e.stopPropagation()}
                                        style={{
                                            border: 'none',
                                            outline: 'none',
                                            background: 'transparent',
                                            color: 'inherit',
                                            width: '100%',
                                            minWidth: 0,
                                            fontSize: 'inherit',
                                            fontWeight: 'inherit',
                                            flex: 1,
                                            textAlign: 'center',
                                        }}
                                    />
                                ) : (
                                    <span
                                        onDoubleClick={(e) => {
                                            e.stopPropagation()
                                            setEditingNameValue(list.name)
                                            setIsEditingListName(list.id)
                                        }}
                                        title="双击重命名"
                                        style={{
                                            flex: 1,
                                            minWidth: 0,
                                            overflow: 'hidden',
                                            textOverflow: 'ellipsis',
                                            whiteSpace: 'nowrap',
                                            textAlign: 'center',
                                        }}
                                    >
                                        {list.name}
                                    </span>
                                )}
                                {quoteLists.length > 1 && (
                                    <button
                                        onClick={(e) => handleDeleteQuoteListClick(list.id, e)}
                                        style={{
                                            background: 'none',
                                            border: 'none',
                                            cursor: 'pointer',
                                            color: activeQuoteListId === list.id ? 'rgba(255,255,255,0.7)' : '#9ca3af',
                                            padding: '0 2px',
                                            display: 'flex',
                                            alignItems: 'center',
                                            fontSize: '12px',
                                            flexShrink: 0,
                                        }}
                                        title="删除报价单"
                                    >×</button>
                                )}
                            </div>
                        ))}
                        {quoteLists.length < 3 && (
                            <button
                                onClick={handleCreateQuoteList}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '132px',
                                    height: '40px',
                                    padding: '10px 18px',
                                    borderRadius: '999px',
                                    border: '1px dashed #d1d5db',
                                    backgroundColor: '#ffffff',
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    flexShrink: 0,
                                    fontSize: '16px',
                                    lineHeight: 1,
                                }}
                                title="添加报价单"
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#4169E1';
                                    e.currentTarget.style.color = '#4169E1';
                                }}
                                onMouseLeave={(e) => {
                                    e.currentTarget.style.borderColor = '#d1d5db';
                                    e.currentTarget.style.color = '#6b7280';
                                }}
                            >
                                ＋
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Tab 切换 */}
            <div style={styles.tabActionRow}>
                <div style={styles.tabBar}>
                    <button
                        style={{ ...styles.tab, ...(activeTab === 'products' ? styles.tabActive : {}) }}
                        onClick={() => setActiveTab('products')}
                    >
                        📦 产品报价 ({quoteItems.length})
                    </button>
                    <button
                        style={{ ...styles.tab, ...(activeTab === 'import' ? styles.tabActive : {}) }}
                        onClick={() => setActiveTab('import')}
                    >
                        📊 Excel 数据 ({importedData.length})
                    </button>
                </div>
                <div style={styles.inlineActions}>
                    <button style={styles.addButton} onClick={() => setShowProductModal(true)}>
                        ＋
                    </button>
                    <div style={styles.moreActionsWrap} ref={moreActionsRef}>
                        <button
                            type="button"
                            style={styles.moreActionsButton}
                            onClick={() => setShowMoreActions((value) => !value)}
                        >
                            <span style={styles.moreActionsIcon}>⋯</span>
                        </button>

                        {showMoreActions && (
                            <div style={styles.moreActionsMenu}>
                                {quoteItems.length > 0 && (
                                    <>
                                        <button
                                            type="button"
                                            style={styles.moreActionsItem}
                                            onClick={() => {
                                                setShowMoreActions(false)
                                                handleClearAll()
                                            }}
                                        >
                                            清除所有
                                        </button>
                                        <button
                                            type="button"
                                            style={styles.moreActionsItem}
                                            onClick={() => {
                                                setShowMoreActions(false)
                                                handleExportQuote()
                                            }}
                                        >
                                            导出当前报价单
                                        </button>
                                    </>
                                )}
                                <button
                                    type="button"
                                    style={styles.moreActionsItem}
                                    onClick={() => {
                                        setShowMoreActions(false)
                                        fileInputRef.current?.click()
                                    }}
                                >
                                    导入 Excel
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* 产品报价表格 */}
            {activeTab === 'products' && quoteItems.length > 0 && (
                <div style={styles.tableCard}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={{ ...styles.th, width: '31%', paddingLeft: '54px' }}>产品名称</th>
                                <th style={{ ...styles.th, width: '25%' }}>产品规格</th>
                                <th style={{ ...styles.th, width: '13%' }}>价格</th>
                                <th style={{ ...styles.th, width: '15%' }}>数量</th>
                                <th style={{ ...styles.th, width: '10%' }}>合计</th>
                                <th aria-label="操作" style={{ ...styles.th, width: '6%', textAlign: 'right', minWidth: '64px' }}></th>
                            </tr>
                        </thead>
                        <tbody>
                            {quoteItems.map((item, index) => (
                                <tr
                                    key={item.id}
                                    className="quote-product-row"
                                    style={{
                                        ...styles.tableRow,
                                        cursor: dragIndex !== null ? 'grabbing' : 'grab',
                                        opacity: dragIndex === index ? 0.3 : 1,
                                        borderTop: dragOverIndex === index && dragIndex > index ? '2px solid #4169E1' : 'none',
                                        borderBottom: dragOverIndex === index && dragIndex < index ? '2px solid #4169E1' : '1px solid #F1F5F9',
                                        backgroundColor: dragOverIndex === index ? '#F8FAFC' : 'transparent',
                                        transition: 'all 0.2s ease',
                                    }}
                                    draggable
                                    onDragStart={(e) => handleDragStart(e, index)}
                                    onDragEnter={(e) => handleDragEnter(e, index)}
                                    onDragOver={(e) => e.preventDefault()}
                                    onDrop={(e) => handleDropItem(e, index)}
                                    onDragEnd={handleDragEnd}
                                >
                                    <td style={styles.tdName}>
                                        <div style={styles.nameCell}>
                                            <span style={styles.dragHandle}>⋮⋮</span>
                                            <span style={styles.nameText} title={item.name}>{item.name}</span>
                                        </div>
                                    </td>
                                    <td style={styles.tdDesc} className="quote-desc-cell">
                                        {item.description || '-'}
                                        {item.description && (
                                            <div className="quote-desc-tooltip">{item.description}</div>
                                        )}
                                    </td>
                                    <td style={styles.td}>
                                        <input
                                            type="number"
                                            min="0"
                                            step="0.01"
                                            style={styles.inlineInput}
                                            value={item.priceInput !== undefined ? item.priceInput : item.price}
                                            onChange={(e) => handlePriceChange(item.id, e.target.value)}
                                            onBlur={(e) => handlePriceBlur(item.id, e.target.value)}
                                        />
                                    </td>
                                    <td style={styles.td}>
                                        <div style={styles.quantityControl}>
                                            <button
                                                style={styles.quantityBtn}
                                                onClick={() => handleDecreaseQuantity(item.id)}
                                            >
                                                −
                                            </button>
                                            <input
                                                type="number"
                                                min="1"
                                                style={styles.inlineInput}
                                                value={item.qtyInput !== undefined ? item.qtyInput : item.quantity}
                                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                onBlur={(e) => handleQuantityBlur(item.id, e.target.value)}
                                            />
                                            <button
                                                style={styles.quantityBtn}
                                                onClick={() => handleIncreaseQuantity(item.id)}
                                            >
                                                ＋
                                            </button>
                                        </div>
                                    </td>
                                    <td style={styles.tdTotal}>¥{(item.price * item.quantity).toLocaleString()}</td>
                                    <td style={styles.tdAction}>
                                        <button style={styles.removeBtn} onClick={() => handleRemoveItem(item.id)}>✕</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                        <tfoot>
                            <tr style={styles.totalRow}>
                                <td colSpan="4" style={styles.totalLabel}>报价总额</td>
                                <td style={styles.totalValue}>¥{totalAmount.toLocaleString()}</td>
                                <td></td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            )}

            {/* Excel 导入数据表格 */}
            {activeTab === 'import' && importedData.length > 0 && (
                <div style={styles.tableCard}>
                    <div style={styles.tableToolbar}>
                        <div style={styles.tableTitle}>📊 Excel 导入数据</div>
                        <div style={{ display: 'flex', gap: '8px' }}>
                            <button style={styles.importMoreBtn} onClick={() => fileInputRef.current?.click()}>+ 追加导入</button>
                            <button style={{ ...styles.importMoreBtn, color: '#EF4444', backgroundColor: '#FEF2F2' }}
                                onClick={() => { if (confirm('清空导入数据？')) { setImportedData([]); fetch(`${API_URL}/quote-imported-data`, { method: 'DELETE' }) } }}>清空</button>
                        </div>
                    </div>
                    <div style={styles.tableScroll}>
                        <table style={styles.table}>
                            <thead>
                                <tr style={styles.tableHeader}>
                                    <th style={styles.th}>#</th>
                                    {importColumns.map(col => <th key={col} style={styles.th}>{col}</th>)}
                                </tr>
                            </thead>
                            <tbody>
                                {importedData.map((row, idx) => (
                                    <tr key={row._dbId || idx} style={styles.tableRow}>
                                        <td style={styles.tdIndex}>{idx + 1}</td>
                                        {importColumns.map(col => <td key={col} style={styles.td}>{row[col] ?? ''}</td>)}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* Excel tab 空状态 */}
            {activeTab === 'import' && importedData.length === 0 && (
                <div
                    style={{
                        ...styles.dropZone,
                        borderColor: isDragging ? '#1E293B' : 'var(--border)',
                        background: isDragging ? 'rgba(30, 41, 59, 0.05)' : 'var(--bg-secondary)',
                    }}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onClick={() => fileInputRef.current?.click()}
                >
                    <div style={styles.dropIcon}>📂</div>
                    <div style={styles.dropTitle}>暂无 Excel 导入数据</div>
                    <div style={styles.dropDesc}>拖拽文件到此处或点击选择文件导入（支持 .xlsx / .xls / .csv）</div>
                </div>
            )}

            {/* 空状态 - 拖拽区 */}
            {quoteItems.length === 0 && importedData.length === 0 && (
                <div
                    style={{
                        ...styles.dropZone,
                        borderColor: isDragging ? '#1E293B' : 'var(--border)',
                        background: isDragging ? 'rgba(30, 41, 59, 0.05)' : 'var(--bg-secondary)',
                    }}
                    onDrop={handleDrop}
                    onDragOver={(e) => { e.preventDefault(); setIsDragging(true) }}
                    onDragLeave={() => setIsDragging(false)}
                    onClick={() => fileInputRef.current?.click()}
                >
                    {importing ? (
                        <div style={styles.loadingWrap}>
                            <div style={styles.spinner} />
                            <div style={styles.loadingText}>正在解析文件...</div>
                        </div>
                    ) : (
                        <>
                            <div style={styles.dropIcon}>📊</div>
                            <div style={styles.dropTitle}>点击「添加产品」选择产品生成报价，或拖拽 Excel 导入数据</div>
                            <div style={styles.dropDesc}>支持 .xlsx / .xls / .csv 格式</div>
                        </>
                    )}
                </div>
            )}

            {/* ─── 添加产品弹窗 ─── */}
            <Modal
                isOpen={showProductModal}
                onClose={handleCloseProductModal}
                title="添加产品"
                width={600}
                headerRightContent={<span>{products.length} 个可选产品</span>}
                footer={
                    <button className="sf-btn sf-btn-confirm" onClick={handleCloseProductModal}>完成</button>
                }
            >
                <div style={styles.searchBox}>
                    <div style={{ display: 'flex', gap: '12px' }}>
                        <input
                            className="sf-input"
                            placeholder="搜索产品名称..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            autoFocus
                            style={{ flex: 1 }}
                        />
                        <button
                            className="sf-btn"
                            style={{ backgroundColor: '#111111', color: '#FFFFFF', border: '1px solid #111111', padding: '0 20px', fontWeight: '600' }}
                            onClick={() => setShowCustomProductModal(true)}
                        >
                            ＋ 自定义产品
                        </button>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '12px' }}>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>价格类型：</span>
                        <div className="sf-capsule-group">
                            <button
                                type="button"
                                className={`sf-capsule ${!useDealerPrice ? 'active' : ''}`}
                                onClick={() => setUseDealerPrice(false)}
                            >终端价</button>
                            <button
                                type="button"
                                className={`sf-capsule ${useDealerPrice ? 'active' : ''}`}
                                onClick={() => setUseDealerPrice(true)}
                            >经销商价</button>
                        </div>
                    </div>
                </div>

                <div style={styles.productList}>
                    {filteredProducts.length === 0 ? (
                        <div style={styles.noResult}>未找到匹配产品</div>
                    ) : (
                        filteredProducts.map((product) => {
                            const inQuote = quoteItems.find(i => i.productId === product.id)
                            return (
                                <div
                                    key={product.id}
                                    className="sf-list-item"
                                    style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px' }}
                                    onClick={() => handleAddProduct(product)}
                                >
                                    <div style={styles.productInfo}>
                                        <div style={styles.productName}>{product.name}</div>
                                        <div style={styles.productSku}>{product.description || '-'}</div>
                                    </div>
                                    <div style={styles.productRight}>
                                        <div style={styles.productPrice}>
                                            ¥{getProductPrice(product).toLocaleString()}
                                            {dualPriceCategories.includes(product.category) && product.dealer_price && (
                                                <span style={{ fontSize: '11px', color: '#9ca3af', fontWeight: '400', marginLeft: '4px' }}>
                                                    ({useDealerPrice ? '经销' : '终端'})
                                                </span>
                                            )}
                                        </div>
                                        {inQuote ? (
                                            <div style={styles.productActions} onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    style={styles.productActionBtn}
                                                    onClick={(e) => handleDecreaseFromModal(product, e)}
                                                >
                                                    −
                                                </button>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="product-quantity-input"
                                                    style={styles.productQuantityInput}
                                                    value={inQuote.qtyInput !== undefined ? inQuote.qtyInput : inQuote.quantity}
                                                    onChange={(e) => handleQuantityInputChange(product, e.target.value, e)}
                                                    onBlur={(e) => handleQuantityInputBlur(product, e.target.value, e)}
                                                />
                                                <button
                                                    style={styles.productActionBtn}
                                                    onClick={(e) => handleIncreaseFromModal(product, e)}
                                                >
                                                    ＋
                                                </button>
                                            </div>
                                        ) : (
                                            <span style={styles.addBadge}>添加</span>
                                        )}
                                    </div>
                                </div>
                            )
                        })
                    )}
                </div>
            </Modal>

            {/* ─── 添加自定义产品弹窗 ─── */}
            <Modal
                isOpen={showCustomProductModal}
                onClose={() => setShowCustomProductModal(false)}
                title="添加自定义产品"
                width={600}
                footer={
                    <>
                        <button className="sf-btn sf-btn-cancel" onClick={() => setShowCustomProductModal(false)}>取消</button>
                        <button className="sf-btn sf-btn-confirm" onClick={handleAddCustomProduct}>直接添加到报价单</button>
                    </>
                }
            >
                <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', padding: '24px 28px' }}>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>产品名称 <span style={{ color: '#E11D48' }}>*</span></label>
                        <input
                            className="sf-input"
                            style={{ width: '100%', boxSizing: 'border-box' }}
                            placeholder="必填..."
                            value={customProduct.name}
                            onChange={(e) => setCustomProduct({ ...customProduct, name: e.target.value })}
                        />
                    </div>
                    <div>
                        <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>规格描述</label>
                        <input
                            className="sf-input"
                            style={{ width: '100%', boxSizing: 'border-box' }}
                            placeholder="选填..."
                            value={customProduct.description}
                            onChange={(e) => setCustomProduct({ ...customProduct, description: e.target.value })}
                        />
                    </div>
                    <div style={{ display: 'flex', gap: '20px' }}>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>单价 <span style={{ color: '#E11D48' }}>*</span></label>
                            <input
                                type="number"
                                min="0"
                                step="0.01"
                                className="sf-input"
                                style={{ width: '100%', boxSizing: 'border-box' }}
                                placeholder="0.00"
                                value={customProduct.price}
                                onChange={(e) => setCustomProduct({ ...customProduct, price: e.target.value })}
                            />
                        </div>
                        <div style={{ flex: 1 }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '600', color: '#475569', marginBottom: '8px' }}>数量 <span style={{ color: '#E11D48' }}>*</span></label>
                            <input
                                type="number"
                                min="1"
                                className="sf-input"
                                style={{ width: '100%', boxSizing: 'border-box' }}
                                value={customProduct.quantity}
                                onChange={(e) => setCustomProduct({ ...customProduct, quantity: e.target.value })}
                            />
                        </div>
                    </div>
                </div>
            </Modal>

            {/* ─── Excel 预览弹窗 ─── */}
            {/* ─── Excel 预览弹窗 ─── */}
            <Modal
                isOpen={showPreview && currentSheet}
                onClose={handleClosePreview}
                title={`📄 ${fileName}`}
                width={900}
                headerRightContent={
                    <div style={{ display: 'flex', gap: '8px' }}>
                        {importedSheets.length > 1 && (
                            <span style={styles.sheetBadge}>
                                {importedSheets.length} 个工作表
                            </span>
                        )}
                        <span style={styles.rowBadge}>{currentSheet?.rows?.length} 行</span>
                    </div>
                }
                footer={
                    <>
                        <button className="sf-btn sf-btn-cancel" onClick={handleClosePreview}>取消</button>
                        <button className="sf-btn sf-btn-confirm" onClick={handleConfirmImport}>
                            确认导入 ({importedSheets.reduce((s, sh) => s + sh.rows.length, 0)} 行)
                        </button>
                    </>
                }
            >
                {importedSheets.length > 1 && (
                    <div className="sf-capsule-group" style={{ paddingBottom: '16px', borderBottom: '1px solid #E2E8F0', marginBottom: '16px' }}>
                        {importedSheets.map((sheet, i) => (
                            <button
                                key={sheet.name}
                                className={`sf-capsule ${i === activeSheet ? 'active' : ''}`}
                                onClick={() => setActiveSheet(i)}
                            >
                                {sheet.name} ({sheet.rows.length})
                            </button>
                        ))}
                    </div>
                )}

                <div style={styles.previewScroll}>
                    <table style={styles.previewTable}>
                        <thead>
                            <tr>
                                {currentSheet?.headers.map((h, i) => (
                                    <th key={i} style={styles.previewTh}>{h || `列${i + 1}`}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            {currentSheet?.rows.slice(0, 50).map((row, rowIdx) => (
                                <tr key={rowIdx}>
                                    {currentSheet.headers.map((_, colIdx) => (
                                        <td key={colIdx} style={styles.previewTd}>{row[colIdx] ?? ''}</td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {currentSheet?.rows.length > 50 && (
                        <div style={styles.moreRows}>... 还有 {currentSheet.rows.length - 50} 行</div>
                    )}
                </div>
            </Modal>

            {/* ─── 清除确认对话框 ─── */}
            <Modal
                isOpen={showClearModal}
                onClose={handleCloseClearModal}
                title="确认清除"
                width={600}
                footer={
                    <>
                        <button className="sf-btn sf-btn-cancel" onClick={handleCloseClearModal}>取消</button>
                        <button className="sf-btn sf-btn-confirm" style={{ backgroundColor: '#111111', borderColor: '#111111' }} onClick={handleConfirmClear}>
                            确认清除
                        </button>
                    </>
                }
            >
                <div style={{ textAlign: 'center' }}>
                    <div style={styles.clearModalIcon}>
                        <svg width="64" height="64" viewBox="0 0 64 64">
                            <circle
                                cx="32"
                                cy="32"
                                r="28"
                                fill="none"
                                stroke="#E11D48" /* Changed from dark slate to red for emphasis */
                                strokeWidth="3"
                                style={{ animation: 'warningPulse 2s ease-in-out infinite' }}
                            />
                            <path
                                d="M20 32 L44 32"
                                stroke="#E11D48"
                                strokeWidth="3"
                                strokeLinecap="round"
                            />
                        </svg>
                    </div>
                    <p style={styles.clearModalMessage}>
                        确定要清除所有报价信息吗？此操作不可撤销，所有数据将被永久删除。
                    </p>
                    <div style={styles.clearModalStats}>
                        <div style={styles.statItem}>
                            <div style={styles.statValue}>{quoteItems.length}</div>
                            <div style={styles.statLabel}>产品项</div>
                        </div>
                        <div style={styles.statDivider}></div>
                        <div style={styles.statItem}>
                            <div style={styles.statValue}>¥{totalAmount.toLocaleString()}</div>
                            <div style={styles.statLabel}>总金额</div>
                        </div>
                    </div>
                </div>
            </Modal>

        </div>
    )
}

const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '24px', animation: 'fadeInUp 0.4s ease forwards', padding: '12px 40px 0 40px' },
    topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
    topBarContent: { display: 'flex', flexDirection: 'column', gap: '16px', flex: 1, minWidth: 0 },
    topBarRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '20px', flexWrap: 'wrap' },
    pageTitle: { fontSize: '42px', fontWeight: '700', color: '#111111', margin: 0, letterSpacing: '-0.02em', lineHeight: '1.02', whiteSpace: 'nowrap', flexShrink: 0 },
    topActions: { display: 'flex', alignItems: 'center', gap: '14px', position: 'relative', zIndex: 100, flexWrap: 'wrap', justifyContent: 'flex-end' },
    moreActionsRow: { display: 'flex', justifyContent: 'flex-end' },
    moreActionsWrap: { position: 'relative', display: 'flex', flexDirection: 'column', alignItems: 'flex-end' },
    moreActionsButton: {
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: '48px',
        height: '48px',
        padding: 0,
        backgroundColor: 'transparent',
        color: '#64748B',
        border: 'none',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        lineHeight: '1.2',
        whiteSpace: 'nowrap'
    },
    moreActionsIcon: { fontSize: '28px', lineHeight: 1, marginTop: '-6px' },
    moreActionsMenu: {
        position: 'absolute',
        top: 'calc(100% + 10px)',
        right: 0,
        minWidth: '220px',
        backgroundColor: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '18px',
        padding: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '6px',
        zIndex: 120
    },
    moreActionsItem: {
        padding: '12px 14px',
        backgroundColor: '#FFFFFF',
        color: '#111111',
        border: '1px solid transparent',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '500',
        textAlign: 'left',
        whiteSpace: 'nowrap'
    },
    addButton: {
        width: '48px', height: '48px', padding: 0, background: '#111111', color: '#FFFFFF', border: 'none',
        borderRadius: '999px', cursor: 'pointer', fontSize: '28px', fontWeight: '500', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 100, position: 'relative', lineHeight: '1'
    },
    tabActionRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', padding: '0 8px' },
    inlineActions: { display: 'flex', alignItems: 'center', gap: '14px', marginLeft: 'auto', position: 'relative', zIndex: 100, flexWrap: 'wrap', justifyContent: 'flex-end' },
    importButton: {
        padding: '12px 26px', backgroundColor: '#FFFFFF', color: '#64748B',
        border: '1px solid #E2E8F0', borderRadius: '999px', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
        whiteSpace: 'nowrap', minWidth: '132px', lineHeight: '1.2',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    exportButton: {
        padding: '12px 26px', backgroundColor: 'rgba(5, 150, 105, 0.08)', color: '#059669',
        border: '1px solid rgba(5, 150, 105, 0.2)', borderRadius: '999px', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
        whiteSpace: 'nowrap', minWidth: '180px', lineHeight: '1.2',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    clearButton: {
        padding: '12px 26px', backgroundColor: 'rgba(225, 29, 72, 0.06)', color: '#E11D48',
        border: '1px solid rgba(225, 29, 72, 0.12)', borderRadius: '999px', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
        whiteSpace: 'nowrap', minWidth: '180px', lineHeight: '1.2',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    summaryCards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' },
    summaryCard: { backgroundColor: '#FFFFFF', padding: '24px', borderRadius: '20px', border: '1px solid #E2E8F0', boxShadow: '0 2px 8px rgba(30, 41, 59, 0.04)' },
    summaryLabel: { fontSize: '13px', color: '#64748B', marginBottom: '8px', fontWeight: '500' },
    summaryValue: { fontSize: '26px', fontWeight: '700', color: '#111111' },
    tabBar: { display: 'flex', gap: '6px', backgroundColor: '#FFFFFF', padding: '6px', borderRadius: '14px', border: '1px solid #E2E8F0', width: 'fit-content' },
    tab: {
        padding: '12px 24px', backgroundColor: 'transparent', border: 'none', borderRadius: '10px', cursor: 'pointer',
        fontSize: '14px', fontWeight: '500', color: '#64748B', display: 'flex', alignItems: 'center', gap: '10px', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    tabActive: { background: '#111111', color: '#FFFFFF' },
    tableCard: { backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', overflow: 'hidden', margin: '0 8px' },
    tableToolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid #E2E8F0' },
    tableTitle: { fontSize: '16px', fontWeight: '600', color: '#1E293B' },
    importMoreBtn: { padding: '8px 18px', backgroundColor: 'transparent', color: '#2563EB', border: '1px solid transparent', borderRadius: '10px', cursor: 'pointer', fontSize: '13px', fontWeight: '600', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)' },
    tableScroll: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' },
    tableHeader: { backgroundColor: '#FFFFFF' },
    th: { padding: '10px 12px 18px', textAlign: 'left', fontSize: '13px', fontWeight: '700', color: '#64748B', borderBottom: 'none', letterSpacing: '1px', whiteSpace: 'nowrap', backgroundColor: '#FFFFFF' },
    tableRow: { borderBottom: '1px solid #F1F5F9', transition: 'background-color 0.2s ease', cursor: 'default' },
    td: { padding: '18px 12px', fontSize: '14px', color: '#1E293B', verticalAlign: 'middle', fontWeight: '500' },
    tdName: { padding: '18px 12px', fontSize: '14px', color: '#1E293B', fontWeight: '600', lineHeight: '1.5', verticalAlign: 'middle' },
    nameCell: { display: 'flex', alignItems: 'center', gap: '8px', minWidth: 0 },
    dragHandle: { color: '#94A3B8', cursor: 'inherit', flexShrink: 0 },
    nameText: { display: 'block', minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    tdSku: { padding: '18px 12px', fontSize: '13px', color: '#64748B', fontFamily: 'monospace', fontWeight: '500', verticalAlign: 'middle' },
    tdDesc: { padding: '18px 12px', fontSize: '13px', color: '#64748B', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', verticalAlign: 'middle' },
    tdTotal: { padding: '18px 12px', fontSize: '16px', fontWeight: '700', color: '#111111', whiteSpace: 'nowrap', verticalAlign: 'middle', textAlign: 'left' },
    tdAction: { padding: '18px 24px 18px 10px', textAlign: 'right', verticalAlign: 'middle' },
    tdIndex: { padding: '18px 12px', fontSize: '12px', color: '#64748B', fontWeight: '500' },
    inlineInput: {
        width: '100%', maxWidth: '80px', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '10px',
        fontSize: '14px', backgroundColor: '#FFFFFF', textAlign: 'right', boxSizing: 'border-box', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    quantityControl: { display: 'flex', alignItems: 'center', gap: '4px', justifyContent: 'flex-start' },
    quantityBtn: {
        width: '28px', height: '28px', padding: '0', border: '1px solid #E2E8F0', borderRadius: '8px',
        backgroundColor: '#FFFFFF', color: '#1E293B', cursor: 'pointer', fontSize: '14px',
        fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
    },
    removeBtn: {
        width: '28px', height: '28px', border: 'none', borderRadius: '8px', backgroundColor: 'transparent',
        color: '#FCA5A5', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    totalRow: { backgroundColor: '#FFFFFF' },
    totalLabel: { padding: '18px 24px', fontSize: '14px', fontWeight: '700', color: '#1E293B', textAlign: 'right' },
    totalValue: { padding: '18px 24px', fontSize: '18px', fontWeight: '700', color: '#111111' },
    dropZone: { borderRadius: '20px', border: '2px dashed #E2E8F0', padding: '60px 40px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease', backgroundColor: '#FAFAF9', width: 'calc(100% - 16px)', margin: '0 auto', boxSizing: 'border-box' },
    dropIcon: { fontSize: '56px', marginBottom: '16px' },
    dropTitle: { fontSize: '16px', fontWeight: '600', color: '#1E293B', marginBottom: '8px' },
    dropDesc: { fontSize: '14px', color: '#64748B' },
    loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
    spinner: { width: '32px', height: '32px', border: '3px solid #E2E8F0', borderTopColor: '#0F172A', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
    loadingText: { fontSize: '14px', color: '#64748B' },
    // Modal
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { backgroundColor: '#FFFFFF', padding: '0', borderRadius: '24px', border: 'none', width: '600px', maxWidth: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.1)' },
    modalHeader: { padding: '24px 28px', borderBottom: '1px solid #F1F5F9', backgroundColor: '#FDFCFB', borderRadius: '20px 20px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
    modalTitle: { fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: '600', margin: 0, color: '#1E293B' },
    modalSubtitle: { fontSize: '13px', color: '#64748B' },
    searchBox: { padding: '16px 24px', borderBottom: '1px solid #E2E8F0', flexShrink: 0 },
    searchInput: { width: '100%', padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '999px', fontSize: '14px', backgroundColor: '#FFFFFF', boxSizing: 'border-box', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', color: '#1E293B' },
    productList: { flex: 1, overflowY: 'auto', padding: '8px 12px' },
    productItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderRadius: '14px', cursor: 'pointer', transition: 'background-color 0.2s ease', borderBottom: '1px solid #F1F5F9' },
    productInfo: { flex: 1 },
    productName: { fontSize: '15px', fontWeight: '600', color: '#1E293B', marginBottom: '4px' },
    productSku: { fontSize: '13px', color: '#64748B', fontFamily: 'monospace' },
    productRight: { display: 'flex', alignItems: 'center', gap: '12px' },
    productPrice: { fontSize: '16px', fontWeight: '700', color: '#111111' },
    productActions: { display: 'flex', alignItems: 'center', gap: '4px' },
    productActionBtn: {
        width: '28px', height: '28px', padding: '0', border: '1px solid #E2E8F0', borderRadius: '8px',
        backgroundColor: '#FFFFFF', color: '#1E293B', cursor: 'pointer', fontSize: '14px',
        fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
    },
    productQuantityInput: {
        width: '60px', height: '28px', padding: '0 4px', border: '1px solid #E2E8F0', borderRadius: '8px',
        backgroundColor: '#FFFFFF', color: '#1E293B', fontSize: '14px', fontWeight: '600',
        textAlign: 'center', outline: 'none', transition: 'all 0.15s', boxSizing: 'border-box',
    },
    addBadge: { fontSize: '12px', color: '#1E293B', backgroundColor: 'rgba(30, 41, 59, 0.08)', padding: '4px 12px', borderRadius: '10px', fontWeight: '600' },
    noResult: { padding: '40px', textAlign: 'center', color: '#64748B', fontSize: '14px' },
    // Preview
    sheetBadge: { fontSize: '12px', color: '#1E293B', backgroundColor: 'rgba(30, 41, 59, 0.08)', padding: '4px 12px', borderRadius: '10px', fontWeight: '600' },
    rowBadge: { fontSize: '12px', color: '#059669', backgroundColor: '#ECFDF5', padding: '4px 12px', borderRadius: '10px', fontWeight: '600' },
    sheetTabs: { display: 'flex', gap: '6px', padding: '16px 24px', borderBottom: '1px solid #E2E8F0', overflowX: 'auto', flexShrink: 0 },
    sheetTab: { padding: '8px 16px', border: '1px solid #E2E8F0', borderRadius: '10px', backgroundColor: 'transparent', color: '#64748B', cursor: 'pointer', fontSize: '14px', fontWeight: '600', whiteSpace: 'nowrap', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)' },
    sheetTabActive: { background: '#111111', color: '#FFFFFF', borderColor: 'transparent' },
    previewScroll: { flex: 1, overflowY: 'auto', overflowX: 'auto' },
    previewTable: { width: '100%', borderCollapse: 'collapse', minWidth: '500px' },
    previewTh: { padding: '14px 20px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#64748B', backgroundColor: '#F8FAFC', borderBottom: '1px solid #E2E8F0', whiteSpace: 'nowrap', position: 'sticky', top: 0, textTransform: 'uppercase', letterSpacing: '1px' },
    previewTd: { padding: '12px 20px', fontSize: '13px', color: '#1E293B', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', borderBottom: '1px solid #F1F5F9' },
    moreRows: { padding: '16px', textAlign: 'center', fontSize: '13px', color: '#64748B', backgroundColor: '#F8FAFC' },
    modalButtons: { display: 'flex', justifyContent: 'flex-end', gap: '14px', padding: '20px 28px', backgroundColor: '#F8FAFC', borderTop: '1px solid #F1F5F9', flexShrink: 0, borderRadius: '0 0 20px 20px' },
    cancelButton: { padding: '12px 28px', backgroundColor: '#FFFFFF', color: '#64748B', border: '1px solid #E2E8F0', borderRadius: '999px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)' },
    submitButton: { padding: '12px 28px', background: '#111111', color: '#FFFFFF', border: 'none', borderRadius: '999px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)' },
    // Clear/Delete Modal
    clearModal: { backgroundColor: 'rgba(255, 255, 255, 1)', borderRadius: '24px', border: '1px solid rgba(226, 232, 240, 0.8)', width: '400px', maxWidth: '90%', padding: '32px', textAlign: 'center', boxShadow: '0 20px 40px rgba(15, 23, 42, 0.1)' },
    clearModalIcon: { marginBottom: '20px', display: 'flex', justifyContent: 'center' },
    clearModalTitle: { fontFamily: "'Inter', -apple-system, sans-serif", fontSize: '20px', fontWeight: '700', color: '#FFFFFF', margin: '0 0 12px 0', letterSpacing: '-0.02em' },
    clearModalMessage: { fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 28px 0' },
    clearModalStats: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', marginBottom: '32px', padding: '24px', backgroundColor: 'rgba(248, 250, 252, 0.5)', borderRadius: '16px', border: '1px solid rgba(226, 232, 240, 0.5)' },
    statItem: { flex: 1 },
    statValue: { fontSize: '28px', fontWeight: '700', color: '#111111', marginBottom: '6px' },
    statLabel: { fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' },
    statDivider: { width: '1px', height: '48px', backgroundColor: 'rgba(226, 232, 240, 0.5)' },
    clearModalButtons: { display: 'flex', gap: '12px', justifyContent: 'center' },
    clearModalCancel: { flex: 1, padding: '12px 20px', backgroundColor: 'rgba(248, 250, 252, 0.6)', color: '#475569', border: '1px solid rgba(226, 232, 240, 0.8)', borderRadius: '999px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s ease', outline: 'none' },
    clearModalConfirm: { flex: 1, padding: '12px 20px', backgroundColor: '#111111', color: '#FFFFFF', border: '1px solid #111111', borderRadius: '999px', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.2s ease', outline: 'none' },
};
