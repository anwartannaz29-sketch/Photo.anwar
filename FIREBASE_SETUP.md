# 📚 دليل Firebase Cloud Functions

## 🚀 البدء السريع

### الخطوة 1: تثبيت Firebase CLI
```bash
npm install -g firebase-tools
```

### الخطوة 2: تسجيل الدخول
```bash
firebase login
```

### الخطوة 3: ربط المشروع
```bash
firebase init
# اختر "Functions"
# اختر مشروعك "anwar-2a290"
```

### الخطوة 4: تثبيت المتعلقات
```bash
cd functions
npm install
```

### الخطوة 5: اختبار محلياً
```bash
firebase emulators:start
```

سيظهر الرابط:
```
http://localhost:5001/anwar-2a290/europe-west1/api
```

### الخطوة 6: نشر إلى الإنتاج
```bash
firebase deploy --only functions
```

---

## 📡 استخدام API من الفرونتإند

### الخطوة 1: الحصول على التوكن
```javascript
const user = firebase.auth().currentUser;
const token = await user.getIdToken();
```

### الخطوة 2: إضافة الـ Header
```javascript
const headers = {
  'Authorization': `Bearer ${token}`,
  'Content-Type': 'application/json'
};
```

### الثطوة 3: استدعاء API

#### 📥 جلب الألبومات
```javascript
const response = await fetch(
  'https://europe-west1-anwar-2a290.cloudfunctions.net/api/albums',
  {
    method: 'GET',
    headers: headers
  }
);
const data = await response.json();
```

#### ➕ إنشاء ألبوم جديد
```javascript
const response = await fetch(
  'https://europe-west1-anwar-2a290.cloudfunctions.net/api/albums',
  {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      name: 'اسم الألبوم',
      description: 'الوصف',
      cover: 'رابط الصورة'
    })
  }
);
```

#### 📸 إضافة صورة
```javascript
const response = await fetch(
  'https://europe-west1-anwar-2a290.cloudfunctions.net/api/albums/ALBUM_ID/photos',
  {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      url: 'رابط الصورة',
      name: 'اسم الصورة',
      size: 12345
    })
  }
);
```

#### ❤️ الإعجاب بصورة
```javascript
const response = await fetch(
  'https://europe-west1-anwar-2a290.cloudfunctions.net/api/albums/ALBUM_ID/photos/PHOTO_ID/like',
  {
    method: 'POST',
    headers: headers
  }
);
```

#### 💬 إضافة تعليق
```javascript
const response = await fetch(
  'https://europe-west1-anwar-2a290.cloudfunctions.net/api/albums/ALBUM_ID/photos/PHOTO_ID/comments',
  {
    method: 'POST',
    headers: headers,
    body: JSON.stringify({
      text: 'نص التعليق'
    })
  }
);
```

#### 📊 إحصائيات المستخدم
```javascript
const response = await fetch(
  'https://europe-west1-anwar-2a290.cloudfunctions.net/api/user/stats',
  {
    method: 'GET',
    headers: headers
  }
);
```

---

## 🔐 قواعد الأمان

### Firestore Rules (`firestore.rules`)
- فقط مالك الألبوم يمكنه قراءته وتعديله
- التعليقات متاحة للجميع المسجلين

### Storage Rules (`storage.rules`)
- فقط المستخدم يمكنه تحميل صوره الخاصة
- أقصى حجم ملف: **10MB**
- فقط صيغ الصور مسموحة (JPG, PNG, WEBP)

---

## 🛠️ قائمة الـ API

| الطريقة | الرابط | الوظيفة |
|--------|--------|--------|
| GET | `/albums` | جلب ألبومات المستخدم |
| POST | `/albums` | إنشاء ألبوم جديد |
| DELETE | `/albums/:id` | حذف ��لبوم |
| GET | `/albums/:id/photos` | جلب صور الألبوم |
| POST | `/albums/:id/photos` | إضافة صورة |
| DELETE | `/albums/:id/photos/:id` | حذف صورة |
| POST | `/albums/:id/photos/:id/like` | الإعجاب/إزالة الإعجاب |
| POST | `/albums/:id/photos/:id/comments` | إضافة تعليق |
| GET | `/user/profile` | بيانات المستخدم |
| GET | `/user/stats` | إحصائيات المستخدم |

---

## 🧪 اختبار مع Postman

1. افتح Postman
2. اختر Request جديد
3. اختر GET / POST / DELETE حسب الـ API
4. أدخل الرابط: `http://localhost:5001/anwar-2a290/europe-west1/api/albums`
5. اذهب إلى **Headers** وأضف:
   - Key: `Authorization`
   - Value: `Bearer YOUR_ID_TOKEN`
6. اضغط Send

---

## 📝 ملاحظات مهمة

✅ **التوكن:** يجب تحديثه كل ساعة
✅ **CORS:** مفعل فقط للنطاقات المسموحة
✅ **الأخطاء:** كل رسالة خطأ باللغة العربية
✅ **الأمان:** التشفير والتحقق من الملكية مفعّل

---

## 🐛 معالجة الأخطاء

```javascript
try {
  const response = await fetch(url, { method, headers, body });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('Error:', error.error);
    return;
  }
  
  const data = await response.json();
  console.log('Success:', data);
} catch (error) {
  console.error('Network error:', error);
}
```

---

## 📞 الدعم

للمساعدة، تحقق من:
- Firebase Documentation: https://firebase.google.com/docs
- Cloud Functions: https://firebase.google.com/docs/functions
- Firestore: https://firebase.google.com/docs/firestore
