import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Lang = "en" | "ar";

type Dict = Record<string, { en: string; ar: string }>;

export const T: Dict = {
  nav_home: { en: "Home", ar: "الرئيسية" },
  nav_library: { en: "Library", ar: "المكتبة" },
  nav_brand: { en: "Cinova", ar: "سينوفا" },
  hero_title: { en: "Where Words Come Alive", ar: "حيث تحيا الكلمات" },
  hero_subtitle: {
    en: "A new dimension of reading — where literature meets cinematic sound.",
    ar: "بُعد جديد للقراءة — حيث يلتقي الأدب بالصوت السينمائي.",
  },
  hero_cta: { en: "Enter the Library", ar: "ادخل المكتبة" },
  about_kicker: { en: "The Invention", ar: "الابتكار" },
  about_title: { en: "A New Reading Experience", ar: "تجربة قراءة جديدة" },
  about_body: {
    en: "This platform introduces an innovative concept combining intelligent reading navigation with cinematic adaptive music — a patented invention in progress.",
    ar: "تقدّم هذه المنصة مفهومًا مبتكرًا يجمع بين الملاحة الذكية للقراءة والموسيقى السينمائية التكيفية — اختراع قيد التسجيل.",
  },
  feat_cursor_title: { en: "Smart Reading Cursor", ar: "مؤشّر القراءة الذكي" },
  feat_cursor_desc: {
    en: "Guides your eye line by line, word by word.",
    ar: "يقود عينيك سطرًا بسطر، وكلمةً بكلمة.",
  },
  feat_ai_title: { en: "AI Emotion Analysis", ar: "تحليل المشاعر بالذكاء الاصطناعي" },
  feat_ai_desc: {
    en: "Reads the mood of every passage in real time.",
    ar: "يقرأ مزاج كل مقطع في الزمن الحقيقي.",
  },
  feat_sound_title: { en: "Cinematic Sound Engine", ar: "محرك صوت سينمائي" },
  feat_sound_desc: {
    en: "An adaptive score that breathes with the story.",
    ar: "موسيقى تكيفية تتنفس مع الحكاية.",
  },
  inventor_kicker: { en: "The Inventor", ar: "المبتكر" },
  inventor_name: { en: "Chahdane Louay", ar: "شحدان لؤي" },
  inventor_role: {
    en: "Inventor & Creator of this concept",
    ar: "مبتكر وصاحب هذا المفهوم",
  },
  footer: {
    en: "© 2026 Chahdane Louay — Patent Pending Concept",
    ar: "© 2026 شحدان لؤي — مفهوم قيد تسجيل البراءة",
  },
  lib_title: { en: "The Library", ar: "المكتبة" },
  lib_subtitle: {
    en: "Selected works and your uploaded novels.",
    ar: "أعمال مختارة ورواياتك المرفوعة.",
  },
  lib_add: { en: "Add Novel", ar: "أضف رواية" },
  lib_empty: {
    en: "Your library is empty. Add your first novel.",
    ar: "مكتبتك فارغة. أضف روايتك الأولى.",
  },
  lib_selected: { en: "Selected works", ar: "أعمال مختارة" },
  lib_uploads: { en: "Your uploads", ar: "روايتك المرفوعة" },
  begin: { en: "Begin reading", ar: "ابدأ القراءة" },
  continue: { en: "Continue reading", ar: "تابع القراءة" },
  reading: { en: "Reading…", ar: "جارٍ القراءة…" },
  delete: { en: "Delete", ar: "حذف" },
};

const LangContext = createContext<{
  lang: Lang;
  setLang: (l: Lang) => void;
  toggle: () => void;
  t: (k: keyof typeof T) => string;
  dir: "ltr" | "rtl";
}>({
  lang: "en",
  setLang: () => {},
  toggle: () => {},
  t: (k) => T[k]?.en ?? String(k),
  dir: "ltr",
});

export function LangProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>("en");

  useEffect(() => {
    const stored = (typeof window !== "undefined" && localStorage.getItem("lang")) as Lang | null;
    if (stored === "en" || stored === "ar") setLangState(stored);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.documentElement.lang = lang;
    document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
    localStorage.setItem("lang", lang);
  }, [lang]);

  const value = {
    lang,
    setLang: setLangState,
    toggle: () => setLangState((l) => (l === "en" ? "ar" : "en")),
    t: (k: keyof typeof T) => T[k]?.[lang] ?? T[k]?.en ?? String(k),
    dir: (lang === "ar" ? "rtl" : "ltr") as "ltr" | "rtl",
  };

  return <LangContext.Provider value={value}>{children}</LangContext.Provider>;
}

export const useLang = () => useContext(LangContext);
