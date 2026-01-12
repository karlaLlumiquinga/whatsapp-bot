const express = require('express');
const bodyParser = require('body-parser');
const { MessagingResponse } = require('twilio').twiml;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// --- MEMORIA DE SESIÓN ---
// Almacena el estado de cada número de teléfono
const sesiones = {};

// --- TEXTOS CONSTANTES ---
const TXT = {
    SALUDO: `👋 ¡Hola! Bienvenido/a a Mundo Click 7
Soy NOVA 🤖, tu asistente virtual.

Te ayudo con:
📱 Celulares y tablets
💻 Computadoras y laptops
🧰 Servicio técnico
🎧 Accesorios
🏢 Empresas

⏰ Atención automática 24/7

👉 ¿Qué deseas hacer hoy?
Responde con el número o escribe la opción 👇

1️⃣ Comprar celulares o tablets
2️⃣ Comprar computadoras o laptops
3️⃣ Accesorios
4️⃣ Servicio técnico
5️⃣ Cotizar precios
6️⃣ Empresas
7️⃣ Horarios y ubicación
8️⃣ Preguntas frecuentes
9️⃣ Hablar con un asesor
0️⃣ Finalizar conversación`,

    MENU_PRINCIPAL: `📋 MENÚ PRINCIPAL – MUNDO CLICK 7

1️⃣ Comprar celulares o tablets
2️⃣ Comprar computadoras o laptops
3️⃣ Accesorios
4️⃣ Servicio técnico
5️⃣ Cotizar precios
6️⃣ Empresas
7️⃣ Horarios y ubicación
8️⃣ Preguntas frecuentes
9️⃣ Hablar con un asesor
0️⃣ Finalizar conversación`,

    DESPEDIDA: `🙌 Gracias por contactar a Mundo Click 7
Cuando lo necesites, aquí estaré 🤖
¡Que tengas un excelente día!

🔒 Conversación finalizada.`,

    ERROR: `❌ No entendí esa opción.
Por favor elige una opción del menú 👇`,

    ASESOR: `👤 Te conecto con un asesor de Mundo Click 7
⏳ Por favor espera un momento`,

    CONTINUAR_COTIZACION: `Perfecto ✅
Para continuar con la cotización necesito:

• Marca preferida
• Presupuesto aproximado

📌 La cotización es sin costo y con garantía incluida.`,

    CIERRE_FLUJO: `👉 ¿Deseas realizar algo más?

1️⃣ Volver al menú
9️⃣ Hablar con un asesor
0️⃣ Finalizar conversación`
};

// --- LÓGICA PRINCIPAL ---
function procesarMensaje(mensaje, telefono) {
    const msg = mensaje.toLowerCase().trim();

    // 1. GESTIÓN DE SESIÓN
    if (!sesiones[telefono]) {
        sesiones[telefono] = { paso: 'menu' }; // CORRECCIÓN: Estado inicial es 'menu'
    }
    const sesion = sesiones[telefono];

    console.log(`[${telefono}] Paso actual: ${sesion.paso} | Mensaje: ${msg}`);

    // 2. COMANDOS GLOBALES (Resetean o redirigen siempre)
    if (['hola', 'buenos días', 'buenas', 'info', 'información', 'inicio', 'start'].includes(msg)) {
        sesion.paso = 'menu';
        return TXT.SALUDO;
    }
    if (['menu', 'menú', 'volver', 'regresar'].includes(msg)) {
        sesion.paso = 'menu';
        return TXT.MENU_PRINCIPAL;
    }
    if (['0', 'es todo', 'no', 'gracias', 'nada más'].includes(msg)) {
        sesion.paso = 'menu'; // Reset al menú para la próxima
        return TXT.DESPEDIDA;
    }
    if (msg === '9' || msg.includes('asesor') || msg.includes('humano')) {
        sesion.paso = 'asesor';
        return TXT.ASESOR;
    }

    // 3. MÁQUINA DE ESTADOS
    switch (sesion.paso) {

        // --- MENÚ PRINCIPAL ---
        case 'menu':
        case 'inicio': // Redundancia de seguridad
            if (msg === '1' || msg.includes('celular') || msg.includes('tablet')) {
                sesion.paso = '1_uso';
                return `Perfecto 😊
Para ayudarte mejor, dime:

👉 ¿El equipo es para:
1️⃣ Uso personal
2️⃣ Trabajo / estudio
3️⃣ Empresa`;
            }
            if (msg === '2' || msg.includes('computadora') || msg.includes('laptop')) {
                sesion.paso = '2_uso';
                return `Perfecto 😊
Para recomendarte mejor, dime:

👉 ¿La computadora es para:
1️⃣ Estudio
2️⃣ Trabajo
3️⃣ Empresa`;
            }
            if (msg === '3' || msg.includes('accesorio')) {
                sesion.paso = '3_tipo';
                return `🎧 Accesorios disponibles:
• Cargadores · Audífonos · Micas · Carcasas · Cables
💲 Precios desde $3

👉 ¿Para qué equipo?
1️⃣ Celular
2️⃣ Computadora
3️⃣ Consultar
9️⃣ Asesor`;
            }
            if (msg === '4' || msg.includes('tecnico') || msg.includes('reparar')) {
                sesion.paso = '4_equipo';
                return `🧰 Servicio técnico

👉 ¿Qué equipo deseas reparar?
1️⃣ Celular
2️⃣ Laptop / computadora
3️⃣ Tablet`;
            }
            if (msg === '5' || msg.includes('cotizar')) {
                sesion.paso = 'fin_flujo';
                return `💰 Cotización sin costo

Para ayudarte, indícanos:
• Producto/Servicio
• Presupuesto

` + TXT.CIERRE_FLUJO;
            }
            if (msg === '6' || msg.includes('empresa')) {
                sesion.paso = '6_confirmar';
                return `🏢 Soluciones empresariales

Ofrecemos Equipos, Mantenimiento y Soporte.

👉 ¿Deseas atención?
1️⃣ Sí
9️⃣ Asesor`;
            }
            if (msg === '7' || msg.includes('horario')) {
                sesion.paso = 'fin_flujo';
                return `🕘 Horarios:
L–V: 09h00 – 18h00
S: 09h00 – 13h00

` + TXT.CIERRE_FLUJO;
            }
            if (msg === '8' || msg.includes('pregunta')) {
                sesion.paso = 'fin_flujo';
                return `❓ FAQ:
• Garantía: Sí
• Factura: Sí
• Tarjetas: Sí

` + TXT.CIERRE_FLUJO;
            }
            break;

        // --- FLUJO 1: CELULARES ---
        case '1_uso':
            if (msg === '1' || msg.includes('personal')) {
                sesion.paso = '1_gama';
                return `Gracias 👍 (Uso Personal)
Opciones:
1️⃣ Económica ($120+)
2️⃣ Intermedia ($180+)
3️⃣ Premium ($250+)

👉 ¿Cuál prefieres?`;
            }
            if (msg === '2' || msg.includes('trabajo') || msg.includes('estudio')) {
                sesion.paso = '1_gama';
                return `Excelente 👍 (Trabajo/Estudio)
Recomendados:
1️⃣ Económica ($150+)
2️⃣ Intermedia ($220+)
3️⃣ Premium ($300+)

👉 ¿Cuál deseas?`;
            }
            if (msg === '3' || msg.includes('empresa')) {
                sesion.paso = '1_gama';
                return `Perfecto 👌 (Empresas)
Opciones:
1️⃣ Intermedia ($250+)
2️⃣ Premium ($350+)

👉 ¿Cuál deseas?`;
            }
            break;

        case '1_gama':
            if (['1', '2', '3'].includes(msg)) {
                sesion.paso = 'fin_flujo';
                return TXT.CONTINUAR_COTIZACION + '\n\n' + TXT.CIERRE_FLUJO;
            }
            break;

        // --- FLUJO 2: LAPTOPS ---
        case '2_uso':
            if (msg === '1' || msg.includes('estudio')) {
                sesion.paso = '2_gama';
                return `Excelente 👍 (Estudio)
1️⃣ Económico ($350+)
2️⃣ Intermedio ($480+)
3️⃣ Premium ($650+)

👉 ¿Cuál prefieres?`;
            }
            if (msg === '2' || msg.includes('trabajo')) {
                sesion.paso = '2_gama';
                return `Muy bien 👌 (Trabajo)
1️⃣ Económico ($420+)
2️⃣ Intermedio ($550+)
3️⃣ Premium ($750+)

👉 ¿Cuál deseas?`;
            }
            if (msg === '3' || msg.includes('empresa')) {
                sesion.paso = '2_gama';
                return `Perfecto 🏢 (Empresa)
1️⃣ Intermedio ($600+)
2️⃣ Premium ($850+)

👉 ¿Cuál deseas?`;
            }
            break;

        case '2_gama':
            if (['1', '2', '3'].includes(msg)) {
                sesion.paso = 'fin_flujo';
                return `Para tu laptop, indícame:
• Marca
• Presupuesto

` + TXT.CIERRE_FLUJO;
            }
            break;

        // --- FLUJO 3: ACCESORIOS ---
        case '3_tipo':
            sesion.paso = 'fin_flujo';
            if (msg === '1') return `📱 Celular: Indica Marca/Modelo.` + TXT.CIERRE_FLUJO;
            if (msg === '2') return `💻 PC: Indica Tipo/Modelo.` + TXT.CIERRE_FLUJO;
            if (msg === '3') return `📦 Disponibilidad: Indica accesorio exacto.` + TXT.CIERRE_FLUJO;
            break;

        // --- FLUJO 4: TÉCNICO ---
        case '4_equipo':
            if (['1', '2', '3'].includes(msg)) {
                sesion.paso = '4_problema';
                return `¿Problema?
1️⃣ Pantalla
2️⃣ Batería
3️⃣ Carga
4️⃣ Lento
5️⃣ Otro`;
            }
            break;

        case '4_problema':
            sesion.paso = '4_agenda';
            return `💰 Precios Ref:
• Batería: $25+
• Pantalla: $35+
• Mantenimiento: $30+

👉 ¿Agendar visita?
1️⃣ Sí
0️⃣ No`;

        case '4_agenda':
            if (msg === '1') {
                sesion.paso = 'fin_flujo';
                return `📅 Para agendar escribe:
• Día y Hora
• Marca y Modelo

` + TXT.CIERRE_FLUJO;
            }
            break;

        // --- FLUJO 6: EMPRESAS ---
        case '6_confirmar':
            if (msg === '1') {
                sesion.paso = 'asesor';
                return TXT.ASESOR;
            }
            break;

        // --- CIERRE ---
        case 'fin_flujo':
        case 'asesor': // Si sigue escribiendo despues de pedir asesor
            if (msg === '1') {
                sesion.paso = 'menu';
                return TXT.MENU_PRINCIPAL;
            }
            // Mantiene el estado para seguir capturando msg del usuario hasta que decida volver
            return `✅ Mensaje recibido. Un asesor te responderá.

` + TXT.CIERRE_FLUJO;

    }

    // Default Fallback
    return TXT.ERROR + '\n\n' + TXT.MENU_PRINCIPAL;
}

// --- SERVIDOR ---
app.post('/whatsapp', (req, res) => {
    const incomingMsg = req.body.Body || '';
    const fromNumber = req.body.From || 'unknown';

    // Logging simple
    console.log(`MSG de ${fromNumber}: ${incomingMsg}`);

    const respuestaTexto = procesarMensaje(incomingMsg, fromNumber);
    const twiml = new MessagingResponse();
    twiml.message(respuestaTexto);
    res.type('text/xml');
    res.send(twiml.toString());
});

app.get('/', (req, res) => res.send('NOVA Bot v4.1 (Force Update) Activo'));
app.listen(process.env.PORT || 3000, () => console.log('NOVA Server v4.1 Listening...'));
