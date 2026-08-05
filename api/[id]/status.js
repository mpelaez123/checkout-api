import admin from 'firebase-admin';

// Inicializamos firebase-admin igual que en tus otros archivos si no está inicializado
if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

const db = admin.firestore();

export default async function handler(req, res) {
  if (req.method !== 'PATCH') {
    res.setHeader('Allow', ['PATCH']);
    return res.status(405).json({ error: `Método ${req.method} no permitido` });
  }

  const { id } = req.query;
  const { status } = req.body;

  if (!status) {
    return res.status(400).json({ error: 'El campo status es obligatorio' });
  }

  try {
    const orderRef = db.collection('orders').doc(id);
    const doc = await orderRef.get();

    if (!doc.exists) {
      return res.status(404).json({ error: 'Pedido no encontrado' });
    }

    await orderRef.update({ 
      status: status,
      updatedAt: new Date().toISOString()
    });

    return res.status(200).json({ 
      success: true, 
      message: `Estado del pedido ${id} actualizado correctamente` 
    });
  } catch (error) {
    console.error('Error al actualizar el estado:', error);
    return res.status(500).json({ error: 'Error interno del servidor' });
  }
}