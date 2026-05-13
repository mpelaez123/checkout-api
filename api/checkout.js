import mercadopago from "mercadopago";

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
});

export default async function handler(req, res) {
  // ✅ solo permite POST
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { items } = req.body;

    // ✅ validación básica
    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Items inválidos" });
    }

    // ✅ construcción de la preferencia
    const preference = {
      items: items.map((item) => ({
        title: String(item.title || "Producto"),
        quantity: Number(item.quantity || 1),
        unit_price: Number(item.unit_price || 0),
        currency_id: "ARS",
      })),
      back_urls: {
        success: "myapp://success",
        failure: "myapp://failure",
        pending: "myapp://pending",
      },
      auto_return: "approved",
    };

    // 🔥 llamada a Mercado Pago
    const response = await mercadopago.preferences.create(preference);

    // ✅ respuesta correcta
    return res.status(200).json({
      init_point: response.body.init_point,
    });

  } catch (error) {
    // 🔥 LOG COMPLETO (esto es lo que necesitábamos)
    console.error("ERROR MP:", JSON.stringify(error, null, 2));

    return res.status(500).json({
      message: error?.message,
      cause: error?.cause,
      status: error?.status,
      full: error,
    });
  }
}
``
