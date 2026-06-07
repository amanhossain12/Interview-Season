"use client";

import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resumeApi, interviewApi } from "@/lib/api";
import {
  Play, Loader2, Plus, Clock, Brain, Mic, X,
  Sparkles, ChevronRight, Target, Zap, CheckCircle2,
  BarChart3, ArrowRight, Layers
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useAuthStore } from "@/stores/authStore";

const EXPERIENCE_LEVELS = [
  { value: "JUNIOR", label: "Junior", emoji: "🌱", years: "0–2 yrs" },
  { value: "MID", label: "Mid", emoji: "🚀", years: "2–5 yrs" },
  { value: "SENIOR", label: "Senior", emoji: "⚡", years: "5–8 yrs" },
  { value: "LEAD", label: "Lead", emoji: "🎯", years: "8+ yrs" },
];

const QUESTION_CATEGORIES = [
  { value: "HR", label: "HR", color: "from-blue-500 to-blue-600" },
  { value: "TECHNICAL", label: "Technical", color: "from-violet-500 to-violet-600" },
  { value: "BEHAVIORAL", label: "Behavioral", color: "from-emerald-500 to-emerald-600" },
  { value: "PROJECT", label: "Project", color: "from-amber-500 to-amber-600" },
  { value: "SYSTEM_DESIGN", label: "System Design", color: "from-rose-500 to-rose-600" },
];

const INTERVIEW_TYPES = [
  { value: "TEXT", label: "Text", icon: "⌨️", desc: "Type your answers" },
  { value: "VOICE", label: "Voice", icon: "🎤", desc: "Speak your answers" },
  { value: "MIXED", label: "Mixed", icon: "🔀", desc: "Text and voice" },
];

function SessionCard({ session }: { session: any }) {
  const statusConfig: Record<string, { cls: string; label: string }> = {
    IN_PROGRESS: { cls: "bg-amber-500/10 text-amber-500 border-amber-500/20", label: "In Progress" },
    COMPLETED: { cls: "bg-emerald-500/10 text-emerald-500 border-emerald-500/20", label: "Completed" },
    ABANDONED: { cls: "bg-red-500/10 text-red-500 border-red-500/20", label: "Abandoned" },
  };
  const cfg = statusConfig[session.status] || { cls: "bg-muted text-muted-foreground border-border", label: session.status };

  return (
    <Link
      href={session.status === "COMPLETED" ? `/interview/${session.id}/report` : `/interview/${session.id}/room`}
      className="group flex items-center gap-4 p-4 rounded-2xl border border-border bg-card hover:border-primary/40 hover:bg-primary/5 transition-all duration-200"
    >
      <div className="w-11 h-11 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
        <Brain className="w-5 h-5 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{session.title || "Mock Interview"}</div>
        <div className="text-xs text-muted-foreground mt-0.5">
          {session.targetRole || "General"} &bull; {new Date(session.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
        </div>
      </div>
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="w-3 h-3" />
          {Math.round((session.durationSeconds || 0) / 60)}m
        </div>
        <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${cfg.cls}`}>
          {cfg.label}
        </span>
        <ChevronRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 transition-all" />
      </div>
    </Link>
  );
}

export default function InterviewPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [form, setForm] = useState({
    targetRole: "",
    experienceLevel: "MID",
    interviewType: "TEXT",
    resumeId: "",
    questionCategories: ["HR", "TECHNICAL", "BEHAVIORAL"],
  });

  const { data: resumesData } = useQuery({
    queryKey: ["resumes"],
    queryFn: () => resumeApi.getAll(),
  });

  const { data: sessionsData, isLoading } = useQuery({
    queryKey: ["interview-sessions"],
    queryFn: () => interviewApi.getSessions(0, 20),
  });

  const sessions = sessionsData?.data?.data?.content || [];
  const resumes = resumesData?.data?.data || [];

  // Auto-open modal on first visit (no sessions)
  useEffect(() => {
    console.log("[INTERVIEW_PAGE_LOADED] Interview dashboard mounted. User:", user?.email);
    if (!isLoading && sessions.length === 0) {
      const timer = setTimeout(() => setShowCreateModal(true), 600);
      return () => clearTimeout(timer);
    }
  }, [isLoading, sessions.length]);

  const createMutation = useMutation({
    mutationFn: () => interviewApi.createSession(form),
    onSuccess: (response) => {
      const session = response.data.data;
      queryClient.invalidateQueries({ queryKey: ["interview-sessions"] });
      toast.success("Interview session ready! Let's go 🚀");
      setShowCreateModal(false);
      router.push(`/interview/${session.id}/room`);
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Failed to create session");
    },
  });

  const toggleCategory = (cat: string) => {
    setForm((prev) => ({
      ...prev,
      questionCategories: prev.questionCategories.includes(cat)
        ? prev.questionCategories.filter((c) => c !== cat)
        : [...prev.questionCategories, cat],
    }));
  };

  const completedCount = sessions.filter((s: any) => s.status === "COMPLETED").length;
  const inProgressCount = sessions.filter((s: any) => s.status === "IN_PROGRESS").length;

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">

      {/* Hero Banner */}
      <div className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-violet-700 p-8 text-white">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.05)_1px,transparent_1px),linear-gradient(to_right,rgba(255,255,255,0.05)_1px,transparent_1px)] bg-[size:40px_40px]" />
        <div className="absolute top-4 right-4 w-64 h-64 rounded-full bg-white/5 blur-3xl" />
        <div className="relative z-10">
          <div className="flex items-start justify-between">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-5 h-5 text-yellow-300" />
                <span className="text-sm font-medium text-white/80">AI-Powered Mock Interview</span>
              </div>
              <h1 className="text-3xl font-bold mb-2">
                Ready to ace your next interview, {user?.firstName}?
              </h1>
              <p className="text-white/70 max-w-md">
                Practice with a real-time AI interviewer tailored to your role. Get instant feedback on every answer.
              </p>
              <div className="flex flex-wrap gap-3 mt-6">
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-primary font-bold text-sm hover:bg-white/90 transition-all hover:scale-[1.02] shadow-lg"
                >
                  <Play className="w-4 h-4" />
                  Start New Interview
                </button>
                {sessions.length > 0 && (
                  <button
                    onClick={() => document.getElementById("sessions-list")?.scrollIntoView({ behavior: "smooth" })}
                    className="flex items-center gap-2 px-6 py-3 rounded-xl border border-white/30 text-white font-semibold text-sm hover:bg-white/10 transition-all"
                  >
                    <Layers className="w-4 h-4" />
                    View Sessions
                  </button>
                )}
              </div>
            </div>
            <div className="hidden lg:flex items-center justify-center w-32 h-32 rounded-3xl bg-white/10 backdrop-blur">
              <Mic className="w-16 h-16 text-white/80" />
            </div>
          </div>
        </div>
      </div>

      {/* Stats Row */}
      {sessions.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          {[
            { label: "Total Sessions", value: sessions.length, icon: Brain, color: "text-primary" },
            { label: "Completed", value: completedCount, icon: CheckCircle2, color: "text-emerald-500" },
            { label: "In Progress", value: inProgressCount, icon: Zap, color: "text-amber-500" },
          ].map(({ label, value, icon: Icon, color }) => (
            <div key={label} className="rounded-2xl border border-border bg-card p-4 text-center">
              <Icon className={`w-5 h-5 mx-auto mb-2 ${color}`} />
              <div className="text-2xl font-bold">{value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
            </div>
          ))}
        </div>
      )}

      {/* Sessions */}
      <div id="sessions-list">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold">
            {sessions.length > 0 ? "Your Interview Sessions" : "No sessions yet"}
          </h2>
          {sessions.length > 0 && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-1.5 text-sm text-primary hover:underline font-medium"
            >
              <Plus className="w-4 h-4" /> New Interview
            </button>
          )}
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-[70px] rounded-2xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : sessions.length > 0 ? (
          <div className="space-y-3">
            {sessions.map((session: any) => (
              <SessionCard key={session.id} session={session} />
            ))}
          </div>
        ) : (
          <div className="rounded-3xl border-2 border-dashed border-border bg-card/50 p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Mic className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Your first interview is waiting!</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-6">
              Click below to set up your personalized AI mock interview — takes 30 seconds.
            </p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:bg-primary/90 transition-all hover:scale-[1.02]"
            >
              <Play className="w-5 h-5" /> Start First Interview
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>

      {/* ─── Create Interview Modal ─── */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-background/80 backdrop-blur-md"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="relative z-10 w-full max-w-lg rounded-3xl border border-border bg-card shadow-2xl overflow-hidden animate-fade-in">
            {/* Modal Header */}
            <div className="bg-gradient-to-r from-primary/10 to-violet-500/10 border-b border-border px-6 py-5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                    <Brain className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold">Configure Interview</h2>
                    <p className="text-xs text-muted-foreground">Set up your AI mock interview</p>
                  </div>
                </div>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="w-8 h-8 rounded-lg hover:bg-accent flex items-center justify-center transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
              {/* Target Role */}
              <div>
                <label className="block text-sm font-semibold mb-2 flex items-center gap-1.5">
                  <Target className="w-3.5 h-3.5 text-primary" /> Target Role <span className="text-destructive">*</span>
                </label>
                <input
                  type="text"
                  value={form.targetRole}
                  onChange={(e) => setForm({ ...form, targetRole: e.target.value })}
                  placeholder="e.g., Software Engineer, Frontend Developer..."
                  className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all placeholder:text-muted-foreground"
                  autoFocus
                />
              </div>

              {/* Experience Level */}
              <div>
                <label className="block text-sm font-semibold mb-2">Experience Level</label>
                <div className="grid grid-cols-4 gap-2">
                  {EXPERIENCE_LEVELS.map(({ value, label, emoji, years }) => (
                    <button
                      key={value}
                      onClick={() => setForm({ ...form, experienceLevel: value })}
                      className={`p-2.5 rounded-xl border text-center transition-all ${
                        form.experienceLevel === value
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border hover:border-primary/40 hover:bg-accent/50"
                      }`}
                    >
                      <div className="text-base mb-0.5">{emoji}</div>
                      <div className="text-xs font-semibold">{label}</div>
                      <div className="text-[10px] text-muted-foreground">{years}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Interview Mode */}
              <div>
                <label className="block text-sm font-semibold mb-2">Interview Mode</label>
                <div className="grid grid-cols-3 gap-2">
                  {INTERVIEW_TYPES.map(({ value, label, icon, desc }) => (
                    <button
                      key={value}
                      onClick={() => setForm({ ...form, interviewType: value })}
                      className={`p-3 rounded-xl border text-center transition-all ${
                        form.interviewType === value
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border hover:border-primary/40 hover:bg-accent/50"
                      }`}
                    >
                      <div className="text-xl mb-1">{icon}</div>
                      <div className="text-xs font-semibold">{label}</div>
                      <div className="text-[10px] text-muted-foreground">{desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Question Categories */}
              <div>
                <label className="block text-sm font-semibold mb-2">Question Types</label>
                <div className="flex flex-wrap gap-2">
                  {QUESTION_CATEGORIES.map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => toggleCategory(value)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                        form.questionCategories.includes(value)
                          ? "bg-primary/10 border-primary text-primary"
                          : "border-border hover:border-primary/40"
                      }`}
                    >
                      {form.questionCategories.includes(value) && (
                        <CheckCircle2 className="w-3 h-3 inline mr-1" />
                      )}
                      {label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Resume */}
              {resumes.filter((r: any) => r.status === "ANALYZED").length > 0 && (
                <div>
                  <label className="block text-sm font-semibold mb-2">
                    Resume <span className="text-muted-foreground font-normal">(optional — for personalised questions)</span>
                  </label>
                  <select
                    value={form.resumeId}
                    onChange={(e) => setForm({ ...form, resumeId: e.target.value })}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  >
                    <option value="">No resume (generic questions)</option>
                    {resumes
                      .filter((r: any) => r.status === "ANALYZED")
                      .map((resume: any) => (
                        <option key={resume.id} value={resume.id}>
                          {resume.originalName}
                        </option>
                      ))}
                  </select>
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="border-t border-border px-6 py-4 flex gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 py-3 rounded-xl border border-border text-sm font-semibold hover:bg-accent transition-all"
              >
                Cancel
              </button>
              <button
                onClick={() => createMutation.mutate()}
                disabled={!form.targetRole.trim() || createMutation.isPending}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-bold hover:bg-primary/90 transition-all disabled:opacity-50 hover:scale-[1.02]"
              >
                {createMutation.isPending ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> Setting up...</>
                ) : (
                  <><Play className="w-4 h-4" /> Start Interview <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
