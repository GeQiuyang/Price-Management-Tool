import { useState, useEffect } from "react";
import Modal from "../components/Modal";
import { API_URL } from "../lib/api";

const modalAnimationStyles = `
  @keyframes modalOverlayIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
  @keyframes modalOverlayOut {
    from { opacity: 1; }
    to { opacity: 0; }
  }
  @keyframes modalSlideIn {
    from { opacity: 0; transform: translateY(32px) scale(0.95); }
    to { opacity: 1; transform: translateY(0) scale(1); }
  }
  @keyframes modalSlideOut {
    from { opacity: 1; transform: translateY(0) scale(1); }
    to { opacity: 0; transform: translateY(24px) scale(0.97); }
  }
`;

const CUSTOMER_TYPES = ["终端", "经销商"];

const COUNTRIES = [
  "中国",
  "马来西亚",
  "新加坡",
  "越南",
  "印度尼西亚",
  "泰国",
  "澳大利亚",
];

const CITIES_BY_COUNTRY = {
  中国: [
    "北京",
    "上海",
    "广州",
    "深圳",
    "天津",
    "重庆",
    "成都",
    "杭州",
    "武汉",
    "南京",
    "苏州",
    "西安",
    "长沙",
    "沈阳",
    "青岛",
    "郑州",
    "大连",
    "东莞",
    "宁波",
    "厦门",
    "福州",
    "无锡",
    "合肥",
    "昆明",
    "哈尔滨",
    "济南",
    "佛山",
    "长春",
    "温州",
    "石家庄",
    "南宁",
    "常州",
    "泉州",
    "南昌",
    "贵阳",
    "太原",
    "烟台",
    "嘉兴",
    "南通",
    "金华",
    "珠海",
    "惠州",
    "徐州",
    "海口",
    "乌鲁木齐",
    "绍兴",
    "中山",
    "台州",
    "兰州",
    "洛阳",
    "潍坊",
    "保定",
    "镇江",
    "扬州",
    "桂林",
    "唐山",
    "三亚",
    "湖州",
    "呼和浩特",
    "廊坊",
    "银川",
    "西宁",
    "芜湖",
    "漳州",
    "连云港",
    "淄博",
    "衡阳",
    "柳州",
    "汕头",
    "遵义",
    "邯郸",
    "江门",
    "泰州",
    "株洲",
    "包头",
    "威海",
    "宜昌",
    "鞍山",
    "临沂",
    "常德",
    "咸阳",
    "盐城",
    "济宁",
    "岳阳",
    "湛江",
    "秦皇岛",
    "许昌",
    "赣州",
    "九江",
    "新乡",
    "德阳",
    "绵阳",
    "宜宾",
    "南充",
    "达州",
    "襄阳",
    "荆州",
    "大庆",
    "拉萨",
  ],
  马来西亚: [
    "吉隆坡",
    "槟城",
    "新山",
    "马六甲",
    "怡保",
    "亚庇",
    "古晋",
    "关丹",
    "芙蓉",
    "莎阿南",
    "八打灵再也",
    "梳邦再也",
    "巴生",
    "太平",
    "民都鲁",
    "诗巫",
    "山打根",
  ],
  新加坡: ["新加坡"],
  越南: [
    "胡志明市",
    "河内",
    "海防",
    "岘港",
    "芽庄",
    "头顿",
    "顺化",
    "大叻",
    "富国岛",
    "归仁",
    "芹苴",
    "太原",
    "平阳",
    "同奈",
    "隆安",
    "永福",
  ],
  印度尼西亚: [
    "雅加达",
    "泗水",
    "万隆",
    "棉兰",
    "三宝垄",
    "望加锡",
    "巴淡",
    "巨港",
    "日惹",
    "登巴萨",
    "万鸦老",
    "坤甸",
    "巴厘巴板",
    "马辰",
    "北干巴鲁",
  ],
  泰国: [
    "曼谷",
    "清迈",
    "普吉",
    "芭提雅",
    "素叻他尼",
    "合艾",
    "呵叻",
    "孔敬",
    "乌汶",
    "清莱",
    "罗勇",
    "春武里",
    "北柳",
    "暖武里",
    "巴吞他尼",
  ],
  澳大利亚: [
    "悉尼",
    "墨尔本",
    "布里斯班",
    "珀斯",
    "阿德莱德",
    "堪培拉",
    "黄金海岸",
    "纽卡斯尔",
    "霍巴特",
    "达尔文",
    "凯恩斯",
    "汤斯维尔",
    "伍伦贡",
  ],
};

export default function Customers() {
  const [customers, setCustomers] = useState([]);
  const [hoveredCustomerId, setHoveredCustomerId] = useState(null);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const res = await fetch(`${API_URL}/customers`);
      const data = await res.json();
      setCustomers(data);
    } catch (err) {
      console.error("获取客户失败:", err);
    }
  };

  const [showModal, setShowModal] = useState(false);
  const [isClosing, setIsClosing] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState(null);
  const [pendingDeleteCustomer, setPendingDeleteCustomer] = useState(null);
  const [formData, setFormData] = useState({
    customer_type: "终端",
    country: "中国",
    city: "",
    contact: "",
    deal_count: 0,
  });

  const handleAdd = () => {
    setEditingCustomer(null);
    setFormData({
      customer_type: "终端",
      country: "中国",
      city: "",
      contact: "",
      deal_count: 0,
    });
    setIsClosing(false);
    setShowModal(true);
  };

  const handleEdit = (customer) => {
    setEditingCustomer(customer);
    setFormData(customer);
    setIsClosing(false);
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setIsClosing(false);
  };

  const handleDelete = (customer) => {
    setPendingDeleteCustomer(customer);
  };

  const addToRecycleBin = async (item, type) => {
    try {
      await fetch(`${API_URL}/recycle-bin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemType: type,
          itemId: item.id,
          itemData: item,
        }),
      });
      window.dispatchEvent(new CustomEvent("recycleBin-updated"));
    } catch (error) {
      console.error("添加到回收站失败:", error);
    }
  };

  const confirmDelete = async () => {
    if (!pendingDeleteCustomer) return;
    try {
      await fetch(`${API_URL}/customers/${pendingDeleteCustomer.id}`, {
        method: "DELETE",
      });
      await addToRecycleBin(pendingDeleteCustomer, "customers");
      setCustomers((prev) => prev.filter((c) => c.id !== pendingDeleteCustomer.id));
    } catch (err) {
      console.error("删除失败:", err);
    }
    setPendingDeleteCustomer(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      customer_type: formData.customer_type,
      country: formData.country,
      city: formData.city,
      contact: formData.contact,
      deal_count: Number(formData.deal_count) || 0,
    };
    try {
      if (editingCustomer) {
        await fetch(`${API_URL}/customers/${editingCustomer.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch(`${API_URL}/customers`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      await fetchCustomers();
      setShowModal(false);
    } catch (err) {
      console.error("保存客户失败:", err);
    }
  };

  const handleCountryChange = (country) => {
    setFormData({ ...formData, country, city: "" });
  };

  const availableCities = CITIES_BY_COUNTRY[formData.country] || [];

  return (
    <div style={styles.container}>
      <style>{modalAnimationStyles}</style>

      <div style={styles.topBar}>
        <h2 style={styles.pageTitle}>客户管理</h2>
        <div style={styles.topActions}>
          <button style={styles.addButton} onClick={handleAdd}>
            添加客户
          </button>
        </div>
      </div>

      <div style={styles.tableCard}>
        <table style={styles.table}>
          <thead>
            <tr style={styles.tableHeader}>
              <th style={styles.th}>客户类型</th>
              <th style={styles.th}>国家</th>
              <th style={styles.th}>城市</th>
              <th style={styles.th}>联系方式</th>
              <th style={styles.thRight}>成交次数</th>
              <th style={styles.thAction}>操作</th>
            </tr>
          </thead>
          <tbody>
            {customers.map((customer) => (
              <tr
                key={customer.id}
                style={{
                  ...styles.tableRow,
                  ...(hoveredCustomerId === customer.id ? styles.tableRowHover : {}),
                }}
                onMouseEnter={() => setHoveredCustomerId(customer.id)}
                onMouseLeave={() => setHoveredCustomerId(null)}
              >
                <td style={styles.td}>
                  <span
                    style={{
                      ...styles.typeBadge,
                      backgroundColor:
                        customer.customer_type === "终端"
                          ? "#DBEAFE"
                          : "#FEF3C7",
                      color:
                        customer.customer_type === "终端"
                          ? "#1D4ED8"
                          : "#92400E",
                    }}
                  >
                    {customer.customer_type}
                  </span>
                </td>
                <td style={styles.td}>{customer.country}</td>
                <td style={styles.td}>{customer.city}</td>
                <td style={styles.tdSecondary}>{customer.contact}</td>
                <td style={styles.tdRight}>
                  <span style={styles.dealBadge}>{customer.deal_count}</span>
                </td>
                <td style={styles.tdAction}>
                  <button
                    style={styles.editButton}
                    onClick={() => handleEdit(customer)}
                  >
                    编辑
                  </button>
                  <button
                    style={styles.deleteButton}
                    onClick={() => handleDelete(customer)}
                  >
                    删除
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingCustomer ? "编辑客户" : "添加客户"}
        width={600}
        footer={null}
      >
        <div style={styles.formScroll}>
          <form onSubmit={handleSubmit}>
            <div style={styles.formSection}>
              <div style={styles.formGroup}>
                <label style={styles.label}>客户类型</label>
                <select
                  className="sf-input"
                  value={formData.customer_type}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      customer_type: e.target.value,
                    })
                  }
                  required
                >
                  {CUSTOMER_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div style={styles.formRow}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>国家</label>
                  <select
                    className="sf-input"
                    value={formData.country}
                    onChange={(e) =>
                      handleCountryChange(e.target.value)
                    }
                    required
                  >
                    {COUNTRIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>城市</label>
                  <select
                    className="sf-input"
                    value={formData.city}
                    onChange={(e) =>
                      setFormData({ ...formData, city: e.target.value })
                    }
                    required
                  >
                    <option value="">请选择城市</option>
                    {availableCities.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={styles.formRow}>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>联系方式</label>
                  <input
                    className="sf-input"
                    value={formData.contact}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        contact: e.target.value,
                      })
                    }
                    placeholder="电话/邮箱"
                  />
                </div>
                <div style={{ ...styles.formGroup, flex: 1 }}>
                  <label style={styles.label}>成交次数</label>
                  <input
                    type="number"
                    min="0"
                    className="sf-input"
                    value={formData.deal_count}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        deal_count: e.target.value,
                      })
                    }
                  />
                </div>
              </div>
            </div>

            <div style={{ padding: '20px 0 0', display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="sf-btn sf-btn-cancel"
                onClick={handleCloseModal}
              >
                取消
              </button>
              <button
                type="submit"
                className="sf-btn sf-btn-confirm"
              >
                {editingCustomer ? "保存修改" : "添加"}
              </button>
            </div>
          </form>
        </div>
      </Modal>

      <Modal
        isOpen={Boolean(pendingDeleteCustomer)}
        onClose={() => setPendingDeleteCustomer(null)}
        title="确认删除"
        width={600}
        footer={null}
      >
        <div style={{ padding: "8px 4px 4px" }}>
          <p style={styles.confirmMessage}>确定要删除该客户吗？</p>
          <p style={styles.confirmHint}>删除后数据将进入回收站,可在回收站中恢复或永久删除。</p>
          <div style={styles.confirmActions}>
            <button type="button" className="sf-btn sf-btn-cancel" onClick={() => setPendingDeleteCustomer(null)}>
              取消
            </button>
            <button type="button" className="sf-btn sf-btn-confirm" onClick={confirmDelete}>
              确认删除
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
  },
  undoToast: {
    position: "fixed",
    top: "24px",
    right: "24px",
    backgroundColor: "var(--bg-secondary)",
    borderRadius: "var(--radius-xl)",
    padding: "16px 20px",
    display: "flex",
    alignItems: "center",
    gap: "16px",
    border: "1px solid var(--border)",
    boxShadow: "0 4px 12px rgba(0, 0, 0, 0.08)",
    zIndex: 1001,
    animation: "toastSlideIn 0.3s ease-out",
  },
  undoToastContent: {
    display: "flex",
    alignItems: "center",
    gap: "12px",
  },
  undoToastIcon: {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    backgroundColor: "#ECFDF5",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  undoToastText: {
    display: "flex",
    flexDirection: "column",
    gap: "2px",
  },
  undoToastTitle: {
    fontSize: "14px",
    fontWeight: "500",
    color: "var(--text-primary)",
  },
  undoToastDesc: {
    fontSize: "12px",
    color: "var(--text-tertiary)",
  },
  undoButton: {
    gap: "24px",
    animation: "fadeInUp 0.4s ease forwards",
  },
  topBar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
  },
  pageTitle: {fontSize: '42px',
    fontWeight: '700',
    color: '#111111',
    margin: 0,
    letterSpacing: '-0.02em',
  },
  topActions: {
    display: "flex",
    alignItems: "center",
    gap: "14px",
  },
  addButton: {
    padding: '12px 26px',
    background: '#111111',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '999px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    letterSpacing: '-0.1px',
  },
  tableCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: '18px',
    border: '1px solid #E2E8F0',
    overflow: 'hidden',
    width: '100%',
  },
  table: {
    width: "100%",
    borderCollapse: "collapse",
    tableLayout: "fixed",
  },
  tableHeader: {
    backgroundColor: "#FFFFFF",
  },
  th: {
    padding: '10px 24px 18px',
    textAlign: 'left',
    fontSize: '13px',
    fontWeight: '700',
    color: '#64748B',
    borderBottom: '1px solid #E2E8F0',
    letterSpacing: '1px',
    backgroundColor: '#FFFFFF',
    position: 'sticky',
    top: '20px',
    zIndex: 2,
  },
  thRight: {
    padding: '10px 24px 18px',
    textAlign: 'right',
    fontSize: '13px',
    fontWeight: '700',
    color: '#64748B',
    borderBottom: '1px solid #E2E8F0',
    letterSpacing: '1px',
    backgroundColor: '#FFFFFF',
    position: 'sticky',
    top: '20px',
    zIndex: 2,
  },
  thAction: {
    padding: '10px 32px 18px 24px',
    textAlign: 'right',
    fontSize: '13px',
    fontWeight: '700',
    color: '#64748B',
    borderBottom: '1px solid #E2E8F0',
    letterSpacing: '1px',
    backgroundColor: '#FFFFFF',
    position: 'sticky',
    top: '20px',
    zIndex: 2,
  },
  tableRow: {
    borderBottom: "1px solid #F1F5F9",
    transition: "background-color 0.2s ease",
    cursor: "default",
  },
  tableRowHover: {
    backgroundColor: "#F8FAFC",
  },
  td: {
    padding: '18px 24px',
    fontSize: '14px',
    color: '#1E293B',
    fontWeight: '500',
  },
  tdSecondary: {
    padding: '18px 24px',
    fontSize: '14px',
    color: '#64748B',
    fontWeight: '500',
  },
  tdRight: {
    padding: '18px 24px',
    fontSize: '14px',
    color: '#1E293B',
    textAlign: 'right',
  },
  tdAction: {
    padding: '18px 32px 18px 24px',
    textAlign: 'right',
    whiteSpace: 'nowrap',
  },
  typeBadge: {
    padding: "4px 12px",
    borderRadius: "10px",
    fontSize: "13px",
    fontWeight: "600",
  },
  dealBadge: {
    padding: "4px 12px",
    borderRadius: "10px",
    backgroundColor: "#F1F5F9",
    color: "#475569",
    fontSize: "13px",
    fontWeight: "600",
  },
  editButton: {
    padding: '8px 14px',
    backgroundColor: 'transparent',
    color: '#2563EB',
    border: '1px solid transparent',
    borderRadius: '999px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    marginRight: '8px',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  deleteButton: {
    padding: '8px 14px',
    backgroundColor: 'transparent',
    color: '#FCA5A5',
    border: '1px solid transparent',
    borderRadius: '999px',
    cursor: 'pointer',
    fontSize: '13px',
    fontWeight: '600',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  confirmMessage: {
    margin: 0,
    fontSize: "16px",
    lineHeight: "1.7",
    color: "#111111",
  },
  confirmHint: {
    margin: "12px 0 0",
    fontSize: "13px",
    lineHeight: "1.7",
    color: "#64748B",
  },
  confirmActions: {
    display: "flex",
    justifyContent: "flex-end",
    gap: "12px",
    marginTop: "24px",
  },
  modalOverlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#FFFFFF',
    padding: '0',
    borderRadius: '20px',
    border: '1px solid rgba(30, 41, 59, 0.08)',
    width: '540px',
    maxWidth: '92%',
    maxHeight: '90vh',
    display: 'flex',
    flexDirection: 'column',
    overflow: "hidden",
    boxShadow: '0 24px 48px rgba(30, 41, 59, 0.2), 0 0 0 1px rgba(65, 105, 225, 0.05)',
  },
  modalHeader: {
    padding: '24px 28px',
    borderBottom: '1px solid #F1F5F9',
    backgroundColor: '#FDFCFB',
    borderRadius: '20px 20px 0 0',
  },
  modalTitle: {
    fontFamily: "'Playfair Display', serif",
    fontSize: '20px',
    fontWeight: '600',
    margin: 0,
    color: '#1E293B',
  },
  formScroll: {
    flex: 1,
    overflowY: "auto",
  },
  formSection: {
    padding: '24px 28px',
  },
  sectionTitle: {
    fontSize: '12px',
    fontWeight: '600',
    color: '#64748B',
    marginBottom: '18px',
    textTransform: 'uppercase',
    letterSpacing: '1px',
  },
  formGroup: {
    marginBottom: "16px",
  },
  formRow: {
    display: "flex",
    gap: "18px",
  },
  label: {
    display: "block",
    marginBottom: "10px",
    fontSize: "14px",
    fontWeight: "600",
    color: "#334155",
  },
  input: {
    width: "100%",
    padding: '12px 16px',
    border: '1px solid #E2E8F0',
    borderRadius: '999px',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    color: '#1E293B',
    boxSizing: "border-box",
  },
  select: {
    width: "100%",
    padding: '12px 16px',
    border: '1px solid #E2E8F0',
    borderRadius: '999px',
    fontSize: '14px',
    backgroundColor: '#FFFFFF',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
    color: '#1E293B',
    cursor: "pointer",
    boxSizing: "border-box",
    appearance: "auto",
  },
  modalButtons: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '14px',
    padding: '20px 28px',
    backgroundColor: '#F8FAFC',
    borderTop: '1px solid #F1F5F9',
    flexShrink: 0,
    borderRadius: '0 0 20px 20px',
  },
  cancelButton: {
    padding: '12px 28px',
    backgroundColor: '#FFFFFF',
    color: '#64748B',
    border: '1px solid #E2E8F0',
    borderRadius: '999px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.25s cubic-bezier(0.4, 0, 0.2, 1)',
  },
  submitButton: {
    padding: '12px 28px',
    background: '#111111',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '999px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '600',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    boxShadow: '0 4px 16px rgba(65, 105, 225, 0.35)',
  },
};
