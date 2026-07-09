# 📸 LENS - معرض الصور الفوتوغرافي

معرض صور آمن وسهل الاستخدام مدعوم بـ Firebase ✨

![Status](https://img.shields.io/badge/status-active-success)
![License](https://img.shields.io/badge/license-MIT-blue)
![Language](https://img.shields.io/badge/language-JavaScript-yellow)

## 🎯 المميزات

✅ **تحميل الصور** - رفع صور بسهولة إلى السحابة
✅ **إدارة الألبومات** - تنظيم صورك في ألبومات منفصلة
✅ **التعليقات** - أضف تعليقات على صورك
✅ **الإعجاب** - أعجب بصورك المفضلة
✅ **آمان عالي** - مصادقة Firebase و قواعد أمان صارمة
✅ **تصميم جميل** - واجهة استخدام عصرية وسريعة

---

## 🚀 البدء السريع

### المتطلبات

- Node.js 20+
- حساب Firebase
- Git

### الخطوة 1️⃣: استنساخ المشروع

```bash
git clone https://github.com/anwartannaz29-sketch/Photo.anwar.git
cd Photo.anwar
```

### الخطوة 2️⃣: إعداد Firebase

1. اذهب إلى https://console.firebase.google.com/
2. إنشاء مشروع جديد "Photo Anwar"
3. تفعيل الخدمات:
   - ✅ Authentication (Google + Email)
   - ✅ Firestore Database
   - ✅ Cloud Storage
   - ✅ Cloud Functions

### الخطوة 3️⃣: تحديث المفاتيح

عدّل `photography-portfolio.html` وأضف مفاتيح Firebase:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### الخطوة 4️⃣: نشر Cloud Functions

```bash
# تثبيت Firebase CLI
npm install -g firebase-tools

# تسجيل الدخول
firebase login

# نشر الدوال
firebase deploy --only functions
```

### الخطوة 5️⃣: تحديث قواعد الأمان

في Firebase Console:

**Firestore Rules:**
```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /albums/{albumId} {
      allow read, write: if request.auth != null && request.auth.uid == resource.data.uid;
      allow create: if request.auth != null;
      match /photos/{photoId} {
        allow read, write: if request.auth != null && get(/databases/$(database)/documents/albums/$(albumId)).data.uid == request.auth.uid;
        match /comments/{commentId} {
          allow read, write: if request.auth != null;
        }
      }
    }
  }
}
```

**Storage Rules:**
```
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /photos/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      allow write: if request.resource.size < 10 * 1024 * 1024;
      allow write: if request.resource.contentType.matches('image/.*');
    }
  }
}
```

---

## 📁 هيكل المشروع

```
Photo.anwar/
├── photography-portfolio.html  # الواجهة الرئيسية
├── api-client.js              # مكتبة الـ API
├── firestore.rules            # قواعد Firestore
├── storage.rules              # قواعد Storage
├── firebase.json              # إعدادات Firebase
├── FIREBASE_SETUP.md          # دليل الإعداد
├── README.md                  # هذا الملف
└── functions/
    ├── index.js               # Cloud Functions API
    └── package.json           # المتعلقات

```

---

## 🔌 API الـ Endpoints

### الألبومات

| الطريقة | الرابط | الوصف |
|--------|--------|-------|
| GET | `/albums` | جلب جميع ألبوماتك |
| POST | `/albums` | إنشاء ألبوم جديد |
| DELETE | `/albums/:id` | حذف ألبوم |

### الصور

| الطريقة | الرابط | الوصف |
|--------|--------|-------|
| GET | `/albums/:id/photos` | جلب صور الألبوم |
| POST | `/albums/:id/photos` | إضافة صورة |
| DELETE | `/albums/:id/photos/:id` | حذف صورة |
| POST | `/albums/:id/photos/:id/like` | إعجاب/إزالة إعجاب |
| POST | `/albums/:id/photos/:id/comments` | إضافة تعليق |

### المستخدم

| الطريقة | الرابط | الوصف |
|--------|--------|-------|
| GET | `/user/profile` | معلومات المستخدم |
| GET | `/user/stats` | إحصائيات المستخدم |

---

## 📖 الاستخدام

### من الفرونتإند

```javascript
// تضمين مكتبة API
<script src="api-client.js"></script>

// إنشاء instance من API
const api = new PhotoAPI();

// جلب الألبومات
const albums = await api.getAlbums();

// إنشاء ألبوم
await api.createAlbum('اسم الألبوم', 'وصف');

// إضافة صورة
await api.addPhoto(albumId, imageUrl, imageName, imageSize);

// الإعجاب بصورة
await api.toggleLike(albumId, photoId);

// إضافة تعليق
await api.addComment(albumId, photoId, 'نص التعليق');
```

---

## 🧪 الاختبار المحلي

### 1️⃣ تشغيل الـ Emulator

```bash
firebase emulators:start
```

سيفتح واجهة على http://localhost:4000

### 2️⃣ تعديل API URL في `api-client.js`

```javascript
const api = new PhotoAPI('http://localhost:5001/anwar-2a290/europe-west1/api');
```

### 3️⃣ فتح المشروع في المتصفح

```bash
open photography-portfolio.html
```

---

## 🔐 الأمان

✅ **مصادقة Firebase** - فقط المستخدمون المسجلون
✅ **Firestore Rules** - فقط مالك البيانات يمكنه الوصول
✅ **Storage Rules** - حماية الملفات من الوصول غير المصرح
✅ **CORS** - محدود للنطاقات المسموحة
✅ **التشفير** - جميع الاتصالات مشفرة

---

## 🌐 النشر على الإنتاج

### نشر على GitHub Pages

```bash
# بناء المشروع (إذا كان موجود)
npm run build

# أو ببساطة push إلى GitHub
git add .
git commit -m "تحديث المشروع"
git push origin main
```

المشروع سيكون متاح على:
```
https://anwartannaz29-sketch.github.io/Photo.anwar/
```

### نشر Cloud Functions

```bash
firebase deploy --only functions
```

---

## 📝 المتطلبات والإعدادات

### Firebase Requirements

- ✅ Firebase Authentication مفعلة
- ✅ Google Sign-in مفعل
- ✅ Email/Password Sign-in مفعل
- ✅ Firestore Database في Production Mode
- ✅ Cloud Storage مفعل
- ✅ Cloud Functions مفعلة

### قيود الملفات

- **الحد الأقصى لحجم الصورة**: 10MB
- **صيغ الملفات المسموحة**: JPG, PNG, WEBP, GIF
- **مساحة التخزين**: حسب خطتك في Firebase

---

## 🐛 حل المشاكل

### ❌ "توكن غير صحيح"

- تأكد من تسجيل الدخول
- تحقق من صحة المفاتيح في Firebase

### ❌ "لا يمكنك الوصول"

- تحقق من قواعد Firestore
- تأكد من أنك صاحب الألبوم

### ❌ "فشل في رفع الصورة"

- تحقق من حجم الصورة (أقل من 10MB)
- تحقق من صيغة الملف
- تحقق من قواعد Storage

### ❌ "خطأ في الاتصال"

- تحقق من اتصالك بالإنترنت
- تحقق من CORS في Firebase
- تحقق من الـ URL الصحيح للـ API

---

## 📚 المراجع

- [Firebase Documentation](https://firebase.google.com/docs)
- [Cloud Functions Guide](https://firebase.google.com/docs/functions)
- [Firestore Security](https://firebase.google.com/docs/firestore/security/start)
- [Storage Security](https://firebase.google.com/docs/storage/security)

---

## 👨‍💻 المساهمة

نرحب بالمساهمات! يرجى:

1. Fork المشروع
2. إنشاء branch جديد (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push إلى Branch (`git push origin feature/AmazingFeature`)
5. فتح Pull Request

---

## 📄 الترخيص

هذا المشروع مرخص تحت MIT License - انظر ملف [LICENSE](LICENSE) للتفاصيل.

---

## 📞 التواصل

- **المطور**: Anwar Tannaz
- **البريد**: anwartannaz29@gmail.com
- **GitHub**: [@anwartannaz29-sketch](https://github.com/anwartannaz29-sketch)

---

## 🙏 شكراً

شكراً لاستخدامك LENS! نتمنى لك تجربة رائعة! 📸✨

---

**آخر تحديث**: يوليو 2026
