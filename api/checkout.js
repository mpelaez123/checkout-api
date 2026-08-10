import { MercadoPagoConfig, Preference } from "mercadopago";

const client = new MercadoPagoConfig({
  accessToken: process.env.MP_ACCESS_TOKEN,
});

export default async function handler(req, res) {
  // ✅ CORS headers — necesarios para que FlutterFlow pueda llamar desde el dispositivo
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");

  // ✅ Preflight — el browser/Flutter manda un OPTIONS antes del POST real
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { items, orderId } = req.body; // 👈 1. Capturamos el orderId que mandás desde FlutterFlow

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Items inválidos" });
    }

    const preference = new Preference(client);
    const result = await preference.create({
      body: {
        items: items.map((item) => ({
          title: String(item.title || "Producto"),
          quantity: Number(item.quantity || 1),
          unit_price: Number(item.unit_price || 0),
          currency_id: "ARS",
        })),
        external_reference: orderId, // 👈 2. Vinculamos el ID del pedido
        back_urls: {
          success: "https://www.google.com", // 👈 3. URL de retorno (puedes cambiarla luego por la tuya)
          pending: "https://www.google.com",
          failure: "https://www.google.com",
        },
        auto_return: "approved", // Redirige automáticamente al usuario si se aprueba
      },
    });

    return res.status(200).json({
      init_point: result.init_point,
      sandbox_init_point: result.sandbox_init_point,
    });

  } catch (error) {
    console.error("ERROR MP:", error);
    return res.status(500).json({
      message: error.message,
      stack: error.stack,
    });
  }
}
