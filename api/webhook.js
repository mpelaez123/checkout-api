import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  // Ojo acá: en tu código original tenías .replace(/\\n/g, '\\n') 
  // Lo correcto para que la clave privada reconozca los saltos de línea reales es '\n' (con barra invertida real)
  const serviceAccount = JSON.parse(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY.replace(/\\n/g, '\n')
  );
  initializeApp({
    credential: cert(serviceAccount)
  });
}
const db = getFirestore();

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { type, data, action } = req.body;

    // CONTEMPLANDO TODO: MercadoPago a veces manda 'type: payment' 
    // y otras veces manda notificaciones modernas con 'action: payment.created / payment.updated'
    const isPaymentEvent = type === 'payment' || action === 'payment.created' || action === 'payment.updated';

    if (isPaymentEvent) {
      // Extraemos el ID de forma segura sin importar si viene en data.id o directamente en id
      const paymentId = data?.id || req.body.id;

      if (paymentId) {
        const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
          headers: {
            'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
          }
        });
        
        const paymentData = await mpResponse.json();

        if (paymentData.status === 'approved') {
          const pedidoId = paymentData.external_reference; 

          if (pedidoId) {
            await db.collection('pedidos').doc(pedidoId).update({
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

    return res.status(200).send('OK');
    
  } catch (error) {
    console.error('Error procesando el webhook:', error);
    return res.status(500).json({ error: error.message });
  }
}
