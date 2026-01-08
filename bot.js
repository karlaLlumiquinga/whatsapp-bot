const express = require('express');
const bodyParser = require('body-parser');
const { MessagingResponse } = require('twilio').twiml;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// --- BASE DE DATOS SIMULADA ---
const CATALOGO = {
    'iphone': '📱 *iPhone 15 Pro*: $999\n📱 *iPhone 14*: $799\n📱 *iPhone 13*: $599',
    'samsung': '📱 *Samsung S24 Ultra*: $1200\n📱 *Samsung A54*: $350',
    'xiaomi': '📱 *Xiaomi Note 13*: $250\n📱 *Poco X6*: $300'
};

const SERVICIOS = {
    'pantalla': '🔧 Cambio de Pantalla: Desde $50 (Varía por modelo). Tiempo: 2 horas.',
    'bateria': '🔋 Cambio de Batería: $30 - $80. Tiempo: 1 hora.',
    'revision': '👨‍🔧 Diagnóstico general: $15 (Gratis si realizas la reparación).'
};

// --- FUNCIÓN INTELIGENTE (SIMULACIÓN IA) ---
function procesarMensaje(mensaje) {
    const msg = mensaje.toLowerCase().trim();

    // 1. Saludos
    if (['hola', 'buenas', 'inicio', 'menu'].includes(msg)) {
        return `👋 *¡Hola! Bienvenido a Celulares & Soporte Tech*
        
Soy tu asistente virtual. Por favor elige una opción escribiendo el número:

1️⃣ *Ver Celulares en Oferta*
2️⃣ *Precios de Reparación*
3️⃣ *Horarios y Ubicación*
4️⃣ *Hablar con un Humano*

_O simplemente pregúntame algo como "¿Tienen iPhone 15?"_`;
    }

    // 2. Menú Opción 1: Celulares
    if (msg === '1' || msg.includes('celular') || msg.includes('comprar')) {
        return `🛒 *Catálogo de Celulares*
        
Tenemos las mejores marcas. Escribe la marca que buscas:
👉 *iPhone*
👉 *Samsung*
👉 *Xiaomi*`;
    }

    // 3. Menú Opción 2: Reparaciones
    if (msg === '2' || msg.includes('reparar') || msg.includes('arreglar')) {
        return `🛠 *Servicio Técnico Especializado*

¿Qué necesitas reparar? Escribe una palabra clave:
👉 *Pantalla*
👉 *Batería*
👉 *Revisión*`;
    }

    // 4. Lógica de "IA" (Keyword Matching)
    // Busca marcas
    for (const [marca, info] of Object.entries(CATALOGO)) {
        if (msg.includes(marca)) return info + '\n\nEscribe *Menu* para volver.';
    }

    // Busca reparaciones
    for (const [servicio, info] of Object.entries(SERVICIOS)) {
        if (msg.includes(servicio)) return info + '\n\n📅 *¡Agenda tu cita escribiendo "Humano"!*';
    }

    // 5. Horarios y Ubicación
    if (msg === '3' || msg.includes('horario') || msg.includes('donde')) {
        const ahora = new Date();
        const hora = ahora.getHours(); // Hora del servidor (0-23)
        const abierto = hora >= 9 && hora < 19; // 9am a 7pm

        return `📍 *Ubicación*: Centro Comercial Tech, Local 45.
⏰ *Horario*: Lunes a Sábado, 9am - 7pm.

${abierto ? '🟢 *Estamos ABIERTOS ahora.* ¡Ven a visitarnos!' : '🔴 *Estamos CERRADOS.* Déjanos tu mensaje y te respondemos mañana.'}`;
    }

    // 6. Transferencia a Humano
    if (msg === '4' || msg.includes('humano') || msg.includes('asesor')) {
        return `👨‍💻 *Conectando con un asesor...*
        
Hemos notificado a nuestro equipo. En breve te atenderán por aquí.
Mientras tanto, ¿puedo ayudarte con otra duda rápida?`;
    }

    // Default Fallback
    return `🤔 No entendí bien tu consulta.
    
Por favor escribe *Menu* para ver las opciones, o intenta preguntar de otra forma (ej: "precio iphone").`;
}

// --- RUTA WHATSAPP (Webhook) ---
app.post('/whatsapp', (req, res) => {
    const incomingMsg = req.body.Body || '';
    console.log(`Mensaje recibido: ${incomingMsg}`);

    const respuestaTexto = procesarMensaje(incomingMsg);

    const twiml = new MessagingResponse();
    twiml.message(respuestaTexto);

    res.type('text/xml');
    res.send(twiml.toString());
});

// --- RUTA HOME (Para verificar que funciona) ---
app.get('/', (req, res) => {
    res.send('🤖 El Bot de WhatsApp está VIVO y escuchando...');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en puerto ${PORT}`);
});
