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

const db = admin.firestore();

export default async function handler(req, res) {
  const { id } = req.query;

  if (req.method === 'GET') {
    const doc = await db.collection('orders').doc(id).get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    const data = doc.data();
    return res.status(200).json({
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

  if (req.method === 'PATCH') {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ error: 'El campo status es obligatorio' });
    }
    const orderRef = db.collection('orders').doc(id);
    const doc = await orderRef.get();
    if (!doc.exists) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }
    await orderRef.update({
      status,
      updatedAt: new Date().toISOString(),
    });
    return res.status(200).json({
      success: true,
      message: `Estado del pedido ${id} actualizado correctamente`,
    });
  }

  res.setHeader('Allow', ['GET', 'PATCH']);
  return res.status(405).json({ error: `Método ${req.method} no permitido` });
}