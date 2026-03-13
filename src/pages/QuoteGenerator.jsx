import { useState, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx-js-style'
import Modal from '../components/Modal'
import { API_URL } from '../lib/api'

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
  .product-quantity-input:focus, .quote-quantity-input:focus {
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
    const [warehouseProducts, setWarehouseProducts] = useState([])
    // 添加产品弹窗
    const [showProductModal, setShowProductModal] = useState(false)
    const [isClosing, setIsClosing] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
    const [useDealerPrice, setUseDealerPrice] = useState(false)
    const fileInputRef = useRef(null)

    // 自定义产品弹窗
    const [showCustomProductModal, setShowCustomProductModal] = useState(false)
    const [customProduct, setCustomProduct] = useState({ name: '', description: '', price: '', quantity: 1 })

    const [isDragging, setIsDragging] = useState(false)
    // 清除确认对话框
    const [showClearModal, setShowClearModal] = useState(false)
    const [isClearClosing, setIsClearClosing] = useState(false)

    // 拖拽排序
    const [dragIndex, setDragIndex] = useState(null)
    const [dragOverIndex, setDragOverIndex] = useState(null)
    const [showMoreActions, setShowMoreActions] = useState(false)
    const moreActionsRef = useRef(null)

    // 导入结果弹窗
    const [showResultModal, setShowResultModal] = useState(false)
    const [resultData, setResultData] = useState({ title: '', message: '', type: 'success' })

    // 初始化加载基础数据
    useEffect(() => {
        fetchProducts()
        fetchWarehouseProducts()
        fetchQuoteLists()
    }, [])

    // 当活动的报价单切换时,重新获取其数据
    useEffect(() => {
        if (activeQuoteListId) {
            fetchQuoteItems(activeQuoteListId)
        } else {
            setQuoteItems([])
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
                // 如果后端为空,自动创建一个默认的
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


    const fetchProducts = async () => {
        try {
            const res = await fetch(`${API_URL}/products`)
            const data = await res.json()
            setProducts(data)
        } catch (err) {
            console.error('获取产品失败:', err)
        }
    }

    const fetchWarehouseProducts = async () => {
        try {
            const res = await fetch(`${API_URL}/warehouse-products`)
            const data = await res.json()
            // 为仓库产品加上特殊前缀的ID,以免和常规产品ID冲突
            setWarehouseProducts(data.map(p => ({ ...p, id: `wh_${p.id}` })))
        } catch (err) {
            console.error('获取仓库产品失败:', err)
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

    const handlePriceChange = (id, value) => {
        setQuoteItems(quoteItems.map(item =>
            item.id === id ? { ...item, priceInput: value } : item
        ))
    }

    const handleQuantityAdjust = (id, delta) => {
        setQuoteItems(prev => prev.map(item => {
            if (item.id === id) {
                const newQty = Math.max(1, item.quantity + delta);
                fetch(`${API_URL}/quote-items/${id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ price: item.price, quantity: newQty }),
                });
                return { ...item, quantity: newQty, qtyInput: undefined };
            }
            return item;
        }));
    }

    const handleProductQuantityAdjust = (product, delta, e) => {
        if (e) e.stopPropagation();
        const existing = quoteItems.find(item => item.productId === product.id);
        if (existing) {
            const newQty = Math.max(0, (existing.quantity || 0) + delta);
            if (newQty <= 0) {
                handleRemoveItem(existing.id);
            } else {
                setQuoteItems(prev => prev.map(item =>
                    item.productId === product.id ? { ...item, quantity: newQty, qtyInput: undefined } : item
                ));
                fetch(`${API_URL}/quote-items/${existing.id}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ price: existing.price, quantity: newQty }),
                });
            }
        }
    }

    const handleImportExcel = () => {
        fileInputRef.current?.click()
    }

    const handleFileSelect = (e) => {
        const file = e.target.files[0]
        if (!file) return
        processExcelFile(file)
        e.target.value = '' // Clear input
    }

    const processExcelFile = async (file) => {
        const reader = new FileReader()
        reader.onload = async (e) => {
            const data = e.target.result
            const workbook = XLSX.read(data, { type: 'array' })
            const sheetName = workbook.SheetNames[0]
            const worksheet = workbook.Sheets[sheetName]
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })

            // Handle Excel data: skip first few rows as they might be header/title
            // This is a simple logic, we might need to adjust based on user's Excel format
            const itemsToAdd = []
            for (let i = 1; i < jsonData.length; i++) {
                const row = jsonData[i]
                if (row[0] && row[2]) { // name and price are basic requirements
                    const rowName = String(row[0]).trim()
                    // 过滤表头行（如“产品名称”、“名称”、“产品规格”等）
                    if (rowName === '产品名称' || rowName === '名称' || rowName.includes('产品规格')) {
                        continue
                    }

                    itemsToAdd.push({
                        name: rowName,
                        description: String(row[1] || ''),
                        price: parseFloat(row[2]) || 0,
                        quantity: parseInt(row[3]) || 1,
                        list_id: activeQuoteListId
                    })
                }
            }

            if (itemsToAdd.length > 0) {
                try {
                    for (const item of itemsToAdd) {
                        const res = await fetch(`${API_URL}/quote-items`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(item),
                        })
                        if (!res.ok) throw new Error('Network response was not ok')
                        const newItem = await res.json()
                        setQuoteItems(prev => [...prev, newItem])
                    }
                    setResultData({
                        title: '导入成功',
                        message: `成功导入 ${itemsToAdd.length} 项产品到当前报价单。`,
                        type: 'success'
                    })
                    setShowResultModal(true)
                } catch (err) {
                    console.error('导入 Excel 失败:', err)
                    setResultData({
                        title: '导入失败',
                        message: '请检查文件格式是否正确。Excel 需包含：产品名称（第一列）、单价（第三列）。',
                        type: 'error'
                    })
                    setShowResultModal(true)
                }
            } else {
                setResultData({
                    title: '未找到产品',
                    message: '未在 Excel 中找到有效产品信息。请确保第一列是名称,第三列是价格。',
                    type: 'warning'
                })
                setShowResultModal(true)
            }
        }
        reader.readAsArrayBuffer(file)
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

        let targetProducts = products;
        let queryForSearch = trimmedQuery;
        let isWarehouseSearch = false;

        // 解析前缀（例如：广州: 或 广州：）
        const warehouseMatch = trimmedQuery.match(/^([^:：]+)[:：]\s*(.*)$/);
        if (warehouseMatch) {
            const warehouseName = warehouseMatch[1].trim();
            const actualKeyword = warehouseMatch[2].trim();
            targetProducts = warehouseProducts.filter(p => {
                if (warehouseName === '长沙&邵阳') {
                    return p.warehouse === '长沙' || p.warehouse === '邵阳' || p.warehouse === '长沙&邵阳';
                }
                return p.warehouse === warehouseName;
            });
            isWarehouseSearch = true;
            if (!actualKeyword) return targetProducts;
            queryForSearch = actualKeyword;
        }

        // 全局排除 "SMSCC" 品牌干扰项
        const keyword = queryForSearch.replace(/SMSCC/gi, '').trim().replace(/-/g, '')

        // 如果剔除品牌名后关键词为空,且原始输入包含品牌名,则认为无有效搜索内容
        if (!keyword && queryForSearch.toLowerCase().includes('smscc')) {
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
            // 匹配 300, 300/288, 260 等管径
            const dm = remaining.match(/^(\d{3}(?:\/\d{3})?)/)
            if (dm) { queryDiameter = dm[1]; remaining = remaining.slice(dm[1].length) }
            let queryThread = null
            // 匹配 尖丝, 方丝, 小方丝, 大方丝
            const tm = remaining.match(/(小方丝|大方丝|尖丝|方丝)/)
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

            return targetProducts.filter(p => {
                if (!isWarehouseSearch && p.category !== '导管类') return false

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
                        // 匹配实际产品名称的管径位,以处理 300/288 等名称
                        const matchDiameter = `${name} ${desc}`.match(/(\d{3}(?:\/\d{3})?)/)
                        if (!matchDiameter || matchDiameter[1] !== queryDiameter) return false
                    }
                    if (queryThread && !`${name} ${desc}`.includes(queryThread)) return false
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
                        const matchDiameter = `${name} ${desc}`.match(/(\d{3}(?:\/\d{3})?)/)
                        if (!matchDiameter || matchDiameter[1] !== queryDiameter) return false
                    }
                    if (queryThread && !`${name} ${desc}`.includes(queryThread)) return false
                    if (queryLength || queryThickness) return false
                    return textMatch
                }

                return textMatch
            })
        })()

        // 钻具类专有搜索规则：提取【产品名称】和【型号】,组合后作为搜索关键词
        const levelDrill = targetProducts.filter(p => {
            if (!isWarehouseSearch && p.category !== '钻具类') return false

            // 钻具类搜索：合并名称和完整描述进行搜索
            // 匹配目标也排除 "SMSCC" 以保持一致
            const searchTarget = `${p.name} ${p.description || ''}`.replace(/SMSCC/gi, '').replace(/[\s\-]+/g, '').toLowerCase()
            const drillSegments = keyword.match(/[\u4e00-\u9fff]+|[a-zA-Z0-9]+/g) || [keyword]

            return drillSegments.every(seg => searchTarget.includes(seg.toLowerCase()))
        })

        // Level 0: 名称+型号组合精准匹配
        const level0 = (chinesePart && numberPart)
            ? targetProducts.filter(p => {
                if (!isWarehouseSearch && p.category === '钻具类') return false
                const nameMatch = p.name.toLowerCase().includes(chinesePart)
                const specMatch = p.description && p.description.match(/(?:规格)?型号(\d+)/)
                return nameMatch && specMatch && specMatch[1] === numberPart
            })
            : []

        // Level 1: 纯数字 → 只匹配规格型号；否则精确匹配规格全文
        const level1 = isNumericOnly
            ? targetProducts.filter(p => {
                if (!isWarehouseSearch && p.category === '钻具类') return false
                const specMatch = p.description && p.description.match(/(?:规格)?型号(\d+)/)
                return specMatch && specMatch[1] === keyword
            })
            : targetProducts.filter(p => {
                if (!isWarehouseSearch && p.category === '钻具类') return false
                return p.description && p.description === keyword
            })

        // Level 2: 名称+型号宽松匹配（数字匹配规格型号）
        const level2 = (chinesePart && numberPart)
            ? targetProducts.filter(p => {
                if (!isWarehouseSearch && p.category === '钻具类') return false
                const nameMatch = p.name.toLowerCase().includes(chinesePart)
                const specMatch = p.description && p.description.match(/(?:规格)?型号(\d+)/)
                return nameMatch && specMatch && specMatch[1] === numberPart
            })
            : []

        // Level 3: 名称前缀匹配
        const level3 = targetProducts.filter(p => {
            if (!isWarehouseSearch && p.category === '钻具类') return false
            return p.name.toLowerCase().startsWith(lowerKeyword)
        })

        // Level 4: 全字段模糊匹配（纯数字时禁用）
        const level4 = isNumericOnly
            ? []
            : targetProducts.filter(p => {
                if (!isWarehouseSearch && p.category === '钻具类') return false
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


    // ─── 导出 ───
    const handleExportQuote = () => {
        const activeItems = quoteItems.filter(item => item.quantity > 0)
        if (activeItems.length === 0) {
            alert('没有数量大于0的产品,无法导出')
            return
        }

        const border = {
            top:    { style: 'thin', color: { rgb: 'FF000000' } },
            bottom: { style: 'thin', color: { rgb: 'FF000000' } },
            left:   { style: 'thin', color: { rgb: 'FF000000' } },
            right:  { style: 'thin', color: { rgb: 'FF000000' } },
        }

        // Build AOA: Row0=title, Row1=date, Row2=header, Row3+=data, last=total
        const headers = ['产品名称', '产品规格', '单价', '数量', '合计']
        const noticeText = "购买须知：\n1.此报价单具有合同效力,买卖双方需严格对待约定事项；\n2.由于行业特殊性,此报价单不含税、不含运费；\n3.买方收货时,需检查产品外观、核对数量。如物流原因造成产品短缺、货物变形,应第一时间联系卖方及物流协商解决。买方收到后,第一时间使用或者使用前务必对导管进行试压测试,如发现漏水现象,拍视频并及时联系本公司调换。如未试压先使用,则不予调换；\n4.买方需认真对待清单,如因质量问题以外原因产生损失,损失由买方承担。"
        const aoa = [
            ['江南管业报价单'],
            [],
            headers,
            ...activeItems.map(item => [
                item.name,
                item.description || '',
                item.price,
                item.quantity,
                item.price * item.quantity,
            ]),
            ['', '', '', '总计', totalAmount],
            [noticeText],
        ]

        const ws = XLSX.utils.aoa_to_sheet(aoa)
        const range = XLSX.utils.decode_range(ws['!ref'])
        // Ensure range covers 5 columns (A-E)
        if (range.e.c < 4) range.e.c = 4
        ws['!ref'] = XLSX.utils.encode_range(range)

        // --- Row 0: Title (merged A1:E1) ---
        ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 4 } }]
        const titleStyle = {
            font: { name: '\u5B8B\u4F53', sz: 36, bold: true },
            alignment: { horizontal: 'center', vertical: 'center', wrapText: false },
            border,
        }
        ws['A1'] = { v: '\u6C5F\u5357\u7BA1\u4E1A\u62A5\u4EF7\u5355', t: 's', s: titleStyle }
        for (let c = 1; c <= 4; c++) {
            const ref = XLSX.utils.encode_cell({ r: 0, c })
            ws[ref] = { v: '', t: 's', s: { border } }
        }

        // --- Row 1: Date ---
        const now = new Date()
        const dateStr = `${now.getFullYear()} \u5E74 ${String(now.getMonth() + 1).padStart(2, '0')} \u6708 ${String(now.getDate()).padStart(2, '0')} \u65E5`
        const dateStyle = {
            font: { name: '\u5B8B\u4F53', sz: 18 },
            alignment: { horizontal: 'center', vertical: 'center' },
            border,
        }
        ws['A2'] = { v: dateStr, t: 's', s: dateStyle }
        for (let c = 1; c <= 4; c++) {
            const ref = XLSX.utils.encode_cell({ r: 1, c })
            if (!ws[ref]) ws[ref] = { v: '', t: 's' }
            ws[ref].s = { border }
        }

        // --- Row 2+: Apply data style (宋体 18, all borders) ---
        const dataStyle = {
            font: { name: '\u5B8B\u4F53', sz: 18 },
            border,
            alignment: { vertical: 'center' },
        }
        const noticeR = range.e.r
        for (let R = 2; R <= noticeR; R++) {
            const isNoticeRow = R === noticeR
            for (let C = 0; C <= 4; C++) {
                const ref = XLSX.utils.encode_cell({ r: R, c: C })
                if (!ws[ref]) ws[ref] = { v: '', t: 's' }
                
                if (isNoticeRow) {
                    ws[ref].s = {
                        font: { name: '\u6977\u4F53', sz: 18 },
                        alignment: { horizontal: 'left', vertical: 'center', wrapText: true },
                        border
                    }
                } else {
                    ws[ref].s = { ...dataStyle }
                }
            }
        }

        // --- Handle notice row merge ---
        if (!ws['!merges']) ws['!merges'] = []
        ws['!merges'].push({ s: { r: noticeR, c: 0 }, e: { r: noticeR, c: 4 } })

        // --- Row heights ---
        ws['!rows'] = [{ hpt: 37 }, { hpt: 37 }]
        for (let R = 2; R < noticeR; R++) {
            ws['!rows'][R] = { hpt: 24 }
        }
        ws['!rows'][noticeR] = { hpt: 166 } // 根据购买须知内容增加高度

        // --- Column widths ---
        ws['!cols'] = [
            { wpx: 200 }, // 产品名称
            { wpx: 300 }, // 产品规格
            { wpx: 100 }, // 单价
            { wpx: 80 },  // 数量
            { wpx: 120 }, // 合计
        ]

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


    return (
        <div style={styles.container}>
            <style>{modalAnimationStyles}</style>

            <div style={styles.topBar}>
                <div style={styles.topBarContent}>
                    <div style={styles.topBarRow}>
                        <h2 style={styles.pageTitle}>报价中心</h2>
                        <div style={styles.topActions}>
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
                                        <button
                                            type="button"
                                            style={styles.moreActionsItem}
                                            onClick={() => {
                                                setShowMoreActions(false)
                                                handleImportExcel()
                                            }}
                                        >
                                            导入 Excel 表格
                                        </button>

                                        {quoteItems.length > 0 && (
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
                                        )}

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
                                    </div>
                                )}
                            </div>
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

            {/* 产品报价表格 */}
            {quoteItems.length > 0 && (
                <div style={styles.tableCard}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={{ ...styles.th, width: '29%', paddingLeft: '54px' }}>产品名称</th>
                                <th style={{ ...styles.th, width: '23%' }}>产品规格</th>
                                <th style={{ ...styles.th, width: '13%' }}>价格</th>
                                <th style={{ ...styles.th, width: '17%', minWidth: '160px' }}>数量</th>
                                <th style={{ ...styles.th, width: '12%', minWidth: '140px', textAlign: 'right' }}>合计</th>
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
                                        <div style={styles.descInner}>
                                            {item.description || '-'}
                                        </div>
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
                                            <input
                                                type="number"
                                                min="1"
                                                className="quote-quantity-input"
                                                style={{ ...styles.quantityInput, width: '70px', minWidth: '70px', maxWidth: '70px', textAlign: 'center' }}
                                                value={item.qtyInput !== undefined ? item.qtyInput : item.quantity}
                                                onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                                onBlur={(e) => handleQuantityBlur(item.id, e.target.value)}
                                            />
                                            <div style={styles.stepperWrap}>
                                                <button style={styles.stepperBtn} onClick={() => handleQuantityAdjust(item.id, 1)}>+</button>
                                                <button style={styles.stepperBtn} onClick={() => handleQuantityAdjust(item.id, -1)}>-</button>
                                            </div>
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



            {/* 空状态 - 拖拽区 */}
            {quoteItems.length === 0 && (
                <div
                    style={styles.dropZone}
                    onClick={() => setShowProductModal(true)}
                >
                    <div style={styles.dropTitle}>点击「＋」按钮或此处选择产品生成报价</div>
                    <div style={styles.dropDesc}>您可以从产品库中选择产品,或添加自定义产品</div>
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
                            const inList = quoteItems.find(i => i.productId === product.id)
                            
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
                                        {inList ? (
                                            <div style={styles.productActions} onClick={(e) => e.stopPropagation()}>
                                                <input
                                                    type="number"
                                                    min="0"
                                                    className="product-quantity-input"
                                                    style={{ ...styles.productQuantityInput, width: '70px', padding: '0 8px' }}
                                                    value={inList.qtyInput !== undefined ? inList.qtyInput : inList.quantity}
                                                    onChange={(e) => handleQuantityInputChange(product, e.target.value, e)}
                                                    onBlur={(e) => handleQuantityInputBlur(product, e.target.value, e)}
                                                />
                                                <div style={styles.stepperWrapModal} onClick={(e) => e.stopPropagation()}>
                                                    <button style={styles.stepperBtnSmall} onClick={(e) => handleProductQuantityAdjust(product, 1, e)}>+</button>
                                                    <button style={styles.stepperBtnSmall} onClick={(e) => handleProductQuantityAdjust(product, -1, e)}>-</button>
                                                </div>
                                                <button
                                                    style={styles.deselectBtn}
                                                    onClick={() => handleRemoveItem(inList.id)}
                                                >
                                                    取消
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
                        确定要清除所有报价信息吗？此操作不可撤销,所有数据将被永久删除。
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

            {/* 隐藏的文件输入框 */}
            <input
                type="file"
                ref={fileInputRef}
                style={{ display: 'none' }}
                accept=".xlsx, .xls"
                onChange={handleFileSelect}
            />

            {/* 导入结果/通用提示弹窗 */}
            <Modal
                isOpen={showResultModal}
                onClose={() => setShowResultModal(false)}
                title={resultData.title}
                width={480}
                footer={null}
            >
                <div style={{ padding: '8px 4px 24px', textAlign: 'center' }}>
                    <div style={{ 
                        fontSize: '48px', 
                        marginBottom: '20px',
                        display: 'flex',
                        justifyContent: 'center'
                    }}>
                        {resultData.type === 'success' && '✅'}
                        {resultData.type === 'error' && '❌'}
                        {resultData.type === 'warning' && '⚠️'}
                    </div>
                    <p style={{ 
                        fontSize: '16px', 
                        color: '#1E293B', 
                        lineHeight: '1.6',
                        margin: '0 0 28px 0',
                        fontWeight: '500'
                    }}>
                        {resultData.message}
                    </p>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                        <button 
                            className="sf-btn sf-btn-confirm"
                            style={{ minWidth: '120px' }}
                            onClick={() => setShowResultModal(false)}
                        >
                            我知道了
                        </button>
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
        color: '#1E293B',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        textAlign: 'left',
        whiteSpace: 'nowrap',
        display: 'flex',
        alignItems: 'center',
        transition: 'background-color 0.2s',
        width: '100%',
        boxSizing: 'border-box'
    },
    addButton: {
        width: '48px', height: '48px', padding: 0, background: '#111111', color: '#FFFFFF', border: 'none',
        borderRadius: '999px', cursor: 'pointer', fontSize: '28px', fontWeight: '500', transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        zIndex: 100, position: 'relative', lineHeight: '1'
    },
    tabActionRow: { display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap', padding: '0 8px' },
    inlineActions: { display: 'flex', alignItems: 'center', gap: '14px', marginLeft: 'auto', position: 'relative', zIndex: 100, flexWrap: 'wrap', justifyContent: 'flex-end' },
    tableCard: { backgroundColor: '#FFFFFF', borderRadius: '18px', border: '1px solid #E2E8F0', overflow: 'hidden', margin: '0 8px' },
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
    tdDesc: { padding: '18px 12px', fontSize: '13px', color: '#64748B', verticalAlign: 'middle', position: 'relative' },
    descInner: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', width: '100%' },
    tdTotal: { padding: '18px 20px 18px 12px', fontSize: '16px', fontWeight: '700', color: '#111111', whiteSpace: 'nowrap', verticalAlign: 'middle', textAlign: 'right' },
    tdAction: { padding: '18px 24px 18px 10px', textAlign: 'right', verticalAlign: 'middle' },
    tdIndex: { padding: '18px 12px', fontSize: '12px', color: '#64748B', fontWeight: '500' },
    inlineInput: {
        width: '100%', maxWidth: '80px', padding: '8px 12px', border: '1px solid #E2E8F0', borderRadius: '10px',
        fontSize: '14px', backgroundColor: '#FFFFFF', textAlign: 'center', boxSizing: 'border-box', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)'
    },
    quantityControl: { display: 'flex', alignItems: 'center', gap: '6px', justifyContent: 'flex-start', minWidth: 0 },
    quantityInput: {
        width: '80px', height: '34px', padding: '0 20px 0 10px', border: '1px solid #E2E8F0', borderRadius: '10px',
        fontSize: '14px', backgroundColor: '#FFFFFF', textAlign: 'center', boxSizing: 'border-box', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        fontWeight: '600', color: '#111111', outline: 'none'
    },
    stepperWrap: { display: 'flex', flexDirection: 'column', gap: '2px' },
    stepperWrapModal: { display: 'flex', flexDirection: 'column', gap: '2px', marginLeft: '-2px' },
    stepperBtn: {
        width: '24px', height: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '4px',
        fontSize: '14px', color: '#64748B', cursor: 'pointer', lineHeight: 1, padding: 0
    },
    stepperBtnSmall: {
        width: '20px', height: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center',
        backgroundColor: '#F1F5F9', border: '1px solid #E2E8F0', borderRadius: '4px',
        fontSize: '12px', color: '#64748B', cursor: 'pointer', lineHeight: 1, padding: 0
    },
    removeBtn: {
        width: '28px', height: '28px', border: 'none', borderRadius: '8px', backgroundColor: 'transparent',
        color: '#FCA5A5', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    totalRow: { backgroundColor: '#FFFFFF' },
    totalLabel: { padding: '18px 24px', fontSize: '14px', fontWeight: '700', color: '#1E293B', textAlign: 'right' },
    totalValue: { padding: '18px 24px', fontSize: '18px', fontWeight: '700', color: '#111111' },
    dropZone: { borderRadius: '20px', border: '2px dashed #E2E8F0', padding: '60px 40px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease', backgroundColor: '#FAFAF9', width: 'calc(100% - 16px)', margin: '0 auto', boxSizing: 'border-box' },
    dropTitle: { fontSize: '16px', fontWeight: '600', color: '#1E293B', marginBottom: '8px' },
    dropDesc: { fontSize: '14px', color: '#64748B' },
    // Modal
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0, 0, 0, 0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { backgroundColor: '#FFFFFF', padding: '0', borderRadius: '24px', border: 'none', width: '600px', maxWidth: '92%', maxHeight: '90vh', display: 'flex', flexDirection: 'column', boxShadow: '0 25px 60px rgba(0, 0, 0, 0.3), 0 0 0 1px rgba(255,255,255,0.1)' },
    modalHeader: { padding: '24px 28px', borderBottom: '1px solid #F1F5F9', backgroundColor: '#FDFCFB', borderRadius: '20px 20px 0 0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0 },
    modalTitle: { fontFamily: "'Playfair Display', serif", fontSize: '20px', fontWeight: '600', margin: 0, color: '#1E293B' },
    modalSubtitle: { fontSize: '13px', color: '#64748B' },
    searchBox: { padding: '16px 24px', borderBottom: '1px solid #E2E8F0', flexShrink: 0 },
    searchInput: { width: '100%', padding: '12px 16px', border: '1px solid #E2E8F0', borderRadius: '999px', fontSize: '14px', backgroundColor: '#FFFFFF', boxSizing: 'border-box', transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)', color: '#1E293B' },
    productList: { height: '500px', overflowY: 'auto', padding: '8px 12px' },
    productItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', borderRadius: '14px', cursor: 'pointer', transition: 'background-color 0.2s ease', borderBottom: '1px solid #F1F5F9' },
    productInfo: { flex: 1, paddingRight: '16px', minWidth: 0 },
    productName: { fontSize: '15px', fontWeight: '600', color: '#1E293B', marginBottom: '4px', wordBreak: 'break-word' },
    productSku: { fontSize: '13px', color: '#64748B', lineHeight: '1.5', wordBreak: 'break-word' },
    productRight: { display: 'flex', alignItems: 'center', gap: '12px' },
    productPrice: { fontSize: '16px', fontWeight: '700', color: '#111111' },
    productActions: { display: 'flex', alignItems: 'center', gap: '4px' },
    productQuantityInput: {
        width: '80px', height: '28px', padding: '0 20px 0 8px', border: '1px solid #E2E8F0', borderRadius: '8px',
        backgroundColor: '#FFFFFF', color: '#1E293B', fontSize: '14px', fontWeight: '600',
        textAlign: 'center', outline: 'none', transition: 'all 0.15s', boxSizing: 'border-box',
    },
    deselectBtn: {
        padding: '4px 10px', backgroundColor: '#FEF2F2', color: '#EF4444', border: '1px solid #FEE2E2',
        borderRadius: '8px', cursor: 'pointer', fontSize: '12px', fontWeight: '600', transition: 'all 0.2s',
    },
    addBadge: { fontSize: '12px', color: '#1E293B', backgroundColor: 'rgba(30, 41, 59, 0.08)', padding: '4px 12px', borderRadius: '10px', fontWeight: '600' },
    noResult: { padding: '40px', textAlign: 'center', color: '#64748B', fontSize: '14px' },
    // Clear/Delete Modal
    clearModalIcon: { marginBottom: '20px', display: 'flex', justifyContent: 'center' },
    clearModalMessage: { fontSize: '14px', color: '#475569', lineHeight: '1.6', margin: '0 0 28px 0' },
    clearModalStats: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', marginBottom: '32px', padding: '24px', backgroundColor: 'rgba(248, 250, 252, 0.5)', borderRadius: '16px', border: '1px solid rgba(226, 232, 240, 0.5)' },
    statItem: { flex: 1 },
    statValue: { fontSize: '28px', fontWeight: '700', color: '#111111', marginBottom: '6px' },
    statLabel: { fontSize: '12px', color: '#64748B', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '1px' },
    statDivider: { width: '1px', height: '48px', backgroundColor: 'rgba(226, 232, 240, 0.5)' },
};
