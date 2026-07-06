export default async function handler(req, res) {
  // 1. Validar que Mercado Pago nos esté mandando un POST
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Método no permitido' });
  }

  try {
    const { type, data } = req.body;

    // 2. Si el aviso es sobre un pago ('payment')
    if (type === 'payment') {
      const paymentId = data.id;

      // Le preguntamos a Mercado Pago el estado real de ese ID de pago
      // Usamos las Variables de Entorno (que configuraremos en el Paso 4)
      const mpResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: {
          'Authorization': `Bearer ${process.env.MP_ACCESS_TOKEN}`
        }
      });
      
      const paymentData = await mpResponse.json();

      // 3. Si el estado es aprobado ('approved')
      if (paymentData.status === 'approved') {
        const pedidoId = paymentData.external_reference; // El ID del pedido en tu app

        // AQUÍ ES DONDE ACTUALIZAMOS EN FIREBASE
        // Para no complicarte ahora con llaves de Firebase, podes usar la propia API HTTP de Firebase
        // o dejar este comentario. Cuando cambies de usuario de MP lo conectamos a Firestore en 2 minutos.
        console.log(`¡Pago Aprobado para el pedido: ${pedidoId}!`);
      }
    }

    // 4. Muy importante: Responderle siempre 200 (OK) a Mercado Pago para que no se quede esperando
    return res.status(200).send('OK');
    
  } catch (error) {
    console.error('Error en el webhook:', error);
    return res.status(500).json({ error: error.message });
  }
}
