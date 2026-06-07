"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useQuery, useMutation } from "@tanstack/react-query";
import { codingApi } from "@/lib/api";
import dynamic from "next/dynamic";
import { 
  Play, Send, ChevronDown, CheckCircle, XCircle, 
  Clock, Cpu, Loader2, ArrowLeft, Zap
} from "lucide-react";
import Link from "next/link";
import toast from "react-hot-toast";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const STARTER_CODE: Record<string, string> = {
  JAVA: `class Solution {
    public int solve(int[] nums) {
        // Write your solution here
        return 0;
    }
}`,
  PYTHON: `class Solution:
    def solve(self, nums: list[int]) -> int:
        # Write your solution here
        return 0`,
  JAVASCRIPT: `/**
 * @param {number[]} nums
 * @return {number}
 */
var solve = function(nums) {
    // Write your solution here
    return 0;
};`,
  CPP: `class Solution {
public:
    int solve(vector<int>& nums) {
        // Write your solution here
        return 0;
    }
};`,
};

const DIFFICULTY_COLORS: Record<string, string> = {
  EASY: "text-green-500 bg-green-500/10",
  MEDIUM: "text-yellow-500 bg-yellow-500/10",
  HARD: "text-red-500 bg-red-500/10",
};

export default function CodingChallengePage() {
  const { challengeId } = useParams<{ challengeId: string }>();
  const [language, setLanguage] = useState("PYTHON");
  const [code, setCode] = useState(STARTER_CODE.PYTHON);
  const [activeTab, setActiveTab] = useState<"description" | "results" | "ai-review">("description");
  const [lastResult, setLastResult] = useState<any>(null);

  const { data, isLoading } = useQuery({
    queryKey: ["coding-challenge", challengeId],
    queryFn: () => codingApi.getChallenge(challengeId),
  });

  const runMutation = useMutation({
    mutationFn: () => codingApi.runCode(challengeId, code, language),
    onSuccess: (response) => {
      setLastResult(response.data.data);
      setActiveTab("results");
      toast.success("Code executed!");
    },
    onError: () => toast.error("Execution failed. Check your code."),
  });

  const submitMutation = useMutation({
    mutationFn: () => codingApi.submitCode(challengeId, code, language),
    onSuccess: (response) => {
      const result = response.data.data;
      setLastResult(result);
      setActiveTab("results");
      if (result.status === "ACCEPTED") {
        toast.success(`✅ Accepted! ${result.passedTests}/${result.totalTests} test cases passed!`);
      } else {
        toast.error(`❌ ${result.passedTests}/${result.totalTests} test cases passed`);
      }
    },
    onError: () => toast.error("Submission failed"),
  });

  const challenge = data?.data?.data;

  useEffect(() => {
    if (challenge?.starterCode) {
      try {
        const starter = JSON.parse(challenge.starterCode);
        if (starter[language]) setCode(starter[language]);
      } catch {}
    } else {
      setCode(STARTER_CODE[language] || "");
    }
  }, [language, challenge]);

  const getMonacoLanguage = () => {
    const map: Record<string, string> = {
      JAVA: "java", PYTHON: "python", JAVASCRIPT: "javascript", CPP: "cpp"
    };
    return map[language] || "python";
  };

  let examples: any[] = [];
  try {
    if (challenge?.examples) examples = JSON.parse(challenge.examples);
  } catch {}

  let testResults: any[] = [];
  try {
    if (lastResult?.testResults) testResults = JSON.parse(lastResult.testResults);
  } catch {}

  if (isLoading) {
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary animate-spin" />
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background">
      {/* Top bar */}
      <div className="h-12 border-b border-border flex items-center justify-between px-4 gap-3 flex-shrink-0 bg-card">
        <div className="flex items-center gap-3">
          <Link href="/coding" className="p-1.5 rounded-lg hover:bg-accent transition-colors">
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="font-semibold text-sm truncate max-w-[200px]">{challenge?.title}</h1>
          {challenge?.difficulty && (
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${DIFFICULTY_COLORS[challenge.difficulty]}`}>
              {challenge.difficulty}
            </span>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Language selector */}
          <div className="relative">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value)}
              className="appearance-none pl-3 pr-8 py-1.5 rounded-lg border border-border bg-background text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/50 cursor-pointer"
            >
              {["PYTHON", "JAVA", "JAVASCRIPT", "CPP"].map((lang) => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
            <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5 pointer-events-none text-muted-foreground" />
          </div>

          <button
            onClick={() => runMutation.mutate()}
            disabled={runMutation.isPending}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-border text-sm font-medium hover:bg-accent transition-all disabled:opacity-60"
          >
            {runMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-green-500" />}
            Run
          </button>
          <button
            onClick={() => submitMutation.mutate()}
            disabled={submitMutation.isPending}
            className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:bg-primary/90 transition-all disabled:opacity-60"
          >
            {submitMutation.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            Submit
          </button>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left panel - Problem + Results */}
        <div className="w-[400px] flex-shrink-0 flex flex-col border-r border-border overflow-hidden">
          {/* Tabs */}
          <div className="flex border-b border-border">
            {[
              { key: "description", label: "Problem" },
              { key: "results", label: "Results" },
              { key: "ai-review", label: "AI Review" },
            ].map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setActiveTab(key as any)}
                className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === key
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                {label}
                {key === "results" && lastResult && (
                  <span className={`ml-1.5 w-1.5 h-1.5 rounded-full inline-block ${lastResult.status === "ACCEPTED" ? "bg-green-500" : "bg-red-500"}`} />
                )}
              </button>
            ))}
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto custom-scrollbar p-5">
            {activeTab === "description" && challenge && (
              <div className="space-y-5">
                <div>
                  <p className="text-sm leading-relaxed text-foreground">{challenge.description}</p>
                </div>

                {challenge.constraints && (
                  <div>
                    <h3 className="text-sm font-semibold mb-2 text-muted-foreground uppercase tracking-wider">Constraints</h3>
                    <p className="text-xs text-muted-foreground font-mono bg-muted/50 p-3 rounded-lg leading-relaxed">{challenge.constraints}</p>
                  </div>
                )}

                {examples.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wider">Examples</h3>
                    <div className="space-y-3">
                      {examples.map((ex: any, i: number) => (
                        <div key={i} className="rounded-xl bg-muted/50 p-4 text-xs font-mono space-y-1">
                          <div><span className="text-muted-foreground">Input: </span>{ex.input}</div>
                          <div><span className="text-muted-foreground">Output: </span>{ex.output}</div>
                          {ex.explanation && <div className="text-muted-foreground">{ex.explanation}</div>}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {challenge.tags && (
                  <div className="flex flex-wrap gap-1.5">
                    {challenge.tags.map((tag: string) => (
                      <span key={tag} className="px-2 py-0.5 rounded-full text-xs bg-primary/10 text-primary">{tag}</span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "results" && (
              <div className="space-y-4">
                {!lastResult ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Play className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Run or submit your code to see results</p>
                  </div>
                ) : (
                  <>
                    <div className={`flex items-center gap-2 p-4 rounded-xl ${lastResult.status === "ACCEPTED" ? "bg-green-500/10 border border-green-500/20" : "bg-red-500/10 border border-red-500/20"}`}>
                      {lastResult.status === "ACCEPTED"
                        ? <CheckCircle className="w-5 h-5 text-green-500" />
                        : <XCircle className="w-5 h-5 text-red-500" />
                      }
                      <div>
                        <div className="font-semibold text-sm">{lastResult.status.replace("_", " ")}</div>
                        {lastResult.totalTests > 0 && (
                          <div className="text-xs text-muted-foreground">{lastResult.passedTests}/{lastResult.totalTests} test cases passed</div>
                        )}
                      </div>
                      <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                        {lastResult.runtimeMs > 0 && (
                          <div className="flex items-center gap-1"><Clock className="w-3 h-3" />{lastResult.runtimeMs}ms</div>
                        )}
                        {lastResult.memoryKb > 0 && (
                          <div className="flex items-center gap-1"><Cpu className="w-3 h-3" />{lastResult.memoryKb}KB</div>
                        )}
                      </div>
                    </div>

                    {testResults.length > 0 && (
                      <div className="space-y-2">
                        {testResults.slice(0, 5).map((tc: any, i: number) => (
                          <div key={i} className={`rounded-lg p-3 text-xs font-mono ${tc.passed ? "bg-green-500/5 border border-green-500/10" : "bg-red-500/5 border border-red-500/10"}`}>
                            <div className="flex items-center gap-2 mb-1">
                              {tc.passed ? <CheckCircle className="w-3 h-3 text-green-500" /> : <XCircle className="w-3 h-3 text-red-500" />}
                              <span className="font-medium">Test {i + 1}</span>
                            </div>
                            {!tc.passed && (
                              <>
                                <div className="text-muted-foreground">Expected: {tc.expected}</div>
                                <div className="text-red-400">Got: {tc.actual}</div>
                              </>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            )}

            {activeTab === "ai-review" && (
              <div className="space-y-4">
                {!lastResult?.aiReview ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <Zap className="w-8 h-8 mx-auto mb-2 opacity-30" />
                    <p className="text-sm">Submit your code to get an AI code review</p>
                  </div>
                ) : (
                  <>
                    <div className="rounded-xl bg-primary/5 border border-primary/10 p-4">
                      <h3 className="text-sm font-semibold mb-2 flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        AI Code Review
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{lastResult.aiReview}</p>
                    </div>

                    {lastResult.complexityAnalysis && (() => {
                      try {
                        const ca = JSON.parse(lastResult.complexityAnalysis);
                        return (
                          <div className="rounded-xl border border-border p-4 space-y-2">
                            <h3 className="text-sm font-semibold">Complexity Analysis</h3>
                            <div className="grid grid-cols-2 gap-3">
                              <div className="p-3 rounded-lg bg-muted/50 text-center">
                                <div className="text-lg font-bold font-mono text-primary">{ca.time}</div>
                                <div className="text-xs text-muted-foreground">Time Complexity</div>
                              </div>
                              <div className="p-3 rounded-lg bg-muted/50 text-center">
                                <div className="text-lg font-bold font-mono text-primary">{ca.space}</div>
                                <div className="text-xs text-muted-foreground">Space Complexity</div>
                              </div>
                            </div>
                            {ca.explanation && <p className="text-xs text-muted-foreground">{ca.explanation}</p>}
                          </div>
                        );
                      } catch { return null; }
                    })()}
                  </>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right panel - Monaco Editor */}
        <div className="flex-1 flex flex-col overflow-hidden">
          <div className="flex-1">
            <MonacoEditor
              height="100%"
              language={getMonacoLanguage()}
              value={code}
              onChange={(val) => setCode(val || "")}
              theme="vs-dark"
              options={{
                fontSize: 14,
                lineHeight: 1.6,
                padding: { top: 16, bottom: 16 },
                minimap: { enabled: false },
                scrollBeyondLastLine: false,
                fontFamily: "JetBrains Mono, Fira Code, monospace",
                fontLigatures: true,
                renderLineHighlight: "gutter",
                cursorBlinking: "smooth",
                smoothScrolling: true,
                tabSize: 4,
              }}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
