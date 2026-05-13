import mercadopago from "mercadopago";

mercadopago.configure({
  access_token: process.env.MP_ACCESS_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Método no permitido" });
  }

  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return res.status(400).json({ error: "Items inválidos" });
    }

    const preference = {
      items: items.map(item => ({
  title: String(item.title),
  quantity: Number(item.quantity),
  unit_price: Number(item.unit_price),
  currency_id: "ARS",
})),
      })),
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
