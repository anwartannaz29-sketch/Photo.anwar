const functions = require('firebase-functions');
const admin = require('firebase-admin');
const express = require('express');
const cors = require('cors');

// تهيئة Firebase Admin SDK
admin.initializeApp();

const db = admin.firestore();
const storage = admin.storage();

// إنشاء تطبيق Express
const app = express();

// إعدادات CORS الآمنة
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5000',
    'https://anwartannaz29-sketch.github.io',
    // أضف نطاقك الفعلي هنا عند النشر
  ],
  credentials: true
};

app.use(cors(corsOptions));
app.use(express.json({ limit: '50mb' }));

// ============================================
// 🔐 Middleware للتحقق من المستخدم المسجل
// ============================================
const authenticate = async (req, res, next) => {
  const token = req.headers.authorization?.split('Bearer ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'لم تقدم توكن' });
  }

  try {
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.userId = decodedToken.uid;
    req.userEmail = decodedToken.email;
    next();
  } catch (error) {
    return res.status(403).json({ error: 'توكن غير صحيح أو انتهت صلاحيته' });
  }
};

// ============================================
// 📸 API: الحصول على ألبومات المستخدم
// ============================================
app.get('/albums', authenticate, async (req, res) => {
  try {
    const snapshot = await db
      .collection('albums')
      .where('uid', '==', req.userId)
      .orderBy('createdAt', 'desc')
      .get();

    const albums = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
    }));

    res.json({ success: true, data: albums });
  } catch (error) {
    console.error('Album fetch error:', error);
    res.status(500).json({ error: 'حدث خطأ في جلب الألبومات' });
  }
});

// ============================================
// 📸 API: إنشاء ألبوم جديد
// ============================================
app.post('/albums', authenticate, async (req, res) => {
  try {
    const { name, description, cover } = req.body;

    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'اسم الألبوم مطلوب' });
    }

    const albumData = {
      uid: req.userId,
      email: req.userEmail,
      name: name.trim(),
      description: description?.trim() || '',
      cover: cover || '',
      photos: 0,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    const docRef = await db.collection('albums').add(albumData);

    res.json({
      success: true,
      message: 'تم إنشاء الألبوم بنجاح',
      data: { id: docRef.id, ...albumData }
    });
  } catch (error) {
    console.error('Album creation error:', error);
    res.status(500).json({ error: 'حدث خطأ في إنشاء الألبوم' });
  }
});

// ============================================
// 📸 API: حذف ألبوم
// ============================================
app.delete('/albums/:albumId', authenticate, async (req, res) => {
  try {
    const { albumId } = req.params;

    // تحقق من ملكية الألبوم
    const albumDoc = await db.collection('albums').doc(albumId).get();
    
    if (!albumDoc.exists) {
      return res.status(404).json({ error: 'الألبوم غير موجود' });
    }

    if (albumDoc.data().uid !== req.userId) {
      return res.status(403).json({ error: 'لا يمكنك حذف ألبوم غيرك' });
    }

    // حذف جميع الصور في الألبوم من Storage
    const bucket = storage.bucket();
    const [files] = await bucket.getFiles({
      prefix: `photos/${req.userId}/${albumId}/`
    });

    await Promise.all(files.map(file => file.delete()));

    // حذف الألبوم من Firestore
    await db.collection('albums').doc(albumId).delete();

    res.json({ success: true, message: 'تم حذف الألبوم بنجاح' });
  } catch (error) {
    console.error('Album deletion error:', error);
    res.status(500).json({ error: 'حدث خطأ في حذف الألبوم' });
  }
});

// ============================================
// 🖼️ API: الحصول على صور الألبوم
// ============================================
app.get('/albums/:albumId/photos', authenticate, async (req, res) => {
  try {
    const { albumId } = req.params;

    // تحقق من ملكية الألبوم
    const albumDoc = await db.collection('albums').doc(albumId).get();
    
    if (!albumDoc.exists) {
      return res.status(404).json({ error: 'الألبوم غير موجود' });
    }

    if (albumDoc.data().uid !== req.userId) {
      return res.status(403).json({ error: 'لا يمكنك الوصول إلى صور غيرك' });
    }

    const snapshot = await db
      .collection('albums')
      .doc(albumId)
      .collection('photos')
      .orderBy('uploadedAt', 'desc')
      .get();

    const photos = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    res.json({ success: true, data: photos });
  } catch (error) {
    console.error('Photos fetch error:', error);
    res.status(500).json({ error: 'حدث خطأ في جلب الصور' });
  }
});

// ============================================
// 📤 API: رفع صور (معلومات الصورة فقط)
// ============================================
app.post('/albums/:albumId/photos', authenticate, async (req, res) => {
  try {
    const { albumId } = req.params;
    const { url, name, size, uploadedAt } = req.body;

    if (!url || !name) {
      return res.status(400).json({ error: 'معلومات الصورة غير كاملة' });
    }

    // تحقق من ملكية الألبوم
    const albumDoc = await db.collection('albums').doc(albumId).get();
    
    if (!albumDoc.exists) {
      return res.status(404).json({ error: 'الألبوم غير موجود' });
    }

    if (albumDoc.data().uid !== req.userId) {
      return res.status(403).json({ error: 'لا يمكنك إضافة صور إلى ألبوم غيرك' });
    }

    const photoData = {
      name: name.trim(),
      url: url,
      size: size || 0,
      uploadedAt: uploadedAt || new Date().toISOString(),
      uploadedBy: req.userEmail
    };

    const photoRef = await db
      .collection('albums')
      .doc(albumId)
      .collection('photos')
      .add(photoData);

    // تحديث عدد الصور في الألبوم
    const currentPhotos = albumDoc.data().photos || 0;
    await db.collection('albums').doc(albumId).update({
      photos: currentPhotos + 1,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({
      success: true,
      message: 'تمت إضافة الصورة بنجاح',
      data: { id: photoRef.id, ...photoData }
    });
  } catch (error) {
    console.error('Photo upload error:', error);
    res.status(500).json({ error: 'حدث خطأ في رفع الصورة' });
  }
});

// ============================================
// 🗑️ API: حذف صورة
// ============================================
app.delete('/albums/:albumId/photos/:photoId', authenticate, async (req, res) => {
  try {
    const { albumId, photoId } = req.params;

    // تحقق من ملكية الألبوم
    const albumDoc = await db.collection('albums').doc(albumId).get();
    
    if (!albumDoc.exists) {
      return res.status(404).json({ error: 'الألبوم غير موجود' });
    }

    if (albumDoc.data().uid !== req.userId) {
      return res.status(403).json({ error: 'لا يمكنك حذف صور من ألبوم غيرك' });
    }

    // حذف الصورة من Firestore
    await db
      .collection('albums')
      .doc(albumId)
      .collection('photos')
      .doc(photoId)
      .delete();

    // تحديث عدد الصور
    const currentPhotos = albumDoc.data().photos || 1;
    await db.collection('albums').doc(albumId).update({
      photos: Math.max(0, currentPhotos - 1),
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    res.json({ success: true, message: 'تمت حذف الصورة بنجاح' });
  } catch (error) {
    console.error('Photo deletion error:', error);
    res.status(500).json({ error: 'حدث خطأ في حذف الصورة' });
  }
});

// ============================================
// ❤️ API: الإعجاب بصورة
// ============================================
app.post('/albums/:albumId/photos/:photoId/like', authenticate, async (req, res) => {
  try {
    const { albumId, photoId } = req.params;

    // تحقق من ملكية الألبوم
    const albumDoc = await db.collection('albums').doc(albumId).get();
    
    if (!albumDoc.exists) {
      return res.status(404).json({ error: 'الألبوم غير موجود' });
    }

    const photoRef = db
      .collection('albums')
      .doc(albumId)
      .collection('photos')
      .doc(photoId);

    const photoDoc = await photoRef.get();

    if (!photoDoc.exists) {
      return res.status(404).json({ error: 'الصورة غير موجودة' });
    }

    const likes = photoDoc.data().likes || [];
    const userIndex = likes.indexOf(req.userId);

    if (userIndex > -1) {
      likes.splice(userIndex, 1);
    } else {
      likes.push(req.userId);
    }

    await photoRef.update({ likes });

    res.json({
      success: true,
      message: userIndex > -1 ? 'تم إزالة الإعجاب' : 'تم الإعجاب بالصورة',
      data: { likes: likes.length }
    });
  } catch (error) {
    console.error('Like error:', error);
    res.status(500).json({ error: 'حدث خطأ في الإعجاب' });
  }
});

// ============================================
// 💬 API: تعليقات على الصور
// ============================================
app.post('/albums/:albumId/photos/:photoId/comments', authenticate, async (req, res) => {
  try {
    const { albumId, photoId } = req.params;
    const { text } = req.body;

    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'التعليق فارغ' });
    }

    const albumDoc = await db.collection('albums').doc(albumId).get();
    
    if (!albumDoc.exists) {
      return res.status(404).json({ error: 'الألبوم غير موجود' });
    }

    const photoRef = db
      .collection('albums')
      .doc(albumId)
      .collection('photos')
      .doc(photoId);

    const commentData = {
      uid: req.userId,
      email: req.userEmail,
      text: text.trim(),
      timestamp: admin.firestore.FieldValue.serverTimestamp()
    };

    await photoRef
      .collection('comments')
      .add(commentData);

    res.json({
      success: true,
      message: 'تم إضافة التعليق بنجاح',
      data: commentData
    });
  } catch (error) {
    console.error('Comment error:', error);
    res.status(500).json({ error: 'حدث خطأ في إضافة التعليق' });
  }
});

// ============================================
// 👤 API: الحصول على معلومات المستخدم
// ============================================
app.get('/user/profile', authenticate, async (req, res) => {
  try {
    const userRecord = await admin.auth().getUser(req.userId);

    res.json({
      success: true,
      data: {
        uid: userRecord.uid,
        email: userRecord.email,
        displayName: userRecord.displayName || '',
        photoURL: userRecord.photoURL || '',
        createdAt: userRecord.metadata.creationTime
      }
    });
  } catch (error) {
    console.error('Profile fetch error:', error);
    res.status(500).json({ error: 'حدث خطأ في جلب بيانات المستخدم' });
  }
});

// ============================================
// 📊 API: إحصائيات المستخدم
// ============================================
app.get('/user/stats', authenticate, async (req, res) => {
  try {
    const albumsSnapshot = await db
      .collection('albums')
      .where('uid', '==', req.userId)
      .get();

    let totalPhotos = 0;
    let totalLikes = 0;

    for (const albumDoc of albumsSnapshot.docs) {
      totalPhotos += albumDoc.data().photos || 0;

      const photosSnapshot = await albumDoc.ref
        .collection('photos')
        .get();

      photosSnapshot.docs.forEach(photoDoc => {
        totalLikes += (photoDoc.data().likes || []).length;
      });
    }

    res.json({
      success: true,
      data: {
        totalAlbums: albumsSnapshot.size,
        totalPhotos: totalPhotos,
        totalLikes: totalLikes
      }
    });
  } catch (error) {
    console.error('Stats error:', error);
    res.status(500).json({ error: 'حدث خطأ في حساب الإحصائيات' });
  }
});

// ============================================
// 🚀 نشر Firebase Cloud Function
// ============================================
exports.api = functions
  .region('europe-west1')
  .https.onRequest(app);

// ============================================
// 🔄 Trigger: عند حذف مستخدم
// ============================================
exports.deleteUserData = functions
  .auth.user()
  .onDelete(async (user) => {
    try {
      // حذف جميع ألبومات المستخدم
      const albumsSnapshot = await db
        .collection('albums')
        .where('uid', '==', user.uid)
        .get();

      for (const albumDoc of albumsSnapshot.docs) {
        // حذف الصور من Storage
        const bucket = storage.bucket();
        const [files] = await bucket.getFiles({
          prefix: `photos/${user.uid}/`
        });

        await Promise.all(files.map(file => file.delete()));

        // حذف الألبوم
        await albumDoc.ref.delete();
      }

      console.log(`تم حذف بيانات المستخدم ${user.uid}`);
    } catch (error) {
      console.error('Error deleting user data:', error);
    }
  });
