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
  .quote-product-row:hover {
    background: var(--bg-tertiary) !important;
  }
  .quote-search-input:focus {
    border-color: #4F46E5 !important;
    box-shadow: 0 0 0 3px rgba(79, 70, 229, 0.1) !important;
  }
`

export default function QuoteGenerator() {
    // 产品报价行
    const [quoteItems, setQuoteItems] = useState([])
    // 产品数据源
    const [products, setProducts] = useState([])
    // 添加产品弹窗
    const [showProductModal, setShowProductModal] = useState(false)
    const [isClosing, setIsClosing] = useState(false)
    const [searchTerm, setSearchTerm] = useState('')
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

    // 初始化加载
    useEffect(() => {
        fetchProducts()
        fetchQuoteItems()
        fetchImportedData()
    }, [])

    const fetchQuoteItems = async () => {
        try {
            const res = await fetch(`${API_URL}/quote-items`)
            const data = await res.json()
            setQuoteItems(data)
        } catch (err) {
            console.error('获取报价项失败:', err)
        }
    }

    const fetchImportedData = async () => {
        try {
            const res = await fetch(`${API_URL}/quote-imported-data`)
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

    // ─── 产品报价相关 ───
    const handleAddProduct = async (product) => {
        const existing = quoteItems.find(item => item.sku === product.sku)
        if (existing) {
            const newQty = existing.quantity + 1
            setQuoteItems(quoteItems.map(item =>
                item.sku === product.sku ? { ...item, quantity: newQty } : item
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
                        sku: product.sku,
                        name: product.name,
                        description: product.description || '',
                        price: product.price,
                        quantity: 1,
                    }),
                })
                const newItem = await res.json()
                setQuoteItems(prev => [...prev, newItem])
            } catch (err) {
                console.error('添加报价项失败:', err)
            }
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

    const totalAmount = quoteItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

    const handleCloseProductModal = () => {
        setIsClosing(true)
        setTimeout(() => {
            setShowProductModal(false)
            setIsClosing(false)
            setSearchTerm('')
        }, 200)
    }

    const filteredProducts = products.filter(p =>
        p.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.sku.toLowerCase().includes(searchTerm.toLowerCase())
    )

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
                body: JSON.stringify({ items: newData }),
            })
            const saved = await res.json()
            setImportedData(prev => [...prev, ...saved])
        } catch (err) {
            console.error('保存导入数据失败:', err)
            // fallback: still update UI
            const fallback = newData.map((row, i) => ({ id: Date.now() + i, ...row }))
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
            SKU: item.sku,
            产品: item.name,
            产品描述: item.description || '',
            单价: item.price,
            数量: item.quantity,
            合计: item.price * item.quantity,
        }))
        exportData.push({ SKU: '', 产品: '', 产品描述: '', 单价: '', 数量: '总计', 合计: totalAmount })
        const ws = XLSX.utils.json_to_sheet(exportData)
        const wb = XLSX.utils.book_new()
        XLSX.utils.book_append_sheet(wb, ws, '报价单')
        XLSX.writeFile(wb, `报价单_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`)
    }

    const currentSheet = importedSheets[activeSheet]
    const importColumns = importedData.length > 0
        ? [...new Set(importedData.flatMap(q => Object.keys(q).filter(k => k !== '_dbId' && k !== 'sheetName')))]
        : []

    return (
        <div style={styles.container}>
            <style>{modalAnimationStyles}</style>

            <div style={styles.topBar}>
                <h2 style={styles.pageTitle}>报价生成器</h2>
                <div style={styles.topActions}>
                    {quoteItems.length > 0 && (
                        <button style={styles.exportButton} onClick={handleExportQuote}>📥 导出报价单</button>
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
                                <th style={styles.th}>SKU</th>
                                <th style={styles.th}>产品</th>
                                <th style={styles.th}>产品描述</th>
                                <th style={{ ...styles.th, width: '120px' }}>价格</th>
                                <th style={{ ...styles.th, width: '100px' }}>数量</th>
                                <th style={styles.th}>合计</th>
                                <th style={{ ...styles.th, width: '60px' }}>操作</th>
                            </tr>
                        </thead>
                        <tbody>
                            {quoteItems.map((item) => (
                                <tr key={item.id} className="quote-product-row" style={styles.tableRow}>
                                    <td style={styles.tdSku}>{item.sku}</td>
                                    <td style={styles.td}>{item.name}</td>
                                    <td style={styles.tdDesc}>{item.description || '-'}</td>
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
                                        <input
                                            type="number"
                                            min="1"
                                            style={styles.inlineInput}
                                            value={item.qtyInput !== undefined ? item.qtyInput : item.quantity}
                                            onChange={(e) => handleQuantityChange(item.id, e.target.value)}
                                            onBlur={(e) => handleQuantityBlur(item.id, e.target.value)}
                                        />
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
                                <td colSpan="5" style={styles.totalLabel}>报价总额</td>
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
                                style={styles.searchInput}
                                placeholder="搜索产品名称或 SKU..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <div style={styles.productList}>
                            {filteredProducts.length === 0 ? (
                                <div style={styles.noResult}>未找到匹配产品</div>
                            ) : (
                                filteredProducts.map((product) => {
                                    const inQuote = quoteItems.find(i => i.sku === product.sku)
                                    return (
                                        <div
                                            key={product.id}
                                            style={styles.productItem}
                                            onClick={() => handleAddProduct(product)}
                                        >
                                            <div style={styles.productInfo}>
                                                <div style={styles.productName}>{product.name}</div>
                                                <div style={styles.productSku}>{product.sku}</div>
                                            </div>
                                            <div style={styles.productRight}>
                                                <div style={styles.productPrice}>¥{product.price.toLocaleString()}</div>
                                                {inQuote && (
                                                    <span style={styles.addedBadge}>已添加 ×{inQuote.quantity}</span>
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
    addedBadge: { fontSize: '11px', color: '#4F46E5', backgroundColor: 'rgba(79,70,229,0.1)', padding: '2px 8px', borderRadius: '999px', fontWeight: '600' },
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
}
