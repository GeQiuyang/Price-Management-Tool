import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, 'server', 'database.db')

const data = [
    { "产品名称": "300尖丝接头", "产品规格": "公扣", "价格": 36 },
    { "产品名称": "300尖丝接头", "产品规格": "母扣", "价格": 36 },
    { "产品名称": "300尖丝接头", "产品规格": "衬套", "价格": 25 },
    { "产品名称": "300方丝接头", "产品规格": "公扣", "价格": 39 },
    { "产品名称": "300方丝接头", "产品规格": "母扣", "价格": 39 },
    { "产品名称": "300方丝接头", "产品规格": "衬套", "价格": 28 },
    { "产品名称": "260尖丝接头", "产品规格": "公扣", "价格": 30 },
    { "产品名称": "260尖丝接头", "产品规格": "母扣", "价格": 30 },
    { "产品名称": "260尖丝接头", "产品规格": "衬套", "价格": 21 },
    { "产品名称": "260方丝接头", "产品规格": "公扣", "价格": 33 },
    { "产品名称": "260方丝接头", "产品规格": "母扣", "价格": 33 },
    { "产品名称": "260方丝接头", "产品规格": "衬套", "价格": 24 },
    { "产品名称": "219尖丝接头", "产品规格": "公扣", "价格": 25 },
    { "产品名称": "219尖丝接头", "产品规格": "母扣", "价格": 25 },
    { "产品名称": "219尖丝接头", "产品规格": "衬套", "价格": 19 },
    { "产品名称": "219方丝接头", "产品规格": "公扣", "价格": 28 },
    { "产品名称": "219方丝接头", "产品规格": "母扣", "价格": 28 },
    { "产品名称": "219方丝接头", "产品规格": "衬套", "价格": 22 },
]

const importDealerPrices = async () => {
    console.log('开始导入接头经销商价数据...\n')

    const SQL = await initSqlJs()

    if (!fs.existsSync(dbPath)) {
        console.error('数据库文件不存在:', dbPath)
        process.exit(1)
    }

    const fileBuffer = fs.readFileSync(dbPath)
    const db = new SQL.Database(fileBuffer)

    // 确保 dealer_price 列存在
    try {
        db.run('ALTER TABLE products ADD COLUMN dealer_price REAL')
        console.log('已添加 dealer_price 列')
    } catch (e) {
        // 列已存在，忽略
    }

    let successCount = 0

    for (const item of data) {
        const name = `${item.产品名称} · ${item.产品规格}`
        const sku = `P-${Date.now()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`
        const dealerPrice = item.价格
        const description = `${item.产品名称}，规格：${item.产品规格}`

        try {
            db.run(
                'INSERT INTO products (name, category, sku, price, dealer_price, description, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
                [name, '导管类', sku, 0, dealerPrice, description, 'active']
            )
            successCount++
            console.log(`✓ ${name} - 经销商价: ¥${dealerPrice}`)
        } catch (error) {
            console.error(`✗ ${name} - 错误: ${error.message}`)
        }

        // 避免 SKU 时间戳重复
        await new Promise(r => setTimeout(r, 2))
    }

    const exportData = db.export()
    const buffer = Buffer.from(exportData)
    fs.writeFileSync(dbPath, buffer)

    console.log(`\n导入完成！成功: ${successCount}/${data.length} 条`)
    console.log(`数据库已保存到: ${dbPath}`)
}

importDealerPrices()
