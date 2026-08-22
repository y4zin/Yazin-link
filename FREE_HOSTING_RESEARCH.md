# بحث خيارات التخزين العام المجاني

## نتيجة أولية

الخيار الأنسب حاليًا هو **ImageKit Free** لتخزين الصور وتسليم روابط عامة، مع طبقة توقيع صغيرة خارج GitHub Pages. لا تتطلب خطة ImageKit المجانية بطاقة دفع حسب صفحة الاستضافة، وتوفر صفحة الأسعار الحالية 3 GB تخزين و20 GB نقل شهريًا. لكن الرفع من المتصفح يحتاج توقيعًا مؤقتًا صادرًا من خادم آمن؛ لا يجوز وضع المفتاح الخاص في مستودع GitHub عام.

| الخدمة | ملاءمة رفع الصور العامة | قيد تقني أو أمني |
|---|---|---|
| ImageKit Free | روابط صور عامة، تخزين وCDN، وخطة مجانية واضحة | يتطلب خادم توقيع صغير للمفتاح الخاص عند الرفع من المتصفح |
| ImgBB API | API مباشر وروابط عامة | يحتاج مفتاح API؛ وضعه في واجهة GitHub Pages العامة يعرضه للإساءة، لذلك لا يُعتمد كتكامل إنتاجي |
| GitHub Pages | يستضيف واجهة ثابتة مجانية على رابط github.io | لا ينفذ API للرفع أو تخزين الصور أو مسار رابط عام مستقل |
| Cloudflare R2 | مناسب تقنيًا للتخزين العام | حساب المستخدم أعاد خطأ يطلب تفعيل R2؛ قد يطلب وسيلة دفع، فلا يستخدمه هذا المسار المجاني |

## بنية النشر المقترحة

1. واجهة Yazin-link: GitHub Pages على `https://y4zin.github.io/Yazin-link/`.
2. الصور: ImageKit Free، مع روابط `ik.imagekit.io` عامة لا تظهر أي علامة داخل واجهة الموقع.
3. التوقيع: خدمة صغيرة مجانية تصدر token/signature قصيرين لرفع ImageKit، وتحفظ المفتاح الخاص خارج GitHub.

## المصادر

- ImageKit Free Media Hosting: https://imagekit.io/tools/free-media-hosting/
- ImageKit pricing: https://imagekit.io/plans/
- ImageKit Upload API: https://imagekit.io/docs/api-reference/upload-file/upload-file
- ImageKit media security: https://imagekit.io/docs/media-delivery-basic-security
- GitHub Pages documentation: https://docs.github.com/en/pages/getting-started-with-github-pages/about-github-pages
- ImgBB API: https://api.imgbb.com/
- Cloudflare Workers pricing: https://developers.cloudflare.com/workers/platform/pricing/
