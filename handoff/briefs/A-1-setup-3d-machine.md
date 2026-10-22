# A-1 — تجهيز جهاز الـ 3D (Blender + Claude)

هذا الملف للجهاز اللي بيتم عليه إنتاج المجسّم والمقاطع، مو جهاز التطوير.
المواصفات المطلوبة للمجسّم والمقاطع في `handoff/briefs/A-1-3d-assets.md`.

## 1. المتطلبات على الجهاز
- Blender 5.0.1 (موجود عندكم).
- كرت شاشة NVIDIA مع تعريف حديث (للتصيير بـ Cycles على GPU). بدونه التصيير يصير على المعالج وبطيء جداً.
- Claude Code (تطبيق سطح المكتب أو الطرفية) مسجّل دخول بنفس الحساب.
- `uv` (أداة Python اللي تشغّل خادم blender-mcp):
  ```bash
  powershell -ExecutionPolicy ByPass -c "irm https://astral.sh/uv/install.ps1 | iex"
  ```
- ffmpeg (لترميز المقاطع وعكسها): `winget install Gyan.FFmpeg`
- Git، ونسخة من مستودع المشروع (أو مجلد مشترك) عشان التسليم يوصل للقناة `handoff/`.

## 2. إضافة blender-mcp داخل Blender
1. نزّل ملف `addon.py` من مستودع `ahujasid/blender-mcp` على GitHub (من آخر إصدار منشور، مو من الفرع الرئيسي).
   **قبل التثبيت أرسل لي رقم الإصدار، وأنا أراجع الملف** لأنه يشغّل أوامر Python داخل Blender.
2. Blender → Edit → Preferences → Add-ons → Install from Disk → اختر `addon.py` → فعّل "Blender MCP".
3. في Blender: لوحة الجانب (مفتاح N) → تبويب BlenderMCP → فعّل Poly Haven → Connect.
4. **تحقق من التوافق مع Blender 5.0.1**: لو الإضافة ما اشتغلت أو طلعت أخطاء، صوّر الخطأ وأرسله.

## 3. ربطها بـ Claude Code
في مجلد العمل على جهاز الـ 3D:
```bash
claude mcp add blender -- uvx blender-mcp
```
ثم افتح جلسة Claude Code في نفس المجلد وتأكد إن أدوات `blender` ظاهرة.

## 4. دور الجلسة (أول رسالة لها)
> أنت فنان 3D على مشروع موقع شركة الجزيرة. اقرأ `handoff/briefs/A-1-3d-assets.md` وابنِ المجسّم في
> Blender عبر blender-mcp. لا تعدّل أي ملف خارج `assets-3d/` و`handoff/reports/A-1*.md`. سلّم على
> ثلاث مراحل (مجسّم أولي + مسارات كاميرا، ثم صورة رئيسية مطابقة لـ
> `design/assets/images/tower-render.png`، ثم المقاطع الخمسة وملف GLB) وبعد كل مرحلة اكتب تقريراً
> واكتب رسالة `3D → CTO` في `handoff/MESSAGES.md` وتوقف حتى يرد الـ CTO.

## 5. التسليم
- الملفات تحت `assets-3d/` (الـ `.blend` الرئيسي، الصور، المقاطع بجودة عالية، JSON النقاط، `tower.glb`).
- الملفات الكبيرة (فيديو بجودة عالية و`.blend`) **ما تنحفظ في git** — مجلد مشترك (OneDrive/Drive) ويُكتب رابطه في التقرير. النسخ المضغوطة للويب فقط تدخل المشروع لاحقاً عبر Antigravity.
