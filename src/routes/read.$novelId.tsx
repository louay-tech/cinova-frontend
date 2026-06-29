import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Pause, Play, Gauge, Settings2, ChevronDown, ChevronUp, X } from "lucide-react";
import { getNovel } from "@/lib/novels";
import type { Novel } from "@/lib/novels";
import { matchMusicForScene, type MatchedMusic, type EmotionScene } from "@/lib/api";
import { isRtlText } from "@/lib/rtl";
import { setLastPosition, getLastPosition } from "@/lib/uploadedNovels";

export const Route = createFileRoute("/read/$novelId")({
  head: () => ({
    meta: [
      { title: "Reading — Cinova" },
      { name: "description", content: "A cinematic reading." },
    ],
  }),
  component: ReaderGate,
});

function ReaderGate() {
  const { novelId } = Route.useParams();
  const [novel, setNovel] = useState<Novel | undefined | null>(undefined);

  useEffect(() => {
    const id = novelId || (typeof window !== "undefined" ? localStorage.getItem("currentNovelId") || "" : "");
    if (typeof window !== "undefined" && novelId) {
      localStorage.setItem("currentNovelId", novelId);
    }
    const found = getNovel(id);
    setNovel(found ?? null);
  }, [novelId]);

  if (novel === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center text-sm text-muted-foreground font-serif-reader italic">
        Opening the book…
      </div>
    );
  }
  if (novel === null) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4">
        <div className="max-w-md text-center">
          <h1 className="font-serif-reader text-3xl text-foreground">Novel not found</h1>
          <p className="mt-3 text-sm text-muted-foreground font-serif-reader italic">
            This book may have been removed from your library.
          </p>
          <Link
            to="/library"
            className="mt-6 inline-flex items-center justify-center rounded-md bg-primary px-5 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Back to Library
          </Link>
        </div>
      </div>
    );
  }
  return <Reader novel={novel} />;
}

type CursorStyle = "line" | "underline" | "dot";
type CursorSize = "small" | "medium" | "large";

const COLOR_PRESETS: { id: string; label: string; value: string }[] = [
  { id: "amber", label: "Amber", value: "oklch(0.78 0.15 75)" },
  { id: "blue", label: "Electric Blue", value: "oklch(0.7 0.2 250)" },
  { id: "green", label: "Soft Green", value: "oklch(0.78 0.16 150)" },
  { id: "white", label: "White", value: "oklch(0.98 0 0)" },
  { id: "red", label: "Red", value: "oklch(0.65 0.22 25)" },
];

// Per-chapter item — only built when the chapter is mounted.
type CharItem = {
  ch: string;
  paraIdx: number;
  isSpace: boolean;
  wordKey: string;
  wordIndex: number;
};

// How many chapters to keep around the cursor in the DOM.
// Requirement: keep current + next (and we keep 1 previous for context, well
// under the "remove anything 20+ behind" budget).
const WINDOW_BEHIND = 1;
const WINDOW_AHEAD = 1;

function buildChapterItems(
  paragraphs: string[],
  chapIdx: number,
  startWordIndex: number,
): { items: CharItem[]; stopCount: number; wordCount: number } {
  const items: CharItem[] = [];
  let globalWordIndex = startWordIndex;
  paragraphs.forEach((p, paraIdx) => {
    const words = p.split(/\s+/).filter(Boolean);
    words.forEach((w, wi) => {
      const wordKey = `c${chapIdx}-p${paraIdx}-w${wi}`;
      for (const c of w) {
        items.push({ ch: c, paraIdx, isSpace: false, wordKey, wordIndex: globalWordIndex });
      }
      if (wi < words.length - 1) {
        items.push({ ch: " ", paraIdx, isSpace: true, wordKey: `${wordKey}-sp`, wordIndex: globalWordIndex });
      }
      globalWordIndex++;
    });
  });
  return { items, stopCount: items.length, wordCount: globalWordIndex - startWordIndex };
}

function Reader({ novel }: { novel: Novel }) {


  const rtl = useMemo(() => {
    const sample = novel.chapters
      .slice(0, 2)
      .map((c: { paragraphs: string[] }) => c.paragraphs.join(" "))
      .join(" ");
    return isRtlText(sample);
  }, [novel]);

  // Lightweight metadata for every chapter — no item arrays, just counts.
  const chapMetas = useMemo(() => {
    let offset = 0;
    let wordOffset = 0;
    return novel.chapters.map((ch: { title: string; paragraphs: string[] }) => {
      let stops = 0;
      let wordCount = 0;
      ch.paragraphs.forEach((p) => {
        const words = p.split(/\s+/).filter(Boolean);
        wordCount += words.length;
        words.forEach((w, wi) => {
          stops += w.length;
          if (wi < words.length - 1) stops += 1;
        });
      });
      const meta = { title: ch.title, stopCount: stops, offset, wordOffset, wordCount };
      offset += stops;
      wordOffset += wordCount;
      return meta;
    });

  }, [novel]);

  const totalStops = useMemo(
    () => chapMetas.reduce((a: number, m: { stopCount: number }) => a + m.stopCount, 0),
    [chapMetas],
  );

  // Restore previous global position → {chap, local}.
  const initialActive = useMemo(() => {
    const savedGlobal = getLastPosition(novel.id);
    let g = savedGlobal;
    if (g < 0 || g >= totalStops) g = 0;
    for (let i = chapMetas.length - 1; i >= 0; i--) {
      const m = chapMetas[i];
      if (g >= m.offset && m.stopCount > 0) {
        return { chap: i, local: Math.min(g - m.offset, m.stopCount - 1) };
      }
    }
    return { chap: 0, local: 0 };
  }, [novel.id, chapMetas, totalStops]);

  const [active, setActive] = useState(initialActive);
  const [playing, setPlaying] = useState(false);
  const [speed, setSpeed] = useState(50);

  const [cursorStyle, setCursorStyle] = useState<CursorStyle>("line");
  const [cursorColor, setCursorColor] = useState<string>(COLOR_PRESETS[0].value);
  const [cursorSize, setCursorSize] = useState<CursorSize>("medium");
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [controlsOpen, setControlsOpen] = useState(true);

  const [caret, setCaret] = useState({ top: 0, left: 0, width: 0, height: 0, visible: false });

  const containerRef = useRef<HTMLDivElement>(null);
  // Key is `${chapIdx}:${localIdx}`.
  const charRefs = useRef<Map<string, HTMLSpanElement>>(new Map());

  // Virtual window — only these chapters are built and mounted.
  const windowRange = useMemo(() => {
    const from = Math.max(0, active.chap - WINDOW_BEHIND);
    const to = Math.min(novel.chapters.length - 1, active.chap + WINDOW_AHEAD);
    return { from, to };
  }, [active.chap, novel.chapters.length]);

  const mountedChapters = useMemo(() => {
    const out: { idx: number; title: string; items: CharItem[] }[] = [];
    for (let i = windowRange.from; i <= windowRange.to; i++) {
      const built = buildChapterItems(novel.chapters[i].paragraphs, i, chapMetas[i].wordOffset);
      out.push({ idx: i, title: novel.chapters[i].title, items: built.items });
    }
    return out;
  }, [windowRange.from, windowRange.to, novel.chapters, chapMetas]);

  // Drop stale refs whenever the window shifts.
  useEffect(() => {
    const valid = new Set<string>();
    for (let i = windowRange.from; i <= windowRange.to; i++) {
      for (let j = 0; j < chapMetas[i].stopCount; j++) valid.add(`${i}:${j}`);
    }
    charRefs.current.forEach((_, k) => {
      if (!valid.has(k)) charRefs.current.delete(k);
    });
  }, [windowRange.from, windowRange.to, chapMetas]);

  const updateCaret = () => {
    const el = charRefs.current.get(`${active.chap}:${active.local}`);
    const container = containerRef.current;
    if (!el || !container) {
      setCaret((c) => ({ ...c, visible: false }));
      return;
    }
    const cRect = container.getBoundingClientRect();
    const r = el.getBoundingClientRect();
    setCaret({
      top: r.top - cRect.top,
      left: r.left - cRect.left,
      width: r.width,
      height: r.height,
      visible: true,
    });
  };

  // Re-position caret when active changes. Retry across a few frames so the
  // newly-mounted chapter's spans have time to attach refs.
  useEffect(() => {
    let cancelled = false;
    let attempts = 0;
    const tick = () => {
      if (cancelled) return;
      const el = charRefs.current.get(`${active.chap}:${active.local}`);
      if (el) {
        updateCaret();
        const rect = el.getBoundingClientRect();
        if (rect.top < 120 || rect.bottom > window.innerHeight - 160) {
          el.scrollIntoView({ behavior: "smooth", block: "center" });
        }
      } else if (attempts++ < 8) {
        requestAnimationFrame(tick);
      }
    };
    requestAnimationFrame(tick);
    // Persist as global offset.
    setLastPosition(novel.id, chapMetas[active.chap].offset + active.local);
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active.chap, active.local]);

  useEffect(() => {
    const onResize = () => updateCaret();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  // Auto-advance — constant cadence.
  useEffect(() => {
    if (!playing) return;
    const delay = 300 - (speed / 100) * 250;
    const id = setInterval(() => {
      setActive((cur) => {
        const meta = chapMetas[cur.chap];
        if (cur.local + 1 < meta.stopCount) {
          return { chap: cur.chap, local: cur.local + 1 };
        }
        // Skip empty trailing chapters.
        for (let next = cur.chap + 1; next < chapMetas.length; next++) {
          if (chapMetas[next].stopCount > 0) return { chap: next, local: 0 };
        }
        setPlaying(false);
        return cur;
      });
    }, delay);
    return () => clearInterval(id);
  }, [playing, speed, chapMetas]);

  const globalActive = chapMetas[active.chap].offset + active.local;
  const progress = totalStops === 0 ? 0 : ((globalActive + 1) / totalStops) * 100;

  // Current word index at the visible reader cursor.
  const currentWordIndex = useMemo(() => {
    const chapItems = mountedChapters.find((c) => c.idx === active.chap)?.items;
    if (!chapItems || !chapItems[active.local]) return chapMetas[active.chap].wordOffset;
    return chapItems[active.local].wordIndex;
  }, [mountedChapters, active.chap, active.local, chapMetas]);

  // Hidden AI cursor — leads the visible cursor by a fixed word offset.
  const AI_CURSOR_LEAD_WORDS = 8;
  const aiCursorWordIndex = currentWordIndex + AI_CURSOR_LEAD_WORDS;

  const [currentMatchedMusic, setCurrentMatchedMusic] = useState<MatchedMusic | null>(null);
  const [activeScene, setActiveScene] = useState<EmotionScene | null>(null);
  const lastRequestedSceneRef = useRef<EmotionScene | null>(null);

  useEffect(() => {
    if (!novel.emotionMap || novel.emotionMap.length === 0) return;
    const scene = novel.emotionMap.find(
      (s: EmotionScene) => aiCursorWordIndex >= s.start && aiCursorWordIndex <= s.end,
    );
    if (!scene) return;
    if (lastRequestedSceneRef.current === scene) return;
    lastRequestedSceneRef.current = scene;
    setActiveScene(scene);
    matchMusicForScene(scene).then((result) => {
      if (result && result.success) {
        setCurrentMatchedMusic(result);
      }
    });
  }, [aiCursorWordIndex, novel.emotionMap]);

  const sizeScale = cursorSize === "small" ? 0.7 : cursorSize === "large" ? 1.4 : 1;
  let caretStyle: React.CSSProperties = {
    ["--caret-color" as string]: cursorColor,
    opacity: caret.visible ? 1 : 0,
  };
  if (cursorStyle === "line") {
    const w = Math.max(2, Math.round(2.5 * sizeScale));
    caretStyle = {
      ...caretStyle,
      top: caret.top + caret.height * 0.1,
      left: rtl ? caret.left + caret.width - w / 2 : caret.left - w / 2,
      width: w,
      height: caret.height * 0.82,
    };
  } else if (cursorStyle === "underline") {
    const h = Math.max(2, Math.round(2 * sizeScale));
    caretStyle = {
      ...caretStyle,
      top: caret.top + caret.height - 1,
      left: caret.left,
      width: Math.max(caret.width, 8),
      height: h,
    };
  } else {
    const d = Math.max(4, Math.round(6 * sizeScale));
    caretStyle = {
      ...caretStyle,
      top: caret.top + caret.height + 2,
      left: caret.left + caret.width / 2 - d / 2,
      width: d,
      height: d,
    };
  }

  const readerFontClass = rtl ? "font-arabic-reader" : "font-serif-reader";
  const paragraphTextSize = rtl ? "text-[1.2rem]" : "text-[1.35rem]";

  return (
    <div
      className="min-h-screen flex flex-col overflow-x-hidden"
      style={{ touchAction: "pan-y", overflowX: "hidden", maxWidth: "100%" }}
    >
      <div className="sticky top-0 z-30 backdrop-blur-md bg-background/70 border-b border-border">

        <div className="max-w-3xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> Library
          </Link>
          <div className="text-center min-w-0 flex-1 px-4">
            <div className={`${readerFontClass} italic text-base leading-none truncate`}>
              {novel.title}
            </div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-1 truncate">
              {novel.author} · {chapMetas[active.chap].title}
            </div>
          </div>
          <button
            onClick={() => setSettingsOpen((s) => !s)}
            className="w-9 h-9 rounded-full border border-border hover:border-primary/60 flex items-center justify-center transition"
            aria-label="Cursor settings"
          >
            <Settings2 className="w-4 h-4" />
          </button>
        </div>
      </div>

      {settingsOpen && (
        <div className="fixed top-16 right-4 z-40 w-72 rounded-2xl bg-card/95 backdrop-blur-xl border border-border p-5"
             style={{ boxShadow: "var(--shadow-card)" }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xs uppercase tracking-[0.25em] text-muted-foreground">Cursor</div>
            <button
              onClick={() => setSettingsOpen(false)}
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="mb-5">
            <div className="text-[11px] font-medium mb-2">Style</div>
            <div className="grid grid-cols-3 gap-2">
              {(["line", "underline", "dot"] as CursorStyle[]).map((s) => (
                <button
                  key={s}
                  onClick={() => setCursorStyle(s)}
                  className={`py-2 rounded-lg border text-xs capitalize transition ${
                    cursorStyle === s
                      ? "border-primary bg-primary/10 text-foreground"
                      : "border-border text-muted-foreground hover:border-primary/40"
                  }`}
                >
                  {s === "line" ? "| line" : s === "underline" ? "_ under" : "• dot"}
                </button>
              ))}
            </div>
          </div>

          <div className="mb-5">
            <div className="text-[11px] font-medium mb-2">Color</div>
            <div className="flex items-center gap-2">
              {COLOR_PRESETS.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setCursorColor(c.value)}
                  aria-label={c.label}
                  title={c.label}
                  className={`w-7 h-7 rounded-full border-2 transition ${
                    cursorColor === c.value ? "border-foreground scale-110" : "border-border"
                  }`}
                  style={{ background: c.value, boxShadow: `0 0 12px ${c.value}` }}
                />
              ))}
            </div>
          </div>

          <div>
            <div className="text-[11px] font-medium mb-2 flex justify-between">
              <span>Size</span>
              <span className="text-muted-foreground capitalize">{cursorSize}</span>
            </div>
            <input
              type="range"
              min={0}
              max={2}
              step={1}
              value={cursorSize === "small" ? 0 : cursorSize === "medium" ? 1 : 2}
              onChange={(e) => {
                const v = Number(e.target.value);
                setCursorSize(v === 0 ? "small" : v === 1 ? "medium" : "large");
              }}
              className="w-full accent-primary"
              style={{ accentColor: cursorColor }}
            />
          </div>
        </div>
      )}

      <main
        className="flex-1 overflow-y-auto overflow-x-hidden pb-40"
        style={{ touchAction: "pan-y", overflowX: "hidden", maxWidth: "100%" }}
      >
        <div
          className="max-w-2xl mx-auto py-20 relative"
          style={{
            paddingLeft: 20,
            paddingRight: 20,
            maxWidth: "100%",
            overflowX: "hidden",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            whiteSpace: "normal",
          }}
          ref={containerRef}
          dir={rtl ? "rtl" : "ltr"}
        >

          <div
            className={`reader-caret ${cursorStyle === "dot" ? "dot" : ""} ${playing ? "" : "paused"}`}
            style={caretStyle}
            aria-hidden
          />

          {windowRange.from > 0 && (
            <div className="text-center text-xs text-muted-foreground mb-8 opacity-60">
              … earlier pages unloaded to save memory …
            </div>
          )}

          {mountedChapters.map(({ idx, title, items }) => (
            <ChapterView
              key={idx}
              chapIdx={idx}
              title={title}
              items={items}
              active={active}
              setActive={setActive}
              charRefs={charRefs}
              readerFontClass={readerFontClass}
              paragraphTextSize={paragraphTextSize}
              rtl={rtl}
            />
          ))}

          {windowRange.to < novel.chapters.length - 1 && (
            <div className="text-center text-xs text-muted-foreground mt-12 opacity-60">
              … next pages will load as you read …
            </div>
          )}
        </div>
      </main>

      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-30">
        {controlsOpen ? (
          <div
            className="rounded-full bg-card/95 backdrop-blur-xl border border-border pl-2 pr-3 py-1.5 flex items-center gap-3"
            style={{ boxShadow: "var(--shadow-card)" }}
          >
            <button
              onClick={() => setPlaying((p) => !p)}
              className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:scale-105 transition-transform shrink-0"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5 ml-0.5" />}
            </button>

            <div className="flex items-center gap-2 min-w-[180px]">
              <Gauge className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
              <input
                type="range"
                min={0}
                max={100}
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-28 h-1 accent-primary"
                aria-label="Reading speed"
              />
              <span className="text-[10px] tabular-nums text-muted-foreground w-8 text-right">
                {Math.round(progress)}%
              </span>
            </div>

            <button
              onClick={() => setControlsOpen(false)}
              className="w-7 h-7 rounded-full text-muted-foreground hover:text-foreground hover:bg-muted flex items-center justify-center"
              aria-label="Hide controls"
            >
              <ChevronDown className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            onClick={() => setControlsOpen(true)}
            className="w-10 h-10 rounded-full bg-card/95 backdrop-blur-xl border border-border flex items-center justify-center hover:scale-105 transition"
            style={{ boxShadow: "var(--shadow-card)" }}
            aria-label="Show controls"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 h-0.5 bg-muted/30 z-20">
        <div
          className="h-full transition-all duration-300"
          style={{ width: `${progress}%`, background: cursorColor }}
        />
      </div>
    </div>
  );
}

type ChapterViewProps = {
  chapIdx: number;
  title: string;
  items: CharItem[];
  active: { chap: number; local: number };
  setActive: React.Dispatch<React.SetStateAction<{ chap: number; local: number }>>;
  charRefs: React.MutableRefObject<Map<string, HTMLSpanElement>>;
  readerFontClass: string;
  paragraphTextSize: string;
  rtl: boolean;
};

function ChapterView({
  chapIdx,
  title,
  items,
  active,
  setActive,
  charRefs,
  readerFontClass,
  paragraphTextSize,
  rtl,
}: ChapterViewProps) {
  const elements: React.ReactNode[] = [];
  let buffer: React.ReactNode[] = [];
  let wordChars: React.ReactNode[] = [];
  let currentWordKey: string | null = null;
  let currentPara = -1;
  const isActiveChap = active.chap === chapIdx;

  const flushWord = () => {
    if (wordChars.length && currentWordKey) {
      buffer.push(
        <span
          key={`w-${currentWordKey}`}
          className="reader-word"
          style={{
            display: "inline",
            wordBreak: "break-word",
            overflowWrap: "anywhere",
          }}
        >
          {wordChars}
        </span>,
      );
      wordChars = [];
      currentWordKey = null;
    }
  };

  const flushPara = (key: string) => {
    flushWord();
    if (buffer.length) {
      elements.push(
        <p
          key={key}
          className={`${readerFontClass} ${paragraphTextSize} leading-[1.95] mb-7 text-foreground`}
          style={{
            textAlign: rtl ? "right" : undefined,
            fontFamily: rtl ? "'Amiri', serif" : undefined,
            direction: rtl ? "rtl" : undefined,
            maxWidth: "100%",
            wordWrap: "break-word",
            overflowWrap: "break-word",
            whiteSpace: "normal",
            wordBreak: "break-word",
          }}
        >
          {buffer}
        </p>,
      );
      buffer = [];
    }
  };


  items.forEach((it, i) => {
    if (currentPara !== -1 && currentPara !== it.paraIdx) {
      flushPara(`p-${chapIdx}-${i}`);
    }
    currentPara = it.paraIdx;
    const refKey = `${chapIdx}:${i}`;

    if (it.isSpace) {
      flushWord();
      buffer.push(
        <span
          key={i}
          ref={(el) => {
            if (el) charRefs.current.set(refKey, el);
            else charRefs.current.delete(refKey);
          }}
          className="reader-char"
          onClick={() => setActive({ chap: chapIdx, local: i })}
        >
          {"\u00A0"}
        </span>,
      );
      return;
    }

    if (currentWordKey !== it.wordKey) {
      flushWord();
      currentWordKey = it.wordKey;
    }

    const isActive = isActiveChap && i === active.local;
    wordChars.push(
      <span
        key={i}
        ref={(el) => {
          if (el) charRefs.current.set(refKey, el);
          else charRefs.current.delete(refKey);
        }}
        className={`reader-char${isActive ? " active" : ""}`}
        onClick={() => setActive({ chap: chapIdx, local: i })}
      >
        {it.ch}
      </span>,
    );
  });
  flushPara(`p-${chapIdx}-end`);

  return (
    <section>
      <div
        className={`mt-20 mb-10 text-center ${readerFontClass} text-2xl tracking-[0.2em] uppercase text-primary`}
      >
        {title}
      </div>
      {elements}
    </section>
  );
}
