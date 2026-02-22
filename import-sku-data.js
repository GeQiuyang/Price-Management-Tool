import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const dbPath = path.join(__dirname, 'server', 'database.db')

const prices300 = {
  '0.5m': {
    '3mm': { S: 141, Q: 146 },
    '3.5mm': { S: 147, Q: 152 },
    '3.75mm': { S: 150, Q: 155 },
    '4mm': { S: 152, Q: 157 },
    '4.5mm': { S: 157, Q: 162 },
  },
  '1m': {
    '3mm': { S: 183, Q: 188 },
    '3.5mm': { S: 196, Q: 201 },
    '3.75mm': { S: 204, Q: 209 },
    '4mm': { S: 209, Q: 214 },
    '4.5mm': { S: 220, Q: 225 },
  },
  '1.5m': {
    '3mm': { S: 225, Q: 230 },
    '3.5mm': { S: 246, Q: 251 },
    '3.75mm': { S: 258, Q: 263 },
    '4mm': { S: 265, Q: 270 },
    '4.5mm': { S: 283, Q: 288 },
  },
  '3m': {
    '3mm': { S: 351, Q: 356 },
    '3.5mm': { S: 394, Q: 399 },
    '3.75mm': { S: 420, Q: 425 },
    '4mm': { S: 435, Q: 440 },
    '4.5mm': { S: 472, Q: 477 },
  },
  '4m': {
    '3mm': { S: 392, Q: 397 },
    '3.5mm': { S: 452, Q: 457 },
    '3.75mm': { S: 488, Q: 493 },
    '4mm': { S: 508, Q: 513 },
    '4.5mm': { S: 560, Q: 565 },
  },
}

const prices260 = {
  '0.5m': {
    '2.8mm': { S: 119, Q: 124 },
    '3.25mm': { S: 124, Q: 129 },
    '3.5mm': { S: 125, Q: 130 },
    '3.75mm': { S: 129, Q: 134 },
    '4mm': { S: 131, Q: 136 },
  },
  '1m': {
    '2.8mm': { S: 153, Q: 158 },
    '3.25mm': { S: 165, Q: 170 },
    '3.5mm': { S: 168, Q: 173 },
    '3.75mm': { S: 176, Q: 181 },
    '4mm': { S: 181, Q: 186 },
  },
  '1.5m': {
    '2.8mm': { S: 188, Q: 193 },
    '3.25mm': { S: 206, Q: 211 },
    '3.5mm': { S: 211, Q: 216 },
    '3.75mm': { S: 223, Q: 228 },
    '4mm': { S: 231, Q: 236 },
  },
  '3m': {
    '2.8mm': { S: 291, Q: 296 },
    '3.25mm': { S: 329, Q: 334 },
    '3.5mm': { S: 340, Q: 345 },
    '3.75mm': { S: 364, Q: 369 },
    '4mm': { S: 381, Q: 386 },
  },
  '4m': {
    '2.8mm': { S: 326, Q: 331 },
    '3.25mm': { S: 378, Q: 383 },
    '3.5mm': { S: 394, Q: 399 },
    '3.75mm': { S: 426, Q: 431 },
    '4mm': { S: 450, Q: 455 },
  },
}

const generateSKUTable = () => {
  const tableData = []
  
  const lengths300 = ['0.5', '1', '1.5', '3', '4']
  const thicknesses300 = ['3', '3.5', '3.75', '4', '4.5']
  lengths300.forEach(length => {
    thicknesses300.forEach(thickness => {
      const threadCodes = ['S', 'Q']
      threadCodes.forEach(thread => {
        const price = prices300[`${length}m`]?.[`${thickness}mm`]?.[thread] || 0
        const threadName = thread === 'S' ? '尖丝' : '方丝'
        const sku = `TP3-${thickness}-${length}m-${thread}`
        const productName = `300导管 (${threadName}) · ${length}m`
        const specDescription = `壁厚${thickness}mm`
        
        tableData.push({
          sku,
          name: productName,
          price: Number(price),
          description: specDescription,
          category: '导管类',
          status: 'active',
        })
      })
    })
  })
  
  const lengths260 = ['0.5', '1', '1.5', '3', '4']
  const thicknesses260 = ['2.8', '3.25', '3.5', '3.75', '4']
  lengths260.forEach(length => {
    thicknesses260.forEach(thickness => {
      const threadCodes = ['S', 'Q']
      threadCodes.forEach(thread => {
        const price = prices260[`${length}m`]?.[`${thickness}mm`]?.[thread] || 0
        const threadName = thread === 'S' ? '尖丝' : '方丝'
        const sku = `TP26-${thickness}-${length}m-${thread}`
        const productName = `260导管 (${threadName}) · ${length}m`
        const specDescription = `壁厚${thickness}mm`
        
        tableData.push({
          sku,
          name: productName,
          price: Number(price),
          description: specDescription,
          category: '导管类',
          status: 'active',
        })
      })
    })
  })
  
  const pipeLengths273 = ['1.5', '2', '2.5', '3', '4', '6']
  pipeLengths273.forEach(length => {
    const sku = `TP27-0-${length}m-S`
    const productName = `273导管 (尖丝) · ${length}m`
    const specDescription = '母扣接头'
    
    tableData.push({
      sku,
      name: productName,
      price: 80,
      description: specDescription,
      category: '导管类',
      status: 'active',
    })
  })
  
  const bitTypes = [
    { sku: 'BT-60-60-24', name: '赛迈斯宝石截齿60 · 60-24', price: 270, description: '合金直径28mm，适合土层', category: '截齿类', status: 'active' },
    { sku: 'BT-60-60-24-R', name: '赛迈斯宝石截齿60 · 60-24', price: 290, description: '合金直径28mm，适合岩层', category: '截齿类', status: 'active' },
  ]
  tableData.push(...bitTypes)
  
  const toolTypes = [
    { sku: 'DB-1200-20', name: '捞沙斗 · 1200mm', price: 6500, description: '1200mm，壁厚20mm', category: '钻具类', status: 'active' },
    { sku: 'DB-1500-20', name: '捞沙斗 · 1500mm', price: 7500, description: '1500mm，壁厚20mm', category: '钻具类', status: 'active' },
    { sku: 'CB-1200-20', name: '筒钻 · 1200mm', price: 13000, description: '1200mm，壁厚20mm', category: '钻具类', status: 'active' },
    { sku: 'CB-1500-20', name: '筒钻 · 1500mm', price: 15000, description: '1500mm，壁厚20mm', category: '钻具类', status: 'active' },
    { sku: 'LZZT-1200-20', name: '螺旋钻头 · 1200mm', price: 800, description: '1200mm，壁厚20mm高效螺旋钻头', category: '钻具类', status: 'active' },
  ]
  tableData.push(...toolTypes)
  
  const accessoryTypes = [
    { sku: 'MT-18-4', name: '泥浆管 · 18m', price: 330, description: '口径4英寸，长度18m', category: '配件类', status: 'active' },
    { sku: 'MP-75', name: '泥浆泵 · 75kW', price: 6500, description: '75千瓦', category: '配件类', status: 'active' },
    { sku: 'ZG-3-89', name: '钻杆 · 3m', price: 400, description: '钻杆，长度3m，直径89mm', category: '配件类', status: 'active' },
    { sku: 'JZZG-3-89', name: '加重钻杆 · 3m', price: 600, description: '加重钻杆，长度3m，直径89mm', category: '配件类', status: 'active' },
  ]
  tableData.push(...accessoryTypes)
  
  return tableData
}

const importProducts = async () => {
  console.log('开始导入SKU数据...\n')
  
  const SQL = await initSqlJs()
  
  let db
  if (fs.existsSync(dbPath)) {
    const fileBuffer = fs.readFileSync(dbPath)
    db = new SQL.Database(fileBuffer)
    console.log('已加载现有数据库')
  } else {
    db = new SQL.Database()
    console.log('创建新数据库')
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
  
  const products = generateSKUTable()
  console.log(`共生成 ${products.length} 条产品记录\n`)
  
  let successCount = 0
  let skipCount = 0
  
  for (const product of products) {
    try {
      const stmt = db.prepare(`
        INSERT OR REPLACE INTO products (sku, name, price, description, category, status)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      stmt.run([
        product.sku,
        product.name,
        Number(product.price),
        product.description,
        product.category,
        product.status
      ])
      successCount++
      console.log(`✓ ${product.sku} - ${product.name} - ¥${product.price}`)
    } catch (error) {
      const errorMsg = error?.message || String(error)
      if (errorMsg.includes('UNIQUE constraint')) {
        skipCount++
        console.log(`- ${product.sku} - 已存在，跳过`)
      } else {
        console.error(`✗ ${product.sku} - 错误: ${errorMsg}`)
        console.error(`   数据: ${JSON.stringify(product)}`)
      }
    }
  }
  
  const data = db.export()
  const buffer = Buffer.from(data)
  fs.writeFileSync(dbPath, buffer)
  
  console.log(`\n导入完成！`)
  console.log(`成功: ${successCount} 条`)
  console.log(`跳过: ${skipCount} 条`)
  console.log(`总计: ${products.length} 条`)
  console.log(`数据库已保存到: ${dbPath}`)
}

importProducts()
