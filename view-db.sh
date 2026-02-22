#!/bin/bash

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
DB_PATH="$SCRIPT_DIR/server/database.db"

show_menu() {
    echo ""
    echo "======================================"
    echo "       数据库查看工具"
    echo "======================================"
    echo ""
    echo "1. 查看所有表"
    echo "2. 查看产品表 (products)"
    echo "3. 查看客户表 (customers)"
    echo "4. 查看成本表 (costs)"
    echo "5. 查看货币表 (currencies)"
    echo "6. 查看税费单位表 (taxes_units)"
    echo "7. 查看市场渠道表 (markets_channels)"
    echo "8. 查看港口表 (ports)"
    echo "9. 查看运费表 (freight_rates)"
    echo "10. 查看报价项目表 (quote_items)"
    echo "11. 查看用户表 (users)"
    echo "12. 查看回收站 (recycle_bin)"
    echo "13. 查看系统设置 (system_settings)"
    echo "14. 查看审计日志 (audit_logs)"
    echo "15. 自定义SQL查询"
    echo "0. 退出"
    echo ""
    echo -n "请选择: "
}

view_table() {
    local table=$1
    echo ""
    echo "=== $table 表数据 ==="
    echo ""
    sqlite3 -header -column "$DB_PATH" "SELECT * FROM $table LIMIT 50;"
    echo ""
    local count=$(sqlite3 "$DB_PATH" "SELECT COUNT(*) FROM $table;")
    echo "总计: $count 条记录"
}

custom_query() {
    echo ""
    echo -n "输入SQL查询语句: "
    read query
    echo ""
    sqlite3 -header -column "$DB_PATH" "$query;"
}

while true; do
    show_menu
    read choice
    
    case $choice in
        1)
            echo ""
            echo "=== 所有表 ==="
            sqlite3 "$DB_PATH" ".tables"
            ;;
        2) view_table "products" ;;
        3) view_table "customers" ;;
        4) view_table "costs" ;;
        5) view_table "currencies" ;;
        6) view_table "taxes_units" ;;
        7) view_table "markets_channels" ;;
        8) view_table "ports" ;;
        9) view_table "freight_rates" ;;
        10) view_table "quote_items" ;;
        11) view_table "users" ;;
        12) view_table "recycle_bin" ;;
        13) view_table "system_settings" ;;
        14) view_table "audit_logs" ;;
        15) custom_query ;;
        0)
            echo ""
            echo "再见!"
            exit 0
            ;;
        *)
            echo ""
            echo "无效选择，请重试"
            ;;
    esac
done
