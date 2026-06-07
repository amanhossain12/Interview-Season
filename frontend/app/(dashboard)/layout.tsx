"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Brain, LayoutDashboard, FileText, Target, Mic, Code2,
  Map, Settings, LogOut, ChevronLeft, Menu,
  Bell, Sun, Moon, User
} from "lucide-react";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/authStore";
import { authApi } from "@/lib/api";
import { useTheme } from "next-themes";
import toast from "react-hot-toast";

const navItems = [
  { href: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
  { href: "/resume", icon: FileText, label: "Resume Analyzer" },
  { href: "/job-match", icon: Target, label: "Job Matcher" },
  { href: "/interview", icon: Mic, label: "Mock Interview" },
  { href: "/coding", icon: Code2, label: "Coding IDE" },
  { href: "/roadmap", icon: Map, label: "Learning Roadmap" },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, refreshToken, logout, isAuthenticated } = useAuthStore();
  const { theme, setTheme } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Wait for Zustand to rehydrate from localStorage before rendering
  useEffect(() => {
    setHydrated(true);
  }, []);

  if (!hydrated) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center animate-pulse">
            <Brain className="w-7 h-7 text-primary-foreground" />
          </div>
          <p className="text-muted-foreground text-sm">Loading...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      if (refreshToken) await authApi.logout(refreshToken);
    } catch {}
    logout();
    toast.success("Logged out successfully");
    router.push("/login");
  };

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-50 flex flex-col border-r border-sidebar-border bg-sidebar
          transition-all duration-300 ease-in-out
          ${collapsed ? "w-16" : "w-64"}
          ${sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
        `}
      >
        {/* Logo */}
        <div className="flex items-center h-16 px-4 border-b border-sidebar-border">
          {!collapsed && (
            <Link href="/dashboard" className="flex items-center gap-2 flex-1">
              <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center flex-shrink-0">
                <Brain className="w-5 h-5 text-primary-foreground" />
              </div>
              <span className="font-bold text-lg gradient-text">InterviewAI</span>
            </Link>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center mx-auto">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            className="hidden lg:flex p-1.5 rounded-lg hover:bg-sidebar-accent text-sidebar-foreground transition-colors ml-auto"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
          <div className="px-3 space-y-1">
            {navItems.map(({ href, icon: Icon, label }) => {
              const isActive = pathname === href || pathname.startsWith(href + "/");
              return (
                <Link
                  key={href}
                  href={href}
                  className={`
                    flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all group
                    ${isActive
                      ? "bg-primary/10 text-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    }
                  `}
                  title={collapsed ? label : undefined}
                  onClick={() => setSidebarOpen(false)}
                >
                  <Icon className={`w-[18px] h-[18px] flex-shrink-0 ${isActive ? "text-primary" : ""}`} />
                  {!collapsed && <span>{label}</span>}
                  {isActive && !collapsed && (
                    <span className="ml-auto w-1.5 h-4 rounded-full bg-primary" />
                  )}
                </Link>
              );
            })}
          </div>

          {user?.role === "ROLE_ADMIN" && (
            <div className="px-3 mt-4">
              <div className={`text-xs font-semibold text-muted-foreground uppercase tracking-wider px-3 mb-2 ${collapsed ? "hidden" : ""}`}>
                Admin
              </div>
              <Link
                href="/admin"
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all
                  ${pathname.startsWith("/admin") ? "bg-primary/10 text-primary" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}
              >
                <Settings className="w-[18px] h-[18px] flex-shrink-0" />
                {!collapsed && <span>Admin Panel</span>}
              </Link>
            </div>
          )}
        </nav>

        {/* User section */}
        <div className="border-t border-sidebar-border p-4">
          <div className={`flex items-center gap-3 ${collapsed ? "justify-center" : ""}`}>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 text-primary font-semibold text-sm">
              {user?.firstName?.charAt(0) || <User className="w-4 h-4" />}
            </div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{user?.firstName} {user?.lastName}</div>
                <div className="text-xs text-muted-foreground truncate">{user?.email}</div>
              </div>
            )}
            {!collapsed && (
              <button
                onClick={handleLogout}
                className="p-1.5 rounded-lg hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                title="Logout"
              >
                <LogOut className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-background/80 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${collapsed ? "lg:ml-16" : "lg:ml-64"}`}>
        {/* Top bar */}
        <header className="h-16 border-b border-border bg-background/80 backdrop-blur-xl flex items-center justify-between px-4 lg:px-6 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-accent transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>

          <div className="flex-1 lg:flex-none" />

          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground"
            >
              {theme === "dark" ? <Sun className="w-[18px] h-[18px]" /> : <Moon className="w-[18px] h-[18px]" />}
            </button>
            <button className="p-2 rounded-lg hover:bg-accent transition-colors text-muted-foreground hover:text-foreground relative">
              <Bell className="w-[18px] h-[18px]" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-primary" />
            </button>
            <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm ml-1">
              {user?.firstName?.charAt(0) || "U"}
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto custom-scrollbar">
          {children}
        </main>
      </div>
    </div>
  );
}
