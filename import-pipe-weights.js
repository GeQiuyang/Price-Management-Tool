import initSqlJs from 'sql.js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const dbPath = path.join(__dirname, 'server', 'database.db')

// 基础数据：3米导管的重量 (单位: kg)
const baseWeights = {
    '219': {
        '2.75': 55.1,
        '3.25': 62.1,
        '3.5': 64.8
    },
    '260': {
        '2.8': 61.1,
        '3.25': 72.3,
        '3.5': 74,
        '3.75': 81,
        '4': 85.5
    },
    '300': {
        '3': 77.95,
        '3.5': 88.6,
        '3.75': 95.9,
        '4': 100,
        '4.5': 110
    }
}

const lengths = [0.5, 1, 1.5, 3, 4]

const updatePipeWeights = async () => {
    console.log('开始更新导管重量...\n')

    const SQL = await initSqlJs()
    const fileBuffer = fs.readFileSync(dbPath)
    const db = new SQL.Database(fileBuffer)

    let updateCount = 0

    // 获取所有导管类产品
    const stmt = db.prepare("SELECT id, name, description FROM products WHERE category = '导管类'")
    const products = []
    while (stmt.step()) {
        products.push(stmt.getAsObject())
    }
    stmt.free()

    console.log(`找到 ${products.length} 个导管类产品`)

    for (const product of products) {
        let updated = false
        let newDesc = product.description || ''

        // 匹配管型
        const pipeMatch = product.name.match(/(300|260|219)导管/)
        if (!pipeMatch) continue
        const pipeType = pipeMatch[1]

        // 匹配长度
        const lengthMatch = product.name.match(/·\s*(\d+\.?\d*)m/)
        if (!lengthMatch) continue
        const length = parseFloat(lengthMatch[1])

        // 如果该长度不在需要计算的列表中，跳过（不过用户说是上面这几个长度）
        if (!lengths.includes(length)) continue

        // 匹配壁厚
        const thickMatch = product.description && product.description.match(/壁厚(\d+\.?\d*)mm/)
        if (!thickMatch) continue
        const thickness = parseFloat(thickMatch[1]).toString() // 转回字符串匹配key

        // 获取3米的基准重量
        const baseWeightInfo = baseWeights[pipeType]
        if (!baseWeightInfo) continue
        const baseWeight = baseWeightInfo[thickness]
        if (!baseWeight) continue

        // 计算当前长度的重量
        const weightPerMeter = baseWeight / 3
        const targetWeight = (weightPerMeter * length).toFixed(2)

        // 更新 description
        // 如果已经包含重量，则替换
        if (newDesc.includes('重量')) {
            newDesc = newDesc.replace(/，?重量.*?kg/, `，重量${targetWeight}kg`)
        } else {
            newDesc = `${newDesc}，重量${targetWeight}kg`
        }

        if (newDesc !== product.description) {
            db.run('UPDATE products SET description = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?', [newDesc, product.id])
            updateCount++
            console.log(`✓ ${product.name} [厚${thickness}mm] -> ${newDesc}`)
        }
    }

    const exportData = db.export()
    fs.writeFileSync(dbPath, Buffer.from(exportData))

    console.log(`\n更新完成！成功更新了 ${updateCount} 条产品的重量`)
}

updatePipeWeights()
