import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Trash2, BookOpen } from "lucide-react";
import { useEffect, useState } from "react";
import { Nav } from "@/components/Nav";
import { useLang } from "@/lib/i18n";
import { novels } from "@/lib/novels";
import { listUploadedNovels, deleteUploadedNovel, type UploadedRecord } from "@/lib/uploadedNovels";

export const Route = createFileRoute("/library")({
  head: () => ({
    meta: [
      { title: "Library — Cinova" },
      { name: "description", content: "Browse the curated library and your uploaded novels." },
      { property: "og:title", content: "Library — Cinova" },
      { property: "og:description", content: "Browse the curated library and your uploaded novels." },
    ],
  }),
  component: Library,
});

function Library() {
  const { t } = useLang();
  const [uploaded, setUploaded] = useState<UploadedRecord[]>([]);

  useEffect(() => {
    setUploaded(listUploadedNovels());
    const onFocus = () => setUploaded(listUploadedNovels());
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const handleDelete = (id: string) => {
    deleteUploadedNovel(id);
    setUploaded(listUploadedNovels());
  };

  return (
    <div className="min-h-screen">
      <Nav showAddButton />

      <section className="relative">
        <div aria-hidden className="absolute inset-0 paper-bg opacity-40 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-6 pt-20 pb-12 text-center">
          <div className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground mb-4">
            {t("lib_title")}
          </div>
          <h1 className="font-display text-5xl sm:text-6xl font-medium italic">
            {t("lib_title")}
          </h1>
          <div className="divider-ornament mt-5 text-xs">
            <span style={{ color: "var(--gold)" }}>✦</span>
          </div>
          <p className="mt-5 max-w-xl mx-auto font-serif-reader text-muted-foreground">
            {t("lib_subtitle")}
          </p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-16">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-2xl sm:text-3xl italic">{t("lib_selected")}</h2>
          <div className="hidden md:flex items-center gap-2 text-xs text-muted-foreground uppercase tracking-widest">
            <BookOpen className="w-3.5 h-3.5" /> {novels.length}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {novels.map((n) => (
            <article
              key={n.id}
              className="group rounded-2xl bg-card border border-border overflow-hidden transition-all hover:-translate-y-1"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              <div
                className="aspect-[3/4] relative overflow-hidden"
                style={{ background: n.coverGradient }}
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />
                <div className="absolute inset-0 p-6 flex flex-col justify-between">
                  <div className="text-[10px] uppercase tracking-[0.3em] text-white/70">
                    {n.year}
                  </div>
                  <div>
                    <div className="font-display italic text-2xl text-white leading-tight">
                      {n.title}
                    </div>
                    <div className="text-white/70 text-xs mt-1 tracking-widest uppercase">
                      {n.author}
                    </div>
                  </div>
                </div>
              </div>
              <div className="p-6">
                <p className="text-sm text-muted-foreground italic font-serif-reader leading-relaxed min-h-[3em]">
                  "{n.tagline}"
                </p>
                <Link
                  to="/read/$novelId"
                  params={{ novelId: n.id }}
                  onClick={() => { try { localStorage.setItem("currentNovelId", n.id); } catch {} }}
                  className="mt-5 inline-flex items-center gap-2 text-[11px] font-ui font-medium uppercase tracking-[0.25em] text-primary hover:gap-3 transition-all"
                >
                  {t("begin")} <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-6 pb-24">
        <div className="flex items-end justify-between mb-8">
          <h2 className="font-display text-2xl sm:text-3xl italic">{t("lib_uploads")}</h2>
        </div>

        {uploaded.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-12 text-center font-serif-reader italic text-muted-foreground">
            {t("lib_empty")}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {uploaded.map((rec) => (
              <div
                key={rec.novel.id}
                className="group relative rounded-xl bg-card border border-border p-5 flex flex-col gap-3 transition hover:-translate-y-0.5"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div className="flex items-start gap-3">
                  <div
                    className="w-10 h-12 rounded-md shrink-0"
                    style={{ background: rec.novel.coverGradient }}
                  />
                  <div className="min-w-0 flex-1">
                    <div className="font-display italic text-lg leading-tight truncate">
                      {rec.novel.title}
                    </div>
                    <div className="text-[10px] uppercase tracking-widest text-muted-foreground mt-1">
                      {new Date(rec.uploadedAt).toLocaleDateString()} · {rec.novel.chapters.length} pages
                    </div>
                  </div>
                  <button
                    onClick={() => handleDelete(rec.novel.id)}
                    className="opacity-60 hover:opacity-100 text-muted-foreground hover:text-destructive transition"
                    aria-label={t("delete")}
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <Link
                  to="/read/$novelId"
                  params={{ novelId: rec.novel.id }}
                  onClick={() => { try { localStorage.setItem("currentNovelId", rec.novel.id); } catch {} }}
                  className="inline-flex items-center gap-2 text-[11px] font-ui font-medium uppercase tracking-[0.25em] text-primary hover:gap-3 transition-all"
                >
                  {rec.lastPosition > 0 ? t("continue") : t("begin")}{" "}
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </section>

      <footer
        className="border-t border-border py-8 text-center text-[11px] font-ui tracking-[0.3em] uppercase text-muted-foreground"
        style={{ background: "var(--nav)" }}
      >
        {t("footer")}
      </footer>
    </div>
  );
}
