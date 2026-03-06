import initSqlJs from 'sql.js';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, 'server', 'database.db');

async function run() {
    const SQL = await initSqlJs();
    const fileBuffer = fs.readFileSync(dbPath);
    const db = new SQL.Database(fileBuffer);

    const stmt = db.prepare("SELECT id, name, category, description, sku, price FROM products");
    const products = [];
    while (stmt.step()) {
        products.push(stmt.getAsObject());
    }
    stmt.free();

    function search(query) {
        const result = {
            search_keywords: [],
            category_filter: null,
            price_range: { min: 0, max: 999999 },
            spec_filters: {},
            results: []
        };

        let keyword = query.trim().replace(/-/g, '');
        let lowerQuery = keyword.toLowerCase();

        // 1. 意图解析 & 规格提取
        // 提取类别
        if (lowerQuery.includes('钻具') || lowerQuery.includes('捞沙斗') || lowerQuery.includes('筒钻') || lowerQuery.includes('螺旋钻') || lowerQuery.includes('截齿') || lowerQuery.includes('销子') || lowerQuery.includes('钳') || lowerQuery.includes('拔齿器')) {
            result.category_filter = '钻具类';
        } else if (lowerQuery.includes('导管') || lowerQuery.includes('料斗') || lowerQuery.includes('接头') || lowerQuery.includes('公扣') || lowerQuery.includes('母扣') || lowerQuery.includes('衬套') || lowerQuery.includes('井口架')) {
            result.category_filter = '导管类';
        }

        // 提取关键词
        const keywords = lowerQuery.match(/[\u4e00-\u9fff]+/g) || [];
        result.search_keywords = keywords;

        // 提取价格区间
        const priceMatch = lowerQuery.match(/(\d+)(?:-|到)(\d+)/);
        if (priceMatch) {
            result.price_range.min = parseInt(priceMatch[1], 10);
            result.price_range.max = parseInt(priceMatch[2], 10);
            lowerQuery = lowerQuery.replace(priceMatch[0], '');
        } else {
            const priceUnderMatch = lowerQuery.match(/(\d+)以[内下]/);
            if (priceUnderMatch) {
                result.price_range.max = parseInt(priceUnderMatch[1], 10);
            }
        }

        // 提取规格参数
        const mmMatch = lowerQuery.match(/(\d+\.?\d*)mm/);
        if (mmMatch) {
            result.spec_filters['壁厚/直径'] = `${mmMatch[1]}mm`;
            lowerQuery = lowerQuery.replace(mmMatch[0], '');
        }

        const mMatch = lowerQuery.match(/(\d+\.?\d*)m(?!m)/);
        if (mMatch) {
            result.spec_filters['长度'] = `${mMatch[1]}m`;
            lowerQuery = lowerQuery.replace(mMatch[0], '');
        }

        const exactNumberMatches = lowerQuery.match(/\d+\.?\d*/g) || [];
        if (exactNumberMatches.length > 0 && !result.spec_filters['型号/尺寸']) {
            result.spec_filters['型号/尺寸'] = exactNumberMatches[0];
            if (exactNumberMatches.length > 1 && !result.spec_filters['壁厚/直径']) {
                result.spec_filters['壁厚/辅尺寸'] = exactNumberMatches[1];
            }
        }

        // 2. 匹配评分 (0-100)
        let matchedProducts = products.map(p => {
            let score = 0;
            const searchTarget = `${p.name} ${p.description || ''} ${p.sku || ''}`.toLowerCase();

            // 基础类别过滤
            if (result.category_filter && p.category !== result.category_filter) {
                return { product: p, score: 0 };
            }

            // 价格区间过滤
            if (p.price && (p.price < result.price_range.min || p.price > result.price_range.max)) {
                return { product: p, score: 0 };
            }

            // 关键词匹配 (30分)
            let keywordMatched = false;
            for (const kw of result.search_keywords) {
                if (searchTarget.includes(kw)) {
                    score += 15;
                    keywordMatched = true;
                }
            }
            if (result.search_keywords.length === 0) keywordMatched = true;

            // 核心规格匹配 (型号/尺寸 40分)
            const pModelMatch = p.description ? p.description.match(/(?:型号|尺寸)[：:\s]*(\d+\.?\d*)/) : null;
            const pNameNumMatch = p.name.match(/^(\d+\.?\d*)/);
            const pSize = pModelMatch ? pModelMatch[1] : (pNameNumMatch ? pNameNumMatch[1] : null);

            let specMatchBonus = 0;
            if (result.spec_filters['型号/尺寸'] && pSize === result.spec_filters['型号/尺寸']) {
                specMatchBonus += 40;
            } else if (result.spec_filters['型号/尺寸'] && searchTarget.includes(result.spec_filters['型号/尺寸'])) {
                specMatchBonus += 25; // 模糊包含
            }

            // 次要规格匹配 (壁厚/长度 20分)
            if (result.spec_filters['长度'] && searchTarget.includes(result.spec_filters['长度'])) {
                specMatchBonus += 15;
            }
            if (result.spec_filters['壁厚/直径'] && searchTarget.includes(result.spec_filters['壁厚/直径'])) {
                specMatchBonus += 15;
            } else if (result.spec_filters['壁厚/辅尺寸'] && searchTarget.includes(result.spec_filters['壁厚/辅尺寸'])) {
                specMatchBonus += 10;
            }

            // SKU精确匹配 (绝对置信 100分)
            if (lowerQuery && p.sku && p.sku.toLowerCase().includes(lowerQuery)) {
                score = 100;
            } else {
                score += specMatchBonus;
            }

            // 全文兜底完全匹配加分 (10分)
            const querySegments = keyword.toLowerCase().match(/[\u4e00-\u9fff]+|[a-z0-9.]+/gi) || [keyword.toLowerCase()];
            if (score < 100 && querySegments.length > 0 && querySegments.every(seg => searchTarget.includes(seg))) {
                score += (result.search_keywords.length === 0 && specMatchBonus === 0) ? 60 : 20;
            }

            // 完全匹配产品名称 (特别针对如 "销子", "拔齿器" 此类没有规格的短名词)
            if (result.search_keywords.length > 0 && result.search_keywords.some(kw => p.name.includes(kw))) {
                if (Object.keys(result.spec_filters).length === 0) {
                    score += 50; // 没有规格并且名字对的上，大幅增加分数保证出列
                }
            }

            // 降权规则
            const excludeWords = ['钻宝', 'SMS6系', '钻金'];
            for (const word of excludeWords) {
                if (p.name.includes(word) && !keyword.includes(word)) {
                    score -= 50;
                }
            }

            return { product: p, score: Math.min(100, score) };
        }).filter(item => item.score > 30); // 设定匹配阀值

        // 按分数排序
        matchedProducts.sort((a, b) => b.score - a.score);

        // 格式化输出
        result.results = matchedProducts.map(item => ({
            id: item.product.id,
            name: item.product.name,
            category: item.product.category,
            sku: item.product.sku || '',
            price: item.product.price,
            description: item.product.description || '',
            match_score: item.score
        }));

        return result;
    }

    const testCases = [
        "219 方丝",
        "219 4m",
        "219 方丝 4m",
        "300",
        "3m",
        "260 尖丝 1.5",
        "料斗",
        "料斗 0.5",
        "公扣",
        "3.5mm",
        "4",
        "销子",
        "装齿钳",
        "拔齿器"
    ];

    for (const tc of testCases) {
        const resultJSON = search(tc);
        console.log(`\n=== 搜寻意图解析: "${tc}" ===`);
        console.log(JSON.stringify(resultJSON, null, 2));
    }
}

run().catch(console.error);
