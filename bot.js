const express = require('express');
const bodyParser = require('body-parser');
const { MessagingResponse } = require('twilio').twiml;

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// --- MEMORIA DE SESIÓN ---
const sesiones = {};

// --- TEXTOS DEL SISTEMA NOVA ---
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

// --- LÓGICA DEL BOT ---
function procesarMensaje(mensaje, telefono) {
    const msg = mensaje.toLowerCase().trim();

    // Inicializar o recuperar sesión
    if (!sesiones[telefono]) sesiones[telefono] = { paso: 'inicio' };
    const sesion = sesiones[telefono];

    // --- COMANDOS GLOBALES ---
    // 1. Saludos / Menú
    if (['hola', 'buenos días', 'buenas', 'info', 'información', 'menu', 'menú', 'volver', 'regresar', 'inicio', 'start'].includes(msg)) {
        sesion.paso = 'menu';
        return msg.includes('hola') || msg.includes('buenos') || msg.includes('buenas') ? TXT.SALUDO : TXT.MENU_PRINCIPAL;
    }
    // 2. Finalizar
    if (['0', 'es todo', 'no', 'gracias', 'nada más'].includes(msg)) {
        sesion.paso = 'inicio'; // Reset
        return TXT.DESPEDIDA;
    }
    // 3. Asesor (Global)
    if (msg === '9' || msg.includes('asesor') || msg.includes('humano')) {
        sesion.paso = 'asesor';
        return TXT.ASESOR;
    }

    // --- MÁQUINA DE ESTADOS ---
    switch (sesion.paso) {

        // --- MENÚ PRINCIPAL ---
        case 'menu':
            // 1. Celulares
            if (msg === '1' || msg.includes('celular') || msg.includes('tablet')) {
                sesion.paso = '1_uso';
                return `Perfecto 😊
Para ayudarte mejor, dime:

👉 ¿El equipo es para:
1️⃣ Uso personal
2️⃣ Trabajo / estudio
3️⃣ Empresa`;
            }
            // 2. Laptops
            if (msg === '2' || msg.includes('computadora') || msg.includes('laptop')) {
                sesion.paso = '2_uso';
                return `Perfecto 😊
Para recomendarte mejor, dime:

👉 ¿La computadora es para:
1️⃣ Estudio
2️⃣ Trabajo
3️⃣ Empresa`;
            }
            // 3. Accesorios
            if (msg === '3' || msg.includes('accesorio')) {
                sesion.paso = '3_tipo';
                return `🎧 Accesorios disponibles en Mundo Click 7:
• Cargadores · Audífonos · Micas · Carcasas · Cables
💲 Precios desde $3

👉 ¿Para qué equipo los necesitas?
1️⃣ Celular
2️⃣ Computadora
3️⃣ Consultar disponibilidad
9️⃣ Hablar con un asesor`;
            }
            // 4. Servicio Técnico
            if (msg === '4' || msg.includes('tecnico') || msg.includes('reparar')) {
                sesion.paso = '4_equipo';
                return `🧰 Servicio técnico Mundo Click 7

👉 ¿Qué equipo deseas reparar?
1️⃣ Celular
2️⃣ Laptop / computadora
3️⃣ Tablet`;
            }
            // 5. Cotizar
            if (msg === '5' || msg.includes('cotizar')) {
                sesion.paso = 'fin_flujo'; // Espera confirmación
                return `💰 Cotización sin costo – Mundo Click 7

Para ayudarte mejor, indícanos:
• Producto o servicio que deseas
• Presupuesto aproximado

📌 Todos nuestros productos incluyen garantía.

` + TXT.CIERRE_FLUJO;
            }
            // 6. Empresas
            if (msg === '6' || msg.includes('empresa')) {
                sesion.paso = '6_confirmar';
                return `🏢 Soluciones empresariales Mundo Click 7

Ofrecemos:
✔️ Venta de equipos corporativos
✔️ Mantenimiento preventivo y correctivo
✔️ Soporte técnico
✔️ Facturación

👉 ¿Deseas atención empresarial?
1️⃣ Sí
9️⃣ Hablar con un asesor
0️⃣ Finalizar conversación`;
            }
            // 7. Horarios
            if (msg === '7' || msg.includes('horario')) {
                sesion.paso = 'fin_flujo'; // No requiere más input
                return `🕘 Horarios de atención humana:

L–V: 09h00 – 18h00
S: 09h00 – 13h00

🤖 Fuera de horario, puedo ayudarte y registrar tu solicitud.

` + TXT.CIERRE_FLUJO;
            }
            // 8. FAQ
            if (msg === '8' || msg.includes('pregunta')) {
                sesion.paso = 'fin_flujo';
                return `❓ Preguntas frecuentes – Mundo Click 7

• ¿Tienen garantía? → ✅ Sí, garantía real
• ¿Aceptan tarjetas? → ✅ Sí
• ¿Emiten factura? → ✅ Sí
• ¿Atienden empresas? → ✅ Sí

` + TXT.CIERRE_FLUJO;
            }
            break;

        // --- FLUJO 1: CELULARES ---
        case '1_uso':
            if (['1', '2', '3'].includes(msg)) {
                sesion.paso = '1_gama';
                if (msg === '1') { // Personal
                    return `Gracias 👍
Según lo que buscas, tenemos estas opciones:

1️⃣ Opción económica (Desde $120)
2️⃣ Opción intermedia (Desde $180)
3️⃣ Opción premium (Desde $250)

👉 ¿Cuál prefieres?`;
                } else if (msg === '2') { // Trabajo
                    return `Excelente 👍
Para trabajo o estudio recomendamos equipos con mejor rendimiento:

1️⃣ Opción económica (Desde $150)
2️⃣ Opción intermedia (Desde $220)
3️⃣ Opción premium (Desde $300)

👉 ¿Cuál opción deseas?`;
                } else { // Empresa
                    return `Perfecto 👌
Para empresas ofrecemos equipos con garantía y soporte:

1️⃣ Opción intermedia (Desde $250)
2️⃣ Opción premium (Desde $350)

👉 ¿Cuál opción deseas?`;
                }
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
            if (['1', '2', '3'].includes(msg)) {
                sesion.paso = '2_gama';
                if (msg === '1') { // Estudio
                    return `Excelente 👍
Para estudio recomendamos:

1️⃣ Opción económica ($350+)
2️⃣ Opción intermedia ($480+)
3️⃣ Opción premium ($650+)

👉 ¿Cuál opción prefieres?`;
                } else if (msg === '2') {
                    return `Muy bien 👌
Para trabajo recomendamos mayor rendimiento:

1️⃣ Opción económica ($420+)
2️⃣ Opción intermedia ($550+)
3️⃣ Opción premium ($750+)

👉 ¿Cuál opción deseas?`;
                } else {
                    return `Perfecto 🏢
Para empresas ofrecemos equipos corporativos:

1️⃣ Opción intermedia ($600+)
2️⃣ Opción premium ($850+)

👉 ¿Cuál opción deseas?`;
                }
            }
            break;

        case '2_gama':
            if (['1', '2', '3'].includes(msg)) {
                sesion.paso = 'fin_flujo';
                return `Perfecto ✅
Para preparar tu cotización de LAPTOP necesito:

• Marca preferida
• Presupuesto aproximado

` + TXT.CIERRE_FLUJO;
            }
            break;

        // --- FLUJO 3: ACCESORIOS ---
        case '3_tipo':
            sesion.paso = 'fin_flujo'; // Se podría extender, pero para simplificar vamos al cierre o captura
            if (msg === '1') return `Perfecto 📱
Para accesorios de celular, indícanos:
• Marca
• Modelo
• Tipo de accesorio

` + TXT.CIERRE_FLUJO;

            if (msg === '2') return `Perfecto 💻
Para accesorios de computadora, indícanos:
• Tipo de accesorio
• Marca o modelo del equipo

` + TXT.CIERRE_FLUJO;

            if (msg === '3') return `📦 Para verificar disponibilidad indícanos:
• Tipo de accesorio
• Marca y modelo del equipo

` + TXT.CIERRE_FLUJO;
            break;

        // --- FLUJO 4: TÉCNICO ---
        case '4_equipo':
            if (['1', '2', '3'].includes(msg)) {
                sesion.paso = '4_problema';
                return `Gracias 👍
¿Qué problema presenta el equipo?

1️⃣ Pantalla
2️⃣ Batería
3️⃣ Carga
4️⃣ Lento / mantenimiento
5️⃣ Otro`;
            }
            break;

        case '4_problema':
            sesion.paso = '4_agenda';
            return `💰 Precios referenciales:

• Cambio de batería: desde $25
• Pantalla: desde $35
• Mantenimiento: desde $30
📌 El precio final depende del modelo y diagnóstico.

👉 ¿Deseas agendar tu visita?
1️⃣ Sí
0️⃣ No`;

        case '4_agenda':
            if (msg === '1') { // SI quiere agendar
                sesion.paso = 'fin_flujo';
                return `📅 Perfecto, para agendar necesito:

• Día preferido
• Horario preferido
• Marca y modelo del equipo

👤 Un asesor confirmará tu cita.

` + TXT.CIERRE_FLUJO;
            }
            if (msg === '0') {
                sesion.paso = 'menu';
                return TXT.MENU_PRINCIPAL;
            }
            break;

        // --- FLUJO 6: EMPRESAS ---
        case '6_confirmar':
            if (msg === '1') {
                sesion.paso = 'fin_flujo';
                return TXT.ASESOR;
            }
            break;

        // --- CIERRE DE CUALQUIER FLUJO ---
        case 'fin_flujo':
            if (msg === '1') { // Volver al menú
                sesion.paso = 'menu';
                return TXT.MENU_PRINCIPAL;
            }
            // Si escribe cualquier otra cosa, asumimos que es el dato que pidió (marca, fecha, etc)
            // y cerramos.
            // NO cambiamos de paso para seguir aceptando inputs hasta que diga '1' o '0'
            return `✅ Entendido. Hemos tomado nota de tu solicitud.
Un asesor te responderá pronto.

` + TXT.CIERRE_FLUJO;

    } // End Switch

    // Fallback si no entra en ningún case
    return TXT.ERROR + '\n\n' + TXT.MENU_PRINCIPAL;
}

// --- CONFIGURACIÓN SERVIDOR ---
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

app.get('/', (req, res) => { res.send('🤖 NOVA Bot v3.0 (Full Logic) Activo'); });
app.listen(process.env.PORT || 3000, () => console.log('NOVA Ready.'));
