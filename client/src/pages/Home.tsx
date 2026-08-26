import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { captureImageContents } from "@/lib/imagePayload";
import { uploadToImageKit } from "@/lib/imagekitUpload";
import { saveLocalLink } from "@/lib/localLinks";
import { Check, Copy, ImagePlus, LayoutList, Link2, RotateCcw, Upload, X } from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/avif", "image/gif", "image/heic", "image/heif", "image/jpeg", "image/png", "image/webp"];
const MIME_ALIASES: Record<string, string> = { "image/heic-sequence": "image/heic", "image/heif-sequence": "image/heif", "image/jpg": "image/jpeg", "image/pjpeg": "image/jpeg", "image/x-png": "image/png" };
const EXTENSION_MIMES: Record<string, string> = { avif: "image/avif", gif: "image/gif", heic: "image/heic", heif: "image/heif", jpeg: "image/jpeg", jpg: "image/jpeg", png: "image/png", webp: "image/webp" };
const BRAND_MARK_URL = "https://ik.imagekit.io/yazinlink/yazin-link/tests/yazin-link-integration-test_JlKvko15k.png";

type UploadStatus = "preparing" | "ready" | "error";
type UploadFile = { contentBase64?: string; errorMessage?: string; fileName: string; mimeType: string; preview: string; size: number; status: UploadStatus };

const steps = [
  { number: "01", title: "اختر الصورة", text: "اختر صورة من هاتفك أو اسحبها داخل المساحة." },
  { number: "02", title: "جهّز الرابط", text: "يحفظ Yazin-link محتوى الصورة فورًا قبل إنشاء الرابط." },
  { number: "03", title: "انسخ وشارك", text: "انسخ الرابط الجاهز واستخدمه في المكان الذي تريده." },
];
const faqs = [
  ["ما هو Yazin-link؟", "Yazin-link أداة مباشرة تمنحك رابطًا قابلًا للمشاركة لصورتك بعد رفعها."],
  ["هل أستطيع رفع الصور من الهاتف؟", "نعم. تلتقط الأداة محتوى الصورة فور اختيارها لتجنب فقدان صلاحية الوصول إلى الملف في الهاتف."],
  ["ما الصيغ المدعومة؟", "PNG وJPG وWEBP وGIF وAVIF وHEIC وHEIF، حتى حجم 8 ميجابايت."],
];

function fileSize(bytes: number) { return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / (1024 * 1024)).toFixed(1)} MB`; }
function inferImageMimeType(file: File) { const reported = file.type.trim().toLowerCase(); const aliased = MIME_ALIASES[reported] ?? reported; if (ACCEPTED_TYPES.includes(aliased)) return aliased; return EXTENSION_MIMES[file.name.trim().split(".").pop()?.toLowerCase() ?? ""]; }

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const previewRef = useRef<string | null>(null);
  const selectionVersionRef = useRef(0);
  const [selected, setSelected] = useState<UploadFile | null>(null);
  const [dragging, setDragging] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  useEffect(() => () => { if (previewRef.current) URL.revokeObjectURL(previewRef.current); }, []);
  const clearSelected = () => { selectionVersionRef.current += 1; if (previewRef.current) URL.revokeObjectURL(previewRef.current); previewRef.current = null; setSelected(null); setShareUrl(""); setCopied(false); setProgress(null); if (inputRef.current) inputRef.current.value = ""; };

  const acceptFile = async (file?: File) => {
    if (!file) return;
    const mimeType = inferImageMimeType(file);
    if (!mimeType) { toast.error("اختر صورة من الصيغ المدعومة."); return; }
    if (file.size > MAX_FILE_BYTES) { toast.error("حجم الصورة يجب أن لا يتجاوز 8 ميجابايت."); return; }
    selectionVersionRef.current += 1;
    const selectionVersion = selectionVersionRef.current;
    if (previewRef.current) URL.revokeObjectURL(previewRef.current);
    const preview = URL.createObjectURL(file);
    previewRef.current = preview;
    const baseSelection = { fileName: file.name, mimeType, preview, size: file.size };
    setSelected({ ...baseSelection, status: "preparing" }); setShareUrl(""); setCopied(false); setProgress(18);
    try {
      const contentBase64 = await captureImageContents(file);
      if (selectionVersion !== selectionVersionRef.current) return;
      setProgress(66); setSelected({ ...baseSelection, contentBase64, status: "ready" });
      window.setTimeout(() => { if (selectionVersion === selectionVersionRef.current) setProgress(null); }, 520);
    } catch (error) {
      if (selectionVersion !== selectionVersionRef.current) return;
      setProgress(null); setSelected({ ...baseSelection, errorMessage: error instanceof Error ? error.message : "تعذر تجهيز الصورة.", status: "error" });
      toast.error("تعذر تجهيز الصورة. اخترها مرة أخرى ثم أعد المحاولة.");
    }
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => { void acceptFile(event.target.files?.[0]); };
  const onDrop = (event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); void acceptFile(event.dataTransfer.files?.[0]); };
  const onDropzoneKeyDown = (event: KeyboardEvent<HTMLDivElement>) => { if (event.key === "Enter" || event.key === " ") { event.preventDefault(); inputRef.current?.click(); } };
  const generateLink = async () => {
    if (!selected || selected.status !== "ready" || !selected.contentBase64) { toast.error("انتظر تجهيز الصورة أو اخترها مرة أخرى."); return; }
    try { setIsUploading(true); setProgress(78); const result = await uploadToImageKit({ fileName: selected.fileName, mimeType: selected.mimeType, contentBase64: selected.contentBase64 }); saveLocalLink({ publicId: result.fileId, publicUrl: result.url, filename: selected.fileName, bytes: result.size, contentType: selected.mimeType, createdAt: new Date().toISOString() }); setProgress(100); setShareUrl(result.url); toast.success("رابط صورتك أصبح جاهزًا للمشاركة."); window.setTimeout(() => setProgress(null), 720); }
    catch (error) { setProgress(null); toast.error(error instanceof Error ? error.message : "تعذر إنشاء الرابط. حاول مرة أخرى."); }
    finally { setIsUploading(false); }
  };
  const copyLink = async () => { if (!shareUrl) return; try { await navigator.clipboard.writeText(shareUrl); setCopied(true); toast.success("تم نسخ الرابط."); window.setTimeout(() => setCopied(false), 1600); } catch { toast.error("لم يتم النسخ تلقائيًا؛ انسخ الرابط يدويًا."); } };
  const progressLabel = selected?.status === "preparing" ? "يجري تجهيز الصورة بأمان…" : isUploading ? "يجري رفع الصورة وإنشاء الرابط…" : progress === 100 ? "اكتمل إنشاء الرابط" : "";

  return <div className="page-enter min-h-screen overflow-hidden bg-[#121212] text-white">
    <main id="top" className="relative isolate"><div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden"><div className="ribbon ribbon-white" /><div className="ribbon ribbon-pink" /><div className="ribbon ribbon-mint" /><div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_2%,rgba(255,255,255,0.07),transparent_29%),radial-gradient(circle_at_100%_42%,rgba(255,175,187,0.08),transparent_24%)]" /></div>
      <section className="container relative py-7 sm:py-10 lg:py-14"><div className="mx-auto flex max-w-5xl flex-col items-center text-center">
        <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5"><a href="#top" aria-label="Yazin-link" className="brand-lockup inline-flex items-center gap-2.5"><span className="brand-word text-left text-[25px] leading-none text-white"><b>Yazin</b><i>-link</i></span><img src={BRAND_MARK_URL} alt="شعار أسد Yazin-link" className="brand-mark h-10 w-10 object-contain" /></a><Link href="/files" className="my-links-shortcut inline-flex items-center gap-2 text-sm font-black text-white/70 hover:text-[#ffa8b7]"><Upload className="h-4 w-4" />رفع ملف</Link><Link href="/my-links" className="my-links-shortcut inline-flex items-center gap-2 text-sm font-black text-white/70 hover:text-[#a8f2c3]"><LayoutList className="h-4 w-4" />آخر الروابط</Link></div>
        <p className="eyebrow mt-11 text-[#a8f2c3]">ارفع. أنشئ. شارك.</p><h1 className="display-font mt-4 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.065em] text-white sm:text-7xl lg:text-[82px]">رابط صورتك<br /><span className="text-[#ffa8b7]">بأسلوب يلفت النظر.</span></h1><p className="mt-6 max-w-2xl text-base leading-7 text-white/68 sm:text-lg">Yazin-link يمنحك رابطًا مباشرًا لصورتك في خطوات بسيطة، مع تجهيز آمن للصورة من الهاتف قبل إنشاء الرابط.</p>
      </div>
      <div id="tool" className="yazin-panel mx-auto mt-12 max-w-5xl rounded-[30px] border border-white/15 bg-[#181818]/90 p-4 shadow-[0_26px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-7"><div className="rounded-[22px] border border-white/10 bg-white/[0.035] p-4 sm:p-7" onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
        {!selected ? <div role="button" tabIndex={0} onClick={() => inputRef.current?.click()} onKeyDown={onDropzoneKeyDown} className={`upload-stage flex min-h-[300px] flex-col items-center justify-center rounded-[18px] px-5 text-center outline-none ${dragging ? "is-dragging" : ""}`}><div className="relative flex h-[74px] w-[74px] items-center justify-center rounded-[23px] bg-[#f7f6ef] text-[#151515] shadow-[0_10px_28px_rgba(255,255,255,0.12)]"><ImagePlus className="h-8 w-8" /><span className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-[#a8f2c3] ring-4 ring-[#181818]" /></div><h2 className="display-font mt-7 text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl">أضف صورتك إلى Yazin-link</h2><p className="mt-3 max-w-md text-sm leading-6 text-white/55">يتم تجهيز الصورة فور اختيارها حتى تبقى عملية إنشاء الرابط مستقرة على الهاتف.</p><Button className="mt-7 rounded-full bg-[#f7f6ef] px-6 py-5 text-sm font-black text-[#151515] shadow-[0_10px_28px_rgba(255,255,255,0.13)] hover:bg-[#a8f2c3]" onClick={(event) => { event.stopPropagation(); inputRef.current?.click(); }}><Upload className="mr-2 h-4 w-4" />اختر صورة</Button><p className="mt-4 text-xs font-medium tracking-[0.08em] text-white/42">PNG · JPG · WEBP · GIF · AVIF · HEIC — حتى 8 MB</p></div> : <div className="mx-auto grid min-h-[300px] max-w-3xl items-center gap-7 py-2 sm:grid-cols-[185px_1fr]"><div className="relative mx-auto aspect-[4/3] w-full max-w-[185px] overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl"><img src={selected.preview} alt="معاينة الصورة المختارة" className="h-full w-full object-cover" /><button className="absolute right-2 top-2 rounded-full bg-black/75 p-2 text-white backdrop-blur transition hover:bg-black" aria-label="حذف الصورة المختارة" onClick={clearSelected}><X className="h-4 w-4" /></button></div><div className="min-w-0 text-center sm:text-right" dir="rtl"><p className="eyebrow text-[#a8f2c3]">Yazin-link جاهز</p><h2 className="display-font mt-2 truncate text-2xl font-semibold text-white">{selected.fileName}</h2><div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-white/58 sm:justify-start"><span>{fileSize(selected.size)}</span><span className="uppercase">{selected.mimeType.replace("image/", "")}</span></div>{progress !== null && <div className="mt-5 max-w-md"><div className="mb-2 flex items-center justify-between text-xs font-bold text-white/62"><span>{progressLabel}</span><span>{progress}%</span></div><Progress value={progress} className="h-2 bg-white/10 [&_[data-slot=progress-indicator]]:bg-[#a8f2c3]" /></div>}{!shareUrl ? <><Button disabled={isUploading || selected.status !== "ready"} onClick={generateLink} className="mt-6 rounded-full bg-[#a8f2c3] px-6 py-5 font-black text-[#16231c] hover:bg-[#f7f6ef] disabled:opacity-50">{selected.status === "preparing" ? "جارٍ تجهيز الصورة…" : isUploading ? "جارٍ إنشاء الرابط…" : <><Link2 className="ml-2 h-4 w-4" />إنشاء رابط الصورة</>}</Button>{selected.status === "error" && <p className="mt-3 max-w-md text-sm leading-6 text-[#ffbdc7]">تعذر تثبيت وصول الهاتف للصورة. اختر نفس الصورة مرة أخرى ثم اضغط إنشاء الرابط.</p>}<button onClick={clearSelected} className="mt-5 block text-sm font-bold text-white/65 transition hover:text-[#ffa8b7] sm:mr-1">اختيار صورة أخرى</button></> : <div className="mt-5 rounded-2xl border border-[#a8f2c3]/40 bg-[#a8f2c3]/10 p-4 text-right"><div className="flex items-center gap-2 text-sm font-black text-[#c4ffda]"><Check className="h-4 w-4" /> رابطك جاهز للمشاركة</div><div className="mt-3 flex gap-2" dir="ltr"><input readOnly aria-label="رابط الصورة القابل للمشاركة" value={shareUrl} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs text-white outline-none" /><button onClick={copyLink} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#f7f6ef] px-3 text-xs font-black text-[#151515] hover:bg-[#ffa8b7]">{copied ? <><Check className="h-3.5 w-3.5" />تم</> : <><Copy className="h-3.5 w-3.5" />نسخ</>}</button></div><div className="mt-3 flex items-center justify-between text-xs"><a href={shareUrl} target="_blank" rel="noreferrer" className="font-bold text-[#c4ffda] hover:text-white">فتح الصورة</a><button onClick={clearSelected} className="inline-flex items-center gap-1 text-white/60 hover:text-white"><RotateCcw className="h-3 w-3" />صورة جديدة</button></div></div>}</div></div>}
        <input ref={inputRef} onChange={onInputChange} type="file" accept="image/*,.heic,.heif" className="hidden" /></div></div></section>
      <section className="container py-18 sm:py-24"><div className="mx-auto max-w-5xl"><div className="section-rule" /><div className="grid gap-4 pt-10 md:grid-cols-3">{steps.map(step => <article key={step.number} className="step-card rounded-2xl border border-white/10 bg-white/[0.035] p-6"><span className="font-mono text-xs font-bold tracking-[0.16em] text-[#ffa8b7]">{step.number}</span><h3 className="display-font mt-8 text-2xl font-semibold tracking-[-0.05em]">{step.title}</h3><p className="mt-3 leading-7 text-white/55">{step.text}</p></article>)}</div></div></section>
      <section id="faq" className="container pb-16 pt-8 sm:pb-24"><div className="faq-shell mx-auto max-w-3xl rounded-[28px] border border-white/12 bg-[#1a1a1a] px-6 py-12 text-white shadow-[0_30px_80px_rgba(0,0,0,0.3)] sm:px-12"><div className="flex items-center gap-3"><div className="h-px flex-1 bg-white/15" /><span className="eyebrow text-[#a8f2c3]">YAZIN-LINK</span><div className="h-px flex-1 bg-white/15" /></div><h2 className="display-font mt-7 text-center text-4xl font-semibold tracking-[-0.065em] sm:text-5xl">أسئلة عن<br /><span className="text-[#ffa8b7]">Yazin-link</span></h2><div className="mt-10 divide-y divide-white/12 border-y border-white/12">{faqs.map(([question, answer]) => <details key={question} className="group py-5" dir="rtl"><summary className="flex list-none items-center justify-between gap-6 text-right text-lg font-black marker:content-none"><span>{question}</span><span className="text-[#a8f2c3] transition group-open:rotate-45">+</span></summary><p className="pt-3 text-right leading-7 text-white/58">{answer}</p></details>)}</div></div></section>
    </main><footer className="border-t border-white/10 bg-[#121212] py-8 text-center text-sm text-white/45"><div className="container flex flex-col items-center justify-between gap-3 sm:flex-row"><div className="flex items-center gap-2"><img src={BRAND_MARK_URL} alt="" className="brand-mark h-5 w-5 object-contain" /><span className="brand-word text-base text-white"><b>Yazin</b><i>-link</i></span></div><p>© 2026 @pro_hg_i · جميع الحقوق محفوظة</p><a href="mailto:bydnottesla@gmail.com" className="hover:text-[#a8f2c3]">Developed by Yazin</a></div></footer>
  </div>;
}
