import { useState, useEffect } from 'react'
import './BackupRestore.css'

function BackupRestore() {
  const [activeTab, setActiveTab] = useState('backups')
  const [backups, setBackups] = useState([])
  const [snapshots, setSnapshots] = useState([])
  const [loading, setLoading] = useState(false)
  const [snapshotName, setSnapshotName] = useState('')
  const [showRestoreConfirm, setShowRestoreConfirm] = useState(false)
  const [selectedBackup, setSelectedBackup] = useState(null)
  const [message, setMessage] = useState({ type: '', text: '' })

  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchBackups()
    fetchSnapshots()
  }, [])

  const fetchBackups = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/backups', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setBackups(data.data.backups)
      }
    } catch (error) {
      console.error('获取备份列表失败:', error)
    }
  }

  const fetchSnapshots = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/snapshots', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setSnapshots(data.data.snapshots)
      }
    } catch (error) {
      console.error('获取快照列表失败:', error)
    }
  }

  const handleCreateBackup = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/backup/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: '备份创建成功！' })
        fetchBackups()
      } else {
        setMessage({ type: 'error', text: data.error || '备份创建失败' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  const handleRestoreBackup = async () => {
    setLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/backup/restore', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ backup_path: selectedBackup.backup_path })
      })

      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: '数据恢复成功！' })
        setShowRestoreConfirm(false)
        setSelectedBackup(null)
      } else {
        setMessage({ type: 'error', text: data.error || '数据恢复失败' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  const handleCreateSnapshot = async () => {
    if (!snapshotName.trim()) {
      setMessage({ type: 'error', text: '请输入快照名称' })
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
      return
    }

    setLoading(true)
    try {
      const response = await fetch('http://localhost:3001/api/snapshots/create', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ snapshot_name: snapshotName })
      })

      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: '快照创建成功！' })
        setSnapshotName('')
        fetchSnapshots()
      } else {
        setMessage({ type: 'error', text: data.error || '快照创建失败' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  const handleRestoreSnapshot = async (snapshotId) => {
    if (!confirm('确定要恢复此快照吗？此操作将覆盖当前数据！')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`http://localhost:3001/api/snapshots/${snapshotId}/restore`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: '快照恢复成功！' })
      } else {
        setMessage({ type: 'error', text: data.error || '快照恢复失败' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  const handleDeleteSnapshot = async (snapshotId) => {
    if (!confirm('确定要删除此快照吗？')) {
      return
    }

    setLoading(true)
    try {
      const response = await fetch(`http://localhost:3001/api/snapshots/${snapshotId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setMessage({ type: 'success', text: '快照删除成功！' })
        fetchSnapshots()
      } else {
        setMessage({ type: 'error', text: data.error || '快照删除失败' })
      }
    } catch (error) {
      setMessage({ type: 'error', text: '网络错误，请稍后重试' })
    } finally {
      setLoading(false)
      setTimeout(() => setMessage({ type: '', text: '' }), 3000)
    }
  }

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 B'
    const k = 1024
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="backup-restore-container">
      <div className="page-header">
        <h1>备份与恢复</h1>
        <p>管理数据库备份和快照</p>
      </div>

      {message.text && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'backups' ? 'active' : ''}`}
          onClick={() => setActiveTab('backups')}
        >
          备份文件
        </button>
        <button
          className={`tab ${activeTab === 'snapshots' ? 'active' : ''}`}
          onClick={() => setActiveTab('snapshots')}
        >
          数据快照
        </button>
      </div>

      {activeTab === 'backups' && (
        <div className="tab-content">
          <div className="action-bar">
            <button
              className="create-btn"
              onClick={handleCreateBackup}
              disabled={loading}
            >
              {loading ? '创建中...' : '创建备份'}
            </button>
          </div>

          <div className="backups-list">
            {backups.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📦</div>
                <p>暂无备份文件</p>
              </div>
            ) : (
              backups.map((backup) => (
                <div key={backup.id} className="backup-item">
                  <div className="backup-info">
                    <div className="backup-name">
                      {backup.backup_path.split('/').pop()}
                    </div>
                    <div className="backup-meta">
                      <span className="meta-item">
                        📅 {new Date(backup.created_at).toLocaleString('zh-CN')}
                      </span>
                      <span className="meta-item">
                        📊 {formatFileSize(backup.file_size)}
                      </span>
                      <span className="meta-item">
                        👤 {backup.full_name || backup.username}
                      </span>
                    </div>
                  </div>
                  <div className="backup-actions">
                    <button
                      className="restore-btn"
                      onClick={() => {
                        setSelectedBackup(backup)
                        setShowRestoreConfirm(true)
                      }}
                    >
                      恢复
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {activeTab === 'snapshots' && (
        <div className="tab-content">
          <div className="create-snapshot-form">
            <input
              type="text"
              placeholder="输入快照名称..."
              value={snapshotName}
              onChange={(e) => setSnapshotName(e.target.value)}
              disabled={loading}
            />
            <button
              className="create-btn"
              onClick={handleCreateSnapshot}
              disabled={loading}
            >
              {loading ? '创建中...' : '创建快照'}
            </button>
          </div>

          <div className="snapshots-list">
            {snapshots.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📸</div>
                <p>暂无数据快照</p>
              </div>
            ) : (
              snapshots.map((snapshot) => (
                <div key={snapshot.id} className="snapshot-item">
                  <div className="snapshot-info">
                    <div className="snapshot-name">{snapshot.snapshot_name}</div>
                    <div className="snapshot-meta">
                      <span className="meta-item">
                        📅 {new Date(snapshot.created_at).toLocaleString('zh-CN')}
                      </span>
                      <span className="meta-item">
                        👤 {snapshot.full_name || snapshot.username}
                      </span>
                    </div>
                  </div>
                  <div className="snapshot-actions">
                    <button
                      className="restore-btn"
                      onClick={() => handleRestoreSnapshot(snapshot.id)}
                      disabled={loading}
                    >
                      恢复
                    </button>
                    <button
                      className="delete-btn"
                      onClick={() => handleDeleteSnapshot(snapshot.id)}
                      disabled={loading}
                    >
                      删除
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {showRestoreConfirm && selectedBackup && (
        <div className="modal-overlay" onClick={() => setShowRestoreConfirm(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>确认恢复备份</h2>
              <button className="close-btn" onClick={() => setShowRestoreConfirm(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="warning-box">
                <div className="warning-icon">⚠️</div>
                <div className="warning-text">
                  <p><strong>警告：此操作将覆盖当前所有数据！</strong></p>
                  <p>恢复后，当前的所有更改将丢失。</p>
                </div>
              </div>
              <div className="backup-detail">
                <p><strong>备份文件：</strong> {selectedBackup.backup_path.split('/').pop()}</p>
                <p><strong>文件大小：</strong> {formatFileSize(selectedBackup.file_size)}</p>
                <p><strong>创建时间：</strong> {new Date(selectedBackup.created_at).toLocaleString('zh-CN')}</p>
                <p><strong>创建者：</strong> {selectedBackup.full_name || selectedBackup.username}</p>
              </div>
              <div className="modal-actions">
                <button
                  className="cancel-btn"
                  onClick={() => setShowRestoreConfirm(false)}
                  disabled={loading}
                >
                  取消
                </button>
                <button
                  className="confirm-btn"
                  onClick={handleRestoreBackup}
                  disabled={loading}
                >
                  {loading ? '恢复中...' : '确认恢复'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default BackupRestore
