import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import initSqlJs from 'sql.js'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import fs from 'fs'
import { setupSecurity, errorHandler, notFoundHandler } from './middleware/security.js'
import { connectRedis } from './config/redis.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

dotenv.config()

const app = express()
const PORT = process.env.PORT || 3001

setupSecurity(app)

app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

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
      customer_type TEXT NOT NULL,
      country TEXT NOT NULL,
      city TEXT NOT NULL,
      contact TEXT,
      deal_count INTEGER DEFAULT 0,
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

  db.run(`
    CREATE TABLE IF NOT EXISTS recycle_bin (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      item_type TEXT NOT NULL,
      item_id INTEGER NOT NULL,
      item_data TEXT NOT NULL,
      deleted_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME NOT NULL
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS ports (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      country TEXT NOT NULL,
      type TEXT NOT NULL,
      is_active INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS freight_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      origin_port TEXT NOT NULL,
      destination_port TEXT NOT NULL,
      container_type TEXT NOT NULL,
      price REAL NOT NULL,
      currency TEXT DEFAULT 'USD',
      valid_from DATE,
      valid_to DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS cost_types (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      code TEXT UNIQUE NOT NULL,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      is_seller_responsibility INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS quote_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sku TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL,
      quantity INTEGER DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS quote_imported_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      sheet_name TEXT,
      data_json TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS system_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key TEXT UNIQUE NOT NULL,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `)

  const initCostTypes = db.exec('SELECT COUNT(*) as count FROM cost_types')
  if (initCostTypes[0]?.values[0]?.[0] === 0) {
    const defaultCostTypes = [
      ['packing', '打包费', 'local', 1],
      ['landFreight', '国内陆运费', 'local', 1],
      ['customsFee', '出口报关费', 'local', 1],
      ['portCharge', '港杂费', 'local', 1],
      ['oceanFreight', '海运费', 'ocean', 0],
      ['insurance', '保险费', 'related', 0],
      ['destinationFee', '目的港费用', 'related', 0],
    ]

    defaultCostTypes.forEach(c => {
      db.run('INSERT INTO cost_types (code, name, category, is_seller_responsibility) VALUES (?, ?, ?, ?)', c)
    })
  }

  const initPorts = db.exec('SELECT COUNT(*) as count FROM ports')
  if (initPorts[0]?.values[0]?.[0] === 0) {
    const defaultPorts = [
      ['SHA', '上海', '中国', 'origin'],
      ['NINGBO', '宁波', '中国', 'origin'],
      ['SHENZHEN', '深圳', '中国', 'origin'],
      ['QINGDAO', '青岛', '中国', 'origin'],
      ['LOSANGELES', '洛杉矶', '美国', 'destination'],
      ['NEWYORK', '纽约', '美国', 'destination'],
      ['HAMBURG', '汉堡', '德国', 'destination'],
      ['ROTTERDAM', '鹿特丹', '荷兰', 'destination'],
      ['YOKOHAMA', '横滨', '日本', 'destination'],
      ['HOCHIMINH', '胡志明', '越南', 'destination'],
    ]

    defaultPorts.forEach(p => {
      db.run('INSERT INTO ports (code, name, country, type) VALUES (?, ?, ?, ?)', p)
    })
  }

  const initFreightRates = db.exec('SELECT COUNT(*) as count FROM freight_rates')
  if (initFreightRates[0]?.values[0]?.[0] === 0) {
    const defaultRates = [
      ['SHA', 'LOSANGELES', '20GP', 1200],
      ['SHA', 'LOSANGELES', '40GP', 1800],
      ['SHA', 'LOSANGELES', '40HQ', 2000],
      ['SHA', 'NEWYORK', '20GP', 2800],
      ['SHA', 'NEWYORK', '40GP', 4200],
      ['NINGBO', 'LOSANGELES', '20GP', 1100],
      ['NINGBO', 'LOSANGELES', '40GP', 1700],
      ['SHENZHEN', 'HAMBURG', '20GP', 1400],
      ['SHENZHEN', 'HAMBURG', '40GP', 2200],
      ['SHENZHEN', 'ROTTERDAM', '20GP', 1350],
      ['SHENZHEN', 'ROTTERDAM', '40GP', 2100],
      ['QINGDAO', 'YOKOHAMA', '20GP', 450],
      ['QINGDAO', 'YOKOHAMA', '40GP', 650],
      ['SHA', 'HOCHIMINH', '20GP', 380],
      ['SHA', 'HOCHIMINH', '40GP', 550],
    ]

    defaultRates.forEach(r => {
      db.run('INSERT INTO freight_rates (origin_port, destination_port, container_type, price) VALUES (?, ?, ?, ?)', r)
    })
  }

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
      ['终端', '中国', '上海', '13800138001', 12],
      ['经销商', '马来西亚', '吉隆坡', '+60-123456789', 8],
      ['终端', '越南', '胡志明市', '+84-901234567', 5],
      ['经销商', '中国', '广州', '13900139002', 20],
    ]

    defaultCustomers.forEach(c => {
      db.run('INSERT INTO customers (customer_type, country, city, contact, deal_count) VALUES (?, ?, ?, ?, ?)', c)
    })
  }

  const initSettings = db.exec('SELECT COUNT(*) as count FROM system_settings')
  if (initSettings[0]?.values[0]?.[0] === 0) {
    const defaults = [
      ['companyName', 'SalesForce'],
      ['defaultCurrency', 'CNY'],
      ['language', 'zh-CN'],
      ['timezone', 'Asia/Shanghai'],
      ['decimalPlaces', '2'],
      ['autoSave', 'true'],
    ]
    defaults.forEach(([k, v]) => {
      db.run('INSERT INTO system_settings (key, value) VALUES (?, ?)', [k, v])
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
  const lastIdResult = db.exec('SELECT last_insert_rowid()')
  const lastId = lastIdResult[0].values[0][0]
  saveDB()
  return { lastInsertRowid: Number(lastId) }
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
  const { customer_type, country, city, contact, deal_count } = req.body

  try {
    const result = runSQL(
      'INSERT INTO customers (customer_type, country, city, contact, deal_count) VALUES (?, ?, ?, ?, ?)',
      [customer_type, country, city, contact, deal_count || 0]
    )

    const newCustomer = queryOne('SELECT * FROM customers WHERE id = ?', [result.lastInsertRowid])
    res.status(201).json(newCustomer)
  } catch (error) {
    res.status(500).json({ error: '创建客户失败' })
  }
})

app.put('/api/customers/:id', (req, res) => {
  const { customer_type, country, city, contact, deal_count } = req.body

  try {
    db.run(
      'UPDATE customers SET customer_type = ?, country = ?, city = ?, contact = ?, deal_count = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?',
      [customer_type, country, city, contact, deal_count, req.params.id]
    )
    saveDB()

    const updatedCustomer = queryOne('SELECT * FROM customers WHERE id = ?', [req.params.id])
    if (!updatedCustomer) {
      return res.status(404).json({ error: '客户不存在' })
    }

    res.json(updatedCustomer)
  } catch (error) {
    res.status(500).json({ error: '更新客户失败' })
  }
})

app.delete('/api/customers/:id', (req, res) => {
  const customer = queryOne('SELECT * FROM customers WHERE id = ?', [req.params.id])

  if (!customer) {
    return res.status(404).json({ error: '客户不存在' })
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
      [code, name, symbol, exchange_rate, is_default ?1 : 0]
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
      [code, name, symbol, exchange_rate, is_default ?1 : 0, req.params.id]
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

app.get('/api/ports', (req, res) => {
  const ports = queryAll('SELECT * FROM ports ORDER BY id DESC')
  res.json(ports)
})

app.post('/api/ports', (req, res) => {
  const { code, name, country, type, is_active } = req.body

  try {
    const result = runSQL(
      'INSERT INTO ports (code, name, country, type, is_active) VALUES (?, ?, ?, ?, ?)',
      [code, name, country, type, is_active !== undefined ? (is_active ?1 : 0) : 1]
    )

    const newPort = queryOne('SELECT * FROM ports WHERE id = ?', [result.lastInsertRowid])
    res.status(201).json(newPort)
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: '港口代码已存在' })
    }
    res.status(500).json({ error: '创建港口失败' })
  }
})

app.put('/api/ports/:id', (req, res) => {
  const { code, name, country, type, is_active } = req.body

  try {
    db.run(
      'UPDATE ports SET code = ?, name = ?, country = ?, type = ?, is_active = ? WHERE id = ?',
      [code, name, country, type, is_active !== undefined ? (is_active ?1 : 0) : 1, req.params.id]
    )
    saveDB()

    const updatedPort = queryOne('SELECT * FROM ports WHERE id = ?', [req.params.id])
    if (!updatedPort) {
      return res.status(404).json({ error: '港口不存在' })
    }

    res.json(updatedPort)
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: '港口代码已存在' })
    }
    res.status(500).json({ error: '更新港口失败' })
  }
})

app.delete('/api/ports/:id', (req, res) => {
  const port = queryOne('SELECT * FROM ports WHERE id = ?', [req.params.id])

  if (!port) {
    return res.status(404).json({ error: '港口不存在' })
  }

  db.run('DELETE FROM ports WHERE id = ?', [req.params.id])
  saveDB()

  res.json({ message: '删除成功' })
})

app.get('/api/freight-rates', (req, res) => {
  const freightRates = queryAll('SELECT * FROM freight_rates ORDER BY id DESC')
  res.json(freightRates)
})

app.post('/api/freight-rates', (req, res) => {
  const { origin_port, destination_port, container_type, price, currency, valid_from, valid_to } = req.body

  try {
    const result = runSQL(
      'INSERT INTO freight_rates (origin_port, destination_port, container_type, price, currency, valid_from, valid_to) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [origin_port, destination_port, container_type, price, currency || 'USD', valid_from, valid_to]
    )

    const newRate = queryOne('SELECT * FROM freight_rates WHERE id = ?', [result.lastInsertRowid])
    res.status(201).json(newRate)
  } catch (error) {
    res.status(500).json({ error: '创建运费率失败' })
  }
})

app.put('/api/freight-rates/:id', (req, res) => {
  const { origin_port, destination_port, container_type, price, currency, valid_from, valid_to } = req.body

  try {
    db.run(
      'UPDATE freight_rates SET origin_port = ?, destination_port = ?, container_type = ?, price = ?, currency = ?, valid_from = ?, valid_to = ? WHERE id = ?',
      [origin_port, destination_port, container_type, price, currency, valid_from, valid_to, req.params.id]
    )
    saveDB()

    const updatedRate = queryOne('SELECT * FROM freight_rates WHERE id = ?', [req.params.id])
    if (!updatedRate) {
      return res.status(404).json({ error: '运费率不存在' })
    }

    res.json(updatedRate)
  } catch (error) {
    res.status(500).json({ error: '更新运费率失败' })
  }
})

app.delete('/api/freight-rates/:id', (req, res) => {
  const rate = queryOne('SELECT * FROM freight_rates WHERE id = ?', [req.params.id])

  if (!rate) {
    return res.status(404).json({ error: '运费率不存在' })
  }

  db.run('DELETE FROM freight_rates WHERE id = ?', [req.params.id])
  saveDB()

  res.json({ message: '删除成功' })
})

app.get('/api/cost-types', (req, res) => {
  const costTypes = queryAll('SELECT * FROM cost_types ORDER BY id DESC')
  res.json(costTypes)
})

app.post('/api/cost-types', (req, res) => {
  const { code, name, category, is_seller_responsibility } = req.body

  try {
    const result = runSQL(
      'INSERT INTO cost_types (code, name, category, is_seller_responsibility) VALUES (?, ?, ?, ?)',
      [code, name, category, is_seller_responsibility !== undefined ? (is_seller_responsibility ?1 : 0) : 1]
    )

    const newCostType = queryOne('SELECT * FROM cost_types WHERE id = ?', [result.lastInsertRowid])
    res.status(201).json(newCostType)
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: '成本类型代码已存在' })
    }
    res.status(500).json({ error: '创建成本类型失败' })
  }
})

app.put('/api/cost-types/:id', (req, res) => {
  const { code, name, category, is_seller_responsibility } = req.body

  try {
    db.run(
      'UPDATE cost_types SET code = ?, name = ?, category = ?, is_seller_responsibility = ? WHERE id = ?',
      [code, name, category, is_seller_responsibility !== undefined ? (is_seller_responsibility ?1 : 0) : 1, req.params.id]
    )
    saveDB()

    const updatedCostType = queryOne('SELECT * FROM cost_types WHERE id = ?', [req.params.id])
    if (!updatedCostType) {
      return res.status(404).json({ error: '成本类型不存在' })
    }

    res.json(updatedCostType)
  } catch (error) {
    if (error.message.includes('UNIQUE constraint failed')) {
      return res.status(400).json({ error: '成本类型代码已存在' })
    }
    res.status(500).json({ error: '更新成本类型失败' })
  }
})

app.delete('/api/cost-types/:id', (req, res) => {
  const costType = queryOne('SELECT * FROM cost_types WHERE id = ?', [req.params.id])

  if (!costType) {
    return res.status(404).json({ error: '成本类型不存在' })
  }

  db.run('DELETE FROM cost_types WHERE id = ?', [req.params.id])
  saveDB()

  res.json({ message: '删除成功' })
})

app.get('/api/quote-items', (req, res) => {
  const quoteItems = queryAll('SELECT * FROM quote_items ORDER BY id DESC')
  res.json(quoteItems)
})

app.post('/api/quote-items', (req, res) => {
  const { sku, name, description, price, quantity } = req.body

  try {
    const result = runSQL(
      'INSERT INTO quote_items (sku, name, description, price, quantity) VALUES (?, ?, ?, ?, ?)',
      [sku, name, description, price, quantity || 1]
    )

    const newItem = queryOne('SELECT * FROM quote_items WHERE id = ?', [result.lastInsertRowid])
    res.status(201).json(newItem)
  } catch (error) {
    res.status(500).json({ error: '创建报价项失败' })
  }
})

app.put('/api/quote-items/:id', (req, res) => {
  const { sku, name, description, price, quantity } = req.body

  try {
    db.run(
      'UPDATE quote_items SET sku = ?, name = ?, description = ?, price = ?, quantity = ? WHERE id = ?',
      [sku, name, description, price, quantity, req.params.id]
    )
    saveDB()

    const updatedItem = queryOne('SELECT * FROM quote_items WHERE id = ?', [req.params.id])
    if (!updatedItem) {
      return res.status(404).json({ error: '报价项不存在' })
    }

    res.json(updatedItem)
  } catch (error) {
    res.status(500).json({ error: '更新报价项失败' })
  }
})

app.delete('/api/quote-items/:id', (req, res) => {
  const item = queryOne('SELECT * FROM quote_items WHERE id = ?', [req.params.id])

  if (!item) {
    return res.status(404).json({ error: '报价项不存在' })
  }

  db.run('DELETE FROM quote_items WHERE id = ?', [req.params.id])
  saveDB()

  res.json({ message: '删除成功' })
})

app.get('/api/system-settings', (req, res) => {
  const settings = queryAll('SELECT * FROM system_settings')
  res.json(settings)
})

app.post('/api/system-settings', (req, res) => {
  const { key, value } = req.body

  try {
    const existing = queryOne('SELECT * FROM system_settings WHERE key = ?', [key])

    if (existing) {
      db.run('UPDATE system_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?', [value, key])
    } else {
      runSQL('INSERT INTO system_settings (key, value) VALUES (?, ?)', [key, value])
    }

    saveDB()

    const setting = queryOne('SELECT * FROM system_settings WHERE key = ?', [key])
    res.json(setting)
  } catch (error) {
    res.status(500).json({ error: '保存设置失败' })
  }
})

app.get('/api/recycle-bin', (req, res) => {
  const items = queryAll('SELECT * FROM recycle_bin WHERE expires_at > datetime("now") ORDER BY deleted_at DESC')
  res.json(items)
})

app.post('/api/recycle-bin/:id/restore', (req, res) => {
  const item = queryOne('SELECT * FROM recycle_bin WHERE id = ?', [req.params.id])

  if (!item) {
    return res.status(404).json({ error: '回收项不存在' })
  }

  try {
    const itemData = JSON.parse(item.item_data)

    if (item.item_type === 'product') {
      db.run(
        'INSERT INTO products (name, category, sku, price, description, status) VALUES (?, ?, ?, ?, ?, ?)',
        [itemData.name, itemData.category, itemData.sku, itemData.price, itemData.description, itemData.status]
      )
    } else if (item.item_type === 'customer') {
      db.run(
        'INSERT INTO customers (customer_type, country, city, contact, deal_count) VALUES (?, ?, ?, ?, ?)',
        [itemData.customer_type, itemData.country, itemData.city, itemData.contact, itemData.deal_count]
      )
    } else if (item.item_type === 'currency') {
      db.run(
        'INSERT INTO currencies (code, name, symbol, exchange_rate, is_default) VALUES (?, ?, ?, ?, ?)',
        [itemData.code, itemData.name, itemData.symbol, itemData.exchange_rate, itemData.is_default]
      )
    }

    db.run('DELETE FROM recycle_bin WHERE id = ?', [req.params.id])
    saveDB()

    res.json({ message: '恢复成功' })
  } catch (error) {
    res.status(500).json({ error: '恢复失败' })
  }
})

app.delete('/api/recycle-bin/:id', (req, res) => {
  const item = queryOne('SELECT * FROM recycle_bin WHERE id = ?', [req.params.id])

  if (!item) {
    return res.status(404).json({ error: '回收项不存在' })
  }

  db.run('DELETE FROM recycle_bin WHERE id = ?', [req.params.id])
  saveDB()

  res.json({ message: '删除成功' })
})

app.use(notFoundHandler)
app.use(errorHandler)

async function startServer() {
  try {
    await initDB()
    
    try {
      await connectRedis()
    } catch (redisError) {
      console.warn('Redis连接失败，将不使用缓存功能:', redisError.message)
    }
    
    app.listen(PORT, () => {
      console.log(`服务器运行在 http://localhost:${PORT}`)
      console.log(`环境: ${process.env.NODE_ENV || 'development'}`)
    })
  } catch (error) {
    console.error('服务器启动失败:', error)
    process.exit(1)
  }
}

startServer()
