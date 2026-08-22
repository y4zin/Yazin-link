import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { trpc } from "@/lib/trpc";
import { startLogin } from "@/const";
import { ArrowRight, Copy, ExternalLink, Image as ImageIcon, Link2, Loader2, Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

function readableSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export default function MyLinks() {
  const { user, loading, isAuthenticated } = useAuth();
  const utils = trpc.useUtils();
  const [oldLink, setOldLink] = useState("");
  const linksQuery = trpc.imageLink.listMine.useQuery(undefined, { enabled: isAuthenticated, retry: false });
  const removeMutation = trpc.imageLink.removeMine.useMutation({ onSuccess: async () => { await utils.imageLink.listMine.invalidate(); toast.success("تم حذف الرابط من قائمة روابطي."); } });
  const claimMutation = trpc.imageLink.claimMine.useMutation({ onSuccess: async () => { setOldLink(""); await utils.imageLink.listMine.invalidate(); toast.success("تمت إضافة الرابط السابق إلى روابطي."); } });

  const copyLink = async (publicId: string) => {
    const url = `${window.location.origin}/i/${publicId}`;
    try { await navigator.clipboard.writeText(url); toast.success("تم نسخ رابط الصورة."); }
    catch { toast.error("تعذر النسخ تلقائيًا. افتح الصورة ثم انسخ الرابط يدويًا."); }
  };
  const claimOldLink = () => {
    const publicId = oldLink.trim().split("/").filter(Boolean).pop();
    if (!publicId || publicId.length < 6) { toast.error("ألصق رابط الصورة الكامل الذي أنشأته سابقًا."); return; }
    claimMutation.mutate({ publicId });
  };

  if (loading) return <div className="min-h-screen bg-[#121212] text-white grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#a8f2c3]" /></div>;

  if (!user) return <div className="min-h-screen w-full overflow-x-hidden bg-[#121212] px-5 py-14 text-white"><div className="mx-auto w-full max-w-xl min-w-0 text-center"><a href="/" className="inline-flex max-w-full items-center gap-2 text-sm font-bold text-white/60 hover:text-white"><ArrowRight className="h-4 w-4 shrink-0" /> العودة إلى الأداة</a><div className="mt-12 w-full rounded-[28px] border border-white/10 bg-white/[0.035] p-7 sm:p-10"><div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#a8f2c3] text-[#16231c]"><Link2 className="h-6 w-6" /></div><h1 className="display-font mt-6 text-4xl font-semibold tracking-[-0.06em]">روابطي</h1><p className="mt-4 leading-7 text-white/60">سجّل الدخول لحفظ صورك الجديدة ضمن حسابك ثم عرضها ونسخ روابطها أو حذفها لاحقًا.</p><Button onClick={startLogin} className="mt-7 rounded-full bg-[#f7f6ef] px-6 font-black text-[#151515] hover:bg-[#a8f2c3]">تسجيل الدخول</Button></div></div></div>;

  return <div className="min-h-screen w-full overflow-x-hidden bg-[#121212] px-5 py-10 text-white"><div className="mx-auto w-full max-w-6xl min-w-0"><header className="flex flex-col items-start justify-between gap-5 border-b border-white/10 pb-8 sm:flex-row sm:items-end"><div className="min-w-0"><a href="/" className="inline-flex max-w-full items-center gap-2 text-sm font-bold text-white/60 hover:text-white"><ArrowRight className="h-4 w-4 shrink-0" /> العودة إلى Yazin-link</a><h1 className="display-font mt-5 text-5xl font-semibold tracking-[-0.07em]">روابطي</h1><p className="mt-3 text-white/55">صور {user.name ?? "حسابك"} المرفوعة والمسجلة في Yazin-link.</p></div><a href="/#tool" className="rounded-full bg-[#a8f2c3] px-5 py-3 text-sm font-black text-[#16231c] hover:bg-[#f7f6ef]">إنشاء رابط جديد</a></header><section className="mt-7 rounded-2xl border border-white/10 bg-white/[0.035] p-5"><div className="flex items-center gap-2 text-sm font-black text-[#a8f2c3]"><Plus className="h-4 w-4" /> أضف رابطًا قديمًا</div><p className="mt-2 text-sm leading-6 text-white/55">إذا أنشأت رابطًا قبل تسجيل الدخول، ألصقه هنا لإضافته إلى حسابك وإدارته من هذه الصفحة.</p><div className="mt-4 flex flex-col gap-2 sm:flex-row" dir="ltr"><input value={oldLink} onChange={event => setOldLink(event.target.value)} placeholder="https://your-domain/i/abc123" className="min-w-0 flex-1 rounded-xl border border-white/10 bg-black/30 px-3 py-3 text-sm text-white outline-none placeholder:text-white/25 focus:border-[#a8f2c3]" /><button disabled={claimMutation.isPending} onClick={claimOldLink} className="rounded-xl bg-[#f7f6ef] px-4 py-3 text-sm font-black text-[#151515] hover:bg-[#a8f2c3] disabled:opacity-50">{claimMutation.isPending ? "جارٍ الإضافة…" : "إضافة الرابط"}</button></div></section>
  {linksQuery.isLoading ? <div className="grid min-h-[300px] place-items-center"><Loader2 className="h-6 w-6 animate-spin text-[#a8f2c3]" /></div> : linksQuery.error ? <div className="mt-10 rounded-2xl border border-[#ffa8b7]/30 bg-[#ffa8b7]/10 p-6 text-[#ffc4ce]">تعذر تحميل روابطك. حاول تحديث الصفحة.</div> : linksQuery.data?.length ? <div className="mt-9 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{linksQuery.data.map(link => { const url = `${window.location.origin}/i/${link.publicId}`; return <article key={link.publicId} className="overflow-hidden rounded-3xl border border-white/10 bg-white/[0.035]"><a href={url} target="_blank" rel="noreferrer" className="block aspect-[16/10] overflow-hidden bg-black"><img src={url} alt={link.filename} className="h-full w-full object-cover transition duration-300 hover:scale-105" /></a><div className="p-5"><p className="truncate font-bold">{link.filename}</p><p className="mt-1 text-xs text-white/45">{readableSize(link.bytes)} · {new Date(link.createdAt).toLocaleDateString("ar-EG")}</p><div className="mt-5 grid grid-cols-3 gap-2"><button onClick={() => copyLink(link.publicId)} className="inline-flex items-center justify-center rounded-xl bg-[#f7f6ef] py-2.5 text-[#151515] hover:bg-[#a8f2c3]" aria-label="نسخ الرابط"><Copy className="h-4 w-4" /></button><a href={url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center rounded-xl border border-white/15 text-white hover:border-[#a8f2c3] hover:text-[#a8f2c3]" aria-label="فتح الصورة"><ExternalLink className="h-4 w-4" /></a><button disabled={removeMutation.isPending} onClick={() => removeMutation.mutate({ publicId: link.publicId })} className="inline-flex items-center justify-center rounded-xl border border-[#ffa8b7]/30 text-[#ffa8b7] hover:bg-[#ffa8b7] hover:text-[#151515] disabled:opacity-50" aria-label="حذف الرابط"><Trash2 className="h-4 w-4" /></button></div></div></article>; })}</div> : <div className="mt-10 rounded-[28px] border border-dashed border-white/15 bg-white/[0.025] px-6 py-20 text-center"><ImageIcon className="mx-auto h-10 w-10 text-[#a8f2c3]" /><h2 className="display-font mt-5 text-3xl font-semibold">لا توجد روابط محفوظة بعد</h2><p className="mx-auto mt-3 max-w-md leading-7 text-white/55">الصور التي ترفعها بعد تسجيل الدخول ستظهر هنا تلقائيًا.</p><a href="/#tool" className="mt-7 inline-flex rounded-full bg-[#f7f6ef] px-5 py-3 text-sm font-black text-[#151515] hover:bg-[#a8f2c3]">ارفع أول صورة</a></div>}</div></div>;
}
