import admin from 'firebase-admin';

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
  });
}

export default async function handler(req, res) {
  const db = admin.firestore();
  const snapshot = await db.collection('orders').orderBy('createdAt', 'desc').get();

  const orders = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      customerName: data.customerName,
      customerEmail: data.customerEmail,
      status: data.status,
      totalAmount: data.totalAmount,
      createdAt: data.createdAt?.toDate?.() ?? null,
      photoCount: data.photos?.length ?? 0,
    };
  });

  res.status(200).json(orders);
}