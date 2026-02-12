import express from 'express'
import cors from 'cors'
import initSqlJs from 'sql.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = 3001

app.use(cors())
app.use(express.json())

const dbPath = join(__dirname, 'database.db')

let db

async function initDB() {
  const SQL = await initSqlJs()
  
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath)
    db = new SQL.Database(fileBuffer)
  } else {
    db = new SQL.Database()
  }
  
  db.run(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      sku TEXT UNIQUE NOT NULL,
      price REAL NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  db.run(`
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      discount REAL DEFAULT 0,
      description TEXT,
      customer_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  db.run(`
    CREATE TABLE IF NOT EXISTS currencies (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      symbol TEXT NOT NULL,
      exchange_rate REAL NOT NULL,
      is_default INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  db.run(`
    CREATE TABLE IF NOT EXISTS costs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER,
      cost_type TEXT NOT NULL,
      amount REAL NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  db.run(`
    CREATE TABLE IF NOT EXISTS taxes_units (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      value REAL NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)
  
  db.run(`
    CREATE TABLE IF NOT EXISTS markets_channels (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      type TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  const initProducts = db.exec('SELECT COUNT(*) as count FROM products')
  if (initProducts[0]?.values[0]?.[0] === 0) {
    const defaultProducts = [
      ['300尖丝导管3米长3毫米厚', '导管类', '300JSDG3030', 358, '300尖丝导管，长度3米，厚度3毫米', 'active'],
      ['300尖丝导管0.5米长3毫米厚', '导管类', '300JSDG0530', 143, '300尖丝导管，长度0.5米，厚度3毫米', 'active'],
      ['300尖丝导管1米长3毫米厚', '导管类', '300JSDG1030', 245, '300尖丝导管，长度1米，厚度3毫米', 'active'],
      ['300尖丝导管1.5米长3毫米厚', '导管类', '300JSDG1530', 278, '300尖丝导管，长度1.5米，厚度3毫米', 'active'],
      ['300尖丝导管4米长3毫米厚', '导管类', '300JSDG4030', 398, '300尖丝导管，长度4米，厚度3毫米', 'active'],
    ]
    
    defaultProducts.forEach(p => {
      db.run('INSERT INTO products (name, category, sku, price, description, status) VALUES (?, ?, ?, ?, ?, ?)', p)
    })
  }

  const initCurrencies = db.exec('SELECT COUNT(*) as count FROM currencies')
  if (initCurrencies[0]?.values[0]?.[0] === 0) {
    const defaultCurrencies = [
      ['CNY', '人民币', '¥', 1.00, 1],
      ['USD', '美元', '$', 0.14, 0],
      ['EUR', '欧元', '€', 0.13, 0],
      ['VND', '越南盾', '₫', 3450.00, 0],
    ]
    
    defaultCurrencies.forEach(c => {
      db.run('INSERT INTO currencies (code, name, symbol, exchange_rate, is_default) VALUES (?, ?, ?, ?, ?)', c)
    })
  }

  const initCustomers = db.exec('SELECT COUNT(*) as count FROM customers')
  if (initCustomers[0]?.values[0]?.[0] === 0) {
    const defaultCustomers = [
      ['VIP客户', 15, '高价值客户，享受15%折扣', 45],
      ['企业客户', 10, '企业采购客户，享受10%折扣', 128],
      ['普通客户', 0, '标准定价客户', 1250],
      ['新客户', 5, '首次购买客户，享受5%折扣', 89],
    ]
    
    defaultCustomers.forEach(c => {
      db.run('INSERT INTO customers (name, discount, description, customer_count) VALUES (?, ?, ?, ?)', c)
    })
  }
  
  saveDB()
}

function saveDB() {
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(dbPath, buffer)
}

function queryAll(sql, params = []) {
  const stmt = db.prepare(sql)
  if (params.length > 0) {
    stmt.bind(params)
  }
  
  const results = []
  while (stmt.step()) {
    const row = stmt.getAsObject()
    results.push(row)
  }
  stmt.free()
  return results
}

function queryOne(sql, params = []) {
  const results = queryAll(sql, params)
  return results.length > 0 ? results[0] : null
}

function runSQL(sql, params = []) {
  db.run(sql, params)
  saveDB()
  return { lastInsertRowid: db.exec('SELECT last_insert_rowid()')[0].values[0][0] }
}

app.get('/api/products', (req, res) => {
  const products = queryAll('SELECT * FROM products ORDER BY id DESC')
  res.json(products)
})

app.get('/api/products/:id', (req, res) => {
  const product = queryOne('SELECT * FROM products WHERE id = ?', [req.params.id])
  if (!product) {
    return res.status(404).json({ error: '产品不存在' })
  }
  res.json(product)
})

app.post('/api/products', (req, res) => {
  const { name, category, sku, price, description, status } = req.body
  
  try {
    const result = runSQL(
      'INSERT INTO products (name, category, sku, price, description, status) VALUES (?, ?, ?, ?, ?, ?)',
      [name, category, sku, price, description, status || 'active']
    )
    
    const newProduct = queryOne('SELECT * FROM products WHERE id = ?', [result.lastInsertRowid])
    res.status(201).json(newProduct)
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'SKU已存在' })
    }
    res.status(500).json({ error: '创建产品失败' })
  }
})

app.put('/api/products/:id', (req, res) => {
  const { name, category, sku, price, description, status } = req.body
  
  try {
    db.run(
      'UPDATE products SET name = ?, category = ?, sku = ?, price = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, category, sku, price, description, status, req.params.id]
    )
    saveDB()
    
    const updatedProduct = queryOne('SELECT * FROM products WHERE id = ?', [req.params.id])
    if (!updatedProduct) {
      return res.status(404).json({ error: '产品不存在' })
    }
    
    res.json(updatedProduct)
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: 'SKU已存在' })
    }
    res.status(500).json({ error: '更新产品失败' })
  }
})

app.delete('/api/products/:id', (req, res) => {
  const product = queryOne('SELECT * FROM products WHERE id = ?', [req.params.id])
  
  if (!product) {
    return res.status(404).json({ error: '产品不存在' })
  }
  
  db.run('DELETE FROM products WHERE id = ?', [req.params.id])
  saveDB()
  
  res.json({ message: '删除成功' })
})

app.get('/api/customers', (req, res) => {
  const customers = queryAll('SELECT * FROM customers ORDER BY id DESC')
  res.json(customers)
})

app.post('/api/customers', (req, res) => {
  const { name, discount, description, customer_count } = req.body
  
  try {
    const result = runSQL(
      'INSERT INTO customers (name, discount, description, customer_count) VALUES (?, ?, ?, ?)',
      [name, discount, description, customer_count || 0]
    )
    
    const newCustomer = queryOne('SELECT * FROM customers WHERE id = ?', [result.lastInsertRowid])
    res.status(201).json(newCustomer)
  } catch (error) {
    res.status(500).json({ error: '创建客户分段失败' })
  }
})

app.put('/api/customers/:id', (req, res) => {
  const { name, discount, description, customer_count } = req.body
  
  try {
    db.run(
      'UPDATE customers SET name = ?, discount = ?, description = ?, customer_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [name, discount, description, customer_count, req.params.id]
    )
    saveDB()
    
    const updatedCustomer = queryOne('SELECT * FROM customers WHERE id = ?', [req.params.id])
    if (!updatedCustomer) {
      return res.status(404).json({ error: '客户分段不存在' })
    }
    
    res.json(updatedCustomer)
  } catch (error) {
    res.status(500).json({ error: '更新客户分段失败' })
  }
})

app.delete('/api/customers/:id', (req, res) => {
  const customer = queryOne('SELECT * FROM customers WHERE id = ?', [req.params.id])
  
  if (!customer) {
    return res.status(404).json({ error: '客户分段不存在' })
  }
  
  db.run('DELETE FROM customers WHERE id = ?', [req.params.id])
  saveDB()
  
  res.json({ message: '删除成功' })
})

app.get('/api/currencies', (req, res) => {
  const currencies = queryAll('SELECT * FROM currencies ORDER BY is_default DESC, id DESC')
  res.json(currencies)
})

app.post('/api/currencies', (req, res) => {
  const { code, name, symbol, exchange_rate, is_default } = req.body
  
  try {
    if (is_default) {
      db.run('UPDATE currencies SET is_default = 0')
    }
    
    const result = runSQL(
      'INSERT INTO currencies (code, name, symbol, exchange_rate, is_default) VALUES (?, ?, ?, ?, ?)',
      [code, name, symbol, exchange_rate, is_default ? 1 : 0]
    )
    
    const newCurrency = queryOne('SELECT * FROM currencies WHERE id = ?', [result.lastInsertRowid])
    res.status(201).json(newCurrency)
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: '货币代码已存在' })
    }
    res.status(500).json({ error: '创建货币失败' })
  }
})

app.put('/api/currencies/:id', (req, res) => {
  const { code, name, symbol, exchange_rate, is_default } = req.body
  
  try {
    if (is_default) {
      db.run('UPDATE currencies SET is_default = 0')
    }
    
    db.run(
      'UPDATE currencies SET code = ?, name = ?, symbol = ?, exchange_rate = ?, is_default = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [code, name, symbol, exchange_rate, is_default ? 1 : 0, req.params.id]
    )
    saveDB()
    
    const updatedCurrency = queryOne('SELECT * FROM currencies WHERE id = ?', [req.params.id])
    if (!updatedCurrency) {
      return res.status(404).json({ error: '货币不存在' })
    }
    
    res.json(updatedCurrency)
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: '货币代码已存在' })
    }
    res.status(500).json({ error: '更新货币失败' })
  }
})

app.delete('/api/currencies/:id', (req, res) => {
  const currency = queryOne('SELECT * FROM currencies WHERE id = ?', [req.params.id])
  
  if (!currency) {
    return res.status(404).json({ error: '货币不存在' })
  }
  
  db.run('DELETE FROM currencies WHERE id = ?', [req.params.id])
  saveDB()
  
  res.json({ message: '删除成功' })
})

app.get('/api/costs', (req, res) => {
  const costs = queryAll('SELECT * FROM costs ORDER BY id DESC')
  res.json(costs)
})

app.post('/api/costs', (req, res) => {
  const { product_id, cost_type, amount, description } = req.body
  
  try {
    const result = runSQL(
      'INSERT INTO costs (product_id, cost_type, amount, description) VALUES (?, ?, ?, ?)',
      [product_id, cost_type, amount, description]
    )
    
    const newCost = queryOne('SELECT * FROM costs WHERE id = ?', [result.lastInsertRowid])
    res.status(201).json(newCost)
  } catch (error) {
    res.status(500).json({ error: '创建成本失败' })
  }
})

app.put('/api/costs/:id', (req, res) => {
  const { product_id, cost_type, amount, description } = req.body
  
  try {
    db.run(
      'UPDATE costs SET product_id = ?, cost_type = ?, amount = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [product_id, cost_type, amount, description, req.params.id]
    )
    saveDB()
    
    const updatedCost = queryOne('SELECT * FROM costs WHERE id = ?', [req.params.id])
    if (!updatedCost) {
      return res.status(404).json({ error: '成本不存在' })
    }
    
    res.json(updatedCost)
  } catch (error) {
    res.status(500).json({ error: '更新成本失败' })
  }
})

app.delete('/api/costs/:id', (req, res) => {
  const cost = queryOne('SELECT * FROM costs WHERE id = ?', [req.params.id])
  
  if (!cost) {
    return res.status(404).json({ error: '成本不存在' })
  }
  
  db.run('DELETE FROM costs WHERE id = ?', [req.params.id])
  saveDB()
  
  res.json({ message: '删除成功' })
})

app.get('/api/taxes-units', (req, res) => {
  const taxesUnits = queryAll('SELECT * FROM taxes_units ORDER BY id DESC')
  res.json(taxesUnits)
})

app.post('/api/taxes-units', (req, res) => {
  const { type, name, value, description } = req.body
  
  try {
    const result = runSQL(
      'INSERT INTO taxes_units (type, name, value, description) VALUES (?, ?, ?, ?)',
      [type, name, value, description]
    )
    
    const newItem = queryOne('SELECT * FROM taxes_units WHERE id = ?', [result.lastInsertRowid])
    res.status(201).json(newItem)
  } catch (error) {
    res.status(500).json({ error: '创建失败' })
  }
})

app.put('/api/taxes-units/:id', (req, res) => {
  const { type, name, value, description } = req.body
  
  try {
    db.run(
      'UPDATE taxes_units SET type = ?, name = ?, value = ?, description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [type, name, value, description, req.params.id]
    )
    saveDB()
    
    const updatedItem = queryOne('SELECT * FROM taxes_units WHERE id = ?', [req.params.id])
    if (!updatedItem) {
      return res.status(404).json({ error: '记录不存在' })
    }
    
    res.json(updatedItem)
  } catch (error) {
    res.status(500).json({ error: '更新失败' })
  }
})

app.delete('/api/taxes-units/:id', (req, res) => {
  const item = queryOne('SELECT * FROM taxes_units WHERE id = ?', [req.params.id])
  
  if (!item) {
    return res.status(404).json({ error: '记录不存在' })
  }
  
  db.run('DELETE FROM taxes_units WHERE id = ?', [req.params.id])
  saveDB()
  
  res.json({ message: '删除成功' })
})

app.get('/api/markets-channels', (req, res) => {
  const marketsChannels = queryAll('SELECT * FROM markets_channels ORDER BY id DESC')
  res.json(marketsChannels)
})

app.post('/api/markets-channels', (req, res) => {
  const { type, name, description, status } = req.body
  
  try {
    const result = runSQL(
      'INSERT INTO markets_channels (type, name, description, status) VALUES (?, ?, ?, ?)',
      [type, name, description, status || 'active']
    )
    
    const newItem = queryOne('SELECT * FROM markets_channels WHERE id = ?', [result.lastInsertRowid])
    res.status(201).json(newItem)
  } catch (error) {
    res.status(500).json({ error: '创建失败' })
  }
})

app.put('/api/markets-channels/:id', (req, res) => {
  const { type, name, description, status } = req.body
  
  try {
    db.run(
      'UPDATE markets_channels SET type = ?, name = ?, description = ?, status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [type, name, description, status, req.params.id]
    )
    saveDB()
    
    const updatedItem = queryOne('SELECT * FROM markets_channels WHERE id = ?', [req.params.id])
    if (!updatedItem) {
      return res.status(404).json({ error: '记录不存在' })
    }
    
    res.json(updatedItem)
  } catch (error) {
    res.status(500).json({ error: '更新失败' })
  }
})

app.delete('/api/markets-channels/:id', (req, res) => {
  const item = queryOne('SELECT * FROM markets_channels WHERE id = ?', [req.params.id])
  
  if (!item) {
    return res.status(404).json({ error: '记录不存在' })
  }
  
  db.run('DELETE FROM markets_channels WHERE id = ?', [req.params.id])
  saveDB()
  
  res.json({ message: '删除成功' })
})

initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}).catch(err => {
  console.error('Failed to initialize database:', err)
  process.exit(1)
})

process.on('SIGINT', () => {
  if (db) {
    saveDB()
  }
  process.exit()
})
