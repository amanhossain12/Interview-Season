"use client";

import { useState, useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { resumeApi } from "@/lib/api";
import {
  Upload, FileText, Loader2, CheckCircle, AlertCircle,
  BarChart3, Zap, Star, ArrowRight, RefreshCw, Eye
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

function ScoreRing({ score, label, color }: { score: number; label: string; color: string }) {
  const radius = 36;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (score / 100) * circumference;

  return (
    <div className="flex flex-col items-center gap-2">
      <div className="relative w-24 h-24">
        <svg className="w-24 h-24 -rotate-90" viewBox="0 0 88 88">
          <circle cx="44" cy="44" r={radius} fill="none" stroke="hsl(var(--border))" strokeWidth="8" />
          <circle
            cx="44" cy="44" r={radius} fill="none"
            stroke={color} strokeWidth="8" strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            className="transition-all duration-1000 ease-out"
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-2xl font-bold">{score}</span>
        </div>
      </div>
      <span className="text-sm text-muted-foreground">{label}</span>
    </div>
  );
}

function ResumeCard({ resume }: { resume: any }) {
  const statusConfig = {
    UPLOADED: { label: "Uploaded", color: "text-yellow-500", bg: "bg-yellow-500/10", icon: Upload },
    PROCESSING: { label: "Analyzing...", color: "text-blue-500", bg: "bg-blue-500/10", icon: Loader2 },
    ANALYZED: { label: "Analyzed", color: "text-green-500", bg: "bg-green-500/10", icon: CheckCircle },
    FAILED: { label: "Failed", color: "text-red-500", bg: "bg-red-500/10", icon: AlertCircle },
  };

  const config = statusConfig[resume.status as keyof typeof statusConfig] || statusConfig.UPLOADED;
  const Icon = config.icon;

  return (
    <div className="group rounded-xl border border-border bg-card p-5 hover:border-primary/30 transition-all">
      <div className="flex items-start justify-between mb-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <div className="font-medium text-sm truncate max-w-[200px]">{resume.originalName}</div>
            <div className="text-xs text-muted-foreground">{resume.fileType}</div>
          </div>
        </div>
        <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${config.bg} ${config.color}`}>
          <Icon className={`w-3 h-3 ${resume.status === "PROCESSING" ? "animate-spin" : ""}`} />
          {config.label}
        </div>
      </div>

      {resume.atsScore > 0 && (
        <div className="mb-3">
          <div className="flex items-center justify-between text-xs mb-1">
            <span className="text-muted-foreground">ATS Score</span>
            <span className="font-semibold text-primary">{resume.atsScore}/100</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000"
              style={{ width: `${resume.atsScore}%` }}
            />
          </div>
        </div>
      )}

      <div className="text-xs text-muted-foreground mb-3">
        {new Date(resume.createdAt).toLocaleDateString("en-US", {
          month: "short", day: "numeric", year: "numeric"
        })}
      </div>

      {resume.status === "ANALYZED" && (
        <Link
          href={`/resume/${resume.id}`}
          className="flex items-center justify-center gap-2 w-full rounded-lg border border-primary/30 bg-primary/5 py-2 text-sm text-primary hover:bg-primary/10 transition-all font-medium"
        >
          <Eye className="w-3.5 h-3.5" />
          View Analysis
        </Link>
      )}
    </div>
  );
}

export default function ResumePage() {
  const queryClient = useQueryClient();
  const [isDragging, setIsDragging] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["resumes"],
    queryFn: () => resumeApi.getAll(),
    refetchInterval: 5000, // Poll for analysis completion
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => resumeApi.upload(file),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["resumes"] });
      toast.success("Resume uploaded! AI analysis started...");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.error || "Upload failed. Please try again.");
    },
  });

  const onDrop = useCallback(
    (acceptedFiles: File[]) => {
      const file = acceptedFiles[0];
      if (file) uploadMutation.mutate(file);
    },
    [uploadMutation]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      "application/pdf": [".pdf"],
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [".docx"],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024,
    onDragEnter: () => setIsDragging(true),
    onDragLeave: () => setIsDragging(false),
    onDropAccepted: () => setIsDragging(false),
    onDropRejected: (files) => {
      setIsDragging(false);
      if (files[0]?.errors[0]?.code === "file-too-large") {
        toast.error("File size exceeds 10MB limit");
      } else {
        toast.error("Only PDF and DOCX files are supported");
      }
    },
  });

  const resumes = data?.data?.data || [];

  return (
    <div className="p-6 lg:p-8 space-y-8 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Resume Analyzer</h1>
        <p className="text-muted-foreground mt-1">
          Upload your resume for AI-powered ATS scoring and improvement suggestions
        </p>
      </div>

      {/* Upload zone */}
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-2xl p-12 text-center cursor-pointer transition-all duration-300
          ${isDragActive || isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-accent/50"
          }
          ${uploadMutation.isPending ? "pointer-events-none opacity-60" : ""}
        `}
      >
        <input {...getInputProps()} />

        {/* Background effect */}
        {isDragActive && (
          <div className="absolute inset-0 rounded-2xl bg-glow-purple opacity-30 pointer-events-none" />
        )}

        <div className="relative z-10">
          {uploadMutation.isPending ? (
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Loader2 className="w-8 h-8 text-primary animate-spin" />
              </div>
              <div>
                <p className="font-semibold">Uploading and analyzing...</p>
                <p className="text-sm text-muted-foreground mt-1">AI is processing your resume</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center transition-all ${
                isDragActive ? "bg-primary text-primary-foreground scale-110" : "bg-primary/10 text-primary"
              }`}>
                <Upload className="w-8 h-8" />
              </div>
              <div>
                <p className="text-lg font-semibold">
                  {isDragActive ? "Drop your resume here!" : "Drag & drop your resume"}
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supports PDF and DOCX up to 10MB
                </p>
              </div>
              <div className="flex items-center gap-3">
                <span className="px-4 py-2 rounded-xl border border-primary bg-primary/5 text-primary text-sm font-medium hover:bg-primary/10 transition-all">
                  Browse Files
                </span>
              </div>
              <div className="flex items-center gap-6 text-xs text-muted-foreground">
                {["ATS Score Analysis", "Skill Extraction", "Improvement Tips"].map((item) => (
                  <div key={item} className="flex items-center gap-1.5">
                    <CheckCircle className="w-3 h-3 text-green-500" />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Resume list */}
      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-40 rounded-xl bg-muted animate-pulse" />
          ))}
        </div>
      ) : resumes.length > 0 ? (
        <div>
          <h2 className="font-semibold text-lg mb-4">Your Resumes</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {resumes.map((resume: any) => (
              <ResumeCard key={resume.id} resume={resume} />
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-16 text-muted-foreground">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p className="font-medium">No resumes yet</p>
          <p className="text-sm mt-1">Upload your first resume to get started</p>
        </div>
      )}
    </div>
  );
}
