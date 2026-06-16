import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Zap, ArrowLeft, Home, BookOpen, MessageSquare } from "lucide-react";

export function NotFoundPage() {
  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      {/* Header */}
      <header className="border-b border-border">
        <div className="max-w-5xl mx-auto px-5 py-4">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity w-fit">
            <div className="size-7 rounded-md bg-foreground flex items-center justify-center">
              <Zap className="size-3.5 text-background" />
            </div>
            <span className="text-sm font-semibold text-foreground">AdalahCredit</span>
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="flex-1 flex items-center justify-center p-5 relative">
        {/* Background elements */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] rounded-full bg-blue-500/[0.02] blur-[100px]" />
          <div className="absolute bottom-1/3 right-1/4 w-[200px] h-[200px] rounded-full bg-purple-500/[0.02] blur-[80px]" />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center relative z-10"
        >
          {/* 404 number */}
          <div className="relative mb-8">
            <span className="text-[120px] sm:text-[160px] font-black text-transparent bg-clip-text bg-gradient-to-b from-foreground/[0.08] to-transparent leading-none select-none">
              404
            </span>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="size-16 rounded-2xl bg-accent/50 border border-border flex items-center justify-center backdrop-blur-sm">
                <Zap className="size-7 text-muted-foreground" />
              </div>
            </div>
          </div>

          <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-2">Page not found</h1>
          <p className="text-sm text-muted-foreground max-w-sm mx-auto mb-8">
            The endpoint you're looking for doesn't exist or has been moved. Check the URL or head back to familiar territory.
          </p>

          {/* Response mock */}
          <div className="max-w-xs mx-auto bg-[#0a0a0c] border border-border rounded-xl p-4 mb-8 text-left">
            <pre className="text-[10px] text-muted-foreground font-mono leading-relaxed">
{`{
  "error": {
    "code": 404,
    "message": "Route not found",
    "suggestion": "Try /docs for API reference"
  }
}`}
            </pre>
          </div>

          {/* Actions */}
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-foreground text-background text-xs font-medium hover:opacity-90 transition-colors"
            >
              <Home className="size-3.5" /> Back to Home
            </Link>
            <Link
              to="/docs"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent/50 border border-border text-foreground/70 text-xs font-medium hover:bg-accent transition-colors"
            >
              <BookOpen className="size-3.5" /> API Docs
            </Link>
            <Link
              to="/support"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-accent/50 border border-border text-foreground/70 text-xs font-medium hover:bg-accent transition-colors"
            >
              <MessageSquare className="size-3.5" /> Support
            </Link>
          </div>

          <p className="text-[10px] text-muted-foreground mt-6">
            <ArrowLeft className="size-3 inline mr-1" />
            Or press your browser's back button
          </p>
        </motion.div>
      </main>
    </div>
  );
}
