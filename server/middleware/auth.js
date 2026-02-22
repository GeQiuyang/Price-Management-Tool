import jwt from 'jsonwebtoken'
import pool from '../config/database.js'
import redisClient from '../config/redis.js'

export const authenticate = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (!token) {
      return res.status(401).json({ 
        success: false,
        error: { 
          code: 'NO_TOKEN',
          message: '未提供认证令牌' 
        }
      })
    }
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    req.user = decoded
    
    const session = await pool.query(
      'SELECT * FROM user_sessions WHERE token = $1 AND expires_at > NOW()',
      [token]
    )
    
    if (!session.rows[0]) {
      return res.status(401).json({ 
        success: false,
        error: { 
          code: 'SESSION_EXPIRED',
          message: '会话已过期' 
        }
      })
    }
    
    next()
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(403).json({ 
        success: false,
        error: { 
          code: 'INVALID_TOKEN',
          message: '无效的认证令牌' 
        }
      })
    }
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        success: false,
        error: { 
          code: 'TOKEN_EXPIRED',
          message: '令牌已过期' 
        }
      })
    }
    return res.status(500).json({ 
      success: false,
      error: { 
        code: 'AUTH_ERROR',
        message: '认证失败' 
      }
    })
  }
}

export const authorize = (requiredPermissions) => {
  return async (req, res, next) => {
    const user = req.user
    
    if (user.role === 'admin') {
      return next()
    }
    
    const userRole = await pool.query(
      'SELECT permissions FROM roles WHERE id = $1',
      [user.role_id]
    )
    
    const permissions = userRole.rows[0]?.permissions || []
    const hasPermission = requiredPermissions.every(perm => 
      permissions.includes(perm) || permissions.includes('*')
    )
    
    if (!hasPermission) {
      return res.status(403).json({ 
        success: false,
        error: { 
          code: 'INSUFFICIENT_PERMISSIONS',
          message: '权限不足' 
        }
      })
    }
    
    next()
  }
}

export const checkDataPermission = (resourceType, requiredLevel) => {
  return async (req, res, next) => {
    const user = req.user
    const resourceId = req.params.id || req.body.id
    
    if (user.role === 'admin') {
      return next()
    }
    
    const permission = await pool.query(
      `SELECT permission_level FROM data_permissions 
       WHERE user_id = $1 AND resource_type = $2 AND resource_id = $3`,
      [user.id, resourceType, resourceId]
    )
    
    const levels = { read: 1, write: 2, delete: 3 }
    const currentLevel = permission.rows[0]?.permission_level
    
    if (!currentLevel || levels[currentLevel] < levels[requiredLevel]) {
      return res.status(403).json({ 
        success: false,
        error: { 
          code: 'NO_DATA_ACCESS',
          message: '无权访问此数据' 
        }
      })
    }
    
    next()
  }
}

export const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role,
      role_id: user.role_id,
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN }
  )
}

export const generateRefreshToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      type: 'refresh',
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES_IN }
  )
}

export const verifyRefreshToken = (token) => {
  return jwt.verify(token, process.env.JWT_SECRET)
}
