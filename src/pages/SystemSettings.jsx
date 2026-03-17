import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import Modal from '../components/Modal'
import { API_URL } from '../lib/api'



export default function SystemSettings() {
    const navigate = useNavigate()
    const [settings, setSettings] = useState({
        companyName: 'QuoteFlow',
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
    const user = JSON.parse(localStorage.getItem('user') || '{}')

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
        setShowSaveModal(false)
        setIsClosing(false)
    }

    const handleLogout = async () => {
        try {
            const token = localStorage.getItem('token')
            await fetch(`${API_URL}/auth/logout`, {
                method: 'POST',
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            })
        } catch (error) {
            console.error('退出登录失败:', error)
        } finally {
            localStorage.removeItem('token')
            localStorage.removeItem('refreshToken')
            localStorage.removeItem('user')
            navigate('/login')
        }
    }

    if (loading) return <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-tertiary)' }}>加载中...</div>

    return (
        <div style={styles.container}>

            <div style={styles.topBar}>
                <h2 style={styles.pageTitle}>系统设置</h2>
                <button style={styles.saveButton} onClick={handleSave}>保存设置</button>
            </div>

            <div style={styles.card}>
                <div style={styles.sectionTitle}>基础设置</div>

                <div style={styles.formGroup}>
                    <label style={styles.label}>账户名称</label>
                    <div style={styles.accountRow}>
                        <div style={{ ...styles.accountName, flex: 1 }}>{user?.username || '访客'}</div>
                        <button style={styles.accountButton} onClick={handleLogout}>LOGOUT</button>
                    </div>
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
                                backgroundColor: settings.autoSave ? '#111111' : '#D1D5DB',
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

            <Modal
                isOpen={showSaveModal}
                onClose={handleCloseModal}
                title=""
                width={600}
                footer={null}
            >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center', padding: '10px 0' }}>
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
                                            strokeDasharray: 226,
                                            strokeDashoffset: 0,
                                        }}
                                    />
                                    <path
                                        d="M24 40 L36 52 L56 28"
                                        fill="none"
                                        stroke="#10B981"
                                        strokeWidth="4"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
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
                            <p style={styles.modalMessage}>保存设置时出错,请重试</p>
                        </>
                    )}
                    <button className="sf-btn sf-btn-confirm" style={{ width: '100%', marginTop: '20px' }} onClick={handleCloseModal}>
                        确定
                    </button>
                </div>
            </Modal>
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
        gap: '16px',
        flexWrap: 'wrap',
    },
    pageTitle: {fontSize: '42px',
        fontWeight: '700',
        color: '#111111',
        margin: 0,
        letterSpacing: '-0.02em',
    },
    saveButton: {
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
    },
    card: {
        backgroundColor: '#FFFFFF',
        padding: '24px',
        borderRadius: '18px',
        border: '1px solid #E2E8F0',
    },
    accountRow: {
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        gap: '16px',
        flexWrap: 'wrap',
    },
    accountName: {
        padding: '12px 18px',
        borderRadius: '999px',
        border: '1px solid #E2E8F0',
        backgroundColor: '#FFFFFF',
        color: '#1E293B',
        fontSize: '14px',
        fontWeight: '600',
        minWidth: '160px',
    },
    accountButton: {
        padding: '12px 26px',
        background: '#111111',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '999px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
    sectionTitle: {
        fontSize: '14px',
        fontWeight: '700',
        color: '#64748B',
        marginBottom: '20px',
        paddingBottom: '12px',
        borderBottom: '1px solid #E2E8F0',
        letterSpacing: '1px',
    },
    formGroup: {
        marginBottom: '20px',
    },
    formRow: {
        display: 'flex',
        gap: '24px',
    },
    label: {
        display: "block",
        marginBottom: "10px",
        fontSize: "14px",
        fontWeight: "600",
        color: "#334155",
    },
    input: {
        width: "100%",
        padding: '12px 16px',
        border: '1px solid #E2E8F0',
        borderRadius: '999px',
        fontSize: '14px',
        backgroundColor: '#FFFFFF',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        color: '#1E293B',
        boxSizing: 'border-box',
    },
    select: {
        width: "100%",
        padding: '12px 16px',
        border: '1px solid #E2E8F0',
        borderRadius: '999px',
        fontSize: '14px',
        backgroundColor: '#FFFFFF',
        transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
        color: '#1E293B',
        cursor: "pointer",
        boxSizing: "border-box",
        appearance: "auto",
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
        borderRadius: '999px',
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
        zIndex: 1000,
    },
    modal: {
        backgroundColor: '#FFFFFF',
        borderRadius: '20px',
        border: '1px solid rgba(30, 41, 59, 0.08)',
        width: '400px',
        padding: '40px 32px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        textAlign: 'center',
        boxShadow: '0 24px 48px rgba(30, 41, 59, 0.2), 0 0 0 1px rgba(65, 105, 225, 0.05)',
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
        fontFamily: "'Playfair Display', serif",
        fontSize: '20px',
        fontWeight: '600',
        color: '#1E293B',
        margin: '0 0 12px 0',
    },
    modalMessage: {
        fontSize: '14px',
        color: '#64748B',
        margin: '0 0 28px 0',
        lineHeight: '1.5',
    },
    modalButton: {
        width: '100%',
        padding: '12px 28px',
        background: '#111111',
        color: '#FFFFFF',
        border: 'none',
        borderRadius: '999px',
        cursor: 'pointer',
        fontSize: '14px',
        fontWeight: '600',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    },
}
