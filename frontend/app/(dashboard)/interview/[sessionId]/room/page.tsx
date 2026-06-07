"use client";

import { useState, useEffect, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { interviewApi } from "@/lib/api";
import {
  Mic, MicOff, Send, Clock, ChevronRight, CheckCircle,
  Brain, Loader2, Volume2, VolumeX, Flag, X, SkipForward
} from "lucide-react";
import toast from "react-hot-toast";

function Timer({ startTime }: { startTime: Date }) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed(Math.floor((Date.now() - startTime.getTime()) / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, [startTime]);

  const mins = Math.floor(elapsed / 60).toString().padStart(2, "0");
  const secs = (elapsed % 60).toString().padStart(2, "0");

  return (
    <div className="flex items-center gap-1.5 text-sm font-mono text-muted-foreground">
      <Clock className="w-3.5 h-3.5" />
      {mins}:{secs}
    </div>
  );
}

function VoiceRecorder({ onTranscript }: { onTranscript: (text: string) => void }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data);
      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        // Simulate transcript for now (real Whisper transcription happens on backend)
        onTranscript("[Voice answer recorded — will be transcribed]");
        stream.getTracks().forEach((t) => t.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (e) {
      toast.error("Microphone access denied. Please enable microphone permission.");
    }
  };

  const stopRecording = () => {
    mediaRecorderRef.current?.stop();
    setIsRecording(false);
  };

  return (
    <div className="flex items-center gap-3">
      <button
        onClick={isRecording ? stopRecording : startRecording}
        className={`flex items-center gap-2 px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
          isRecording
            ? "bg-red-500 text-white hover:bg-red-600 animate-pulse"
            : "border border-border hover:bg-accent"
        }`}
      >
        {isRecording ? (
          <><MicOff className="w-4 h-4" />Stop Recording</>
        ) : (
          <><Mic className="w-4 h-4" />Record Answer</>
        )}
      </button>
      {isRecording && (
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
          <span className="text-sm text-muted-foreground">Recording...</span>
        </div>
      )}
    </div>
  );
}

export default function InterviewRoomPage() {
  const { sessionId } = useParams<{ sessionId: string }>();
  const router = useRouter();
  const startTimeRef = useRef(new Date());

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answer, setAnswer] = useState("");
  const [submittedAnswers, setSubmittedAnswers] = useState<Record<string, any>>({});
  const [isCompleting, setIsCompleting] = useState(false);

  const { data: sessionData } = useQuery({
    queryKey: ["interview-session", sessionId],
    queryFn: () => interviewApi.getSession(sessionId),
  });

  const { data: questionsData, isLoading: questionsLoading } = useQuery({
    queryKey: ["interview-questions", sessionId],
    queryFn: () => interviewApi.getQuestions(sessionId),
  });

  const submitMutation = useMutation({
    mutationFn: (data: { questionId: string; textContent?: string; transcript?: string }) =>
      interviewApi.submitAnswer(sessionId, data),
    onSuccess: (response, variables) => {
      const result = response.data.data;
      setSubmittedAnswers((prev) => ({ ...prev, [variables.questionId]: result }));
      setAnswer("");

      if (currentQuestionIndex < questions.length - 1) {
        setCurrentQuestionIndex((i) => i + 1);
        toast.success("Answer submitted! Moving to next question.", { icon: "✅" });
      } else {
        toast.success("Final answer submitted!");
      }
    },
    onError: () => toast.error("Failed to submit answer. Please try again."),
  });

  const completeMutation = useMutation({
    mutationFn: () => interviewApi.completeSession(sessionId),
    onSuccess: () => {
      toast.success("Interview completed! Generating your report...", { duration: 3000 });
      setTimeout(() => router.push(`/interview/${sessionId}/report`), 1500);
    },
  });

  const session = sessionData?.data?.data;
  const questions = questionsData?.data?.data || [];
  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex) / questions.length) * 100 : 0;

  const categoryColors: Record<string, string> = {
    HR: "bg-purple-500/10 text-purple-400",
    TECHNICAL: "bg-blue-500/10 text-blue-400",
    BEHAVIORAL: "bg-green-500/10 text-green-400",
    PROJECT: "bg-orange-500/10 text-orange-400",
    SYSTEM_DESIGN: "bg-pink-500/10 text-pink-400",
    CODING: "bg-yellow-500/10 text-yellow-400",
  };

  const handleSubmitAnswer = () => {
    if (!currentQuestion || !answer.trim()) return;
    submitMutation.mutate({ questionId: currentQuestion.id, textContent: answer });
  };

  const handleComplete = async () => {
    setIsCompleting(true);
    completeMutation.mutate();
  };

  if (questionsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Brain className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
          <p className="text-lg font-medium">Preparing your interview...</p>
          <p className="text-muted-foreground text-sm mt-1">AI is generating personalized questions</p>
        </div>
      </div>
    );
  }

  const currentFeedback = currentQuestion && submittedAnswers[currentQuestion.id];

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Top bar */}
      <div className="border-b border-border px-6 py-4 flex items-center justify-between bg-card/50 backdrop-blur-sm">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
            <Brain className="w-4 h-4 text-primary" />
          </div>
          <div>
            <div className="font-semibold text-sm">{session?.title || "Mock Interview"}</div>
            <div className="text-xs text-muted-foreground">{session?.targetRole}</div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Timer startTime={startTimeRef.current} />
          <div className="text-sm text-muted-foreground">
            {currentQuestionIndex + 1} / {questions.length}
          </div>
          <button
            onClick={handleComplete}
            disabled={isCompleting}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-all disabled:opacity-60"
          >
            {isCompleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flag className="w-4 h-4" />}
            End Interview
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 bg-border">
        <div
          className="h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="flex-1 flex gap-6 p-6 max-w-6xl mx-auto w-full">
        {/* Question panel */}
        <div className="flex-1 space-y-6">
          {/* Question navigator */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {questions.map((q: any, i: number) => (
              <button
                key={q.id}
                onClick={() => setCurrentQuestionIndex(i)}
                className={`flex-shrink-0 w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                  i === currentQuestionIndex
                    ? "bg-primary text-primary-foreground"
                    : submittedAnswers[q.id]
                    ? "bg-green-500/10 text-green-500 border border-green-500/20"
                    : "bg-muted text-muted-foreground hover:bg-accent"
                }`}
              >
                {submittedAnswers[q.id] ? <CheckCircle className="w-4 h-4 mx-auto" /> : i + 1}
              </button>
            ))}
          </div>

          {/* Current question */}
          {currentQuestion && (
            <div className="rounded-2xl border border-border bg-card p-6 animate-fade-in">
              <div className="flex items-center gap-3 mb-4">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${categoryColors[currentQuestion.category] || "bg-muted text-muted-foreground"}`}>
                  {currentQuestion.category}
                </span>
                <span className="text-xs text-muted-foreground px-2 py-1 rounded-full border border-border">
                  {currentQuestion.difficulty}
                </span>
              </div>

              <div className="flex items-start gap-3 mb-6">
                <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center flex-shrink-0 mt-0.5">
                  <Brain className="w-4 h-4 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-xs text-muted-foreground mb-1">AI Interviewer</div>
                  <p className="text-foreground leading-relaxed">{currentQuestion.content}</p>
                </div>
              </div>

              {/* Answer input */}
              {!submittedAnswers[currentQuestion.id] ? (
                <div className="space-y-4">
                  <textarea
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="Type your answer here... Be detailed and structured."
                    rows={6}
                    className="w-full rounded-xl border border-input bg-background px-4 py-3 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 resize-none transition-all"
                  />

                  {session?.interviewType !== "TEXT" && (
                    <VoiceRecorder onTranscript={(text) => setAnswer((prev) => prev + "\n" + text)} />
                  )}

                  <div className="flex items-center justify-between">
                    <div className="text-xs text-muted-foreground">
                      {answer.split(/\s+/).filter(Boolean).length} words
                    </div>
                    <div className="flex gap-3">
                      {currentQuestionIndex < questions.length - 1 && (
                        <button
                          onClick={() => {
                            setAnswer("");
                            setCurrentQuestionIndex((i) => i + 1);
                          }}
                          className="flex items-center gap-2 px-4 py-2 rounded-xl border border-border text-sm hover:bg-accent transition-all"
                        >
                          <SkipForward className="w-4 h-4" />
                          Skip
                        </button>
                      )}
                      <button
                        onClick={handleSubmitAnswer}
                        disabled={!answer.trim() || submitMutation.isPending}
                        className="flex items-center gap-2 px-6 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60"
                      >
                        {submitMutation.isPending ? (
                          <><Loader2 className="w-4 h-4 animate-spin" />Evaluating...</>
                        ) : (
                          <><Send className="w-4 h-4" />Submit Answer</>
                        )}
                      </button>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-green-500/5 border border-green-500/20 p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span className="text-sm font-medium text-green-500">Answer Submitted</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{submittedAnswers[currentQuestion.id]?.answer?.textContent}</p>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Feedback panel */}
        {currentFeedback && (
          <div className="w-80 flex-shrink-0 space-y-4 animate-slide-in">
            <div className="rounded-2xl border border-border bg-card p-5">
              <h3 className="font-semibold mb-4 flex items-center gap-2">
                <Brain className="w-4 h-4 text-primary" />
                AI Feedback
              </h3>

              {/* Scores */}
              <div className="grid grid-cols-2 gap-3 mb-4">
                {[
                  { label: "Technical", value: currentFeedback.feedback?.technicalScore },
                  { label: "Communication", value: currentFeedback.feedback?.communicationScore },
                  { label: "Confidence", value: currentFeedback.feedback?.confidenceScore },
                  { label: "Relevance", value: currentFeedback.feedback?.relevanceScore },
                ].map(({ label, value }) => (
                  <div key={label} className="text-center p-2 rounded-lg bg-muted/50">
                    <div className="text-2xl font-bold text-primary">{value || 0}</div>
                    <div className="text-xs text-muted-foreground">{label}</div>
                  </div>
                ))}
              </div>

              {/* Overall score */}
              <div className="text-center py-3 border-t border-border mb-4">
                <div className="text-3xl font-bold">{currentFeedback.feedback?.overallScore || 0}<span className="text-sm text-muted-foreground">/10</span></div>
                <div className="text-xs text-muted-foreground">Overall Score</div>
              </div>

              {/* Strengths */}
              {currentFeedback.feedback?.strengths?.length > 0 && (
                <div className="mb-3">
                  <div className="text-xs font-semibold text-green-500 mb-2">STRENGTHS</div>
                  <ul className="space-y-1">
                    {currentFeedback.feedback.strengths.slice(0, 2).map((s: string) => (
                      <li key={s} className="text-xs text-muted-foreground flex items-start gap-1.5">
                        <CheckCircle className="w-3 h-3 text-green-500 flex-shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Feedback */}
              {currentFeedback.feedback?.detailedFeedback && (
                <div className="text-xs text-muted-foreground leading-relaxed border-t border-border pt-3">
                  {currentFeedback.feedback.detailedFeedback}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
