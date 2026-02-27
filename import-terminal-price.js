import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, 'server', 'database.db')

const data = [
    { "产品名称": "300尖丝接头", "产品规格": "公扣", "价格": 40 },
    { "产品名称": "300尖丝接头", "产品规格": "母扣", "价格": 40 },
    { "产品名称": "300尖丝接头", "产品规格": "衬套", "价格": 29 },
    { "产品名称": "300方丝接头", "产品规格": "公扣", "价格": 43 },
    { "产品名称": "300方丝接头", "产品规格": "母扣", "价格": 43 },
    { "产品名称": "300方丝接头", "产品规格": "衬套", "价格": 32 },
    { "产品名称": "260尖丝接头", "产品规格": "公扣", "价格": 34 },
    { "产品名称": "260尖丝接头", "产品规格": "母扣", "价格": 34 },
    { "产品名称": "260尖丝接头", "产品规格": "衬套", "价格": 25 },
    { "产品名称": "260方丝接头", "产品规格": "公扣", "价格": 37 },
    { "产品名称": "260方丝接头", "产品规格": "母扣", "价格": 37 },
    { "产品名称": "260方丝接头", "产品规格": "衬套", "价格": 28 },
    { "产品名称": "219尖丝接头", "产品规格": "公扣", "价格": 29 },
    { "产品名称": "219尖丝接头", "产品规格": "母扣", "价格": 29 },
    { "产品名称": "219尖丝接头", "产品规格": "衬套", "价格": 23 },
    { "产品名称": "219方丝接头", "产品规格": "公扣", "价格": 32 },
    { "产品名称": "219方丝接头", "产品规格": "母扣", "价格": 32 },
    { "产品名称": "219方丝接头", "产品规格": "衬套", "价格": 26 },
]

const updatePrices = async () => {
    console.log('开始更新接头终端价...\n')

    const SQL = await initSqlJs()
    const fileBuffer = fs.readFileSync(dbPath)
    const db = new SQL.Database(fileBuffer)

    let successCount = 0

    for (const item of data) {
        const name = `${item.产品名称} · ${item.产品规格}`
        const price = item.价格

        const result = db.run(
            'UPDATE products SET price = ?, updated_at = CURRENT_TIMESTAMP WHERE name = ? AND category = ?',
            [price, name, '导管类']
        )

        const changes = db.getRowsModified()
        if (changes > 0) {
            successCount++
            console.log(`✓ ${name} - 终端价: ¥${price}`)
        } else {
            console.log(`✗ ${name} - 未找到匹配产品`)
        }
    }

    const exportData = db.export()
    fs.writeFileSync(dbPath, Buffer.from(exportData))

    console.log(`\n更新完成！成功: ${successCount}/${data.length} 条`)
}

updatePrices()
