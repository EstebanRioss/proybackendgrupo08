const axios = require("axios");
const crypto = require("crypto");
const Entrada = require("../models/entrada");
const Factura = require("../models/factura");

const mpCtrl = {};

mpCtrl.buyCart = async (req, res) => {
  try {
    const {
      eventoId,
      usuarioId,
      entradas, // array: [{ tipoEntrada, cantidad, precioUnitario }]
      eventName,
      eventDescription,
      imageUrl,
      metodoPago = "Tarjeta de Crédito"
    } = req.body;

    if (!Array.isArray(entradas) || entradas.length === 0) {
      return res.status(400).json({ error: true, msg: "No hay entradas para procesar." });
    }

    // Crear factura pendiente
    const total = entradas.reduce((acc, e) => acc + e.cantidad * e.precioUnitario, 0);

    const factura = new Factura({
      total,
      estado: "pendiente",
      metodoPago,
      usuarioId
    });
    await factura.save();

    // Crear todas las entradas (cada una con cantidad 1 por item, repetido)
    const entradasACrear = [];
    entradas.forEach(({ tipoEntrada, cantidad, precioUnitario }) => {
      for (let i = 0; i < cantidad; i++) {
        entradasACrear.push(new Entrada({
          nombre: `${tipoEntrada} para ${eventName}`,
          precio: precioUnitario,
          tipo: tipoEntrada,
          estado: "disponible",
          usuarioId,
          facturaId: factura._id,
          eventoId
        }));
      }
    });
    await Entrada.insertMany(entradasACrear);

    // Crear preferencia MercadoPago con ítems separados
    const items = entradas.map(({ tipoEntrada, cantidad, precioUnitario }) => ({
      title: `Entrada para ${eventName} - ${tipoEntrada}`,
      description: eventDescription,
      picture_url: imageUrl,
      category_id: "tickets",
      quantity: cantidad,
      unit_price: precioUnitario
    }));

    const url = "https://api.mercadopago.com/checkout/preferences";
    const body = {
      items,
      back_urls: {
        failure: "http://localhost:4200/pago/fallido",
        pending: "http://localhost:4200/pago/pendiente",
        success: "http://localhost:4200/pago/exitoso"
      },
      external_reference: factura._id.toString()
    };

    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`
      }
    });

    factura.mpPreferenceId = response.data.id;
    await factura.save();

    res.status(200).json({ preferenceId: response.data.id, initPoint: response.data.init_point });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: true, msg: "Error al generar enlace de compra" });
  }
};

mpCtrl.buyTicket = async (req, res) => {
  try {
    const {
      eventoId,
      usuarioId,
      tipoEntrada,
      cantidad,
      precioUnitario,
      eventName,
      eventDescription,
      imageUrl,
      metodoPago = "Tarjeta de Crédito"
    } = req.body;

    // Crear factura inicial con información necesaria
    const factura = new Factura({
      total: cantidad * precioUnitario,
      estado: "pendiente",
      metodoPago,
      usuarioId,
      eventoId,
      tipoEntrada,
      cantidad,
      precioUnitario,
      eventName
    });

    await factura.save();

    const url = "https://api.mercadopago.com/checkout/preferences";

    const body = {
      items: [
        {
          title: `Entrada para ${eventName} - ${tipoEntrada}`,
          description: eventDescription,
          picture_url: imageUrl,
          category_id: "tickets",
          quantity: cantidad,
          unit_price: precioUnitario
        }
      ],
      back_urls: {
        failure: "https://pases-com.onrender.com/",
        pending: "https://pases-com.onrender.com/",
        success: "https://pases-com.onrender.com/"
      },
      external_reference: factura._id.toString()
    };

    const response = await axios.post(url, body, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.ACCESS_TOKEN}`
      }
    });

    factura.mpPreferenceId = response.data.id;
    await factura.save();

    res.status(200).json({ preferenceId: response.data.id, initPoint: response.data.init_point });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: true, msg: "Error al generar enlace de compra" });
  }
};


mpCtrl.receiveWebhook = async (req, res) => {
  const signature = req.get("x-signature");
  const { type: webhookType, data } = req.body;
  const dataId = data?.id;
  const [ts, hash] = signature ? signature.split(",") : [];
  const secret = process.env.WEBHOOK_SECRET;

  if (!signature || !dataId) return res.status(400).send("Faltan datos para la validación.");
  if (!secret) return res.status(400).send("Webhook secret not configured.");

  const manifest = `data_id:${dataId};ts:${ts};`;
  const hmac = crypto.createHmac("sha256", secret);
  hmac.update(manifest);
  const expectedHash = hmac.digest("hex");

  if (!crypto.timingSafeEqual(Buffer.from(hash), Buffer.from(expectedHash))) {
    console.error("Firma de Webhook inválida.");
    return res.status(400).send("Invalid signature");
  }

  if (webhookType === "payment") {
    try {
      const paymentInfo = await axios.get(`https://api.mercadopago.com/v1/payments/${dataId}`, {
        headers: { Authorization: `Bearer ${process.env.ACCESS_TOKEN}` }
      });

      const payment = paymentInfo.data;
      const facturaId = payment.external_reference;
      if (!facturaId) return res.status(400).send("No external reference");

      const factura = await Factura.findById(facturaId);
      if (!factura) return res.status(404).send("Factura no encontrada");

      let nuevoEstadoFactura = "pendiente";
      if (payment.status === "approved") nuevoEstadoFactura = "pagada";
      else if (["rejected", "cancelled"].includes(payment.status)) nuevoEstadoFactura = "cancelada";

      factura.estado = nuevoEstadoFactura;
      factura.transaccionId = dataId;
      await factura.save();

      if (nuevoEstadoFactura === "pagada") {
        const entradas = [];
        for (let i = 0; i < factura.cantidad; i++) {
          entradas.push(new Entrada({
            nombre: `${factura.tipoEntrada} para ${factura.eventName}`,
            precio: factura.precioUnitario,
            tipo: factura.tipoEntrada,
            estado: "vendida",
            usuarioId: factura.usuarioId,
            facturaId: factura._id,
            eventoId: factura.eventoId
          }));
        }

        await Entrada.insertMany(entradas);
      }

      return res.status(200).send("ok");
    } catch (error) {
      console.error("Error al procesar webhook:", error.response?.data || error.message);
      return res.status(500).send("Error procesando notificación");
    }
  }

  res.status(200).send("ok");
};

module.exports = mpCtrl;