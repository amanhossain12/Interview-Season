"use client";

import { useQuery } from "@tanstack/react-query";
import { dashboardApi } from "@/lib/api";
import { useAuthStore } from "@/stores/authStore";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import {
  Brain, TrendingUp, FileText, Target, Mic, Code2,
  ArrowRight, Clock, Award, Zap, ChevronRight, Flame
} from "lucide-react";
import Link from "next/link";



function StatCard({
  title, value, subtitle, icon: Icon, color, trend
}: {
  title: string; value: string | number; subtitle?: string;
  icon: any; color: string; trend?: string;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 hover:border-primary/20 transition-all duration-300 group">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold mt-2 tracking-tight">{value}</p>
          {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
          {trend && (
            <div className="flex items-center gap-1 mt-2">
              <TrendingUp className="w-3 h-3 text-green-500" />
              <span className="text-xs text-green-500">{trend}</span>
            </div>
          )}
        </div>
        <div className={`p-3 rounded-xl ${color} group-hover:scale-110 transition-transform`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
      </div>
    </div>
  );
}

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-border bg-card p-6 animate-pulse">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <div className="h-3 w-24 bg-muted rounded mb-3" />
          <div className="h-8 w-16 bg-muted rounded mb-2" />
          <div className="h-2 w-32 bg-muted rounded" />
        </div>
        <div className="w-11 h-11 rounded-xl bg-muted" />
      </div>
    </div>
  );
}

const quickActions = [
  { href: "/interview", icon: Mic, label: "Start Interview", desc: "Practice with AI", color: "bg-purple-500/10 text-purple-400 border-purple-500/20" },
  { href: "/resume", icon: FileText, label: "Analyze Resume", desc: "Get ATS score", color: "bg-blue-500/10 text-blue-400 border-blue-500/20" },
  { href: "/coding", icon: Code2, label: "Coding Practice", desc: "Solve problems", color: "bg-green-500/10 text-green-400 border-green-500/20" },
  { href: "/job-match", icon: Target, label: "Match Job", desc: "Find skill gaps", color: "bg-orange-500/10 text-orange-400 border-orange-500/20" },
];

export default function DashboardPage() {
  const { user } = useAuthStore();

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: () => dashboardApi.getStats(),
  });

  const { data: progressData, isLoading: progressLoading } = useQuery({
    queryKey: ["dashboard-progress"],
    queryFn: () => dashboardApi.getProgress(),
  });

  const stats = statsData?.data?.data;
  const progress = progressData?.data?.data || [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {greeting}, {user?.firstName} 👋
          </h1>
          <p className="text-muted-foreground mt-1">
            Here&apos;s your interview preparation overview
          </p>
        </div>
        <Link
          href="/interview"
          className="hidden sm:flex items-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02]"
        >
          <Mic className="w-4 h-4" />
          Start Interview
        </Link>
      </div>

      {/* Stats grid */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statsLoading ? (
          Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)
        ) : (
          <>
            <StatCard
              title="Total Interviews"
              value={stats?.totalInterviews ?? 0}
              subtitle="Completed sessions"
              icon={Brain}
              color="bg-purple-500"
              trend="+3 this week"
            />
            <StatCard
              title="Average Score"
              value={`${stats?.averageScore ?? 0}%`}
              subtitle="Overall performance"
              icon={Award}
              color="bg-blue-500"
              trend="+5% vs last week"
            />
            <StatCard
              title="Resumes Analyzed"
              value={stats?.totalResumes ?? 0}
              subtitle="With ATS scoring"
              icon={FileText}
              color="bg-green-500"
            />
            <StatCard
              title="Current Streak"
              value="7 days"
              subtitle="Keep it going!"
              icon={Flame}
              color="bg-orange-500"
            />
          </>
        )}
      </div>

      {/* Charts row */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Weekly progress */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="font-semibold">Weekly Progress</h2>
              <p className="text-sm text-muted-foreground">Interviews completed per week</p>
            </div>
            <div className="flex items-center gap-1.5 text-xs text-green-500 bg-green-500/10 px-2.5 py-1 rounded-full">
              <TrendingUp className="w-3 h-3" />
              <span>+12% vs last month</span>
            </div>
          </div>

          {progressLoading ? (
            <div className="h-48 bg-muted animate-pulse rounded-xl" />
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={progress} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis dataKey="week" tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 12, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                <Tooltip
                  contentStyle={{
                    background: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "0.75rem",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="interviews" fill="hsl(var(--primary))" radius={[6, 6, 0, 0] as [number, number, number, number]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Score breakdown */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <div className="mb-6">
            <h2 className="font-semibold">Score Breakdown</h2>
            <p className="text-sm text-muted-foreground">Your performance metrics</p>
          </div>

          <div className="space-y-4">
            {[
              { label: "Technical", score: 78, color: "bg-purple-500" },
              { label: "Communication", score: 85, color: "bg-blue-500" },
              { label: "Confidence", score: 72, color: "bg-green-500" },
              { label: "Problem Solving", score: 80, color: "bg-orange-500" },
            ].map(({ label, score, color }) => (
              <div key={label}>
                <div className="flex items-center justify-between text-sm mb-1.5">
                  <span className="text-muted-foreground">{label}</span>
                  <span className="font-medium">{score}%</span>
                </div>
                <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${color} transition-all duration-1000 ease-out`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Actions + Recent */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Quick Actions */}
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-semibold mb-4">Quick Actions</h2>
          <div className="space-y-3">
            {quickActions.map(({ href, icon: Icon, label, desc, color }) => (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 p-3 rounded-xl border ${color} hover:scale-[1.01] transition-all group`}
              >
                <div className="flex-shrink-0">
                  <Icon className="w-[18px] h-[18px]" />
                </div>
                <div className="flex-1">
                  <div className="text-sm font-medium">{label}</div>
                  <div className="text-xs opacity-70">{desc}</div>
                </div>
                <ChevronRight className="w-4 h-4 opacity-50 group-hover:opacity-100 transition-opacity" />
              </Link>
            ))}
          </div>
        </div>

        {/* Recent Interviews */}
        <div className="lg:col-span-2 rounded-2xl border border-border bg-card p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold">Recent Interviews</h2>
            <Link href="/interview" className="text-sm text-primary hover:underline flex items-center gap-1">
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {stats?.recentSessions?.length === 0 || !stats?.recentSessions ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
                <Mic className="w-8 h-8 text-primary" />
              </div>
              <h3 className="font-medium mb-1">No interviews yet</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Start your first AI mock interview to see your progress
              </p>
              <Link
                href="/interview"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all"
              >
                <Zap className="w-4 h-4" />
                Start Now
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {stats.recentSessions.map((session: any) => (
                <Link
                  key={session.id}
                  href={`/interview/${session.id}/report`}
                  className="flex items-center gap-4 p-3 rounded-xl hover:bg-accent transition-all group"
                >
                  <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{session.title || "Mock Interview"}</div>
                    <div className="text-xs text-muted-foreground">
                      {session.targetRole} • {new Date(session.completedAt).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="text-sm font-semibold text-primary">—</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {Math.round((session.durationSeconds || 0) / 60)}m
                    </div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
