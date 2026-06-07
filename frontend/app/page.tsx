import Link from "next/link";
import { 
  Brain, Code2, FileText, BarChart3, Mic, Target, 
  ArrowRight, CheckCircle, Star, Zap, Shield, Globe
} from "lucide-react";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background text-foreground overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto max-w-7xl px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
              <Brain className="w-5 h-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-bold gradient-text">InterviewAI</span>
          </div>

          <div className="hidden md:flex items-center gap-8">
            {["Features", "How it Works", "Pricing"].map((item) => (
              <a
                key={item}
                href={`#${item.toLowerCase().replace(" ", "-")}`}
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {item}
              </a>
            ))}
          </div>

          <div className="flex items-center gap-3">
            <Link
              href="/login"
              className="text-sm text-muted-foreground hover:text-foreground transition-colors px-4 py-2"
            >
              Sign In
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02]"
            >
              Get Started Free
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-16">
        {/* Background effects */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />
          <div className="absolute top-1/3 left-1/4 w-[400px] h-[400px] rounded-full bg-blue-500/5 blur-3xl" />
          <div className="absolute bottom-1/3 right-1/4 w-[300px] h-[300px] rounded-full bg-purple-500/5 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(124,58,237,0.03)_1px,transparent_1px),linear-gradient(to_right,rgba(124,58,237,0.03)_1px,transparent_1px)] bg-[size:64px_64px]" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-8">
            <Zap className="w-3.5 h-3.5" />
            <span>Powered by GPT-4o + Whisper AI</span>
          </div>

          <h1 className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 leading-[1.1]">
            Ace Your Next Interview
            <br />
            <span className="gradient-text">with AI Confidence</span>
          </h1>

          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            AI-powered mock interviews, resume analysis, personalized feedback, 
            and coding practice — everything you need to land your dream job.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/register"
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02] glow-purple shadow-lg shadow-primary/25"
            >
              Start Preparing Free
              <ArrowRight className="w-5 h-5" />
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-8 py-4 text-base font-semibold hover:bg-accent transition-all"
            >
              Sign In
            </Link>
          </div>

          <div className="mt-10 flex items-center justify-center gap-6 text-sm text-muted-foreground">
            {["No credit card required", "Free tier available", "Setup in 2 minutes"].map((text) => (
              <div key={text} className="flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4 text-green-500" />
                {text}
              </div>
            ))}
          </div>

          {/* Stats */}
          <div className="mt-20 grid grid-cols-3 gap-8 max-w-lg mx-auto">
            {[
              { value: "50K+", label: "Interviews Completed" },
              { value: "94%", label: "Success Rate" },
              { value: "4.9★", label: "Average Rating" },
            ].map(({ value, label }) => (
              <div key={label} className="text-center">
                <div className="text-2xl font-bold text-foreground">{value}</div>
                <div className="text-xs text-muted-foreground mt-1">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-32 relative">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">Everything You Need to Succeed</h2>
            <p className="text-lg text-muted-foreground max-w-xl mx-auto">
              A complete interview preparation platform powered by cutting-edge AI
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[
              {
                icon: Brain,
                title: "AI Mock Interviews",
                description: "Practice with an AI interviewer that adapts to your responses. Get real-time feedback on technical depth, communication, and confidence.",
                color: "text-purple-400",
                bg: "bg-purple-500/10",
              },
              {
                icon: FileText,
                title: "Resume Analyzer",
                description: "Upload your resume and get an ATS score, keyword analysis, missing sections, and specific improvement suggestions powered by AI.",
                color: "text-blue-400",
                bg: "bg-blue-500/10",
              },
              {
                icon: Target,
                title: "Job Description Matcher",
                description: "Paste a job description and see exactly how your profile matches — including missing skills and how to bridge the gap.",
                color: "text-green-400",
                bg: "bg-green-500/10",
              },
              {
                icon: Mic,
                title: "Voice Interview Mode",
                description: "Practice with your actual voice. Whisper AI transcribes your speech in real-time, then GPT-4o evaluates your answer.",
                color: "text-pink-400",
                bg: "bg-pink-500/10",
              },
              {
                icon: Code2,
                title: "Coding Interview IDE",
                description: "Solve LeetCode-style problems in our Monaco editor. Run code, submit against test cases, and get AI code review with complexity analysis.",
                color: "text-yellow-400",
                bg: "bg-yellow-500/10",
              },
              {
                icon: BarChart3,
                title: "Progress Analytics",
                description: "Track your improvement over time with detailed reports, score breakdowns, weak topic identification, and personalized roadmaps.",
                color: "text-orange-400",
                bg: "bg-orange-500/10",
              },
            ].map(({ icon: Icon, title, description, color, bg }) => (
              <div
                key={title}
                className="group relative rounded-2xl border border-border bg-card p-6 hover:border-primary/30 transition-all duration-300 hover:shadow-lg hover:shadow-primary/5"
              >
                <div className={`inline-flex p-3 rounded-xl ${bg} mb-4`}>
                  <Icon className={`w-6 h-6 ${color}`} />
                </div>
                <h3 className="text-lg font-semibold mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="py-32 bg-muted/30">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-lg text-muted-foreground">Get interview-ready in 4 simple steps</p>
          </div>

          <div className="grid md:grid-cols-4 gap-8">
            {[
              { step: "01", title: "Upload Resume", desc: "Upload your PDF or DOCX resume. AI extracts your skills, experience, and generates an ATS score." },
              { step: "02", title: "Match JD", desc: "Paste a job description to see your match percentage and identify skill gaps." },
              { step: "03", title: "Practice", desc: "Start an AI mock interview with questions tailored to your resume and target role." },
              { step: "04", title: "Review & Improve", desc: "Get detailed feedback reports and a personalized learning roadmap." },
            ].map(({ step, title, desc }) => (
              <div key={step} className="relative text-center">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 border border-primary/20 text-primary font-bold text-lg flex items-center justify-center mx-auto mb-4">
                  {step}
                </div>
                <h3 className="font-semibold text-lg mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-32">
        <div className="max-w-4xl mx-auto px-6 text-center">
          <div className="relative rounded-3xl border border-primary/20 bg-primary/5 p-16 overflow-hidden">
            <div className="absolute inset-0 bg-glow-purple opacity-50" />
            <div className="relative z-10">
              <h2 className="text-4xl font-bold mb-4">Ready to Ace Your Interview?</h2>
              <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
                Join thousands of engineers who landed their dream jobs with InterviewAI
              </p>
              <Link
                href="/register"
                className="inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-4 text-base font-semibold text-primary-foreground hover:bg-primary/90 transition-all hover:scale-[1.02]"
              >
                Start for Free — No Card Required
                <ArrowRight className="w-5 h-5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-md bg-primary flex items-center justify-center">
              <Brain className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="font-bold gradient-text">InterviewAI</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © 2025 InterviewAI. Built with ❤️ for engineers.
          </p>
          <div className="flex gap-6 text-sm text-muted-foreground">
            <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
            <a href="#" className="hover:text-foreground transition-colors">Terms</a>
            <a href="#" className="hover:text-foreground transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
