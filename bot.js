const express = require('express');
const bodyParser = require('body-parser');
const { MessagingResponse } = require('twilio').twiml;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// --- MEMORIA DE SESIÓN (SIMULADA) ---
// En producción, usar una base de datos (Redis/MongoDB)
// Estructura: { 'celular_cliente': { paso: 'menu', datos: {} } }
const sesiones = {};

// --- TEXTOS CONSTANTES (PROMPT NOVA) ---
const MENSAJES = {
    SALUDO: `👋 ¡Hola! Bienvenido/a a Mundo Click 7
Soy NOVA 🤖, tu asistente virtual.

Te ayudo con:
📱 Celulares y tablets
💻 Computadoras y laptops
🧰 Servicio técnico
🎧 Accesorios
🏢 Atención a empresas

⏰ Atención automática 24/7

👉 ¿Qué deseas hacer hoy?
Responde con el número o escribe la opción 👇

1️⃣ Comprar celulares o tablets
2️⃣ Comprar computadoras o laptops
3️⃣ Accesorios
4️⃣ Servicio técnico / reparaciones
5️⃣ Cotizar precios
6️⃣ Empresas
7️⃣ Horarios y ubicación
8️⃣ Preguntas frecuentes
9️⃣ Hablar con un asesor humano
0️⃣ Volver al menú`,

    HORARIO: `👤 Atención humana:
L–V: 09h00 – 18h00
S: 09h00 – 13h00

⏳ Fuera de horario, puedo ayudarte y registrar tu mensaje. 
📍 Estamos ubicados en el Centro de la Ciudad.`,

    DERIVACION: `👤 Te conecto con un asesor de Mundo Click 7
⏳ Por favor espera un momento...

(Hemos notificado a nuestro equipo de tu consulta)`,

    PRECIOS_BASE: `💰 Precios referenciales:

📱 Celulares desde $120
📲 Tablets desde $150
💻 Laptops desde $350

✔️ Cotización sin costo
✔️ Garantía incluida
✔️ Soporte técnico

👉 ¿Deseas continuar?
1️⃣ Sí, quiero cotizar
2️⃣ Hablar con asesor
0️⃣ Volver al menú`,

    TECNICO_PRECIOS: `💰 Precios referenciales:
🔋 Batería desde $25
📱 Pantalla desde $35
🧼 Mantenimiento desde $30

📌 Precio final tras diagnóstico.

📅 *Agendemos tu visita*
Por favor escribe en un solo mensaje:
• Tu Ciudad
• Día preferido
• Marca y modelo del equipo`,

    FIRMA: `
—
🤖 NOVA
Asistente Virtual de Mundo Click 7
Tecnología · Servicio · Confianza`,

    DEFAULT: `🤔 No entendí esa opción. 
Por favor responde con el número de la opción (ej: 1) o escribe "Menu" para volver al inicio.`
};

function procesarMensaje(mensaje, telefono) {
    const msg = mensaje.toLowerCase().trim();

    // Inicializar sesión si no existe
    if (!sesiones[telefono]) {
        sesiones[telefono] = { paso: 'inicio', intencion: null };
    }
    const sesion = sesiones[telefono];

    // --- COMANDOS GLOBALES ---
    if (['hola', 'buenas', 'inicio', 'menu', '0'].includes(msg)) {
        sesion.paso = 'menu';
        return MENSAJES.SALUDO;
    }

    if (msg === '9' || msg.includes('asesor') || msg.includes('humano')) {
        sesion.paso = 'asesor';
        return MENSAJES.DERIVACION + MENSAJES.FIRMA;
    }

    if (msg === '7' || msg.includes('horario') || msg.includes('ubicacion')) {
        return MENSAJES.HORARIO + '\n\nEscribe "Menu" para volver.' + MENSAJES.FIRMA;
    }

    // --- MÁQUINA DE ESTADOS (FLUJO) ---
    switch (sesion.paso) {
        case 'menu':
            // 2. MENÚ PRINCIPAL
            if (['1', '2', '5'].includes(msg)) {
                sesion.paso = 'venta_uso';
                sesion.intencion = (msg === '1') ? 'celular' : (msg === '2' ? 'computadora' : 'cotizacion');
                return `Perfecto 😊
👉 ¿El equipo es para:
1️⃣ Uso personal
2️⃣ Trabajo / estudio
3️⃣ Empresa`;
            }
            if (msg === '3') { // Accesorios
                sesion.paso = 'accesorios';
                return `🎧 Accesorios disponibles:
Cargadores · Audífonos · Micas · Carcasas · Cables

💲 Desde $3

1️⃣ Para celular
2️⃣ Para computadora
3️⃣ Consultar disponibilidad
9️⃣ Hablar con asesor`;
            }
            if (msg === '4') { // Servicio Técnico
                sesion.paso = 'tecnico_equipo';
                return `🧰 ¿Qué equipo deseas reparar?
1️⃣ Celular
2️⃣ Laptop / computadora
3️⃣ Tablet`;
            }
            if (msg === '6') { // Empresas
                sesion.paso = 'empresas';
                return `🏢 Soluciones empresariales:
✔️ Equipos corporativos
✔️ Mantenimiento
✔️ Soporte técnico
✔️ Facturación

¿Deseas atención empresarial?
1️⃣ Sí, me interesa
9️⃣ Hablar con asesor`;
            }
            break; // Fin menu

        // --- FLUJO VENTAS (3.x) ---
        case 'venta_uso':
            if (['1', '2', '3'].includes(msg)) {
                sesion.uso = (msg === '1') ? 'personal' : (msg === '2' ? 'trabajo' : 'empresa');
                sesion.paso = 'venta_gama';
                return `Gracias 👍
Te recomendaré equipos con:
✔️ Buen rendimiento
✔️ Garantía
✔️ Excelente precio–calidad

¿Qué gama prefieres?
1️⃣ Económica
2️⃣ Intermedia
3️⃣ Premium`;
            }
            break;

        case 'venta_gama':
            if (['1', '2', '3'].includes(msg)) {
                sesion.gama = (msg === '1') ? 'economica' : (msg === '2' ? 'intermedia' : 'premium');
                sesion.paso = 'venta_precio';
                return MENSAJES.PRECIOS_BASE;
            }
            break;

        case 'venta_precio':
            if (msg === '1') { // Sí quiere cotizar
                sesion.paso = 'venta_cierre';
                return `Perfecto ✅
Para cotizar necesito que me escribas:

• Marca preferida (ej: Samsung, HP)
• Presupuesto aproximado`;
            } else if (msg === '2') {
                return MENSAJES.DERIVACION + MENSAJES.FIRMA;
            }
            break;

        case 'venta_cierre':
            // Aquí el usuario escribe marca/presupuesto
            // Lo derivamos a asesor con la Info capturada
            sesion.paso = 'fin';
            return `✅ *Solicitud de Cotización Recibida*
            
He transferido tus datos (${mensaje}) a un asesor especializado.
En breve te pondrán opciones exactas para ti.
\n` + MENSAJES.FIRMA;

        // --- FLUJO TÉCNICO (4.x) ---
        case 'tecnico_equipo':
            if (['1', '2', '3'].includes(msg)) {
                sesion.paso = 'tecnico_problema';
                return `¿Qué problema presenta?
1️⃣ Pantalla
2️⃣ Batería
3️⃣ Carga
4️⃣ Lento / mantenimiento
5️⃣ Otro`;
            }
            break;

        case 'tecnico_problema':
            if (['1', '2', '3', '4', '5'].includes(msg)) {
                sesion.paso = 'tecnico_agenda';
                return MENSAJES.TECNICO_PRECIOS;
            }
            break;

        case 'tecnico_agenda':
            // Usuario envía datos de cita
            sesion.paso = 'fin';
            return `✅ Solicitud registrada
👤 Un asesor confirmará tu cita pronto para revisar tu equipo.
\n` + MENSAJES.FIRMA;

    } // End Switch

    return MENSAJES.DEFAULT;
}

// --- RUTA WHATSAPP ---
app.post('/whatsapp', (req, res) => {
    const incomingMsg = req.body.Body || '';
    const fromNumber = req.body.From || 'unknown';

    console.log(`Mensaje de ${fromNumber}: ${incomingMsg}`);

    const respuestaTexto = procesarMensaje(incomingMsg, fromNumber);

    const twiml = new MessagingResponse();
    twiml.message(respuestaTexto);

    res.type('text/xml');
    res.send(twiml.toString());
});

app.get('/', (req, res) => {
    res.send('🤖 NOVA Bot está activo 24/7 de Mundo Click 7');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor NOVA escuchando en puerto ${PORT}`);
});
