import { useState, useEffect } from 'react'

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
  @keyframes checkmark {
    0% { stroke-dashoffset: 100; }
    100% { stroke-dashoffset: 0; }
  }
  @keyframes checkmarkCircle {
    0% { stroke-dashoffset: 100; }
    100% { stroke-dashoffset: 0; }
  }
`

export default function SystemSettings() {
    const [settings, setSettings] = useState({
        companyName: 'SalesForce',
        defaultCurrency: 'CNY',
        language: 'zh-CN',
        timezone: 'Asia/Shanghai',
        decimalPlaces: 2,
        autoSave: true,
    })
    const [loading, setLoading] = useState(true)
    const [showSaveModal, setShowSaveModal] = useState(false)
    const [saveStatus, setSaveStatus] = useState('success')
    const [isClosing, setIsClosing] = useState(false)

    useEffect(() => {
        fetchSettings()
    }, [])

    const fetchSettings = async () => {
        try {
            const res = await fetch(`${API_URL}/system-settings`)
            const data = await res.json()
            if (Object.keys(data).length > 0) {
                setSettings(data)
            }
        } catch (err) {
            console.error('获取设置失败:', err)
        } finally {
            setLoading(false)
        }
    }

    const handleChange = (key, value) => {
        setSettings(prev => ({ ...prev, [key]: value }))
    }

    const handleSave = async () => {
        try {
            await fetch(`${API_URL}/system-settings`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings),
            })
            setSaveStatus('success')
            setShowSaveModal(true)
        } catch (err) {
            console.error('保存设置失败:', err)
            setSaveStatus('error')
            setShowSaveModal(true)
        }
    }

    const handleCloseModal = () => {
        setIsClosing(true)
        setTimeout(() => {
            setShowSaveModal(false)
            setIsClosing(false)
        }, 200)
    }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>加载中...</div>

    return (
        <div style={styles.container}>
            <style>{modalAnimationStyles}</style>

            <div style={styles.topBar}>
                <h2 style={styles.pageTitle}>系统参数</h2>
                <button style={styles.saveButton} onClick={handleSave}>保存设置</button>
            </div>

            <div style={styles.card}>
                <div style={styles.sectionTitle}>基础设置</div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>公司名称</label>
                    <input
                        style={styles.input}
                        value={settings.companyName}
                        onChange={(e) => handleChange('companyName', e.target.value)}
                    />
                </div>

                <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                        <label style={styles.label}>默认货币</label>
                        <select
                            style={styles.select}
                            value={settings.defaultCurrency}
                            onChange={(e) => handleChange('defaultCurrency', e.target.value)}
                        >
                            <option value="CNY">CNY - 人民币</option>
                            <option value="USD">USD - 美元</option>
                            <option value="EUR">EUR - 欧元</option>
                            <option value="VND">VND - 越南盾</option>
                        </select>
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                        <label style={styles.label}>语言</label>
                        <select
                            style={styles.select}
                            value={settings.language}
                            onChange={(e) => handleChange('language', e.target.value)}
                        >
                            <option value="zh-CN">简体中文</option>
                            <option value="en-US">English</option>
                        </select>
                    </div>
                </div>

                <div style={styles.formRow}>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                        <label style={styles.label}>时区</label>
                        <select
                            style={styles.select}
                            value={settings.timezone}
                            onChange={(e) => handleChange('timezone', e.target.value)}
                        >
                            <option value="Asia/Shanghai">Asia/Shanghai (GMT+8)</option>
                            <option value="Asia/Singapore">Asia/Singapore (GMT+8)</option>
                            <option value="Asia/Ho_Chi_Minh">Asia/Ho_Chi_Minh (GMT+7)</option>
                            <option value="Asia/Bangkok">Asia/Bangkok (GMT+7)</option>
                            <option value="Asia/Jakarta">Asia/Jakarta (GMT+7)</option>
                            <option value="Australia/Sydney">Australia/Sydney (GMT+11)</option>
                        </select>
                    </div>
                    <div style={{ ...styles.formGroup, flex: 1 }}>
                        <label style={styles.label}>小数位数</label>
                        <input
                            type="number"
                            min="0"
                            max="6"
                            style={styles.input}
                            value={settings.decimalPlaces}
                            onChange={(e) => handleChange('decimalPlaces', Number(e.target.value))}
                        />
                    </div>
                </div>

                <div style={styles.formGroup}>
                    <label style={styles.toggleRow}>
                        <span style={styles.label}>自动保存</span>
                        <div
                            style={{
                                ...styles.toggle,
                                backgroundColor: settings.autoSave ? '#4F46E5' : '#D1D5DB',
                            }}
                            onClick={() => handleChange('autoSave', !settings.autoSave)}
                        >
                            <div style={{
                                ...styles.toggleKnob,
                                transform: settings.autoSave ? 'translateX(20px)' : 'translateX(2px)',
                            }} />
                        </div>
                    </label>
                </div>
            </div>

            {showSaveModal && (
                <div
                    style={{
                        ...styles.modalOverlay,
                        animation: isClosing ? 'modalFadeOut 0.2s ease-out forwards' : 'modalFadeIn 0.2s ease-out forwards',
                    }}
                    onClick={handleCloseModal}
                >
                    <div
                        style={{
                            ...styles.modal,
                            animation: isClosing ? 'modalSlideOut 0.2s ease-out forwards' : 'modalSlideIn 0.2s ease-out forwards',
                        }}
                        onClick={(e) => e.stopPropagation()}
                    >
                        {saveStatus === 'success' ? (
                            <>
                                <div style={styles.successIcon}>
                                    <svg width="80" height="80" viewBox="0 0 80 80">
                                        <circle
                                            cx="40"
                                            cy="40"
                                            r="36"
                                            fill="none"
                                            stroke="#10B981"
                                            strokeWidth="4"
                                            style={{
                                                animation: 'checkmarkCircle 0.6s ease-in-out forwards',
                                                strokeDasharray: 226,
                                                strokeDashoffset: 226,
                                            }}
                                        />
                                        <path
                                            d="M24 40 L36 52 L56 28"
                                            fill="none"
                                            stroke="#10B981"
                                            strokeWidth="4"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            style={{
                                                animation: 'checkmark 0.4s ease-in-out 0.3s forwards',
                                                strokeDasharray: 50,
                                                strokeDashoffset: 50,
                                            }}
                                        />
                                    </svg>
                                </div>
                                <h3 style={styles.modalTitle}>保存成功</h3>
                                <p style={styles.modalMessage}>系统参数已成功保存</p>
                            </>
                        ) : (
                            <>
                                <div style={styles.errorIcon}>✕</div>
                                <h3 style={styles.modalTitle}>保存失败</h3>
                                <p style={styles.modalMessage}>保存设置时出错，请重试</p>
                            </>
                        )}
                        <button style={styles.modalButton} onClick={handleCloseModal}>
                            确定
                        </button>
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
    saveButton: {
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
    card: {
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-lg)',
        border: '1px solid var(--border)',
        padding: '24px',
    },
    sectionTitle: {
        fontSize: '15px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        marginBottom: '20px',
        paddingBottom: '12px',
        borderBottom: '1px solid var(--border)',
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
        backgroundColor: 'var(--bg-primary)',
        boxSizing: 'border-box',
    },
    select: {
        width: '100%',
        padding: '10px 14px',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-sm)',
        fontSize: '14px',
        backgroundColor: 'var(--bg-primary)',
        cursor: 'pointer',
        boxSizing: 'border-box',
    },
    toggleRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        cursor: 'pointer',
    },
    toggle: {
        width: '44px',
        height: '24px',
        borderRadius: '12px',
        position: 'relative',
        cursor: 'pointer',
        transition: 'background-color 0.2s',
    },
    toggleKnob: {
        width: '20px',
        height: '20px',
        borderRadius: '50%',
        backgroundColor: '#fff',
        position: 'absolute',
        top: '2px',
        transition: 'transform 0.2s',
        boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
    },
    modalOverlay: {
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(15, 23, 42, 0.6)',
        backdropFilter: 'blur(4px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
    },
    modal: {
        backgroundColor: 'var(--bg-secondary)',
        borderRadius: 'var(--radius-xl)',
        border: '1px solid var(--border)',
        width: '400px',
        padding: '40px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        boxShadow: 'var(--shadow-xl)',
    },
    successIcon: {
        marginBottom: '24px',
    },
    errorIcon: {
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        backgroundColor: '#FEF2F2',
        color: '#EF4444',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '40px',
        fontWeight: '700',
        marginBottom: '24px',
    },
    modalTitle: {
        fontSize: '20px',
        fontWeight: '700',
        color: 'var(--text-primary)',
        margin: '0 0 12px 0',
    },
    modalMessage: {
        fontSize: '14px',
        color: 'var(--text-secondary)',
        margin: '0 0 28px 0',
        lineHeight: '1.5',
    },
    modalButton: {
        width: '100%',
        padding: '12px 24px',
        background: 'var(--gradient-primary)',
        color: '#fff',
        border: 'none',
        borderRadius: 'var(--radius-sm)',
        cursor: 'pointer',
        fontSize: '15px',
        fontWeight: '600',
        transition: 'all var(--transition-fast)',
    },
}
