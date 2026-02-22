import { Pool } from 'pg'

const pool = new Pool({
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'price_management',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
})

async function initDatabase() {
  const client = await pool.connect()
  try {
    console.log('开始初始化数据库...')

    await client.query('BEGIN')

    console.log('创建角色表...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS roles (
        id SERIAL PRIMARY KEY,
        name VARCHAR(50) UNIQUE NOT NULL,
        display_name VARCHAR(100) NOT NULL,
        description TEXT,
        permissions JSONB NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('创建用户表...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(50) UNIQUE NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        full_name VARCHAR(100),
        phone VARCHAR(20),
        avatar_url VARCHAR(255),
        status VARCHAR(20) DEFAULT 'active',
        role_id INTEGER REFERENCES roles(id),
        last_login_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('创建会话表...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS user_sessions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(500) UNIQUE NOT NULL,
        refresh_token VARCHAR(500) UNIQUE,
        ip_address VARCHAR(45),
        user_agent TEXT,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('创建登录日志表...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS login_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        ip_address VARCHAR(45),
        user_agent TEXT,
        login_status VARCHAR(20) NOT NULL,
        failure_reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('创建密码重置表...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS password_resets (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        used_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('创建审计日志表...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS audit_logs (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        action VARCHAR(50) NOT NULL,
        resource_type VARCHAR(50) NOT NULL,
        resource_id INTEGER,
        resource_name VARCHAR(255),
        changes JSONB,
        ip_address VARCHAR(45),
        user_agent TEXT,
        status VARCHAR(20) DEFAULT 'success',
        error_message TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('创建数据快照表...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS data_snapshots (
        id SERIAL PRIMARY KEY,
        resource_type VARCHAR(50) NOT NULL,
        resource_id INTEGER NOT NULL,
        version INTEGER NOT NULL,
        data JSONB NOT NULL,
        created_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (resource_type, resource_id, version)
      )
    `)

    console.log('创建操作历史表...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS operation_history (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        operation_type VARCHAR(50) NOT NULL,
        description TEXT,
        metadata JSONB,
        duration_ms INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('创建团队表...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS teams (
        id SERIAL PRIMARY KEY,
        name VARCHAR(100) NOT NULL,
        description TEXT,
        owner_id INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('创建团队成员表...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_members (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        role VARCHAR(50) NOT NULL,
        joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (team_id, user_id)
      )
    `)

    console.log('创建团队资源表...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS team_resources (
        id SERIAL PRIMARY KEY,
        team_id INTEGER REFERENCES teams(id) ON DELETE CASCADE,
        resource_type VARCHAR(50) NOT NULL,
        resource_id INTEGER NOT NULL,
        permission_level VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (team_id, resource_type, resource_id)
      )
    `)

    console.log('创建数据权限表...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS data_permissions (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        resource_type VARCHAR(50) NOT NULL,
        resource_id INTEGER NOT NULL,
        permission_level VARCHAR(20) NOT NULL,
        granted_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        UNIQUE (user_id, resource_type, resource_id)
      )
    `)

    console.log('创建备份日志表...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS backup_logs (
        id SERIAL PRIMARY KEY,
        type VARCHAR(20) NOT NULL,
        filename VARCHAR(255) NOT NULL,
        size BIGINT,
        status VARCHAR(20) NOT NULL,
        error_message TEXT,
        cloud_url VARCHAR(500),
        cloud_uploaded_at TIMESTAMP,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('创建恢复日志表...')
    await client.query(`
      CREATE TABLE IF NOT EXISTS restore_logs (
        id SERIAL PRIMARY KEY,
        backup_file VARCHAR(255) NOT NULL,
        status VARCHAR(20) NOT NULL,
        error_message TEXT,
        restored_by INTEGER REFERENCES users(id),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `)

    console.log('创建索引...')
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_status ON users(status)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_users_role ON users(role_id)')
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(token)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at)')
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_login_logs_user ON login_logs(user_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_login_logs_status ON login_logs(login_status)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_login_logs_timestamp ON login_logs(created_at DESC)')
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_password_resets_token ON password_resets(token)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_password_resets_user ON password_resets(user_id)')
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON audit_logs(user_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp ON audit_logs(created_at DESC)')
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_snapshots_resource ON data_snapshots(resource_type, resource_id)')
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_operation_history_user ON operation_history(user_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_operation_history_type ON operation_history(operation_type)')
    
    await client.query('CREATE INDEX IF NOT EXISTS idx_teams_owner ON teams(owner_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_team_members_team ON team_members(team_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_team_members_user ON team_members(user_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_team_resources_team ON team_resources(team_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_data_permissions_user ON data_permissions(user_id)')
    await client.query('CREATE INDEX IF NOT EXISTS idx_data_permissions_resource ON data_permissions(resource_type, resource_id)')

    console.log('插入默认角色...')
    const roleCheck = await client.query('SELECT COUNT(*) FROM roles')
    if (parseInt(roleCheck.rows[0].count) === 0) {
      await client.query(`
        INSERT INTO roles (name, display_name, description, permissions) VALUES
        ('admin', '管理员', '拥有所有权限', '["*"]'::jsonb),
        ('manager', '经理', '可以管理产品和报价', '["products:*", "quotes:*", "customers:*"]'::jsonb),
        ('editor', '编辑', '可以编辑产品和报价', '["products:read", "products:write", "quotes:read", "quotes:write"]'::jsonb),
        ('viewer', '查看者', '只能查看数据', '["products:read", "quotes:read", "customers:read"]'::jsonb)
      `)
      console.log('默认角色插入成功')
    }

    await client.query('COMMIT')
    console.log('数据库初始化完成！')
  } catch (error) {
    await client.query('ROLLBACK')
    console.error('数据库初始化失败:', error)
    throw error
  } finally {
    client.release()
    await pool.end()
  }
}

initDatabase().catch(console.error)
