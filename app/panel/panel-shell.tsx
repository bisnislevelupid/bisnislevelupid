"use client";

import Link from "next/link";
import { useState, type CSSProperties } from "react";
import { usePathname } from "next/navigation";
import {
  BadgePlus,
  BarChart3,
  Bell,
  BookOpen,
  CheckSquare,
  ChevronDown,
  ClipboardList,
  CreditCard,
  ExternalLink,
  FolderTree,
  GitBranch,
  Handshake,
  HelpCircle,
  KeyRound,
  Layers,
  LayoutDashboard,
  Library,
  Lightbulb,
  List,
  Mail,
  Menu,
  Package,
  PanelsTopLeft,
  PieChart,
  Quote,
  Receipt,
  ScrollText,
  Settings,
  Share2,
  Shield,
  ShoppingCart,
  Tags,
  Ticket,
  TicketCheck,
  Timer,
  TrendingUp,
  UserCog,
  Users,
  Wallet,
  X,
  Zap,
  type LucideIcon,
} from "lucide-react";
import { PANEL_SECTIONS, sectionForPath } from "@/lib/admin/resources";

const ICONS: Record<string, LucideIcon> = {
  BadgePlus,
  BarChart3,
  Bell,
  BookOpen,
  CheckSquare,
  ClipboardList,
  CreditCard,
  FolderTree,
  GitBranch,
  Handshake,
  HelpCircle,
  KeyRound,
  Layers,
  LayoutDashboard,
  Library,
  Lightbulb,
  List,
  Mail,
  Package,
  PanelsTopLeft,
  PieChart,
  Quote,
  Receipt,
  ScrollText,
  Settings,
  Share2,
  Shield,
  ShoppingCart,
  Tags,
  Ticket,
  TicketCheck,
  Timer,
  UserCog,
  Users,
  Wallet,
  Zap,
};

function navItem(active: boolean): CSSProperties {
  return {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    padding: "10px 12px",
    borderRadius: 10,
    background: active ? "rgba(16,185,129,.18)" : "transparent",
    color: active ? "#34d399" : "#cbd5e1",
    border: active ? "1px solid rgba(52,211,153,.3)" : "1px solid transparent",
    fontWeight: active ? 700 : 500,
    fontSize: "0.88rem",
    textAlign: "left",
  };
}

export function PanelShell({
  children,
  pending,
  adminName,
  statusLabel,
  statusTitle,
}: {
  children: React.ReactNode;
  pending: number;
  adminName: string;
  statusLabel: string;
  statusTitle: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const section = sectionForPath(pathname);
  const sectionHref = section?.href ?? null;
  const [expanded, setExpanded] = useState<string | null>(sectionHref);
  const [seenSection, setSeenSection] = useState(sectionHref);
  if (seenSection !== sectionHref) {
    setSeenSection(sectionHref);
    if (sectionHref) setExpanded(sectionHref);
  }

  return (
    <div className="admin-root" style={{ display: "flex", minHeight: "100vh", background: "#f8fafc", color: "#0f172a" }}>
      {open ? <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, background: "rgba(15,23,42,.5)", zIndex: 90 }} /> : null}
      <aside
        style={{
          width: 260,
          background: "#091e1b",
          color: "#f8fafc",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          position: "fixed",
          top: 0,
          bottom: 0,
          left: 0,
          zIndex: 100,
          transform: open ? "translateX(0)" : undefined,
        }}
        className="admin-sidebar"
      >
        <div style={{ overflow: "auto" }}>
          <div style={{ height: 76, padding: "0 20px", display: "flex", alignItems: "center", gap: 10, borderBottom: "1px solid rgba(255,255,255,.08)" }}>
            <div style={{ width: 32, height: 32, borderRadius: 8, background: "linear-gradient(135deg,#10b981,#059669)", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <TrendingUp size={18} />
            </div>
            <div>
              <div style={{ fontWeight: 800 }}>Bisnis<span style={{ color: "#34d399" }}>LevelUp</span></div>
              <div style={{ fontSize: "0.65rem", color: "#6ee7b7", letterSpacing: "0.05em" }}>PANEL ADMINISTRATOR</div>
            </div>
            <button type="button" onClick={() => setOpen(false)} className="mobile-close-sidebar" style={{ marginLeft: "auto", display: "none", background: "transparent", border: "none", color: "#94a3b8" }}>
              <X size={18} />
            </button>
          </div>
          <div style={{ padding: "20px 14px" }}>
            <nav style={{ display: "flex", flexDirection: "column", gap: 4 }}>
              {PANEL_SECTIONS.map((item) => {
                const Icon = ICONS[item.icon] ?? LayoutDashboard;
                const active = item.href === "/panel" ? pathname === "/panel" : section?.href === item.href;
                const isOpen = expanded === item.href;
                if (!item.tabs.length) {
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setOpen(false)}
                      style={navItem(active)}
                    >
                      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Icon size={18} />
                        {item.label}
                      </span>
                    </Link>
                  );
                }
                return (
                  <div key={item.href}>
                    <button type="button" onClick={() => setExpanded(isOpen ? null : item.href)} style={{ ...navItem(active), width: "100%", cursor: "pointer" }}>
                      <span style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <Icon size={18} />
                        {item.label}
                      </span>
                      <span style={{ display: "flex", alignItems: "center", gap: 6 }}>
                        {item.label === "Pembayaran" && pending > 0 ? (
                          <span style={{ fontSize: "0.68rem", background: "#10b981", color: "#fff", borderRadius: 999, padding: "2px 6px" }}>{pending}</span>
                        ) : null}
                        <ChevronDown size={16} style={{ transform: isOpen ? "rotate(180deg)" : "none" }} />
                      </span>
                    </button>
                    {isOpen ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: 2, margin: "4px 0 8px 16px", borderLeft: "1px solid rgba(255,255,255,.12)", paddingLeft: 8 }}>
                        {item.tabs.map((tab) => {
                          const TabIcon = ICONS[tab.icon] ?? LayoutDashboard;
                          const tabActive = pathname === tab.href || pathname.startsWith(`${tab.href}/`);
                          return (
                            <Link key={tab.href} href={tab.href} onClick={() => setOpen(false)} style={{ ...navItem(tabActive), fontSize: "0.82rem", padding: "8px 10px" }}>
                              <span style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <TabIcon size={15} />
                                {tab.label}
                              </span>
                            </Link>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </nav>
          </div>
        </div>
        <div style={{ padding: 16, borderTop: "1px solid rgba(255,255,255,.08)", background: "rgba(0,0,0,.2)" }}>
          <div style={{ display: "flex", gap: 10, marginBottom: 12 }}>
            <div style={{ width: 38, height: 38, borderRadius: "50%", background: "#059669", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: 800 }}>{adminName.slice(0, 1).toUpperCase()}</div>
            <div>
              <div style={{ fontWeight: 700, fontSize: "0.86rem" }}>{adminName}</div>
              <div style={{ fontSize: "0.72rem", color: "#6ee7b7" }}>Super Admin</div>
            </div>
          </div>
          <form action="/api/logout" method="post" style={{ marginBottom: 8 }}>
            <input type="hidden" name="realm" value="superadmin" />
            <button type="submit" style={{ width: "100%", background: "transparent", color: "#fecaca", border: "1px solid rgba(254,202,202,.35)", borderRadius: 8, padding: 7, fontSize: "0.75rem", cursor: "pointer" }}>
              Keluar
            </button>
          </form>
          <Link href="/" style={{ display: "flex", justifyContent: "center", gap: 6, border: "1px solid rgba(255,255,255,.12)", borderRadius: 8, padding: 7, fontSize: "0.75rem", color: "#cbd5e1" }}>
            <ExternalLink size={13} /> Web Publik
          </Link>
        </div>
      </aside>
      <div className="admin-main" style={{ flex: 1, marginLeft: 260, display: "flex", flexDirection: "column", minWidth: 0 }}>
        <header className="admin-header" style={{ height: 76, background: "#fff", borderBottom: "1px solid #e2e8f0", padding: "0 32px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 40 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <button type="button" className="mobile-hamburger-btn" onClick={() => setOpen(true)} style={{ display: "none", background: "transparent", border: "none" }}>
              <Menu size={22} />
            </button>
            <div>
              <div style={{ fontSize: "0.78rem", color: "#64748b" }}>Dashboard Administrator</div>
              <div style={{ fontSize: "1.15rem", fontWeight: 800 }}>BisnisLevelUp Backoffice</div>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div title={statusTitle} className="admin-status" style={{ display: "flex", alignItems: "center", gap: 6, background: "#ecfdf5", color: "#059669", fontSize: "0.75rem", fontWeight: 700, padding: "6px 12px", borderRadius: 999, border: "1px solid #a7f3d0", maxWidth: 520, lineHeight: 1.35 }}>
              <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#10b981", flex: "0 0 auto" }} />
              {statusLabel}
            </div>
            <Link href="/" style={{ border: "1px solid #e2e8f0", borderRadius: 8, padding: "7px 14px", fontSize: "0.82rem", fontWeight: 600 }}>
              Buka Web Utama
            </Link>
          </div>
        </header>
        <main style={{ padding: 32, flex: 1 }}>
          {children}
        </main>
      </div>
      <style>{`
        .admin-root, .admin-root * {
          font-family: "Source Sans Pro", sans-serif !important;
        }
        .admin-root { font-size: 13px; }
        .admin-main table thead th { background: #059669; color: #fff !important; }
        @media (max-width: 400px) {
          .admin-main { overflow-x: clip; }
          .panel-as-cards { overflow: visible !important; max-width: 100%; }
          .panel-as-cards table thead { display: none; }
          .panel-as-cards table,
          .panel-as-cards tbody,
          .panel-as-cards tr,
          .panel-as-cards td { display: block; width: 100%; max-width: 100%; }
          .panel-as-cards tr {
            border: 1px solid #e2e8f0;
            border-radius: 12px;
            margin: 0 0 12px;
            padding: 8px 12px;
            background: #fff;
          }
          .panel-as-cards td {
            display: flex;
            justify-content: space-between;
            align-items: flex-start;
            gap: 12px;
            min-width: 0;
            padding: 8px 0;
            border-bottom: 1px solid #f1f5f9;
            white-space: normal;
            overflow-wrap: anywhere;
            word-break: break-word;
          }
          .panel-as-cards td:last-child { border-bottom: none; }
          .panel-as-cards td::before {
            content: attr(data-label);
            color: #64748b;
            font-weight: 700;
            flex: 0 0 auto;
            max-width: 42%;
          }
          .panel-as-cards td[data-label=""]::before { content: none; }
          .panel-as-cards td > a,
          .panel-as-cards td > span,
          .panel-as-cards td > div {
            min-width: 0;
            overflow-wrap: anywhere;
            word-break: break-word;
            text-align: right;
          }
        }
        .admin-main .status-pill { color: #fff; }
        @media (max-width: 900px) {
          .admin-sidebar { transform: translateX(-100%); }
          .admin-main { margin-left: 0 !important; }
          .mobile-hamburger-btn, .mobile-close-sidebar { display: block !important; }
          .admin-header { height: auto !important; padding: 12px 16px !important; flex-wrap: wrap; gap: 10px; }
          .admin-status { display: none !important; }
          .admin-main > main { padding: 16px !important; }
        }
      `}</style>
    </div>
  );
}
