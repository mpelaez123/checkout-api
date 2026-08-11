import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

// Vercel se conecta a tu Firebase usando tu forma original que ya te funcionaba
if (!getApps().length) {
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\\n')
  );
  initializeApp({
    credential: cert(serviceAccount)
  });
}
const db = getFirestore();

export default async function handler(req, res) {
  // Validar que sea un método POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { type, data, action } = req.body;

    // Aceptamos tanto el formato clásico como el moderno de Mercado Pago
    const isPaymentEvent = type === 'payment' || action === 'payment.created' || action === 'payment.updated';

    if (isPaymentEvent) {
      const paymentId = data?.id || req.body.id;

      if (paymentId) {
        // Consultamos a Mercado Pago para verificar los datos reales del pago
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
          }
        });
        
        const paymentData = await mpResponse.json();

        // Si el estado del pago está aprobado
        if (paymentData.status === 'approved') {
          // Obtenemos el ID del pedido que le mandamos desde FlutterFlow
          const pedidoId = paymentData.external_reference; 

          if (pedidoId) {
            // ¡Actualizamos tu colección de pedidos en Firebase!
            await db.collection('orders').doc(pedidoId).update({
              status: 'pagado_a_imprimir',
              mp_payment_id: paymentId,
              monto_abonado: paymentData.transaction_amount,
              metodo_pago: paymentData.payment_method_id,
              fecha_pago: new Date().toISOString()
            });

            console.log(`Pedido ${pedidoId} actualizado exitosamente a 'pagado_a_imprimir'.`);
          }
        }
      }
    }

    // Responder siempre 200 a Mercado Pago para que no reintente el envío
    return res.status(200).send('OK');
    
  } catch (error) {
    console.error('Error procesando el webhook:', error);
    return res.status(500).json({ error: error.message });
  }
}
