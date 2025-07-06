const axios = require("axios");
const crypto = require("crypto");
const Factura = require("../models/factura");
const Entrada = require('../models/entrada');
const entradaCtrl = require("./entrada.controller");
const mpCtrl = {};
/**
 * Compra con carrito: varias entradas
 */
mpCtrl.buyCart = async (req, res) => {
  try {
    const {
      usuarioId,
      entradas,
      eventoId,
      eventName,
      eventDescription,
      imageUrl,
      metodoPago = "Tarjeta de Crédito"
    } = req.body;

    if (!Array.isArray(entradas) || entradas.length === 0) {
      return res.status(400).json({ error: true, msg: "No hay entradas para procesar." });
    }

    const total = entradas.reduce((acc, e) => acc + e.cantidad * e.precioUnitario, 0);

    const factura = new Factura({
      usuarioId,
      eventoId,
      entradas,
      total,
      estado: "pendiente",
      metodoPago,
      eventName,
      eventDescription,
      imageUrl
    });

    await factura.save();

    const items = entradas.map(({ tipoEntrada, cantidad, precioUnitario }) => ({
      title: `${eventName} - Entrada ${tipoEntrada}`,
      description: eventDescription,
      quantity: cantidad,
      unit_price: precioUnitario,
      picture_url: imageUrl
    }));

    const response = await axios.post(
      "https://api.mercadopago.com/checkout/preferences",
      {
        items,
        back_urls: {
          failure: "https://pases-com.onrender.com/",
          pending: "https://pases-com.onrender.com/",
          success: "https://pases-com.onrender.com/"
        },
        external_reference: factura._id.toString()
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    factura.mpPreferenceId = response.data.id;
    await factura.save();

    res.status(200).json({
      preferenceId: response.data.id,
      initPoint: response.data.init_point
    });
  } catch (error) {
    console.error("Error en buyCart:", error.response?.data || error.message);
    res.status(500).json({ error: true, msg: "Error al generar enlace de compra" });
  }
};

// Compra entrada individual (una sola entrada)
mpCtrl.buyTicket = async (req, res) => {
  try {
    console.log("Body recibido en buyTicket:", req.body);
    
    const {
      usuarioId,
      tipoEntrada,
      cantidad,
      precioUnitario,
      eventoId,
      eventName,
      eventDescription,
      imageUrl,
      metodoPago = "Tarjeta de Crédito"
    } = req.body;

    if (!cantidad || cantidad <= 0) {
      return res.status(400).json({ error: true, msg: "Cantidad inválida" });
    }

    const total = cantidad * precioUnitario;

    const factura = new Factura({
      usuarioId,
      tipoEntrada,
      cantidad,
      precioUnitario,
      eventoId,
      eventName,
      eventDescription,
      imageUrl,
      total,
      estado: "pendiente",
      metodoPago
    });

    await factura.save();
    console.log("Factura guardada:", factura);

    const items = [
      {
        title: `${eventName} - Entrada ${tipoEntrada}`,
        description: eventDescription,
        quantity: cantidad,
        unit_price: precioUnitario,
        picture_url: imageUrl
      }
    ];

    const response = await axios.post(
      "https://api.mercadopago.com/checkout/preferences",
      {
        items,
        back_urls: {
          failure: "https://pases-com.onrender.com/",
          pending: "https://pases-com.onrender.com/",
          success: "https://pases-com.onrender.com/"
        },
        external_reference: factura._id.toString()
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.ACCESS_TOKEN}`,
          "Content-Type": "application/json"
        }
      }
    );

    factura.mpPreferenceId = response.data.id;
    await factura.save();

    res.status(200).json({
      preferenceId: response.data.id,
      initPoint: response.data.init_point
    });
  } catch (error) {
    console.error("Error en buyTicket:", error.response?.data || error.message);
    res.status(500).json({ error: true, msg: "Error al generar enlace de compra" });
  }
};

// Webhook para recibir notificaciones de MercadoPago
mpCtrl.receiveWebhook = async (req, res) => {
  const { type: webhookType, data } = req.body;
  const dataId = data?.id;

  if (webhookType !== "payment" || !dataId) {
    return res.status(400).send("Datos de webhook inválidos");
  }

  try {
    const paymentInfo = await axios.get(
      `https://api.mercadopago.com/v1/payments/${dataId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.ACCESS_TOKEN}`
        }
      }
    );

    const payment = paymentInfo.data;
    const facturaId = payment.external_reference;
    if (!facturaId) return res.status(400).send("No se encontró la referencia externa");

    const factura = await Factura.findById(facturaId);
    if (!factura) return res.status(404).send("Factura no encontrada");

    // Actualizar estado según el resultado del pago
    if (payment.status === "approved") {
      factura.estado = "pagada";
    } else if (["rejected", "cancelled"].includes(payment.status)) {
      factura.estado = "cancelada";
    }

    factura.transaccionId = dataId;
    await factura.save();

    // Si no está pagada, respondemos OK y no generamos entradas
    if (factura.estado !== "pagada") return res.sendStatus(200);

    const entradasCreadas = [];

    // Caso compra múltiple (carrito)
    if (Array.isArray(factura.entradas) && factura.entradas.length > 0) {
      for (const { tipoEntrada, cantidad, precioUnitario } of factura.entradas) {
        for (let i = 0; i < cantidad; i++) {
          const nuevaEntrada = new Entrada({
            nombre: `${factura.eventName} - Entrada ${tipoEntrada}`,
            tipo: tipoEntrada,
            precio: precioUnitario,
            usuarioId: factura.usuarioId,
            facturaId: factura._id,
            estado: "vendida",
            eventName: factura.eventName,
            eventDescription: factura.eventDescription,
            imageUrl: factura.imageUrl
          });

          entradasCreadas.push(nuevaEntrada.save());
        }
      }
    } 
    // Caso compra individual
    else if (factura.tipoEntrada && factura.cantidad && factura.precioUnitario) {
      for (let i = 0; i < factura.cantidad; i++) {
        const nuevaEntrada = new Entrada({
          nombre: `${factura.eventName || ""} - Entrada ${factura.tipoEntrada}`,
          tipo: factura.tipoEntrada,
          precio: factura.precioUnitario,
          usuarioId: factura.usuarioId,
          facturaId: factura._id,
          estado: "vendida",
          eventName: factura.eventName,
          eventDescription: factura.eventDescription,
          imageUrl: factura.imageUrl
        });

        entradasCreadas.push(nuevaEntrada.save());
      }
    } else {
      console.warn(`Factura ${factura._id} no tiene información válida para crear entradas.`);
    }

    await Promise.all(entradasCreadas);
    console.log(`Se crearon ${entradasCreadas.length} entradas para factura ${factura._id}`);

    return res.sendStatus(200);
  } catch (error) {
    console.error("Error procesando webhook:", error.response?.data || error.message);
    return res.status(500).send("Error procesando notificación");
  }
};

module.exports = mpCtrl;