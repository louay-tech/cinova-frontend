import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Cpu, MousePointer2, Music2, User } from "lucide-react";
import { Nav } from "@/components/Nav";
import { useLang } from "@/lib/i18n";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cinova — Where Words Come Alive" },
      {
        name: "description",
        content:
          "A new dimension of reading — where literature meets cinematic sound. A patent-pending reading experience by Chahdane Louay.",
      },
      { property: "og:title", content: "Cinova — Where Words Come Alive" },
      {
        property: "og:description",
        content: "A new dimension of reading — where literature meets cinematic sound.",
      },
    ],
  }),
  component: Home,
});

function Home() {
  const { t, lang } = useLang();
  const isAr = lang === "ar";

  return (
    <div className="min-h-screen">
      <Nav />

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div aria-hidden className="absolute inset-0 paper-bg opacity-60 pointer-events-none" />
        <div aria-hidden className="absolute inset-0 candle-glow pointer-events-none" />
        <div className="relative max-w-5xl mx-auto px-6 pt-28 pb-32 sm:pt-36 sm:pb-40 text-center">
          <div className="divider-ornament fade-rise text-[10px] uppercase tracking-[0.5em] mb-8">
            <span>Est. MMXXVI</span>
          </div>
          <h1
            className={`fade-rise-delay-1 font-display font-medium leading-[1.02] tracking-tight ${
              isAr ? "text-5xl sm:text-7xl" : "text-6xl sm:text-8xl"
            }`}
          >
            <span className="italic" style={{ color: "var(--foreground)" }}>
              {t("hero_title").split(" ").slice(0, -1).join(" ")}
            </span>{" "}
            <span style={{ color: "var(--primary)" }}>
              {t("hero_title").split(" ").slice(-1)}
            </span>
          </h1>
          <p className="fade-rise-delay-2 mt-8 max-w-2xl mx-auto font-serif-reader italic text-lg sm:text-xl leading-relaxed text-muted-foreground">
            {t("hero_subtitle")}
          </p>
          <div className="fade-rise-delay-3 mt-12">
            <Link
              to="/library"
              className="inline-flex items-center gap-3 px-8 py-3.5 rounded-full bg-primary text-primary-foreground font-ui text-sm tracking-[0.2em] uppercase hover:gap-4 transition-all"
              style={{ boxShadow: "var(--shadow-card)" }}
            >
              {t("hero_cta")} <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      {/* About the Invention */}
      <section className="relative border-t border-border">
        <div className="max-w-5xl mx-auto px-6 py-24">
          <div className="text-center mb-14">
            <div className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground mb-4">
              {t("about_kicker")}
            </div>
            <h2 className="font-display text-4xl sm:text-5xl font-medium italic">
              {t("about_title")}
            </h2>
            <div className="divider-ornament mt-6 text-xs">
              <span style={{ color: "var(--gold)" }}>✦</span>
            </div>
            <p className="mt-6 max-w-2xl mx-auto font-serif-reader text-base sm:text-lg leading-relaxed text-muted-foreground">
              {t("about_body")}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { Icon: MousePointer2, title: t("feat_cursor_title"), desc: t("feat_cursor_desc") },
              { Icon: Cpu, title: t("feat_ai_title"), desc: t("feat_ai_desc") },
              { Icon: Music2, title: t("feat_sound_title"), desc: t("feat_sound_desc") },
            ].map(({ Icon, title, desc }) => (
              <div
                key={title}
                className="group rounded-2xl bg-card border border-border p-7 text-center transition-all hover:-translate-y-1"
                style={{ boxShadow: "var(--shadow-card)" }}
              >
                <div
                  className="mx-auto w-12 h-12 rounded-full flex items-center justify-center mb-5 transition-colors group-hover:bg-primary/10"
                  style={{ border: "1px solid var(--gold)" }}
                >
                  <Icon className="w-5 h-5" style={{ color: "var(--gold)" }} />
                </div>
                <h3 className="font-display text-xl mb-2">{title}</h3>
                <p className="font-serif-reader text-sm text-muted-foreground leading-relaxed">
                  {desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Inventor */}
      <section className="border-t border-border">
        <div className="max-w-3xl mx-auto px-6 py-24 text-center">
          <div className="text-[11px] uppercase tracking-[0.4em] text-muted-foreground mb-8">
            {t("inventor_kicker")}
          </div>
          <div
            className="mx-auto w-24 h-24 rounded-full flex items-center justify-center mb-6"
            style={{
              background:
                "linear-gradient(135deg, color-mix(in oklab, var(--gold) 30%, transparent), color-mix(in oklab, var(--primary) 20%, transparent))",
              border: "1px solid var(--gold)",
            }}
          >
            <User className="w-9 h-9" style={{ color: "var(--gold)" }} />
          </div>
          <div className="font-display text-2xl sm:text-3xl italic">{t("inventor_name")}</div>
          <div className="mt-2 font-serif-reader text-sm text-muted-foreground">
            {t("inventor_role")}
          </div>
        </div>
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
