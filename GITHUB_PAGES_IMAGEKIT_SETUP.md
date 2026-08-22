# تشغيل Yazin-link على GitHub Pages مع ImageKit

## ما يعمل بالفعل

- حساب ImageKit باسم `yazinlink` متصل بمشروع Yazin-link.
- تم اختبار مفاتيح ImageKit بنجاح داخل بيئة الخادم.
- تم رفع صورة اختبار والحصول على رابط عام أعاد `HTTP 200` و`content-type: image/png` دون تسجيل دخول.
- يمكن بناء الواجهة لـ GitHub Pages بالأمر `pnpm build:pages`.

## لماذا يحتاج الموقع خادم توقيع صغير؟

ImageKit يتطلب توقيعًا قصير المدة عند الرفع. المفتاح الخاص لا يوضع أبدًا في GitHub Pages أو في المستودع العام. لهذا يحتوي المشروع على قالب Cloudflare Worker في:

`deployment/imagekit-auth-worker.js`

لا يرفع هذا Worker أي صورة؛ بل يعيد توقيعًا مؤقتًا فقط. الصورة نفسها ترفع من المتصفح مباشرة إلى ImageKit، ثم يكون رابطها عامًا لأي شخص يملكه.

## إعداد Worker يدويًا

1. افتح Cloudflare → **Workers & Pages** → **Create application** → **Create Worker**.
2. سمّ العامل `yazin-link-image-auth` وانسخ محتوى `deployment/imagekit-auth-worker.js` إليه.
3. من Settings → Variables and Secrets، أضف الأسرار التالية:
   - `IMAGEKIT_PRIVATE_KEY`: المفتاح الخاص الجديد من ImageKit.
   - `IMAGEKIT_PUBLIC_KEY`: المفتاح العام من ImageKit.
   - `ALLOWED_ORIGIN`: `https://y4zin.github.io`.
4. انشر العامل يدويًا، ثم انسخ عنوانه مثل `https://yazin-link-image-auth.<your-subdomain>.workers.dev`.
5. عند بناء واجهة GitHub Pages، عيّن `VITE_IMAGEKIT_AUTH_URL` إلى عنوان Worker. لا تضع أي مفتاح ImageKit في GitHub.

## إعداد GitHub Pages يدويًا

بعد إعداد Worker، افتح المستودع ثم Settings → Secrets and variables → Actions. أضف سرًا باسم `VITE_IMAGEKIT_AUTH_URL` وقيمته عنوان Worker فقط، مثل `https://yazin-link-image-auth.<your-subdomain>.workers.dev`.

بعد ذلك افتح Settings → Pages واختر **GitHub Actions** كمصدر النشر. يحتوي المستودع على سير عمل يدوي باسم `Deploy Yazin-link to GitHub Pages`. من تبويب Actions شغّله يدويًا بعد إدخال السر. لا توجد مفاتيح ImageKit في GitHub أو في ملفات الواجهة.

رابط الموقع سيكون:

`https://y4zin.github.io/Yazin-link/`

عند فتح الموقع على GitHub Pages، يستخدم المسارات الهاشية مثل `#/my-links` حتى تعمل صفحة آخر الروابط دون إعداد إعادة توجيه في الخادم.
