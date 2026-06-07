"use client";

import { useParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { interviewApi } from "@/lib/api";
import {
  Brain, Award, TrendingUp, Download, ArrowLeft, Mic, BarChart3
} from "lucide-react";
import Link from "next/link";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer } from "recharts";

function ScoreGauge({ score }: { score: number }) {
  const color = score >= 80 ? "text-green-500" : score >= 60 ? "text-yellow-500" : "text-red-500";
  const ringColor = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";

  const radius = 54;
  const circumference = Math.PI * radius; // half circle
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="relative w-32 h-20 overflow-hidden">
      <svg viewBox="0 0 120 60" className="w-32">
        <path d="M 10 60 A 50 50 0 0 1 110 60" fill="none" stroke="hsl(var(--border))" strokeWidth="10" strokeLinecap="round" />
        <path
          d="M 10 60 A 50 50 0 0 1 110 60"
          fill="none" stroke={ringColor} strokeWidth="10" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          className="transition-all duration-1000"
        />
      </svg>
      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 text-center">
        <div className={`text-2xl font-bold ${color}`}>{score}%</div>
      </div>
    </div>
  );
}

export default function InterviewReportPage() {
  const { sessionId } = useParams<{ sessionId: string }>();

  const { data: sessionData } = useQuery({
    queryKey: ["interview-session", sessionId],
    queryFn: () => interviewApi.getSession(sessionId),
  });

  const { data: feedbacksData, isLoading } = useQuery({
    queryKey: ["interview-feedbacks", sessionId],
    queryFn: () => interviewApi.getFeedbacks(sessionId),
  });

  const session = sessionData?.data?.data;
  const feedbacks = feedbacksData?.data?.data || [];

  const avgScore = feedbacks.length > 0
    ? Math.round(feedbacks.reduce((sum: number, f: any) => sum + (f.overallScore || 0), 0) / feedbacks.length * 10)
    : 0;

  const avgTechnical = feedbacks.length > 0
    ? Math.round(feedbacks.reduce((sum: number, f: any) => sum + (f.technicalScore || 0), 0) / feedbacks.length * 10)
    : 0;

  const avgCommunication = feedbacks.length > 0
    ? Math.round(feedbacks.reduce((sum: number, f: any) => sum + (f.communicationScore || 0), 0) / feedbacks.length * 10)
    : 0;

  const avgConfidence = feedbacks.length > 0
    ? Math.round(feedbacks.reduce((sum: number, f: any) => sum + (f.confidenceScore || 0), 0) / feedbacks.length * 10)
    : 0;

  const radarData = [
    { subject: "Technical", A: avgTechnical },
    { subject: "Communication", A: avgCommunication },
    { subject: "Confidence", A: avgConfidence },
    { subject: "Relevance", A: Math.round(feedbacks.reduce((s: number, f: any) => s + (f.relevanceScore || 0), 0) / Math.max(feedbacks.length, 1) * 10) },
    { subject: "Structure", A: Math.round(feedbacks.reduce((s: number, f: any) => s + (f.structureScore || 0), 0) / Math.max(feedbacks.length, 1) * 10) },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg font-medium">Generating your report...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4">
          <Link href="/interview" className="p-2 rounded-xl border border-border hover:bg-accent transition-all">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">Interview Report</h1>
            <p className="text-muted-foreground mt-1">
              {session?.title} • {session?.targetRole} • {new Date(session?.completedAt || "").toLocaleDateString()}
            </p>
          </div>
        </div>
        <button className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-all">
          <Download className="w-4 h-4" />
          Export PDF
        </button>
      </div>

      {/* Overall score */}
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <div className="flex items-center justify-center gap-12 flex-wrap">
          <div>
            <ScoreGauge score={avgScore} />
            <p className="text-sm text-muted-foreground mt-2">Overall Score</p>
          </div>
          <div className="grid grid-cols-3 gap-6">
            {[
              { label: "Technical", value: avgTechnical, color: "text-purple-400" },
              { label: "Communication", value: avgCommunication, color: "text-blue-400" },
              { label: "Confidence", value: avgConfidence, color: "text-green-400" },
            ].map(({ label, value, color }) => (
              <div key={label} className="text-center">
                <div className={`text-3xl font-bold ${color}`}>{value}%</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Radar + Summary */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-border bg-card p-6">
          <h2 className="font-semibold mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-primary" />
            Performance Radar
          </h2>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={radarData}>
              <PolarGrid stroke="hsl(var(--border))" />
              <PolarAngleAxis dataKey="subject" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
              <Radar name="Score" dataKey="A" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.15} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <h2 className="font-semibold flex items-center gap-2">
            <Award className="w-4 h-4 text-primary" />
            Session Summary
          </h2>
          <div className="space-y-3">
            {[
              { label: "Questions Answered", value: `${session?.answeredQuestions || 0} / ${session?.totalQuestions || 0}` },
              { label: "Interview Type", value: session?.interviewType },
              { label: "Experience Level", value: session?.experienceLevel },
              { label: "Duration", value: `${Math.round((session?.durationSeconds || 0) / 60)} minutes` },
            ].map(({ label, value }) => (
              <div key={label} className="flex items-center justify-between py-2 border-b border-border last:border-0">
                <span className="text-sm text-muted-foreground">{label}</span>
                <span className="text-sm font-medium">{value}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Per-question breakdown */}
      <div>
        <h2 className="font-semibold text-lg mb-4">Question-by-Question Analysis</h2>
        <div className="space-y-4">
          {feedbacks.map((feedback: any, i: number) => (
            <div key={feedback.id} className="rounded-2xl border border-border bg-card p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-sm font-bold text-primary">
                    {i + 1}
                  </div>
                  <span className="font-medium text-sm">
                    {feedback.answer?.question?.content || "Question " + (i + 1)}
                  </span>
                </div>
                <div className={`text-lg font-bold ${feedback.overallScore >= 7 ? "text-green-500" : feedback.overallScore >= 5 ? "text-yellow-500" : "text-red-500"}`}>
                  {feedback.overallScore}/10
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3 mb-3">
                {[
                  { label: "Technical", val: feedback.technicalScore },
                  { label: "Communication", val: feedback.communicationScore },
                  { label: "Relevance", val: feedback.relevanceScore },
                ].map(({ label, val }) => (
                  <div key={label} className="text-center p-2 rounded-lg bg-muted/50">
                    <div className="text-lg font-bold">{val}/10</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>

              {feedback.detailedFeedback && (
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {feedback.detailedFeedback}
                </p>
              )}

              {feedback.suggestedAnswer && (
                <details className="mt-3">
                  <summary className="text-xs text-primary cursor-pointer hover:underline">
                    View suggested answer
                  </summary>
                  <div className="mt-2 p-3 rounded-lg bg-primary/5 border border-primary/10 text-sm text-muted-foreground leading-relaxed">
                    {feedback.suggestedAnswer}
                  </div>
                </details>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="flex gap-3">
        <Link href="/interview" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border border-border text-sm font-medium hover:bg-accent transition-all">
          <Mic className="w-4 h-4" />
          Practice Again
        </Link>
        <Link href="/roadmap" className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all">
          <TrendingUp className="w-4 h-4" />
          View Improvement Roadmap
        </Link>
      </div>
    </div>
  );
}
