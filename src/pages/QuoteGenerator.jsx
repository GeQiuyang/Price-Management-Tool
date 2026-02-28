import { useState, useRef, useEffect } from 'react'
import * as XLSX from 'xlsx'

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
    border-color: #4F46E5 !important;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
  }
  .product-quantity-input:focus {
    border-color: #4F46E5 !important;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
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
    // 删除报价单确认对话框
    const [deleteListId, setDeleteListId] = useState(null)
    const [isDeleteListClosing, setIsDeleteListClosing] = useState(false)

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
        if (quoteLists.length >= 5) {
            alert('最多只能创建 5 个报价单')
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

    const handleDeleteQuoteListClick = (id, e) => {
        e.stopPropagation()
        if (quoteLists.length <= 1) {
            alert('必须保留至少一个报价单')
            return
        }
        setDeleteListId(id)
    }

    const handleConfirmDeleteList = async () => {
        if (!deleteListId) return
        try {
            await fetch(`${API_URL}/quote-lists/${deleteListId}`, { method: 'DELETE' })
            const newLists = quoteLists.filter(list => list.id !== deleteListId)
            setQuoteLists(newLists)
            if (activeQuoteListId === deleteListId) {
                setActiveQuoteListId(newLists[0].id)
            }
        } catch (err) {
            console.error('删除报价单失败:', err)
        }
        handleCloseDeleteListModal()
    }

    const handleCloseDeleteListModal = () => {
        setIsDeleteListClosing(true)
        setTimeout(() => {
            setDeleteListId(null)
            setIsDeleteListClosing(false)
        }, 200)
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
                setQuoteItems(prev => [...prev, newItem])
            } catch (err) {
                console.error('添加报价项失败:', err)
            }
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
        if (existing && existing.quantity > 1) {
            const newQty = existing.quantity - 1
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
            const num = Math.max(1, parseInt(value) || 1)
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

    const handleQuantityChange = (id, value) => {
        setQuoteItems(quoteItems.map(item =>
            item.id === id ? { ...item, qtyInput: value } : item
        ))
    }

    const handleQuantityBlur = (id, value) => {
        const num = Math.max(1, parseInt(value) || 1)
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
        if (item && item.quantity > 1) {
            const newQty = item.quantity - 1
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
        if (!searchTerm.trim()) return products
        const keyword = searchTerm.trim().replace(/-/g, '')
        const lowerKeyword = keyword.toLowerCase()
        const numbers = keyword.match(/\d+/g)
        const chinesePart = keyword.replace(/[\d\s]+/g, '').toLowerCase()
        const numberPart = numbers ? numbers.join('') : ''
        const isNumericOnly = /^\d+$/.test(keyword)

        // 导管类智能搜索：将自然语言提取为结构化 JSON
        const parsePipeQuery = (kw) => {
            const pipeTypeMatch = kw.match(/(300|260|273|219)/)
            const pipeType = pipeTypeMatch ? pipeTypeMatch[1] : null

            let threadType = null
            if (/尖丝|尖/.test(kw)) threadType = '尖丝'
            else if (/方丝|方/.test(kw)) threadType = '方丝'

            let name = null
            if (pipeType && threadType) {
                name = `${pipeType}${threadType}导管`
            }

            let jointSpec = null
            if (/公扣/.test(kw)) jointSpec = '公扣'
            else if (/母扣/.test(kw)) jointSpec = '母扣'
            else if (/衬套/.test(kw)) jointSpec = '衬套'
            const isJointQuery = /接头|衬套/.test(kw) || jointSpec !== null

            // 长度 (L)：支持 "1米"/"1m"/"0.5米"/"1.5m" 等 (排除了 mm)
            const lengthMatch = kw.match(/(\d+\.?\d*)\s*(?:m|米)(?!m|毫米)/i)
            const L = lengthMatch ? parseFloat(lengthMatch[1]) : null

            let T = null
            const thickMatch1 = kw.match(/(\d+\.?\d*)\s*(?:mm|毫米|厚|壁厚|外径)/i)
            const thickMatch2 = kw.match(/(?:厚度|壁厚|外径)[：:]?\s*(\d+\.?\d*)/)
            const thickMatch3 = kw.match(/(?:(?:米|m)(?!m|毫米)[^+]*\+\s*|\+\s*)(\d+\.?\d*)\s*(?:mm|毫米)?\s*$/i)

            if (thickMatch1) {
                T = parseFloat(thickMatch1[1])
            } else if (thickMatch2) {
                T = parseFloat(thickMatch2[1])
            } else if (thickMatch3) {
                T = parseFloat(thickMatch3[1])
            } else {
                const allNums = [...kw.matchAll(/(?<!\d\.)\d+(?:\.\d+)?(?!m|米|mm)/gi)].map(m => parseFloat(m[0]))
                for (const n of allNums) {
                    if (n !== L && n !== parseInt(pipeType) && n !== 6) {
                        T = n;
                        break;
                    }
                }
            }

            const hasPipeKeywords = pipeType || kw.includes('导管') || isJointQuery || L !== null || T !== null
            return { name, pipeType, threadType, L, T, hasPipeKeywords, isJointQuery, jointSpec }
        }
        const pipeQuery = parsePipeQuery(keyword)
        if (pipeQuery.hasPipeKeywords && (pipeQuery.pipeType || pipeQuery.threadType || pipeQuery.L !== null || pipeQuery.T !== null || pipeQuery.isJointQuery)) {
            const pipeResults = products.filter((p) => {
                if (p.category !== '导管类') return false

                // 严禁返回钻宝、SMS6系、钻金 (除非用户输入包含)
                const excludeWords = ['钻宝', 'SMS6系', '钻金']
                for (const word of excludeWords) {
                    if (p.name.includes(word) && !keyword.includes(word)) return false
                }

                if (pipeQuery.isJointQuery) {
                    if (!p.name.includes('接头') && !p.name.includes('衬套')) return false
                    if (pipeQuery.pipeType && !p.name.includes(pipeQuery.pipeType)) return false
                    if (pipeQuery.threadType && !p.name.includes(pipeQuery.threadType)) return false
                    if (pipeQuery.jointSpec && !p.name.includes(pipeQuery.jointSpec)) return false

                    if (pipeQuery.T !== null && !(p.description && p.description.includes(`外径：${pipeQuery.T}`))) return false
                    return true
                }

                if (pipeQuery.name) {
                    if (!p.name.includes(pipeQuery.name)) return false
                } else {
                    if (pipeQuery.pipeType && !p.name.includes(pipeQuery.pipeType)) return false
                    if (pipeQuery.threadType && !p.name.includes(pipeQuery.threadType)) return false
                }

                if (pipeQuery.L !== null && !p.name.includes(`${pipeQuery.L}m`)) return false
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
        for (const list of [levelDrill, level0, level1, level2, level3, level4]) {
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
        if (quoteItems.length === 0) return
        const exportData = quoteItems.map(item => ({
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

    const currentSheet = importedSheets[activeSheet]
    const importColumns = importedData.length > 0
        ? [...new Set(importedData.flatMap(q => Object.keys(q).filter(k => k !== '_dbId' && k !== 'sheetName')))]
        : []

    return (
        <div style={styles.container}>
            <style>{modalAnimationStyles}</style>

            <div style={styles.topBar}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <h2 style={styles.pageTitle}>报价生成器</h2>
                        <div style={styles.topActions}>
                            {quoteItems.length > 0 && (
                                <>
                                    <button style={styles.clearButton} onClick={handleClearAll}>🗑️ 清除所有</button>
                                    <button style={styles.exportButton} onClick={handleExportQuote}>📥 导出当前报价单</button>
                                </>
                            )}
                            <button style={styles.importButton} onClick={() => fileInputRef.current?.click()}>
                                📂 导入 Excel
                            </button>
                            <button style={styles.addButton} onClick={() => setShowProductModal(true)}>
                                ＋ 添加产品
                            </button>
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
                                    padding: '6px 16px',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    backgroundColor: activeQuoteListId === list.id ? '#4F46E5' : 'white',
                                    color: activeQuoteListId === list.id ? 'white' : '#4b5563',
                                    border: `1px solid ${activeQuoteListId === list.id ? '#4F46E5' : '#e5e7eb'}`,
                                    boxShadow: activeQuoteListId === list.id ? '0 1px 2px rgba(79, 70, 229, 0.1)' : 'none',
                                    transition: 'all 0.2s',
                                    whiteSpace: 'nowrap',
                                    fontSize: '14px',
                                    fontWeight: activeQuoteListId === list.id ? '500' : '400',
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
                                            width: '80px',
                                            fontSize: 'inherit',
                                            fontWeight: 'inherit',
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
                                            fontSize: '12px'
                                        }}
                                        title="删除报价单"
                                    >×</button>
                                )}
                            </div>
                        ))}
                        {quoteLists.length < 5 && (
                            <button
                                onClick={handleCreateQuoteList}
                                style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    width: '32px',
                                    height: '32px',
                                    borderRadius: '8px',
                                    border: '1px dashed #d1d5db',
                                    backgroundColor: '#f9fafb',
                                    color: '#6b7280',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                }}
                                title="添加报价单"
                                onMouseEnter={(e) => {
                                    e.currentTarget.style.borderColor = '#4F46E5';
                                    e.currentTarget.style.color = '#4F46E5';
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

            {/* 概览卡片 */}
            <div style={styles.summaryCards}>
                <div style={styles.summaryCard}>
                    <div style={styles.summaryLabel}>报价产品数</div>
                    <div style={styles.summaryValue}>{quoteItems.length}</div>
                </div>
                <div style={styles.summaryCard}>
                    <div style={styles.summaryLabel}>总数量</div>
                    <div style={styles.summaryValue}>{quoteItems.reduce((s, i) => s + i.quantity, 0)}</div>
                </div>
                <div style={styles.summaryCard}>
                    <div style={styles.summaryLabel}>报价总额</div>
                    <div style={{ ...styles.summaryValue, color: '#059669' }}>¥{totalAmount.toLocaleString()}</div>
                </div>
                <div style={styles.summaryCard}>
                    <div style={styles.summaryLabel}>Excel 导入行</div>
                    <div style={styles.summaryValue}>{importedData.length}</div>
                </div>
            </div>

            {/* Tab 切换 */}
            {(quoteItems.length > 0 || importedData.length > 0) && (
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
            )}

            {/* 产品报价表格 */}
            {activeTab === 'products' && quoteItems.length > 0 && (
                <div style={styles.tableCard}>
                    <table style={styles.table}>
                        <thead>
                            <tr style={styles.tableHeader}>
                                <th style={styles.th}>产品名称</th>
                                <th style={styles.th}>产品规格</th>
                                <th style={{ ...styles.th, width: '120px' }}>价格</th>
                                <th style={{ ...styles.th, width: '100px' }}>数量</th>
                                <th style={styles.th}>合计</th>
                                <th style={{ ...styles.th, width: '60px' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quoteItems.map((item) => (
                                <tr key={item.id} className="quote-product-row" style={styles.tableRow}>
                                    <td style={styles.td}>{item.name}</td>
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
                                                disabled={item.quantity <= 1}
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
                                    <td style={styles.td}>
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
                        borderColor: isDragging ? '#4F46E5' : 'var(--border)',
                        background: isDragging ? 'rgba(79, 70, 229, 0.06)' : 'var(--bg-secondary)',
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
                        borderColor: isDragging ? '#4F46E5' : 'var(--border)',
                        background: isDragging ? 'rgba(79, 70, 229, 0.06)' : 'var(--bg-secondary)',
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
            {showProductModal && (
                <div
                    style={{
                        ...styles.modalOverlay,
                        animation: isClosing ? 'modalFadeOut 0.2s ease-out forwards' : 'modalFadeIn 0.2s ease-out forwards',
                    }}
                    onClick={handleCloseProductModal}
                >
                    <div
                        style={{
                            ...styles.modal,
                            animation: isClosing ? 'modalSlideOut 0.2s ease-out forwards' : 'modalSlideIn 0.2s ease-out forwards',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>添加产品</h3>
                            <span style={styles.modalSubtitle}>{products.length} 个可选产品</span>
                        </div>

                        <div style={styles.searchBox}>
                            <input
                                className="quote-search-input"
                                style={{ ...styles.searchInput, flex: 1 }}
                                placeholder="搜索产品名称..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '10px' }}>
                                <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>价格类型：</span>
                                <button
                                    type="button"
                                    style={{
                                        padding: '5px 14px',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        border: '1px solid',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        borderColor: !useDealerPrice ? '#4F46E5' : '#d1d5db',
                                        backgroundColor: !useDealerPrice ? '#EEF2FF' : 'white',
                                        color: !useDealerPrice ? '#4F46E5' : '#6b7280',
                                    }}
                                    onClick={() => setUseDealerPrice(false)}
                                >终端价</button>
                                <button
                                    type="button"
                                    style={{
                                        padding: '5px 14px',
                                        fontSize: '13px',
                                        fontWeight: '500',
                                        border: '1px solid',
                                        borderRadius: '6px',
                                        cursor: 'pointer',
                                        borderColor: useDealerPrice ? '#4F46E5' : '#d1d5db',
                                        backgroundColor: useDealerPrice ? '#EEF2FF' : 'white',
                                        color: useDealerPrice ? '#4F46E5' : '#6b7280',
                                    }}
                                    onClick={() => setUseDealerPrice(true)}
                                >经销商价</button>
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
                                            style={styles.productItem}
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
                                                    <div style={styles.productActions}>
                                                        <button
                                                            style={styles.productActionBtn}
                                                            onClick={(e) => handleDecreaseFromModal(product, e)}
                                                            disabled={inQuote.quantity <= 1}
                                                        >
                                                            −
                                                        </button>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            className="product-quantity-input"
                                                            style={styles.productQuantityInput}
                                                            value={inQuote.qtyInput !== undefined ? inQuote.qtyInput : inQuote.quantity}
                                                            onChange={(e) => handleQuantityInputChange(product, e.target.value, e)}
                                                            onBlur={(e) => handleQuantityInputBlur(product, e.target.value, e)}
                                                            onClick={(e) => e.stopPropagation()}
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

                        <div style={styles.modalButtons}>
                            <button style={styles.cancelButton} onClick={handleCloseProductModal}>完成</button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── Excel 预览弹窗 ─── */}
            {showPreview && currentSheet && (
                <div
                    style={{
                        ...styles.modalOverlay,
                        animation: isPreviewClosing ? 'modalFadeOut 0.2s ease-out forwards' : 'modalFadeIn 0.2s ease-out forwards',
                    }}
                    onClick={handleClosePreview}
                >
                    <div
                        style={{
                            ...styles.modal, width: '900px',
                            animation: isPreviewClosing ? 'modalSlideOut 0.2s ease-out forwards' : 'modalSlideIn 0.2s ease-out forwards',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={styles.modalHeader}>
                            <h3 style={styles.modalTitle}>📄 {fileName}</h3>
                            <div style={{ display: 'flex', gap: '8px' }}>
                                {importedSheets.length > 1 && (
                                    <span style={styles.sheetBadge}>{importedSheets.length} 个工作表</span>
                                )}
                                <span style={styles.rowBadge}>{currentSheet.rows.length} 行</span>
                            </div>
                        </div>

                        {importedSheets.length > 1 && (
                            <div style={styles.sheetTabs}>
                                {importedSheets.map((sheet, i) => (
                                    <button
                                        key={sheet.name}
                                        style={{ ...styles.sheetTab, ...(i === activeSheet ? styles.sheetTabActive : {}) }}
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
                                        {currentSheet.headers.map((h, i) => (
                                            <th key={i} style={styles.previewTh}>{h || `列${i + 1}`}</th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {currentSheet.rows.slice(0, 50).map((row, rowIdx) => (
                                        <tr key={rowIdx}>
                                            {currentSheet.headers.map((_, colIdx) => (
                                                <td key={colIdx} style={styles.previewTd}>{row[colIdx] ?? ''}</td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {currentSheet.rows.length > 50 && (
                                <div style={styles.moreRows}>... 还有 {currentSheet.rows.length - 50} 行</div>
                            )}
                        </div>

                        <div style={styles.modalButtons}>
                            <button style={styles.cancelButton} onClick={handleClosePreview}>取消</button>
                            <button style={styles.submitButton} onClick={handleConfirmImport}>
                                确认导入 ({importedSheets.reduce((s, sh) => s + sh.rows.length, 0)} 行)
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* ─── 清除确认对话框 ─── */}
            {showClearModal && (
                <div
                    style={{
                        ...styles.modalOverlay,
                        animation: isClearClosing ? 'modalFadeOut 0.2s ease-out forwards' : 'modalFadeIn 0.2s ease-out forwards',
                    }}
                    onClick={handleCloseClearModal}
                >
                    <div
                        style={{
                            ...styles.clearModal,
                            animation: isClearClosing ? 'modalSlideOut 0.2s ease-out forwards' : 'modalSlideIn 0.2s ease-out forwards',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={styles.clearModalIcon}>
                            <svg width="64" height="64" viewBox="0 0 64 64">
                                <circle
                                    cx="32"
                                    cy="32"
                                    r="28"
                                    fill="none"
                                    stroke="#DC2626"
                                    strokeWidth="3"
                                    style={{ animation: 'warningPulse 2s ease-in-out infinite' }}
                                />
                                <path
                                    d="M20 32 L44 32"
                                    stroke="#DC2626"
                                    strokeWidth="3"
                                    strokeLinecap="round"
                                />
                            </svg>
                        </div>
                        <h3 style={styles.clearModalTitle}>确认清除</h3>
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
                        <div style={styles.clearModalButtons}>
                            <button style={styles.clearModalCancel} onClick={handleCloseClearModal}>
                                取消
                            </button>
                            <button style={styles.clearModalConfirm} onClick={handleConfirmClear}>
                                确认清除
                            </button>
                        </div>
                    </div>
                </div>
            )}
            {/* ─── 删除报价单确认弹窗 ─── */}
            {deleteListId && (
                <div
                    style={{
                        ...styles.modalOverlay,
                        animation: isDeleteListClosing ? 'modalFadeOut 0.2s ease-out forwards' : 'modalFadeIn 0.2s ease-out forwards',
                    }}
                    onClick={handleCloseDeleteListModal}
                >
                    <div
                        style={{
                            ...styles.modal,
                            width: '420px',
                            padding: '0',
                            animation: isDeleteListClosing ? 'modalSlideOut 0.2s ease-out forwards' : 'modalSlideIn 0.2s ease-out forwards',
                            overflow: 'hidden',
                            borderRadius: '16px',
                            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div style={{ padding: '24px 24px 16px 24px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '50%', backgroundColor: '#FEE2E2',
                                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
                                }}>
                                    <span style={{ fontSize: '24px' }}>🗑️</span>
                                </div>
                                <h3 style={{ margin: 0, fontSize: '20px', color: '#111827', fontWeight: '600' }}>
                                    删除报价单
                                </h3>
                            </div>
                            <p style={{ margin: '0 0 0 64px', fontSize: '15px', color: '#4B5563', lineHeight: '1.6' }}>
                                确定要删除该报价单及其包含的所有产品数据吗？此操作不可恢复。
                            </p>
                        </div>
                        <div style={{
                            padding: '20px 24px', backgroundColor: '#F9FAFB', borderTop: '1px solid #E5E7EB',
                            display: 'flex', justifyContent: 'flex-end', gap: '12px'
                        }}>
                            <button
                                style={{
                                    ...styles.cancelBtn,
                                    backgroundColor: 'white',
                                    border: '1px solid #D1D5DB',
                                    color: '#374151',
                                    padding: '8px 20px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    borderRadius: '8px',
                                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#F9FAFB'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = 'white'}
                                onClick={handleCloseDeleteListModal}
                            >
                                取消
                            </button>
                            <button
                                style={{
                                    ...styles.confirmBtn,
                                    backgroundColor: '#DC2626',
                                    color: 'white',
                                    padding: '8px 20px',
                                    fontSize: '14px',
                                    fontWeight: '500',
                                    border: 'none',
                                    borderRadius: '8px',
                                    boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
                                    transition: 'background-color 0.2s'
                                }}
                                onMouseEnter={(e) => e.target.style.backgroundColor = '#B91C1C'}
                                onMouseLeave={(e) => e.target.style.backgroundColor = '#DC2626'}
                                onClick={handleConfirmDeleteList}
                            >
                                确定删除
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}

const styles = {
    container: { display: 'flex', flexDirection: 'column', gap: '20px' },
    topBar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' },
    pageTitle: { fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)', margin: 0 },
    topActions: { display: 'flex', alignItems: 'center', gap: '10px' },
    addButton: {
        padding: '10px 20px', background: 'var(--gradient-primary)', color: '#fff', border: 'none',
        borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '14px', fontWeight: '600',
    },
    importButton: {
        padding: '10px 20px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)',
        border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '14px', fontWeight: '500',
    },
    exportButton: {
        padding: '10px 20px', backgroundColor: '#ECFDF5', color: '#059669',
        border: '1px solid #A7F3D0', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '14px', fontWeight: '500',
    },
    clearButton: {
        padding: '10px 20px', backgroundColor: '#FEF2F2', color: '#DC2626',
        border: '1px solid #FECACA', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '14px', fontWeight: '500',
    },
    summaryCards: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px' },
    summaryCard: { backgroundColor: 'var(--bg-secondary)', padding: '20px', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)' },
    summaryLabel: { fontSize: '13px', color: 'var(--text-tertiary)', marginBottom: '8px', fontWeight: '500' },
    summaryValue: { fontSize: '26px', fontWeight: '700', color: 'var(--text-primary)' },
    tabBar: { display: 'flex', gap: '4px', backgroundColor: 'var(--bg-secondary)', padding: '4px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border)' },
    tab: {
        flex: 1, padding: '10px 16px', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer',
        fontSize: '14px', fontWeight: '500', backgroundColor: 'transparent', color: 'var(--text-secondary)', transition: 'all 0.15s',
    },
    tabActive: { backgroundColor: '#4F46E5', color: '#fff' },
    tableCard: { backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border)', overflow: 'hidden', boxShadow: 'var(--shadow-card)' },
    tableToolbar: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '16px 20px', borderBottom: '1px solid var(--border)' },
    tableTitle: { fontSize: '15px', fontWeight: '600', color: 'var(--text-primary)' },
    importMoreBtn: { padding: '6px 14px', backgroundColor: 'var(--primary-bg)', color: 'var(--primary)', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '13px', fontWeight: '500' },
    tableScroll: { overflowX: 'auto' },
    table: { width: '100%', borderCollapse: 'collapse' },
    tableHeader: { backgroundColor: 'var(--bg-tertiary)' },
    th: { padding: '14px 20px', textAlign: 'left', fontSize: '13px', fontWeight: '500', color: 'var(--text-tertiary)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap' },
    tableRow: { borderBottom: '1px solid var(--border)', transition: 'background 0.15s' },
    td: { padding: '12px 20px', fontSize: '14px', color: 'var(--text-primary)' },
    tdSku: { padding: '12px 20px', fontSize: '13px', color: 'var(--text-tertiary)', fontFamily: 'monospace', fontWeight: '500' },
    tdDesc: { padding: '12px 20px', fontSize: '13px', color: 'var(--text-secondary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    tdTotal: { padding: '12px 20px', fontSize: '14px', fontWeight: '700', color: '#059669' },
    tdIndex: { padding: '10px 16px', fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '500' },
    inlineInput: {
        width: '80px', padding: '6px 10px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
        fontSize: '14px', backgroundColor: 'var(--bg-primary)', textAlign: 'right', boxSizing: 'border-box',
    },
    quantityControl: { display: 'flex', alignItems: 'center', gap: '4px' },
    quantityBtn: {
        width: '28px', height: '28px', padding: '0', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
        backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '14px',
        fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
    },
    removeBtn: {
        width: '28px', height: '28px', border: 'none', borderRadius: '50%', backgroundColor: '#FEF2F2',
        color: '#EF4444', cursor: 'pointer', fontSize: '13px', display: 'flex', alignItems: 'center', justifyContent: 'center',
    },
    totalRow: { backgroundColor: 'var(--bg-tertiary)' },
    totalLabel: { padding: '14px 20px', fontSize: '14px', fontWeight: '700', color: 'var(--text-primary)', textAlign: 'right' },
    totalValue: { padding: '14px 20px', fontSize: '16px', fontWeight: '700', color: '#059669' },
    dropZone: { borderRadius: 'var(--radius-lg)', border: '2px dashed var(--border)', padding: '60px 40px', textAlign: 'center', cursor: 'pointer', transition: 'all 0.2s ease' },
    dropIcon: { fontSize: '56px', marginBottom: '16px' },
    dropTitle: { fontSize: '16px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '8px' },
    dropDesc: { fontSize: '14px', color: 'var(--text-tertiary)' },
    loadingWrap: { display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' },
    spinner: { width: '32px', height: '32px', border: '3px solid var(--border)', borderTopColor: '#4F46E5', borderRadius: '50%', animation: 'spin 0.8s linear infinite' },
    loadingText: { fontSize: '14px', color: 'var(--text-tertiary)' },
    // Modal
    modalOverlay: { position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(15, 23, 42, 0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 },
    modal: { backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', width: '600px', maxWidth: '94%', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: 'var(--shadow-xl)' },
    modalHeader: { padding: '20px 24px', borderBottom: '1px solid var(--border)', backgroundColor: 'var(--bg-tertiary)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexShrink: 0, borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0' },
    modalTitle: { fontSize: '17px', fontWeight: '700', margin: 0, color: 'var(--text-primary)' },
    modalSubtitle: { fontSize: '13px', color: 'var(--text-tertiary)' },
    searchBox: { padding: '16px 24px', borderBottom: '1px solid var(--border)', flexShrink: 0 },
    searchInput: { width: '100%', padding: '10px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', fontSize: '14px', backgroundColor: 'var(--bg-primary)', boxSizing: 'border-box', outline: 'none', transition: 'all 0.15s' },
    productList: { flex: 1, overflowY: 'auto', padding: '8px 12px' },
    productItem: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 14px', borderRadius: 'var(--radius-sm)', cursor: 'pointer', transition: 'background 0.15s', borderBottom: '1px solid var(--border)' },
    productInfo: { flex: 1 },
    productName: { fontSize: '14px', fontWeight: '600', color: 'var(--text-primary)', marginBottom: '2px' },
    productSku: { fontSize: '12px', color: 'var(--text-tertiary)', fontFamily: 'monospace' },
    productRight: { display: 'flex', alignItems: 'center', gap: '10px' },
    productPrice: { fontSize: '15px', fontWeight: '700', color: '#059669' },
    productActions: { display: 'flex', alignItems: 'center', gap: '4px' },
    productActionBtn: {
        width: '24px', height: '24px', padding: '0', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
        backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', cursor: 'pointer', fontSize: '14px',
        fontWeight: '600', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.15s',
    },
    productQuantityInput: {
        width: '60px', height: '24px', padding: '0 4px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)',
        backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)', fontSize: '13px', fontWeight: '600',
        textAlign: 'center', outline: 'none', transition: 'all 0.15s', boxSizing: 'border-box',
    },
    addBadge: { fontSize: '11px', color: '#4F46E5', backgroundColor: 'rgba(79,70,229,0.1)', padding: '4px 10px', borderRadius: '999px', fontWeight: '600' },
    noResult: { padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)', fontSize: '14px' },
    // Preview
    sheetBadge: { fontSize: '12px', color: '#4F46E5', backgroundColor: 'rgba(79,70,229,0.1)', padding: '3px 10px', borderRadius: '999px', fontWeight: '600' },
    rowBadge: { fontSize: '12px', color: '#059669', backgroundColor: '#ECFDF5', padding: '3px 10px', borderRadius: '999px', fontWeight: '600' },
    sheetTabs: { display: 'flex', gap: '4px', padding: '12px 24px', borderBottom: '1px solid var(--border)', overflowX: 'auto', flexShrink: 0 },
    sheetTab: { padding: '6px 14px', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', backgroundColor: 'transparent', color: 'var(--text-secondary)', cursor: 'pointer', fontSize: '13px', fontWeight: '500', whiteSpace: 'nowrap' },
    sheetTabActive: { backgroundColor: '#4F46E5', color: '#fff', borderColor: '#4F46E5' },
    previewScroll: { flex: 1, overflowY: 'auto', overflowX: 'auto' },
    previewTable: { width: '100%', borderCollapse: 'collapse', minWidth: '500px' },
    previewTh: { padding: '10px 14px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-tertiary)', borderBottom: '1px solid var(--border)', whiteSpace: 'nowrap', position: 'sticky', top: 0 },
    previewTd: { padding: '8px 14px', fontSize: '13px', color: 'var(--text-primary)', maxWidth: '200px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
    moreRows: { padding: '12px', textAlign: 'center', fontSize: '13px', color: 'var(--text-tertiary)', backgroundColor: 'var(--bg-tertiary)' },
    modalButtons: { display: 'flex', justifyContent: 'flex-end', gap: '12px', padding: '16px 24px', backgroundColor: 'var(--bg-tertiary)', borderTop: '1px solid var(--border)', flexShrink: 0, borderRadius: '0 0 var(--radius-xl) var(--radius-xl)' },
    cancelButton: { padding: '10px 24px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
    submitButton: { padding: '10px 24px', background: 'var(--gradient-primary)', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '14px', fontWeight: '500' },
    // Clear Modal
    clearModal: { backgroundColor: 'var(--bg-secondary)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--border)', width: '420px', maxWidth: '94%', padding: '32px', textAlign: 'center', boxShadow: 'var(--shadow-xl)' },
    clearModalIcon: { marginBottom: '20px', display: 'flex', justifyContent: 'center' },
    clearModalTitle: { fontSize: '20px', fontWeight: '700', color: 'var(--text-primary)', margin: '0 0 12px 0' },
    clearModalMessage: { fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.6', margin: '0 0 24px 0' },
    clearModalStats: { display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '24px', marginBottom: '28px', padding: '20px', backgroundColor: 'var(--bg-tertiary)', borderRadius: 'var(--radius-lg)' },
    statItem: { flex: 1 },
    statValue: { fontSize: '24px', fontWeight: '700', color: 'var(--text-primary)', marginBottom: '4px' },
    statLabel: { fontSize: '12px', color: 'var(--text-tertiary)', fontWeight: '500', textTransform: 'uppercase', letterSpacing: '0.5px' },
    statDivider: { width: '1px', height: '40px', backgroundColor: 'var(--border)' },
    clearModalButtons: { display: 'flex', gap: '12px', justifyContent: 'center' },
    clearModalCancel: { flex: 1, padding: '12px 24px', backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)', border: '1px solid var(--border)', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '14px', fontWeight: '500', transition: 'all 0.15s' },
    clearModalConfirm: { flex: 1, padding: '12px 24px', backgroundColor: '#DC2626', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)', cursor: 'pointer', fontSize: '14px', fontWeight: '600', transition: 'all 0.15s' },
}
