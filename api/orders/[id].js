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
  const { id } = req.query;

  const doc = await admin.firestore().collection('orders').doc(id).get();

  if (!doc.exists) {
    return res.status(404).json({ error: 'Pedido no encontrado' });
  }

  const data = doc.data();

  res.status(200).json({
    id: doc.id,
    customerName: data.customerName,
    customerEmail: data.customerEmail,
    status: data.status,
    totalAmount: data.totalAmount,
    createdAt: data.createdAt?.toDate?.() ?? null,
    photos: (data.photos || []).map(p => ({
      cantidad: p.cantidad,
      imagen: p.imagen,
      producto: p.producto,
    })),
  });
}