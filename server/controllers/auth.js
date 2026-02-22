import bcrypt from 'bcryptjs'
import pool from '../config/database.js'
import { generateToken, generateRefreshToken, verifyRefreshToken } from '../middleware/auth.js'

export const register = async (req, res) => {
  try {
    const { username, email, password, full_name, phone } = req.body
    
    const existingUser = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [username, email]
    )
    
    if (existingUser.rows.length > 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'USER_EXISTS',
          message: '用户名或邮箱已存在'
        }
      })
    }
    
    const password_hash = await bcrypt.hash(password, 10)
    
    const result = await pool.query(
      `INSERT INTO users (username, email, password_hash, full_name, phone, role_id)
       VALUES ($1, $2, $3, $4, $5, (SELECT id FROM roles WHERE name = 'viewer' LIMIT 1))
       RETURNING id, username, email, full_name, phone, role_id, created_at`,
      [username, email, password_hash, full_name, phone]
    )
    
    const user = result.rows[0]
    
    const roleResult = await pool.query(
      'SELECT * FROM roles WHERE id = $1',
      [user.role_id]
    )
    
    const token = generateToken({ ...user, role: roleResult.rows[0].name })
    const refreshToken = generateRefreshToken(user)
    
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    
    await pool.query(
      `INSERT INTO user_sessions (user_id, token, refresh_token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, token, refreshToken, req.ip, req.get('user-agent'), expiresAt]
    )
    
    res.status(201).json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          role: roleResult.rows[0]
        },
        token,
        refreshToken
      }
    })
  } catch (error) {
    console.error('注册失败:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'REGISTRATION_FAILED',
        message: '注册失败'
      }
    })
  }
}

export const login = async (req, res) => {
  try {
    const { username, password } = req.body
    
    const result = await pool.query(
      `SELECT u.*, r.name as role_name, r.permissions
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.username = $1 OR u.email = $1`,
      [username]
    )
    
    if (result.rows.length === 0) {
      await pool.query(
        `INSERT INTO login_logs (user_id, ip_address, user_agent, login_status, failure_reason)
         VALUES (NULL, $1, $2, 'failed', '用户不存在')`,
        [req.ip, req.get('user-agent')]
      )
      
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '用户名或密码错误'
        }
      })
    }
    
    const user = result.rows[0]
    
    const isValidPassword = await bcrypt.compare(password, user.password_hash)
    
    if (!isValidPassword) {
      await pool.query(
        `INSERT INTO login_logs (user_id, ip_address, user_agent, login_status, failure_reason)
         VALUES ($1, $2, $3, 'failed', '密码错误')`,
        [user.id, req.ip, req.get('user-agent')]
      )
      
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_CREDENTIALS',
          message: '用户名或密码错误'
        }
      })
    }
    
    if (user.status !== 'active') {
      return res.status(403).json({
        success: false,
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: '账户已被禁用'
        }
      })
    }
    
    const token = generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role_name,
      role_id: user.role_id
    })
    
    const refreshToken = generateRefreshToken({ id: user.id })
    
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    
    await pool.query(
      `INSERT INTO user_sessions (user_id, token, refresh_token, ip_address, user_agent, expires_at)
       VALUES ($1, $2, $3, $4, $5, $6)`,
      [user.id, token, refreshToken, req.ip, req.get('user-agent'), expiresAt]
    )
    
    await pool.query(
      `UPDATE users SET last_login_at = NOW() WHERE id = $1`,
      [user.id]
    )
    
    await pool.query(
      `INSERT INTO login_logs (user_id, ip_address, user_agent, login_status)
       VALUES ($1, $2, $3, 'success')`,
      [user.id, req.ip, req.get('user-agent')]
    )
    
    res.json({
      success: true,
      data: {
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          full_name: user.full_name,
          phone: user.phone,
          avatar_url: user.avatar_url,
          role: {
            id: user.role_id,
            name: user.role_name,
            permissions: user.permissions
          }
        },
        token,
        refreshToken
      }
    })
  } catch (error) {
    console.error('登录失败:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGIN_FAILED',
        message: '登录失败'
      }
    })
  }
}

export const logout = async (req, res) => {
  try {
    const token = req.headers.authorization?.replace('Bearer ', '')
    
    if (token) {
      await pool.query(
        'DELETE FROM user_sessions WHERE token = $1',
        [token]
      )
    }
    
    res.json({
      success: true,
      message: '登出成功'
    })
  } catch (error) {
    console.error('登出失败:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'LOGOUT_FAILED',
        message: '登出失败'
      }
    })
  }
}

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body
    
    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'NO_REFRESH_TOKEN',
          message: '未提供刷新令牌'
        }
      })
    }
    
    const decoded = verifyRefreshToken(refreshToken)
    
    const session = await pool.query(
      `SELECT us.*, u.username, u.email, u.role_id, r.name as role_name, r.permissions
       FROM user_sessions us
       JOIN users u ON us.user_id = u.id
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE us.refresh_token = $1 AND us.expires_at > NOW()`,
      [refreshToken]
    )
    
    if (!session.rows[0]) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_REFRESH_TOKEN',
          message: '无效的刷新令牌'
        }
      })
    }
    
    const user = session.rows[0]
    
    const newToken = generateToken({
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role_name,
      role_id: user.role_id
    })
    
    const newRefreshToken = generateRefreshToken({ id: user.id })
    
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    
    await pool.query(
      `UPDATE user_sessions 
       SET token = $1, refresh_token = $2, expires_at = $3 
       WHERE id = $4`,
      [newToken, newRefreshToken, expiresAt, user.id]
    )
    
    res.json({
      success: true,
      data: {
        token: newToken,
        refreshToken: newRefreshToken
      }
    })
  } catch (error) {
    console.error('刷新令牌失败:', error)
    res.status(401).json({
      success: false,
      error: {
        code: 'REFRESH_FAILED',
        message: '刷新令牌失败'
      }
    })
  }
}

export const getMe = async (req, res) => {
  try {
    const user = req.user
    
    const result = await pool.query(
      `SELECT u.*, r.name as role_name, r.permissions
       FROM users u
       LEFT JOIN roles r ON u.role_id = r.id
       WHERE u.id = $1`,
      [user.id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '用户不存在'
        }
      })
    }
    
    const userData = result.rows[0]
    
    res.json({
      success: true,
      data: {
        user: {
          id: userData.id,
          username: userData.username,
          email: userData.email,
          full_name: userData.full_name,
          phone: userData.phone,
          avatar_url: userData.avatar_url,
          role: {
            id: userData.role_id,
            name: userData.role_name,
            permissions: userData.permissions
          },
          last_login_at: userData.last_login_at,
          created_at: userData.created_at
        }
      }
    })
  } catch (error) {
    console.error('获取用户信息失败:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_USER_FAILED',
        message: '获取用户信息失败'
      }
    })
  }
}

export const changePassword = async (req, res) => {
  try {
    const { oldPassword, newPassword } = req.body
    const user = req.user
    
    const result = await pool.query(
      'SELECT password_hash FROM users WHERE id = $1',
      [user.id]
    )
    
    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'USER_NOT_FOUND',
          message: '用户不存在'
        }
      })
    }
    
    const isValidPassword = await bcrypt.compare(oldPassword, result.rows[0].password_hash)
    
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: {
          code: 'INVALID_PASSWORD',
          message: '原密码错误'
        }
      })
    }
    
    const password_hash = await bcrypt.hash(newPassword, 10)
    
    await pool.query(
      'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
      [password_hash, user.id]
    )
    
    res.json({
      success: true,
      message: '密码修改成功'
    })
  } catch (error) {
    console.error('修改密码失败:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'CHANGE_PASSWORD_FAILED',
        message: '修改密码失败'
      }
    })
  }
}

export const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body
    
    const result = await pool.query(
      'SELECT id, username FROM users WHERE email = $1',
      [email]
    )
    
    if (result.rows.length === 0) {
      return res.json({
        success: true,
        message: '如果邮箱存在，重置链接已发送'
      })
    }
    
    const user = result.rows[0]
    const crypto = await import('crypto')
    const token = crypto.randomBytes(32).toString('hex')
    const expiresAt = new Date(Date.now() + 3600000)
    
    await pool.query(
      `INSERT INTO password_resets (user_id, token, expires_at)
       VALUES ($1, $2, $3)`,
      [user.id, token, expiresAt]
    )
    
    console.log(`密码重置链接: http://localhost:5173/reset-password?token=${token}`)
    
    res.json({
      success: true,
      message: '重置链接已发送到邮箱'
    })
  } catch (error) {
    console.error('请求密码重置失败:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'FORGOT_PASSWORD_FAILED',
        message: '请求密码重置失败'
      }
    })
  }
}

export const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body
    
    const result = await pool.query(
      `SELECT pr.*, u.id as user_id
       FROM password_resets pr
       JOIN users u ON pr.user_id = u.id
       WHERE pr.token = $1 AND pr.expires_at > NOW() AND pr.used_at IS NULL`,
      [token]
    )
    
    if (result.rows.length === 0) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_TOKEN',
          message: '无效或已过期的重置令牌'
        }
      })
    }
    
    const password_hash = await bcrypt.hash(newPassword, 10)
    
    await pool.query('BEGIN')
    
    try {
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2',
        [password_hash, result.rows[0].user_id]
      )
      
      await pool.query(
        'UPDATE password_resets SET used_at = NOW() WHERE token = $1',
        [token]
      )
      
      await pool.query('COMMIT')
      
      res.json({
        success: true,
        message: '密码重置成功'
      })
    } catch (error) {
      await pool.query('ROLLBACK')
      throw error
    }
  } catch (error) {
    console.error('重置密码失败:', error)
    res.status(500).json({
      success: false,
      error: {
        code: 'RESET_PASSWORD_FAILED',
        message: '重置密码失败'
      }
    })
  }
}
