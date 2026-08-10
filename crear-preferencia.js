import mercadopago from "mercadopago";

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    // Recibimos los ítems y tu ID de pedido de FlutterFlow
    const { items, pedidoId } = req.body;

    const preference = {
      items: items.map(item => ({
        title: item.title,
        quantity: item.quantity,
        unit_price: item.unit_price,
        currency_id: "ARS",
      })),
      external_reference: pedidoId, // 👈 ¡ESTO ES CLAVE PARA QUE FUNCIONE EL WEBHOOK!
      back_urls: {
        success: "myapp://success",
        failure: "myapp://failure",
        pending: "myapp://pending",
      },
      auto_return: "approved",
    };

    const response = await mercadopago.preferences.create(preference);

    return res.status(200).json({
      init_point: response.body.init_point,
    });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}