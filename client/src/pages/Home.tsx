import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import {
  ArrowRight,
  Check,
  ChevronDown,
  Cloud,
  Code2,
  Copy,
  FileImage,
  Gauge,
  ImagePlus,
  Layers2,
  Link2,
  Menu,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Upload,
  Wand2,
  X,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState, type ChangeEvent, type DragEvent, type KeyboardEvent } from "react";
import { toast } from "sonner";

const MAX_FILE_BYTES = 8 * 1024 * 1024;
const ACCEPTED_TYPES = ["image/avif", "image/gif", "image/heic", "image/heif", "image/jpeg", "image/png", "image/webp"];
const MIME_ALIASES: Record<string, string> = {
  "image/heic-sequence": "image/heic",
  "image/heif-sequence": "image/heif",
  "image/jpg": "image/jpeg",
  "image/pjpeg": "image/jpeg",
  "image/x-png": "image/png",
};
const EXTENSION_MIMES: Record<string, string> = { avif: "image/avif", gif: "image/gif", heic: "image/heic", heif: "image/heif", jpeg: "image/jpeg", jpg: "image/jpeg", png: "image/png", webp: "image/webp" };

type UploadFile = { file: File; mimeType: string; preview: string };

const features = [
  { icon: Sparkles, title: "Image enhancement", text: "Prepare visual assets for every channel with a polished, optimized delivery layer." },
  { icon: Gauge, title: "Performance optimization", text: "Serve modern formats and efficient image payloads where every millisecond matters." },
  { icon: Layers2, title: "Bulk-ready workflows", text: "Use the same dependable upload foundation across campaigns, websites, and products." },
  { icon: Wand2, title: "Automation options", text: "Build repeatable image workflows around a clear storage and sharing endpoint." },
];

const faqs = [
  ["What is LinkForge?", "LinkForge is a browser-based utility for turning image files into a direct, shareable image URL."],
  ["How does the image link work?", "Choose an image, upload it securely, then copy the generated URL to use it in messages, documents, sites, or social posts."],
  ["Which image files can I upload?", "The current tool supports PNG, JPG, WEBP, GIF, and AVIF images up to 8 MB."],
  ["Do I need to install anything?", "No. The complete upload and link-generation flow runs in your browser."],
];

function fileSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function inferImageMimeType(file: File) {
  const reported = file.type.trim().toLowerCase();
  const aliased = MIME_ALIASES[reported] ?? reported;
  if (ACCEPTED_TYPES.includes(aliased)) return aliased;
  const extension = file.name.trim().split(".").pop()?.toLowerCase() ?? "";
  return EXTENSION_MIMES[extension];
}

async function fileToBase64(file: File) {
  const buffer = await file.arrayBuffer();
  if (buffer.byteLength === 0) throw new Error("The selected image is empty.");
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = "";
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    for (let characterIndex = 0; characterIndex < chunk.length; characterIndex += 1) {
      binary += String.fromCharCode(chunk[characterIndex]);
    }
  }
  return btoa(binary);
}

export default function Home() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [selected, setSelected] = useState<UploadFile | null>(null);
  const [dragging, setDragging] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [copied, setCopied] = useState(false);
  const uploadImage = trpc.imageLink.upload.useMutation();

  useEffect(() => {
    return () => {
      if (selected) URL.revokeObjectURL(selected.preview);
    };
  }, [selected]);

  const clearSelected = () => {
    if (selected) URL.revokeObjectURL(selected.preview);
    setSelected(null);
    setShareUrl("");
    setCopied(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const acceptFile = (file?: File) => {
    if (!file) return;
    const mimeType = inferImageMimeType(file);
    if (!mimeType) {
      toast.error("Choose a PNG, JPG, WEBP, GIF, AVIF, HEIC, or HEIF image.");
      return;
    }
    if (file.size > MAX_FILE_BYTES) {
      toast.error("Image size must be 8 MB or smaller.");
      return;
    }
    if (selected) URL.revokeObjectURL(selected.preview);
    setSelected({ file, mimeType, preview: URL.createObjectURL(file) });
    setShareUrl("");
    setCopied(false);
  };

  const onInputChange = (event: ChangeEvent<HTMLInputElement>) => acceptFile(event.target.files?.[0]);
  const onDrop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    acceptFile(event.dataTransfer.files?.[0]);
  };
  const onDropzoneKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      inputRef.current?.click();
    }
  };

  const generateLink = async () => {
    if (!selected) return;
    try {
      const contentBase64 = await fileToBase64(selected.file);
      const result = await uploadImage.mutateAsync({
        fileName: selected.file.name,
        mimeType: selected.mimeType,
        contentBase64,
      });
      setShareUrl(result.publicUrl);
      toast.success("Your image link is ready to share.");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "We could not create the image link.");
    }
  };

  const copyLink = async () => {
    if (!shareUrl) return;
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("Image link copied to clipboard.");
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error("Copying was blocked. Select the link and copy it manually.");
    }
  };

  return (
    <div className="min-h-screen overflow-hidden bg-white text-[#102a43]">
      <header className="relative z-20 border-b border-white/10 bg-[#061d30] text-white">
        <div className="container flex h-[72px] items-center justify-between gap-6">
          <a href="#top" className="flex shrink-0 items-center gap-2.5" aria-label="LinkForge home">
            <img src="/manus-storage/linkforge-mark_f24f4787.png" alt="" className="h-8 w-8 object-contain" />
            <span className="display-font text-[20px] font-extrabold tracking-[-0.04em]">LinkForge</span>
          </a>
          <nav className="hidden items-center gap-6 text-[11px] font-semibold tracking-[0.05em] text-[#bfd2e7] lg:flex">
            <a className="transition-colors hover:text-white" href="#why">PLATFORM</a>
            <a className="transition-colors hover:text-white" href="#how">SOLUTIONS</a>
            <a className="transition-colors hover:text-white" href="#developers">DEVELOPERS</a>
            <a className="transition-colors hover:text-white" href="#faq">RESOURCES</a>
            <a className="transition-colors hover:text-white" href="#why">PRICING</a>
          </nav>
          <div className="hidden items-center gap-4 md:flex">
            <a href="#tool" className="text-sm font-semibold text-[#dbe9f6] transition hover:text-white">Log in</a>
            <a href="#tool" className="rounded-full bg-[#ff6e77] px-4 py-2 text-[12px] font-extrabold uppercase tracking-[0.04em] text-white shadow-[0_6px_18px_rgba(255,110,119,0.25)] transition hover:bg-[#ff5b66]">Start free</a>
          </div>
          <button className="rounded-md p-2 text-white md:hidden" aria-label="Open navigation" onClick={() => toast("Navigation links are listed in the page footer.")}><Menu className="h-5 w-5" /></button>
        </div>
      </header>

      <main id="top">
        <section className="hero-arc relative min-h-[700px] overflow-hidden pb-28 pt-16 text-white sm:pt-20 lg:min-h-[770px]">
          <div className="hero-grid pointer-events-none absolute inset-0 opacity-70" />
          <div className="container relative z-10">
            <div className="mx-auto max-w-4xl text-center">
              <p className="eyebrow flex items-center justify-center gap-2 text-[#8eeef2]"><span className="h-1.5 w-1.5 rounded-full bg-[#97f65e]" /> Tools <span className="text-white/50">/</span> Create link for image</p>
              <h1 className="display-font mt-6 text-4xl font-medium tracking-[-0.055em] sm:text-5xl lg:text-[62px]">Create Link for Image</h1>
              <p className="mx-auto mt-5 max-w-2xl text-lg leading-7 text-[#d7e8f7] sm:text-[19px]">Upload an image and generate a permanent URL in just a few clicks. Your link is ready to share, right from your browser.</p>
            </div>

            <div id="tool" className="tool-card-shadow mx-auto mt-16 max-w-6xl rounded-[19px] bg-[#234b75] p-5 sm:p-9 lg:p-12">
              <div className="upload-dash upload-motion min-h-[335px] rounded-[13px] bg-[#38649c]/90 p-5 sm:p-8" onDragEnter={(event) => { event.preventDefault(); setDragging(true); }} onDragOver={(event) => event.preventDefault()} onDragLeave={() => setDragging(false)} onDrop={onDrop}>
                {!selected ? (
                  <div role="button" tabIndex={0} onClick={() => inputRef.current?.click()} onKeyDown={onDropzoneKeyDown} className={`flex min-h-[265px] flex-col items-center justify-center rounded-[10px] px-6 text-center outline-none transition ${dragging ? "bg-[#4a76ad] ring-2 ring-[#97f65e]" : "hover:bg-[#416da4]"}`}>
                    <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/15 bg-[#2c5c93] shadow-inner"><ImagePlus className="h-8 w-8 text-[#97f65e]" /><span className="absolute -right-2 -top-2 h-4 w-4 rounded-full bg-[#97f65e]" /></div>
                    <h2 className="display-font mt-6 max-w-lg text-3xl font-medium tracking-[-0.045em] sm:text-[35px]">Create a Shareable Link for Your Image</h2>
                    <Button className="mt-5 rounded-full bg-[#5ba8ef] px-6 text-xs font-extrabold tracking-wide text-white shadow-[0_8px_22px_rgba(3,25,49,0.22)] hover:bg-[#75b8f3]" onClick={(event) => { event.stopPropagation(); inputRef.current?.click(); }}><Upload className="mr-2 h-4 w-4" />UPLOAD IMAGE</Button>
                    <p className="mt-3 text-sm text-[#d9e8fa]">Or drag your image here</p>
                    <p className="mt-5 text-xs text-[#bad0ea]">PNG, JPG, WEBP, GIF, or AVIF · up to 8 MB</p>
                  </div>
                ) : (
                  <div className="mx-auto grid min-h-[265px] max-w-3xl items-center gap-7 py-3 sm:grid-cols-[190px_1fr]">
                    <div className="relative mx-auto aspect-[4/3] w-full max-w-[190px] overflow-hidden rounded-xl border border-white/20 bg-[#173a63] shadow-lg"><img src={selected.preview} alt="Selected preview" className="h-full w-full object-cover" /><button className="absolute right-2 top-2 rounded-full bg-[#061d30]/75 p-1.5 text-white backdrop-blur transition hover:bg-[#061d30]" aria-label="Remove selected image" onClick={clearSelected}><X className="h-4 w-4" /></button></div>
                    <div className="min-w-0 text-center sm:text-left">
                      <p className="eyebrow text-[#97f65e]">Selected image</p>
                      <h2 className="display-font mt-2 truncate text-2xl font-semibold text-white">{selected.file.name}</h2>
                      <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1 text-sm text-[#d2e3f5] sm:justify-start"><span>{fileSize(selected.file.size)}</span><span className="uppercase">{selected.mimeType.replace("image/", "")}</span></div>
                      {!shareUrl ? <><Button disabled={uploadImage.isPending} onClick={generateLink} className="mt-6 rounded-full bg-[#97f65e] px-6 font-bold text-[#13331e] hover:bg-[#acf87c]">{uploadImage.isPending ? "Creating secure link…" : <><Link2 className="mr-2 h-4 w-4" />Create image link</>}</Button><button onClick={clearSelected} className="ml-3 mt-6 text-sm font-semibold text-[#d7e8fa] underline-offset-4 hover:text-white hover:underline">Choose another</button></> : <div className="mt-5 rounded-xl border border-[#97f65e]/40 bg-[#0e3558]/65 p-4 text-left"><div className="flex items-center gap-2 text-sm font-bold text-[#b6fa8a]"><Check className="h-4 w-4" /> Your shareable link is ready</div><div className="mt-3 flex gap-2"><input readOnly aria-label="Shareable image link" value={shareUrl} className="min-w-0 flex-1 rounded-lg border border-white/15 bg-[#062741] px-3 py-2 text-xs text-[#e6f2ff] outline-none" /><button onClick={copyLink} className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-[#97f65e] px-3 text-xs font-extrabold text-[#13331e] hover:bg-[#b3fb83]">{copied ? <><Check className="h-3.5 w-3.5" />COPIED</> : <><Copy className="h-3.5 w-3.5" />COPY</>}</button></div><div className="mt-3 flex items-center justify-between"><a href={shareUrl} target="_blank" rel="noreferrer" className="text-xs font-semibold text-[#8eeef2] hover:text-white">Open image <ArrowRight className="ml-1 inline h-3 w-3" /></a><button onClick={clearSelected} className="inline-flex items-center gap-1 text-xs font-semibold text-[#d7e8fa] hover:text-white"><RotateCcw className="h-3 w-3" /> New image</button></div></div>}
                    </div>
                  </div>
                )}
                <input ref={inputRef} onChange={onInputChange} type="file" accept="image/*,.heic,.heif" className="hidden" />
              </div>
            </div>
          </div>
        </section>

        <section className="relative z-10 -mt-1 border-y border-[#1a3f62] bg-[#071e31] py-8 text-white"><div className="container flex flex-col items-center justify-between gap-5 text-center md:flex-row md:text-left"><div><p className="display-font text-xl font-semibold">Looking to create image links in bulk?</p><p className="mt-1 text-sm text-[#b9d0e5]">Use a dependable media workflow in your next project and automate delivery at scale.</p></div><a href="#developers" className="inline-flex shrink-0 items-center rounded-full border border-[#97f65e] px-5 py-2.5 text-xs font-extrabold tracking-wide text-[#aafa80] transition hover:bg-[#97f65e] hover:text-[#10351f]">EXPLORE API OPTIONS <ArrowRight className="ml-2 h-4 w-4" /></a></div></section>

        <section id="why" className="bg-white py-24 sm:py-32"><div className="container grid items-center gap-14 lg:grid-cols-[1.05fr_0.95fr]"><div><p className="eyebrow text-[#3a72a6]">Simple image delivery</p><h2 className="display-font mt-4 max-w-2xl text-4xl font-medium tracking-[-0.055em] text-[#102a43] sm:text-5xl">Free online image link tool</h2><p className="mt-6 max-w-xl text-lg leading-8 text-[#52677c]">Generate a shareable image URL in seconds, without downloads or clutter. Add your image, create the direct link, then use it wherever you communicate.</p><div className="mt-9 grid gap-x-8 gap-y-7 sm:grid-cols-2">{features.map(({ icon: Icon, title, text }) => <article key={title} className="group"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#eaf3fb] text-[#3978b6] transition group-hover:bg-[#d8f6c7] group-hover:text-[#267043]"><Icon className="h-5 w-5" /></div><h3 className="display-font mt-4 text-lg font-bold text-[#173451]">{title}</h3><p className="mt-2 text-[15px] leading-6 text-[#61778d]">{text}</p></article>)}</div></div><div className="relative mx-auto w-full max-w-[460px]"><div className="absolute -inset-7 rounded-[42px] bg-[#e8f2fa]" /><div className="relative overflow-hidden rounded-[28px] border border-[#d7e5f1] bg-[#08223a] p-7 shadow-[0_25px_70px_rgba(18,52,81,0.16)]"><img src="/manus-storage/linkforge-network_d7d62ce4.png" alt="Abstract image sharing network" className="mx-auto aspect-square w-full max-w-[330px] object-cover mix-blend-screen" /><div className="mt-5 rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur"><div className="flex items-center gap-3"><div className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#97f65e] text-[#14351f]"><Link2 className="h-4 w-4" /></div><div><p className="text-xs font-bold text-white">One upload. One clean URL.</p><p className="mt-0.5 text-xs text-[#b9d4e7]">Designed for practical sharing.</p></div></div></div></div></div></div></section>

        <section id="how" className="bg-[#f2f7fa] py-24 sm:py-30"><div className="container"><div className="mx-auto max-w-2xl text-center"><p className="eyebrow text-[#3a72a6]">How it works</p><h2 className="display-font mt-4 text-4xl font-medium tracking-[-0.055em] text-[#102a43] sm:text-5xl">A shareable image link in three steps</h2><p className="mt-5 text-lg leading-7 text-[#61778d]">Upload the image, generate its secure delivery URL, and copy it anywhere you need.</p></div><div className="mt-14 grid gap-6 md:grid-cols-3">{[["01", Upload, "Add your image", "Upload or drag an image file into the tool."], ["02", Link2, "Generate your link", "We create a clean direct URL for your uploaded file."], ["03", Copy, "Copy and share", "Use the image link in messages, websites, emails, and more."]].map(([number, Icon, title, text]) => { const StepIcon = Icon as typeof Upload; return <article key={number as string} className="hover-lift rounded-2xl border border-[#dce8f1] bg-white p-8 shadow-[0_12px_30px_rgba(31,76,111,0.06)]"><span className="display-font text-sm font-extrabold tracking-[0.1em] text-[#66a47f]">{number as string}</span><div className="mt-7 flex h-12 w-12 items-center justify-center rounded-xl bg-[#eaf3fb] text-[#377ab9]"><StepIcon className="h-6 w-6" /></div><h3 className="display-font mt-6 text-2xl font-bold tracking-[-0.04em] text-[#163451]">{title as string}</h3><p className="mt-3 text-base leading-7 text-[#62788e]">{text as string}</p></article>; })}</div></div></section>

        <section id="developers" className="bg-[#071f34] py-24 text-white"><div className="container grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr]"><div><p className="eyebrow text-[#97f65e]">Beyond standard image links</p><h2 className="display-font mt-4 text-4xl font-medium tracking-[-0.055em] sm:text-5xl">A workflow that scales with your work</h2><p className="mt-6 max-w-xl text-lg leading-8 text-[#bad1e5]">The interface stays simple for a single upload, while the delivery model makes sense for developer-led visual workflows too.</p><a href="#tool" className="mt-8 inline-flex items-center rounded-full bg-[#97f65e] px-5 py-3 text-sm font-extrabold text-[#153820] transition hover:bg-[#b1fb83]">Create a link now <ArrowRight className="ml-2 h-4 w-4" /></a></div><div className="overflow-hidden rounded-2xl border border-white/10 bg-[#0b2b46] shadow-2xl"><div className="flex items-center justify-between border-b border-white/10 px-5 py-4"><div className="flex gap-2"><span className="h-2.5 w-2.5 rounded-full bg-[#ff6e77]" /><span className="h-2.5 w-2.5 rounded-full bg-[#f0c45e]" /><span className="h-2.5 w-2.5 rounded-full bg-[#97f65e]" /></div><span className="text-xs font-semibold text-[#bad4e6]">linkforge.config</span><Code2 className="h-4 w-4 text-[#8eeef2]" /></div><pre className="overflow-x-auto p-6 font-mono text-sm leading-7 text-[#d9eaf9]"><code><span className="text-[#97f65e]">const</span> shareLink = <span className="text-[#8eeef2]">await</span> linkforge.images.<span className="text-[#f6cd77]">upload</span>({'\n'}  {'{'} file: <span className="text-[#ff9fab]">&quot;product-image.webp&quot;</span> {'}'}{'\n'});{'\n\n'}console.<span className="text-[#f6cd77]">log</span>(shareLink.url);{'\n'}<span className="text-[#5f849f]">// https://your-domain/i/your-image-id</span></code></pre></div></div></section>

        <section id="faq" className="bg-white py-24 sm:py-30"><div className="container max-w-4xl"><div className="text-center"><p className="eyebrow text-[#3a72a6]">FAQ</p><h2 className="display-font mt-4 text-4xl font-medium tracking-[-0.055em] text-[#102a43] sm:text-5xl">Frequently asked questions</h2></div><div className="mt-12 divide-y divide-[#dbe7f0] border-y border-[#dbe7f0]">{faqs.map(([question, answer]) => <details key={question} className="group py-5"><summary className="flex list-none items-center justify-between gap-6 text-left text-lg font-bold text-[#153451] marker:content-none"><span>{question}</span><ChevronDown className="h-5 w-5 shrink-0 text-[#4b85bb] transition group-open:rotate-180" /></summary><p className="max-w-3xl pt-3 pr-10 text-[16px] leading-7 text-[#647b91]">{answer}</p></details>)}</div></div></section>
      </main>

      <footer className="bg-[#061b2e] pb-8 pt-16 text-[#bdd2e4]"><div className="container"><div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-[1.25fr_repeat(4,1fr)]"><div><div className="flex items-center gap-2.5 text-white"><img src="/manus-storage/linkforge-mark_f24f4787.png" alt="" className="h-8 w-8 object-contain" /><span className="display-font text-xl font-extrabold tracking-[-0.04em]">LinkForge</span></div><p className="mt-4 max-w-xs text-sm leading-6">A clean, browser-first utility for creating and sharing image links.</p></div>{[["Platform", "Image", "Video", "Performance", "Pricing"], ["Solutions", "E-commerce", "Retail", "Media", "Travel"], ["Developers", "Image API", "Documentation", "SDKs", "Tools"], ["Company", "About", "Careers", "Contact", "Trust"]].map(([heading, ...links]) => <div key={heading}><h3 className="display-font text-sm font-bold text-white">{heading}</h3><ul className="mt-4 space-y-2.5 text-sm">{links.map(link => <li key={link}><a href="#top" className="transition hover:text-[#97f65e]">{link}</a></li>)}</ul></div>)}</div><div className="mt-14 flex flex-col gap-3 border-t border-white/10 pt-7 text-xs text-[#8ba9c0] sm:flex-row sm:items-center sm:justify-between"><p>© 2026 @pro_hg_i. All rights reserved.</p><div className="flex gap-5"><a href="https://instagram.com/pro_hg_i" target="_blank" rel="noreferrer" className="hover:text-white">Instagram @pro_hg_i</a><a href="mailto:bydnottesla@gmail.com" className="hover:text-white">Contact</a></div><p>Developed by Yazin · bydnottesla@gmail.com</p></div></div></footer>
    </div>
  );
}
