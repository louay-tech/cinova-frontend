import { Link, useNavigate } from "@tanstack/react-router";
import { Moon, Sun, BookOpen, Plus, Loader2, X, AlertTriangle, Languages } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTheme } from "@/lib/theme";
import { useLang } from "@/lib/i18n";
import {
  extractNovelFromPdf,
  PdfExtractionError,
  PdfCancelledError,
  type PdfProgress,
} from "@/lib/pdf";

const SIZE_WARN_MB = 50;
const SLOW_THRESHOLD_MS = 30_000;

type NavProps = { showAddButton?: boolean };

export function Nav({ showAddButton = false }: NavProps) {
  const { theme, toggle } = useTheme();
  const { lang, toggle: toggleLang, t } = useLang();
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);
  const abortRef = useRef<AbortController | null>(null);

  const [loading, setLoading] = useState(false);
  const [fileName, setFileName] = useState("");
  const [progress, setProgress] = useState<PdfProgress>({ loadedPages: 0, totalPages: 0 });
  const [slow, setSlow] = useState(false);

  useEffect(() => {
    if (!loading) {
      setSlow(false);
      return;
    }
    const tm = setTimeout(() => setSlow(true), SLOW_THRESHOLD_MS);
    return () => clearTimeout(tm);
  }, [loading]);

  function cancelLoad() {
    abortRef.current?.abort();
  }

  async function onFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;

    const sizeMb = file.size / (1024 * 1024);
    if (sizeMb > SIZE_WARN_MB) {
      const ok = window.confirm(
        `This PDF is ${sizeMb.toFixed(1)} MB. Files larger than ${SIZE_WARN_MB} MB may load slowly. Continue?`,
      );
      if (!ok) return;
    }

    const controller = new AbortController();
    abortRef.current = controller;
    setFileName(file.name);
    setProgress({ loadedPages: 0, totalPages: 0 });
    setLoading(true);

    try {
      const novel = await extractNovelFromPdf(file, {
        signal: controller.signal,
        onProgress: (p) => setProgress(p),
      });
      try { localStorage.setItem("currentNovelId", novel.id); } catch {}
      navigate({ to: "/read/$novelId", params: { novelId: novel.id } });
    } catch (err) {
      if (err instanceof PdfCancelledError) {
        // silent
      } else {
        console.error(err);
        const msg =
          err instanceof PdfExtractionError
            ? err.message
            : "Could not read this PDF. It may be scanned or image-based. Please try a text-based PDF.";
        alert(msg);
      }
    } finally {
      abortRef.current = null;
      setLoading(false);
    }
  }

  const pct =
    progress.totalPages > 0
      ? Math.round((progress.loadedPages / progress.totalPages) * 100)
      : 0;

  return (
    <>
      <header
        className="sticky top-0 z-40 backdrop-blur-md border-b border-border"
        style={{ background: "color-mix(in oklab, var(--nav) 88%, transparent)" }}
      >
        <div className="max-w-6xl mx-auto px-5 sm:px-6 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <BookOpen className="w-4 h-4" style={{ color: "var(--gold)" }} />
            <span className="font-display text-lg tracking-[0.18em] uppercase">
              {t("nav_brand")}
            </span>
          </Link>

          <nav className="flex items-center gap-1 text-sm">
            <Link
              to="/"
              className="hidden sm:inline-block px-3 py-2 rounded-md font-ui tracking-wide text-[13px] hover:text-primary transition-colors"
              activeProps={{ className: "hidden sm:inline-block px-3 py-2 rounded-md font-ui tracking-wide text-[13px] text-primary" }}
              activeOptions={{ exact: true }}
            >
              {t("nav_home")}
            </Link>
            <Link
              to="/library"
              className="inline-block px-3 py-2 rounded-md font-ui tracking-wide text-[13px] hover:text-primary transition-colors"
              activeProps={{ className: "inline-block px-3 py-2 rounded-md font-ui tracking-wide text-[13px] text-primary" }}
            >
              {t("nav_library")}
            </Link>

            {showAddButton && (
              <>
                <input
                  ref={inputRef}
                  type="file"
                  accept="application/pdf,.pdf"
                  className="hidden"
                  onChange={onFile}
                />
                <button
                  onClick={() => inputRef.current?.click()}
                  disabled={loading}
                  className="ml-1 inline-flex items-center gap-1.5 px-3 py-2 rounded-full bg-primary text-primary-foreground text-xs font-medium tracking-wide hover:opacity-90 transition disabled:opacity-60"
                >
                  {loading ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>{loading ? t("reading") : t("lib_add")}</span>
                </button>
              </>
            )}

            <button
              onClick={toggleLang}
              aria-label="Toggle language"
              className="ml-2 inline-flex items-center gap-1 h-9 px-3 rounded-full border border-border hover:border-primary/60 text-[11px] font-ui font-medium tracking-[0.2em] uppercase transition"
            >
              <Languages className="w-3.5 h-3.5" />
              {lang === "en" ? "AR" : "EN"}
            </button>

            <button
              onClick={toggle}
              aria-label="Toggle theme"
              className="ml-1 w-9 h-9 rounded-full border border-border hover:border-primary/60 flex items-center justify-center transition-all hover:scale-105"
            >
              <div className="relative w-4 h-4">
                <Sun
                  className={`w-4 h-4 absolute inset-0 transition-all duration-500 ${
                    theme === "dark" ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"
                  }`}
                />
                <Moon
                  className={`w-4 h-4 absolute inset-0 transition-all duration-500 ${
                    theme === "dark" ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"
                  }`}
                />
              </div>
            </button>
          </nav>
        </div>
      </header>

      {loading && (
        <div className="fixed inset-0 z-[60] bg-background/95 backdrop-blur-md flex items-center justify-center p-6">
          <div
            className="w-full max-w-md rounded-2xl bg-card border border-border p-8 text-center"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <Loader2 className="w-10 h-10 mx-auto mb-5 animate-spin" style={{ color: "var(--gold)" }} />
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-2">
              Preparing your book
            </div>
            <div className="font-display text-xl mb-1 truncate" title={fileName}>
              {fileName}
            </div>
            <div className="text-sm text-muted-foreground mb-6">
              {progress.totalPages > 0
                ? `Loading page ${progress.loadedPages} of ${progress.totalPages}…`
                : "Opening document…"}
            </div>

            <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden mb-2">
              <div
                className="h-full transition-all duration-300"
                style={{ width: `${pct}%`, background: "var(--gold)" }}
              />
            </div>
            <div className="text-xs tabular-nums text-muted-foreground mb-6">{pct}%</div>

            {slow && (
              <div className="flex items-start gap-2 text-left p-3 rounded-lg border border-border bg-muted/40 mb-5">
                <AlertTriangle className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground leading-relaxed">
                  This is taking longer than expected. You can cancel and try a smaller text-based PDF.
                </p>
              </div>
            )}

            <button
              onClick={cancelLoad}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-border text-xs font-medium hover:bg-muted transition"
            >
              <X className="w-3.5 h-3.5" />
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}
