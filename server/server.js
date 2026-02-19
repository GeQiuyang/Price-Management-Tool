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

app.post('/api/recycle-bin', (req, res) => {
  const { itemType, itemId, itemData } = req.body

  if (!itemType || !itemId || !itemData) {
    return res.status(400).json({ error: '缺少必要参数' })
  }

  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 30)

  const result = db.run(
    'INSERT INTO recycle_bin (item_type, item_id, item_data, expires_at) VALUES (?, ?, ?, ?)',
    [itemType, itemId, JSON.stringify(itemData), expiresAt.toISOString()]
  )
  saveDB()

  res.json({
    message: '已添加到回收站',
    id: db.exec('SELECT last_insert_rowid()')[0].values[0][0]
  })
})

app.get('/api/recycle-bin', (req, res) => {
  const now = new Date().toISOString()

  db.run('DELETE FROM recycle_bin WHERE expires_at < ?', [now])
  saveDB()

  const items = queryAll('SELECT * FROM recycle_bin ORDER BY deleted_at DESC')
  const formattedItems = items.map(item => ({
    ...item,
    item_data: JSON.parse(item.item_data)
  }))

  res.json(formattedItems)
})

app.post('/api/recycle-bin/:id/restore', (req, res) => {
  const { id } = req.params
  const { targetTable } = req.body

  const item = queryOne('SELECT * FROM recycle_bin WHERE id = ?', [id])

  if (!item) {
    return res.status(404).json({ error: '回收站项不存在' })
  }

  const itemData = JSON.parse(item.item_data)

  if (targetTable === 'products') {
    const result = db.run(
      'INSERT INTO products (name, category, sku, price, description, status) VALUES (?, ?, ?, ?, ?, ?)',
      [itemData.name, itemData.category, itemData.sku, itemData.price, itemData.description, itemData.status || 'active']
    )
  } else if (targetTable === 'costs') {
    db.run(
      'INSERT INTO costs (product_id, cost_type, amount, description) VALUES (?, ?, ?, ?)',
      [itemData.product_id, itemData.cost_type, itemData.amount, itemData.description]
    )
  } else if (targetTable === 'currencies') {
    db.run(
      'INSERT INTO currencies (code, name, symbol, exchange_rate, is_default) VALUES (?, ?, ?, ?, ?)',
      [itemData.code, itemData.name, itemData.symbol, itemData.exchange_rate, itemData.is_default || 0]
    )
  } else if (targetTable === 'customers') {
    db.run(
      'INSERT INTO customers (customer_type, country, city, contact, deal_count) VALUES (?, ?, ?, ?, ?)',
      [itemData.customer_type, itemData.country, itemData.city, itemData.contact, itemData.deal_count]
    )
  } else if (targetTable === 'taxes') {
    db.run(
      'INSERT INTO taxes_units (type, name, value, description) VALUES (?, ?, ?, ?)',
      ['tax', itemData.name, itemData.rate || itemData.value, itemData.description]
    )
  } else if (targetTable === 'units') {
    db.run(
      'INSERT INTO taxes_units (type, name, value, description) VALUES (?, ?, ?, ?)',
      ['unit', itemData.name, itemData.value, itemData.description]
    )
  } else if (targetTable === 'markets') {
    db.run(
      'INSERT INTO markets_channels (type, name, description, status) VALUES (?, ?, ?, ?)',
      ['market', itemData.name, itemData.description, itemData.status || 'active']
    )
  } else if (targetTable === 'channels') {
    db.run(
      'INSERT INTO markets_channels (type, name, description, status) VALUES (?, ?, ?, ?)',
      ['channel', itemData.name, itemData.description, itemData.status || 'active']
    )
  }

  db.run('DELETE FROM recycle_bin WHERE id = ?', [id])
  saveDB()

  res.json({ message: '恢复成功' })
})

app.delete('/api/recycle-bin/cleanup', (req, res) => {
  const now = new Date().toISOString()

  db.run('DELETE FROM recycle_bin WHERE expires_at < ?', [now])
  saveDB()

  res.json({ message: '清理完成' })
})

app.delete('/api/recycle-bin/:id', (req, res) => {
  const { id } = req.params

  const item = queryOne('SELECT * FROM recycle_bin WHERE id = ?', [id])

  if (!item) {
    return res.status(404).json({ error: '回收站项不存在' })
  }

  db.run('DELETE FROM recycle_bin WHERE id = ?', [id])
  saveDB()

  res.json({ message: '永久删除成功' })
})

const CONTAINER_TYPES = {
  '20GP': { name: '20GP', volume: 28, maxWeight: 25000 },
  '40GP': { name: '40GP', volume: 58, maxWeight: 26000 },
  '40HQ': { name: '40HQ', volume: 68, maxWeight: 26000 },
  '45HQ': { name: '45HQ', volume: 86, maxWeight: 28000 },
}

const LCL_THRESHOLD = 15

const TERM_COST_RULES = {
  EXW: {
    seller: ['packing', 'landFreight', 'customsFee', 'portCharge'],
    buyer: ['oceanFreight', 'insurance', 'destinationFee'],
  },
  FOB: {
    seller: ['packing', 'landFreight', 'customsFee', 'portCharge'],
    buyer: ['oceanFreight', 'insurance', 'destinationFee'],
  },
  CIF: {
    seller: ['packing', 'landFreight', 'customsFee', 'portCharge', 'oceanFreight', 'insurance'],
    buyer: ['destinationFee'],
  },
}

function getCostTypeName(code) {
  const names = {
    packing: '打包费',
    landFreight: '国内陆运费',
    customsFee: '出口报关费',
    portCharge: '港杂费',
    oceanFreight: '海运费',
    insurance: '保险费',
    destinationFee: '目的港费用',
  }
  return names[code] || code
}

function checkWeightWarning(weight, maxWeight) {
  const warnings = []
  const ratio = weight / maxWeight
  if (ratio > 0.9) warnings.push('接近限重，建议检查是否超重')
  if (ratio > 1) warnings.push('已超重！请拆分或更换柜型')
  return warnings
}

app.get('/api/freight/container-types', (req, res) => {
  const types = Object.entries(CONTAINER_TYPES).map(([code, config]) => ({
    code,
    ...config,
  }))
  res.json(types)
})

app.get('/api/freight/ports', (req, res) => {
  const { type } = req.query
  let sql = 'SELECT * FROM ports WHERE is_active = 1'
  const params = []
  if (type) {
    sql += ' AND type = ?'
    params.push(type)
  }
  const ports = queryAll(sql, params)
  res.json(ports)
})

app.get('/api/freight/cost-types', (req, res) => {
  const costTypes = queryAll('SELECT * FROM cost_types')
  res.json(costTypes)
})

app.get('/api/freight/rates', (req, res) => {
  const { originPort, destinationPort } = req.query
  let sql = 'SELECT * FROM freight_rates WHERE 1=1'
  const params = []
  if (originPort) {
    sql += ' AND origin_port = ?'
    params.push(originPort)
  }
  if (destinationPort) {
    sql += ' AND destination_port = ?'
    params.push(destinationPort)
  }
  const rates = queryAll(sql, params)
  res.json(rates)
})

app.post('/api/freight/rates', (req, res) => {
  const { originPort, destinationPort, containerType, price, currency } = req.body
  const result = db.run(
    'INSERT INTO freight_rates (origin_port, destination_port, container_type, price, currency) VALUES (?, ?, ?, ?, ?)',
    [originPort, destinationPort, containerType, price, currency || 'USD']
  )
  saveDB()
  res.json({ message: '保存成功', id: db.exec('SELECT last_insert_rowid()')[0].values[0][0] })
})

app.post('/api/freight/calculate', (req, res) => {
  try {
    const { tradeTerm, cargoDetails, route, costs } = req.body

    if (!tradeTerm || !cargoDetails) {
      return res.status(400).json({ error: '缺少必要参数' })
    }

    const { volume, weight, value } = cargoDetails
    const isLCL = volume < LCL_THRESHOLD

    let containerResult
    if (isLCL) {
      const revenueTon = Math.max(volume, weight / 1000)
      const oceanFreightCost = costs.find(c => c.type === 'oceanFreight')?.amount || 0
      const insuranceCost = costs.find(c => c.type === 'insurance')?.amount || (value * 0.001)
      containerResult = {
        type: 'LCL',
        revenueTon: Math.ceil(revenueTon * 100) / 100,
        freight: revenueTon * oceanFreightCost,
        insurance: insuranceCost,
        total: revenueTon * oceanFreightCost + insuranceCost,
        rate: oceanFreightCost,
      }
    } else {
      const sortedContainers = Object.entries(CONTAINER_TYPES)
        .filter(([_, config]) => volume <= config.volume && weight <= config.maxWeight)
        .sort((a, b) => a[1].volume - b[1].volume)

      if (sortedContainers.length === 0) {
        containerResult = {
          type: 'FCL_MULTI',
          message: '体积超过单柜容量，需要多柜运输',
          requiredVolume: volume,
          maxContainerVolume: 86,
          warnings: ['体积超过单柜容量，需要多柜运输'],
        }
      } else {
        const [code, config] = sortedContainers[0]
        const oceanFreightCost = costs.find(c => c.type === 'oceanFreight')?.amount || 0
        containerResult = {
          type: 'FCL',
          containerType: code,
          containerCount: 1,
          usedVolume: config.volume,
          usedWeight: config.maxWeight,
          utilization: Math.max(volume / config.volume, weight / config.maxWeight) * 100,
          remainingVolume: config.volume - volume,
          remainingWeight: config.maxWeight - weight,
          warnings: checkWeightWarning(weight, config.maxWeight),
          oceanFreight: oceanFreightCost,
        }
      }
    }

    const rules = TERM_COST_RULES[tradeTerm]
    const sellerCosts = []
    const buyerCosts = []

    for (const cost of (costs || [])) {
      const isSeller = rules.seller.includes(cost.type)
      if (isSeller) {
        sellerCosts.push({
          type: cost.type,
          name: getCostTypeName(cost.type),
          amount: cost.amount,
          payer: 'seller',
        })
      } else {
        buyerCosts.push({
          type: cost.type,
          name: getCostTypeName(cost.type),
          amount: cost.amount,
          payer: 'buyer',
        })
      }
    }

    const costBreakdown = { seller: sellerCosts, buyer: buyerCosts }

    res.json({
      summary: {
        tradeTerm,
        isLCL,
        totalVolume: volume,
        totalWeight: weight,
        cargoValue: value,
        ...route,
      },
      container: containerResult,
      costBreakdown,
      sellerTotal: sellerCosts.reduce((sum, c) => sum + c.amount, 0),
      buyerTotal: buyerCosts.reduce((sum, c) => sum + c.amount, 0),
    })
  } catch (error) {
    res.status(500).json({ error: '计算失败: ' + error.message })
  }
})

// ─── Quote Items API ───
app.get('/api/quote-items', (req, res) => {
  const items = queryAll('SELECT * FROM quote_items ORDER BY id ASC')
  res.json(items)
})

app.post('/api/quote-items', (req, res) => {
  const { sku, name, description, price, quantity } = req.body
  try {
    const result = runSQL(
      'INSERT INTO quote_items (sku, name, description, price, quantity) VALUES (?, ?, ?, ?, ?)',
      [sku, name, description || '', price, quantity || 1]
    )
    const item = queryOne('SELECT * FROM quote_items WHERE id = ?', [result.lastInsertRowid])
    res.status(201).json(item)
  } catch (error) {
    res.status(500).json({ error: '添加报价项失败' })
  }
})

app.put('/api/quote-items/:id', (req, res) => {
  const { price, quantity } = req.body
  try {
    db.run('UPDATE quote_items SET price = ?, quantity = ? WHERE id = ?', [price, quantity, req.params.id])
    saveDB()
    const item = queryOne('SELECT * FROM quote_items WHERE id = ?', [req.params.id])
    res.json(item)
  } catch (error) {
    res.status(500).json({ error: '更新报价项失败' })
  }
})

app.delete('/api/quote-items/:id', (req, res) => {
  db.run('DELETE FROM quote_items WHERE id = ?', [req.params.id])
  saveDB()
  res.json({ message: '删除成功' })
})

app.delete('/api/quote-items', (req, res) => {
  db.run('DELETE FROM quote_items')
  saveDB()
  res.json({ message: '清空成功' })
})

// ─── Quote Imported Data API ───
app.get('/api/quote-imported-data', (req, res) => {
  const rows = queryAll('SELECT * FROM quote_imported_data ORDER BY id ASC')
  const parsed = rows.map(r => ({ ...JSON.parse(r.data_json), _dbId: r.id, sheetName: r.sheet_name }))
  res.json(parsed)
})

app.post('/api/quote-imported-data', (req, res) => {
  const { items } = req.body // array of { sheetName, ...data }
  try {
    const inserted = []
    items.forEach(item => {
      const { sheetName, ...data } = item
      const result = runSQL(
        'INSERT INTO quote_imported_data (sheet_name, data_json) VALUES (?, ?)',
        [sheetName || '', JSON.stringify(data)]
      )
      inserted.push({ ...data, _dbId: result.lastInsertRowid, sheetName })
    })
    res.status(201).json(inserted)
  } catch (error) {
    res.status(500).json({ error: '保存导入数据失败' })
  }
})

app.delete('/api/quote-imported-data', (req, res) => {
  db.run('DELETE FROM quote_imported_data')
  saveDB()
  res.json({ message: '清空成功' })
})

// ─── System Settings API ───
app.get('/api/system-settings', (req, res) => {
  const rows = queryAll('SELECT * FROM system_settings')
  const settings = {}
  rows.forEach(r => {
    settings[r.key] = r.value === 'true' ? true : r.value === 'false' ? false : (isNaN(r.value) ? r.value : Number(r.value))
  })
  res.json(settings)
})

app.put('/api/system-settings', (req, res) => {
  const settings = req.body
  try {
    Object.entries(settings).forEach(([key, value]) => {
      const exists = queryOne('SELECT id FROM system_settings WHERE key = ?', [key])
      if (exists) {
        db.run('UPDATE system_settings SET value = ?, updated_at = CURRENT_TIMESTAMP WHERE key = ?', [String(value), key])
      } else {
        db.run('INSERT INTO system_settings (key, value) VALUES (?, ?)', [key, String(value)])
      }
    })
    saveDB()
    res.json({ message: '设置已保存' })
  } catch (error) {
    res.status(500).json({ error: '保存设置失败' })
  }
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
