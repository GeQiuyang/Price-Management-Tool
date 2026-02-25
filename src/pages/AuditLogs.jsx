import { useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import './AuditLogs.css'

function AuditLogs() {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [pagination, setPagination] = useState({ page: 1, limit: 20, total: 0, pages: 0 })
  const [filters, setFilters] = useState({ entity_type: '', action: '', user_id: '' })
  const [selectedLog, setSelectedLog] = useState(null)
  const [showDetail, setShowDetail] = useState(false)

  const token = localStorage.getItem('token')

  useEffect(() => {
    fetchLogs()
  }, [pagination.page, filters])

  const fetchLogs = async () => {
    setLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: pagination.page,
        limit: pagination.limit,
        ...filters
      })

      const response = await fetch(`http://localhost:3001/api/audit-logs?${queryParams}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setLogs(data.data.logs)
        setPagination(data.data.pagination)
      }
    } catch (error) {
      console.error('获取审计日志失败:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value })
    setPagination({ ...pagination, page: 1 })
  }

  const handlePageChange = (newPage) => {
    setPagination({ ...pagination, page: newPage })
  }

  const handleViewDetail = async (logId) => {
    try {
      const response = await fetch(`http://localhost:3001/api/audit-logs/${logId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      const data = await response.json()
      if (data.success) {
        setSelectedLog(data.data.log)
        setShowDetail(true)
      }
    } catch (error) {
      console.error('获取日志详情失败:', error)
    }
  }

  const getActionBadge = (action) => {
    const badges = {
      'create': { color: '#10B981', text: '创建' },
      'update': { color: '#3B82F6', text: '更新' },
      'delete': { color: '#EF4444', text: '删除' },
      'backup': { color: '#8B5CF6', text: '备份' },
      'restore': { color: '#F59E0B', text: '恢复' },
      'snapshot': { color: '#EC4899', text: '快照' },
      'restore_snapshot': { color: '#F59E0B', text: '恢复快照' },
      'delete_snapshot': { color: '#EF4444', text: '删除快照' }
    }
    const badge = badges[action] || { color: '#6B7280', text: action }
    return (
      <span style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '999px',
        fontSize: '11px',
        fontWeight: '600',
        backgroundColor: `${badge.color}20`,
        color: badge.color
      }}>
        {badge.text}
      </span>
    )
  }

  const formatData = (data) => {
    if (!data) return '无'
    try {
      const parsed = typeof data === 'string' ? JSON.parse(data) : data
      return JSON.stringify(parsed, null, 2)
    } catch {
      return data
    }
  }

  if (loading && logs.length === 0) {
    return (
      <div className="audit-logs-container">
        <div className="loading-state">加载中...</div>
      </div>
    )
  }

  return (
    <div className="audit-logs-container">
      <div className="page-header">
        <h1>审计日志</h1>
        <p>查看系统所有操作记录</p>
      </div>

      <div className="filters-section">
        <div className="filter-group">
          <label>实体类型</label>
          <select
            name="entity_type"
            value={filters.entity_type}
            onChange={handleFilterChange}
          >
            <option value="">全部</option>
            <option value="products">产品</option>
            <option value="customers">客户</option>
            <option value="currencies">货币</option>
            <option value="costs">成本</option>
            <option value="database">数据库</option>
            <option value="snapshot">快照</option>
          </select>
        </div>

        <div className="filter-group">
          <label>操作类型</label>
          <select
            name="action"
            value={filters.action}
            onChange={handleFilterChange}
          >
            <option value="">全部</option>
            <option value="create">创建</option>
            <option value="update">更新</option>
            <option value="delete">删除</option>
            <option value="backup">备份</option>
            <option value="restore">恢复</option>
            <option value="snapshot">快照</option>
          </select>
        </div>
      </div>

      <div className="logs-table">
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>操作</th>
              <th>实体类型</th>
              <th>用户</th>
              <th>IP地址</th>
              <th>时间</th>
              <th>操作</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id}>
                <td>{log.id}</td>
                <td>{getActionBadge(log.action)}</td>
                <td>{log.entity_type}</td>
                <td>
                  <div className="user-info">
                    <span className="user-name">{log.full_name || log.username}</span>
                  </div>
                </td>
                <td>{log.ip_address || '-'}</td>
                <td>{new Date(log.created_at).toLocaleString('zh-CN')}</td>
                <td>
                  <button
                    className="view-detail-btn"
                    onClick={() => handleViewDetail(log.id)}
                  >
                    查看详情
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="pagination">
          <button
            onClick={() => handlePageChange(pagination.page - 1)}
            disabled={pagination.page === 1}
          >
            上一页
          </button>
          <span className="page-info">
            第 {pagination.page} 页 / 共 {pagination.pages} 页
          </span>
          <button
            onClick={() => handlePageChange(pagination.page + 1)}
            disabled={pagination.page === pagination.pages}
          >
            下一页
          </button>
        </div>
      )}

      {showDetail && selectedLog && createPortal(
        <div className="modal-overlay" onClick={() => setShowDetail(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>审计日志详情</h2>
              <button className="close-btn" onClick={() => setShowDetail(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="detail-row">
                <label>ID:</label>
                <span>{selectedLog.id}</span>
              </div>
              <div className="detail-row">
                <label>操作:</label>
                <span>{getActionBadge(selectedLog.action)}</span>
              </div>
              <div className="detail-row">
                <label>实体类型:</label>
                <span>{selectedLog.entity_type}</span>
              </div>
              <div className="detail-row">
                <label>实体ID:</label>
                <span>{selectedLog.entity_id || '-'}</span>
              </div>
              <div className="detail-row">
                <label>用户:</label>
                <span>{selectedLog.full_name || selectedLog.username}</span>
              </div>
              <div className="detail-row">
                <label>IP地址:</label>
                <span>{selectedLog.ip_address || '-'}</span>
              </div>
              <div className="detail-row">
                <label>时间:</label>
                <span>{new Date(selectedLog.created_at).toLocaleString('zh-CN')}</span>
              </div>
              {selectedLog.old_data && (
                <div className="detail-section">
                  <label>旧数据:</label>
                  <pre>{formatData(selectedLog.old_data)}</pre>
                </div>
              )}
              {selectedLog.new_data && (
                <div className="detail-section">
                  <label>新数据:</label>
                  <pre>{formatData(selectedLog.new_data)}</pre>
                </div>
              )}
              {selectedLog.user_agent && (
                <div className="detail-section">
                  <label>User Agent:</label>
                  <pre>{selectedLog.user_agent}</pre>
                </div>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

export default AuditLogs
