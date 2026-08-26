import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { createFileDownloadUrl } from "@/lib/fileDownloadUrl";
import { captureFileContents } from "@/lib/filePayload";
import { uploadToImageKit } from "@/lib/imagekitUpload";
import { Check, Copy, Download, File, FileUp, Image, LayoutList, Link2, RotateCcw, Upload, X } from "lucide-react";
import { useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import { toast } from "sonner";
import { Link } from "wouter";

const MAX_FILE_BYTES = 25 * 1024 * 1024;
const BRAND_MARK_URL = "https://ik.imagekit.io/yazinlink/yazin-link/tests/yazin-link-integration-test_JlKvko15k.png";

type UploadStatus = "preparing" | "ready" | "error";
type UploadFile = {
  contentBase64?: string;
  errorMessage?: string;
  fileName: string;
  mimeType: string;
  size: number;
  status: UploadStatus;
};

const steps = [
  { number: "01", title: "اختر الملف", text: "اختر ملفًا من جهازك أو اسحبه داخل مساحة الرفع." },
  { number: "02", title: "أنشئ الرابط", text: "يُرفع الملف إلى مساحة عامة مخصصة ثم يُجهّز رابط تنزيل مباشر." },
  { number: "03", title: "شارك وحمّل", text: "أي شخص يفتح الرابط يحمل الملف نفسه الذي رفعته." },
];

function fileSize(bytes: number) {
  return bytes < 1024 * 1024
    ? `${Math.max(1, Math.round(bytes / 1024))} KB`
    : `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function displayType(mimeType: string) {
  if (!mimeType) return "نوع ملف عام";
  return mimeType.split("/").pop()?.toUpperCase() || "ملف";
}

export default function Files() {
  const inputRef = useRef<HTMLInputElement>(null);
  const selectionVersionRef = useRef(0);
  const [selected, setSelected] = useState<UploadFile | null>(null);
  const [dragging, setDragging] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const [progress, setProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const clearSelected = () => {
    selectionVersionRef.current += 1;
    setSelected(null);
    setShareUrl("");
    setCopied(false);
    setProgress(null);
    if (inputRef.current) inputRef.current.value = "";
  };

  const acceptFile = async (file?: File) => {
    if (!file) return;
    if (!file.name.trim()) {
      toast.error("تعذر معرفة اسم الملف. اختر ملفًا آخر.");
      return;
    }
    if (file.size === 0) {
      toast.error("لا يمكن رفع ملف فارغ.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error("حجم الملف يجب أن لا يتجاوز 25 ميجابايت.");
      return;
    }

    selectionVersionRef.current += 1;
    const selectionVersion = selectionVersionRef.current;
    const baseSelection = {
      fileName: file.name,
      mimeType: file.type || "application/octet-stream",
      size: file.size,
    };

    setSelected({ ...baseSelection, status: "preparing" });
    setShareUrl("");
    setCopied(false);
    setProgress(18);

    try {
      const contentBase64 = await captureFileContents(file);
      if (selectionVersion !== selectionVersionRef.current) return;
      setProgress(66);
      setSelected({ ...baseSelection, contentBase64, status: "ready" });
      window.setTimeout(() => {
        if (selectionVersion === selectionVersionRef.current) setProgress(null);
      }, 520);
    } catch (error) {
      if (selectionVersion !== selectionVersionRef.current) return;
      setProgress(null);
      setSelected({
        ...baseSelection,
        errorMessage: error instanceof Error ? error.message : "تعذر تجهيز الملف.",
        status: "error",
      });
      toast.error("تعذر تجهيز الملف. اختره مرة أخرى ثم أعد المحاولة.");
    }
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    void acceptFile(event.target.files?.[0]);
  };

  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void acceptFile(event.dataTransfer.files?.[0]);
  };

  const onDropzoneKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  };

  const generateLink = async () => {
    if (!selected || selected.status !== "ready" || !selected.contentBase64) {
      toast.error("انتظر تجهيز الملف أو اختره مرة أخرى.");
      return;
    }

    try {
      setIsUploading(true);
      setProgress(78);
      const result = await uploadToImageKit({
        fileName: selected.fileName,
        mimeType: selected.mimeType,
        contentBase64: selected.contentBase64,
        folder: "/yazin-link/files",
        resourceName: "الملف",
      });
      setProgress(100);
      setShareUrl(createFileDownloadUrl(result.url, selected.fileName));
      toast.success("رابط تنزيل ملفك أصبح جاهزًا للمشاركة.");
      window.setTimeout(() => setProgress(null), 720);
    } catch (error) {
      setProgress(null);
      toast.error(error instanceof Error ? error.message : "تعذر إنشاء رابط التنزيل. حاول مرة أخرى.");
    } finally {
      setIsUploading(false);
    }
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("تم نسخ رابط التنزيل.");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("لم يتم النسخ تلقائيًا؛ انسخ الرابط يدويًا.");
    }
  };

  const progressLabel = selected?.status === "preparing"
    ? "يجري تجهيز الملف بأمان…"
    : isUploading
      ? "يجري رفع الملف وإنشاء رابط التنزيل…"
      : progress === 100
        ? "اكتمل إنشاء الرابط"
        : "";

  return <div className="page-enter min-h-screen overflow-hidden bg-[#121212] text-white">
    <main id="top" className="relative isolate">
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="ribbon ribbon-white" />
        <div className="ribbon ribbon-pink" />
        <div className="ribbon ribbon-mint" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_2%,rgba(255,255,255,0.07),transparent_29%),radial-gradient(circle_at_100%_42%,rgba(168,242,195,0.11),transparent_24%)]" />
      </div>

      <section className="container relative py-7 sm:py-10 lg:py-14">
        <div className="mx-auto flex max-w-5xl flex-col items-center text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 sm:gap-5">
            <a href="#top" aria-label="Yazin-link" className="brand-lockup inline-flex items-center gap-2.5">
              <span className="brand-word text-left text-[25px] leading-none text-white"><b>Yazin</b><i>-link</i></span>
              <img src={BRAND_MARK_URL} alt="شعار أسد Yazin-link" className="brand-mark h-10 w-10 object-contain" />
            </a>
            <Link href="/" className="my-links-shortcut inline-flex items-center gap-2 text-sm font-black text-white/70 hover:text-[#ffa8b7]"><Image className="h-4 w-4" />روابط الصور</Link>
            <Link href="/my-links" className="my-links-shortcut inline-flex items-center gap-2 text-sm font-black text-white/70 hover:text-[#a8f2c3]"><LayoutList className="h-4 w-4" />آخر الروابط</Link>
          </div>
          <p className="eyebrow mt-11 text-[#a8f2c3]">ارفع. نزّل. شارك.</p>
          <h1 className="display-font mt-4 max-w-4xl text-5xl font-semibold leading-[0.98] tracking-[-0.065em] text-white sm:text-7xl lg:text-[82px]">رابط ملفك<br /><span className="text-[#a8f2c3]">جاهز للتحميل.</span></h1>
          <p className="mt-6 max-w-2xl text-base leading-7 text-white/68 sm:text-lg">ارفع ملفك وأنشئ رابط تنزيل عام. عندما يفتح أي شخص الرابط، يحصل على الملف نفسه الذي رفعته.</p>
        </div>

        <div id="tool" className="yazin-panel mx-auto mt-12 max-w-5xl rounded-[30px] border border-white/15 bg-[#181818]/90 p-4 shadow-[0_26px_90px_rgba(0,0,0,0.5)] backdrop-blur-xl sm:p-7">
          <div className="rounded-[22px] border border-white/10 bg-white/[0.035] p-4 sm:p-7" onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
            {!selected ? <div role="button" tabIndex={0} onClick={() => inputRef.current?.click()} onKeyDown={onDropzoneKeyDown} className={`upload-stage flex min-h-[300px] flex-col items-center justify-center rounded-[18px] px-5 text-center outline-none ${dragging ? "is-dragging" : ""}`}>
              <div className="relative flex h-[74px] w-[74px] items-center justify-center rounded-[23px] bg-[#f7f6ef] text-[#151515] shadow-[0_10px_28px_rgba(255,255,255,0.12)]"><FileUp className="h-8 w-8" /><span className="absolute -right-2 -top-2 h-5 w-5 rounded-full bg-[#a8f2c3] ring-4 ring-[#181818]" /></div>
              <h2 className="display-font mt-7 text-3xl font-semibold tracking-[-0.055em] text-white sm:text-4xl">أضف ملفك إلى Yazin-link</h2>
              <p className="mt-3 max-w-md text-sm leading-6 text-white/55">PDF وZIP وDOCX وملفات الصوت والفيديو وغير ذلك. يُجهّز الملف فور اختياره ليبقى الرفع ثابتًا على الهاتف.</p>
              <Button className="mt-7 rounded-full bg-[#f7f6ef] px-6 py-5 text-sm font-black text-[#151515] shadow-[0_10px_28px_rgba(255,255,255,0.13)] hover:bg-[#a8f2c3]" onClick={(event) => { event.stopPropagation(); inputRef.current?.click(); }}><Upload className="mr-2 h-4 w-4" />اختر ملفًا</Button>
              <p className="mt-4 text-xs font-medium tracking-[0.08em] text-white/42">ملفات عامة حتى 25 MB</p>
            </div> : <div className="mx-auto grid min-h-[300px] max-w-3xl items-center gap-7 py-2 sm:grid-cols-[185px_1fr]">
              <div className="relative mx-auto flex aspect-[4/3] w-full max-w-[185px] items-center justify-center overflow-hidden rounded-2xl border border-white/15 bg-black shadow-2xl"><File className="h-16 w-16 text-[#a8f2c3]" /><button className="absolute right-2 top-2 rounded-full bg-black/75 p-2 text-white backdrop-blur transition hover:bg-black" aria-label="حذف الملف المختار" onClick={clearSelected}><X className="h-4 w-4" /></button></div>
              <div className="min-w-0 text-center sm:text-right" dir="rtl">
                <p className="eyebrow text-[#a8f2c3]">Yazin-link جاهز</p>
                <h2 className="display-font mt-2 truncate text-2xl font-semibold text-white">{selected.fileName}</h2>
                <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-white/58 sm:justify-start"><span>{fileSize(selected.size)}</span><span>{displayType(selected.mimeType)}</span></div>
                {progress !== null && <div className="mt-5 max-w-md"><div className="mb-2 flex items-center justify-between text-xs font-bold text-white/62"><span>{progressLabel}</span><span>{progress}%</span></div><Progress value={progress} className="h-2 bg-white/10 [&_[data-slot=progress-indicator]]:bg-[#a8f2c3]" /></div>}
                {!shareUrl ? <>
                  <Button disabled={isUploading || selected.status !== "ready"} onClick={generateLink} className="mt-6 rounded-full bg-[#a8f2c3] px-6 py-5 font-black text-[#16231c] hover:bg-[#f7f6ef] disabled:opacity-50">{selected.status === "preparing" ? "جارٍ تجهيز الملف…" : isUploading ? "جارٍ إنشاء الرابط…" : <><Link2 className="ml-2 h-4 w-4" />إنشاء رابط التنزيل</>}</Button>
                  {selected.status === "error" && <p className="mt-3 max-w-md text-sm leading-6 text-[#ffbdc7]">{selected.errorMessage || "تعذر تثبيت وصول الجهاز للملف. اختره مرة أخرى ثم أعد المحاولة."}</p>}
                  <button onClick={clearSelected} className="mt-5 block text-sm font-bold text-white/65 transition hover:text-[#ffa8b7] sm:mr-1">اختيار ملف آخر</button>
                </> : <div className="mt-5 rounded-2xl border border-[#a8f2c3]/40 bg-[#a8f2c3]/10 p-4 text-right">
                  <div className="flex items-center gap-2 text-sm font-black text-[#c4ffda]"><Check className="h-4 w-4" /> رابط التنزيل جاهز للمشاركة</div>
                  <div className="mt-3 flex gap-2" dir="ltr"><input readOnly aria-label="رابط تنزيل الملف القابل للمشاركة" value={shareUrl} className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/35 px-3 py-2 text-xs text-white outline-none" /><button onClick={copyLink} className="inline-flex shrink-0 items-center gap-1.5 rounded-xl bg-[#f7f6ef] px-3 text-xs font-black text-[#151515] hover:bg-[#ffa8b7]">{copied ? <><Check className="h-3.5 w-3.5" />تم</> : <><Copy className="h-3.5 w-3.5" />نسخ</>}</button></div>
                  <div className="mt-3 flex items-center justify-between text-xs"><a href={shareUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 font-bold text-[#c4ffda] hover:text-white"><Download className="h-3.5 w-3.5" />تجربة التنزيل</a><button onClick={clearSelected} className="inline-flex items-center gap-1 text-white/60 hover:text-white"><RotateCcw className="h-3 w-3" />ملف جديد</button></div>
                </div>}
              </div>
            </div>}
            <input ref={inputRef} onChange={onInputChange} type="file" className="hidden" />
          </div>
        </div>
      </section>

      <section className="container py-18 sm:py-24"><div className="mx-auto max-w-5xl"><div className="section-rule" /><div className="grid gap-4 pt-10 md:grid-cols-3">{steps.map(step => <article key={step.number} className="step-card rounded-2xl border border-white/10 bg-white/[0.035] p-6"><span className="font-mono text-xs font-bold tracking-[0.16em] text-[#a8f2c3]">{step.number}</span><h3 className="display-font mt-8 text-2xl font-semibold tracking-[-0.05em]">{step.title}</h3><p className="mt-3 leading-7 text-white/55">{step.text}</p></article>)}</div></div></section>
    </main>
    <footer className="border-t border-white/10 bg-[#121212] py-8 text-center text-sm text-white/45"><div className="container flex flex-col items-center justify-between gap-3 sm:flex-row"><div className="flex items-center gap-2"><img src={BRAND_MARK_URL} alt="" className="brand-mark h-5 w-5 object-contain" /><span className="brand-word text-base text-white"><b>Yazin</b><i>-link</i></span></div><p>© 2026 @pro_hg_i · جميع الحقوق محفوظة</p><a href="mailto:bydnottesla@gmail.com" className="hover:text-[#a8f2c3]">Developed by Yazin</a></div></footer>
  </div>;
}
