import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";

const sidebarStyles = `
  .sidebar {
    width: 268px;
    background: #FFFFFF;
    color: #1E293B;
    display: flex;
    flex-direction: column;
    position: fixed;
    top: 0;
    left: 0;
    bottom: 0;
    z-index: 100;
    overflow-y: auto;
    border-right: 1px solid #E2E8F0;
    box-shadow: 4px 0 24px rgba(30, 41, 59, 0.02);
  }
  
  .sidebar-header {
    padding: 32px 28px 28px;
    border-bottom: 1px solid #F1F5F9;
    position: relative;
  }
  
  .sidebar-logo {
    display: flex;
    align-items: center;
    gap: 12px;
    text-decoration: none;
    transition: all 0.3s ease;
  }
  
  .sidebar-logo-text {
    font-family: 'Inter', -apple-system, sans-serif;
    font-size: 22px;
    font-weight: 800;
    letter-spacing: -0.5px;
    background: linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #334155 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  .nav-section-label {
    padding: 28px 28px 12px;
    font-size: 11px;
    font-weight: 700;
    color: #94A3B8;
    text-transform: uppercase;
    letter-spacing: 1.5px;
  }

  .nav-list {
    list-style: none;
    padding: 4px 16px;
    margin: 0;
  }
  
  .nav-link {
    display: flex;
    align-items: center;
    gap: 14px;
    padding: 14px 18px;
    color: #64748B;
    text-decoration: none;
    font-size: 14px;
    font-weight: 500;
    letter-spacing: -0.1px;
    transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    border-radius: 12px;
    margin-bottom: 4px;
    position: relative;
  }
  
  .nav-link:hover {
    color: #4169E1;
    background: rgba(65, 105, 225, 0.05);
    transform: translateX(4px);
  }
  
  .nav-link.active {
    color: #1E293B;
    background: linear-gradient(135deg, rgba(65, 105, 225, 0.12) 0%, rgba(65, 105, 225, 0.06) 100%);
    font-weight: 600;
  }
  
  .nav-link.active::before {
    content: '';
    position: absolute;
    left: 0;
    top: 50%;
    transform: translateY(-50%);
    width: 4px;
    height: 20px;
    background: #4169E1;
    border-radius: 0 4px 4px 0;
  }
  
  .nav-badge {
    margin-left: auto;
    font-size: 10px;
    font-weight: 600;
    padding: 3px 10px;
    border-radius: 999px;
    background: rgba(65, 105, 225, 0.1);
    color: #3355C0;
    letter-spacing: 0.5px;
  }
  
  .sidebar-footer {
    margin-top: auto;
    padding: 24px;
    border-top: 1px solid #F1F5F9;
    background: #FAFAFA;
  }
  
  .user-info {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px;
    background: #FFFFFF;
    border: 1px solid #E2E8F0;
    border-radius: 14px;
    margin-bottom: 12px;
    box-shadow: 0 2px 6px rgba(30, 41, 59, 0.02);
  }
  
  .user-avatar {
    width: 40px;
    height: 40px;
    background: linear-gradient(135deg, #4169E1 0%, #3355C0 100%);
    border-radius: 10px;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 16px;
    font-weight: 700;
    color: #FFFFFF;
    box-shadow: 0 4px 12px rgba(65, 105, 225, 0.2);
  }
  
  .user-name {
    font-size: 14px;
    font-weight: 600;
    color: #1E293B;
    margin: 0;
  }
  
  .user-role {
    font-size: 12px;
    color: #64748B;
    margin: 2px 0 0 0;
  }
  
  .logout-button {
    width: 100%;
    padding: 12px;
    background: #FFFFFF;
    color: #E11D48;
    border: 1px solid rgba(225, 29, 72, 0.1);
    border-radius: 12px;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    display: flex;
    align-items: center;
    gap: 8px;
    justify-content: center;
  }
  
  .logout-button:hover {
    background: rgba(225, 29, 72, 0.05);
    border-color: rgba(225, 29, 72, 0.2);
    transform: translateY(-1px);
  }
  
  .sidebar-footer-text {
    font-size: 11px;
    color: #94A3B8;
    text-align: center;
    margin-top: 16px;
    font-weight: 500;
  }
  
  .main-content {
    flex: 1;
    margin-left: 268px;
    padding: 36px 40px;
    background-color: #F8FAFC;
    min-height: 100vh;
    animation: contentFadeIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  }
  
  @keyframes contentFadeIn {
    from { 
      opacity: 0; 
      transform: translateY(12px); 
    }
    to { 
      opacity: 1; 
      transform: translateY(0); 
    }
  }
`;

export default function Layout({ children }) {
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const userData = localStorage.getItem("user");
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = async () => {
    try {
      const token = localStorage.getItem("token");
      await fetch("http://localhost:3001/api/auth/logout", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error("登出失败:", error);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      localStorage.removeItem("user");
      navigate("/login");
    }
  };

  const navItems = [
    { path: "/products", label: "产品管理", section: "业务管理" },

    { path: "/customers", label: "客户管理" },

    { path: "/freight-simulator", label: "海运费模拟", section: "业务工具" },
    { path: "/quote-generator", label: "报价生成器" },
    { path: "/currencies", label: "货币与汇率", section: "系统设置" },
    { path: "/tax-rules", label: "税费规则" },
    { path: "/system-settings", label: "系统参数" },
    { path: "/audit-logs", label: "审计日志", section: "数据管理" },
    { path: "/backup-restore", label: "备份恢复" },
    { path: "/recycle-bin", label: "回收站", section: "其他" },
  ];

  const isActive = (path) => {
    if (path === "/") return location.pathname === "/";
    return (
      location.pathname === path || location.pathname.startsWith(path + "/")
    );
  };

  const getFilteredNavItems = () => {
    if (!user) return [];
    const role = user.role || "viewer";
    if (role === "admin") return navItems;
    if (role === "sales")
      return navItems.filter((item) =>
        ["/quote-generator", "/customers"].includes(item.path),
      );
    if (role === "foreign_trade")
      return navItems.filter((item) =>
        [
          "/products",
          "/quote-generator",
          "/freight-simulator",
          "/customers",
        ].includes(item.path),
      );
    return [];
  };

  const filteredNavItems = getFilteredNavItems();

  let currentSection = null;

  const roleDisplayMap = {
    admin: "管理员",
    sales: "业务员",
    foreign_trade: "外贸员",
  };

  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "var(--bg-primary)",
      }}
    >
      <style>{sidebarStyles}</style>
      <aside className="sidebar">
        <div className="sidebar-header">
          <Link to="/" className="sidebar-logo">
            <span className="sidebar-logo-text">Vector</span>
          </Link>
        </div>
        <nav>
          {filteredNavItems.map((item) => {
            const showSection = item.section && item.section !== currentSection;
            if (item.section) currentSection = item.section;
            return (
              <div key={item.path}>
                {showSection && (
                  <div className="nav-section-label">{item.section}</div>
                )}
                <ul
                  className="nav-list"
                  style={{ padding: showSection ? "0 16px" : undefined }}
                >
                  <li>
                    <Link
                      to={item.path}
                      className={`nav-link ${isActive(item.path) ? "active" : ""}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                </ul>
              </div>
            );
          })}
        </nav>
        <div className="sidebar-footer">
          {user && (
            <div className="user-info">
              <div className="user-avatar">
                {user.full_name
                  ? user.full_name.charAt(0).toUpperCase()
                  : user.username.charAt(0).toUpperCase()}
              </div>
              <div className="user-details">
                <p className="user-name">{user.full_name || user.username}</p>
                <p className="user-role">
                  {roleDisplayMap[user.role] || "用户"}
                </p>
              </div>
            </div>
          )}
          <button className="logout-button" onClick={handleLogout}>
            退出登录
          </button>
          <div className="sidebar-footer-text">Vector v1.0</div>
        </div>
      </aside>
      <main className="main-content" key={location.pathname}>
        {children}
      </main>
    </div>
  );
}
