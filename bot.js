const express = require('express');
const bodyParser = require('body-parser');
const { MessagingResponse } = require('twilio').twiml;
const { GoogleSpreadsheet } = require('google-spreadsheet');
const { JWT } = require('google-auth-library');

// Intenta cargar credenciales locales si existen (Solo desarrollo local)
let localCreds = null;
try { localCreds = require('./credentials.json'); } catch (e) { }

const app = express();
app.use(bodyParser.urlencoded({ extended: false }));

// --- CONFIGURACIÓN GOOGLE SHEETS (SECURE) ---
const SHEET_ID = '1Q0C4gSt0qIeBOsHruqKMph_wZI43yHGvO6XlkbJWqZ0';

// Prioridad: Variable de Entorno > Archivo Local
const PRIVATE_KEY = process.env.GOOGLE_PRIVATE_KEY ? process.env.GOOGLE_PRIVATE_KEY.replace(/\\n/g, '\n') : (localCreds ? localCreds.private_key : null);
const CLIENT_EMAIL = process.env.GOOGLE_CLIENT_EMAIL || (localCreds ? localCreds.client_email : null);

// Validar si tenemos credenciales
let doc = null;
if (PRIVATE_KEY && CLIENT_EMAIL) {
    const serviceAccountAuth = new JWT({
        email: CLIENT_EMAIL,
        key: PRIVATE_KEY,
        scopes: ['https://www.googleapis.com/auth/spreadsheets'],
    });
    doc = new GoogleSpreadsheet(SHEET_ID, serviceAccountAuth);
    console.log('✅ Google Sheets Configurado');
} else {
    console.log('⚠️ ADVERTENCIA: No se encontraron credenciales de Google Sheets. El bot funcionará pero no guardará datos.');
}

async function guardarLead(telefono, accion, detalle) {
    if (!doc) return; // Si no hay credenciales, ignorar
    try {
        await doc.loadInfo();
        const sheet = doc.sheetsByIndex[0];
        await sheet.addRow({
            fecha: new Date().toLocaleString(),
            telefono: telefono,
            accion: accion,
            detalle: detalle
        });
        console.log(`✅ Excel Update: ${telefono}`);
    } catch (error) {
        console.error('❌ Error Excel:', error);
    }
}

// --- MEMORIA ---
const sesiones = {};

// --- TEXTOS ---
const TXT = {
    SALUDO: `👋 ¡Hola! Bienvenido/a a Mundo Click 7\nSoy NOVA 🤖, tu asistente virtual.\n\nTe ayudo con:\n📱 Celulares y tablets\n💻 Computadoras y laptops\n🧰 Servicio técnico\n🎧 Accesorios\n🏢 Empresas\n\n⏰ Atención automática 24/7\n\n👉 ¿Qué deseas hacer hoy?\nResponde con el número 👇\n\n1️⃣ Comprar celulares o tablets\n2️⃣ Comprar computadoras o laptops\n3️⃣ Accesorios\n4️⃣ Servicio técnico\n5️⃣ Cotizar precios\n6️⃣ Empresas\n7️⃣ Horarios y ubicación\n8️⃣ Preguntas frecuentes\n9️⃣ Hablar con un asesor\n0️⃣ Finalizar`,
    MENU: `📋 MENÚ PRINCIPAL\n\n1️⃣ Celulares/Tablets\n2️⃣ Computadoras/Laptops\n3️⃣ Accesorios\n4️⃣ Servicio técnico\n5️⃣ Cotizar precios\n6️⃣ Empresas\n7️⃣ Horarios/Ubicación\n8️⃣ FAQs\n9️⃣ Hablar con asesor\n0️⃣ Fin`,
    ASESOR: `👤 Te conecto con un asesor...\n(Notificando al equipo 🔔)`,
    CIERRE: `👉 ¿Algo más?\n1️⃣ Menú\n9️⃣ Asesor\n0️⃣ Fin`,
    ERROR: `❌ Opción no válida. Escribe "Menu".`
};

function procesarMensaje(mensaje, telefono) {
    const msg = mensaje.toLowerCase().trim();
    if (!sesiones[telefono]) sesiones[telefono] = { paso: 'menu' };
    const sesion = sesiones[telefono];

    // --- COMANDOS GLOBALES ---
    if (['hola', 'inicio', 'start', 'menu'].some(x => msg.includes(x))) {
        sesion.paso = 'menu';
        return TXT.SALUDO;
    }
    if (['asesor', 'humano', '9'].includes(msg)) {
        guardarLead(telefono, 'Solicita Asesor', 'Desde Menú Global');
        sesion.paso = 'asesor';
        return TXT.ASESOR;
    }
    if (['0', 'gracias', 'chau'].includes(msg)) {
        return `👋 Gracias por escribir a Mundo Click 7.`;
    }

    // --- MÁQUINA DE ESTADOS ---
    switch (sesion.paso) {
        case 'menu':
            if (msg.includes('1') || msg.includes('celular')) {
                sesion.paso = '1_uso';
                return `📱 Celulares/Tablets. ¿Uso?\n1️⃣ Personal\n2️⃣ Trabajo\n3️⃣ Empresa`;
            }
            if (msg.includes('2') || msg.includes('computadora')) {
                sesion.paso = '2_uso';
                return `💻 Computadoras. ¿Uso?\n1️⃣ Estudio\n2️⃣ Trabajo\n3️⃣ Empresa`;
            }
            if (msg.includes('4') || msg.includes('tecnico')) {
                sesion.paso = '4_equipo';
                return `🧰 Servicio Técnico. ¿Equipo?\n1️⃣ Celular\n2️⃣ PC\n3️⃣ Tablet`;
            }
            if (msg.includes('5') || msg.includes('cotizar')) {
                sesion.paso = 'fin_flujo';
                guardarLead(telefono, 'Cotización', 'Inicia Proceso');
                return `💰 Cotización Sin Costo.\nIndica: Producto y Presupuesto.\n\n` + TXT.CIERRE;
            }
            break;

        case '1_uso':
        case '2_uso':
            if (['1', '2', '3'].includes(msg)) {
                sesion.paso = 'fin_flujo';
                const tipo = sesion.paso === '1_uso' ? 'Celular' : 'Laptop';
                const uso = msg === '1' ? 'Personal' : (msg === '2' ? 'Trabajo' : 'Empresa');
                guardarLead(telefono, `Interes ${tipo}`, `Uso: ${uso}`);
                return `✅ Perfecto (${tipo} para ${uso}).\nEscribe tu Presupuesto.\n\n` + TXT.CIERRE;
            }
            break;

        case '4_equipo':
            if (['1', '2', '3'].includes(msg)) {
                sesion.paso = '4_agenda';
                return `💰 Precios Ref:\n• Batería $25+\n• Pantalla $35+\n\n¿Agendar Cita?\n1️⃣ Sí\n0️⃣ No`;
            }
            break;

        case '4_agenda':
            if (msg === '1') {
                sesion.paso = 'fin_flujo';
                guardarLead(telefono, 'Servicio Técnico', 'Agendar Cita');
                return `📅 Para agendar escribe: Día, Hora y Modelo.\n\n` + TXT.CIERRE;
            }
            break;

        case 'fin_flujo':
        case 'asesor':
            if (msg === '1') { sesion.paso = 'menu'; return TXT.MENU; }
            guardarLead(telefono, 'Mensaje Usuario', msg);
            return `✅ Recibido.\n\n` + TXT.CIERRE;
    }

    return TXT.ERROR;
}

// --- SERVIDOR ---
app.post('/whatsapp', (req, res) => {
    const incomingMsg = req.body.Body || '';
    const fromNumber = req.body.From || 'unknown';
    console.log(`MSG (${fromNumber}): ${incomingMsg}`);
    const respuesta = procesarMensaje(incomingMsg, fromNumber);
    const twiml = new MessagingResponse();
    twiml.message(respuesta);
    res.type('text/xml');
    res.send(twiml.toString());
});

app.get('/', (req, res) => res.send('NOVA Bot v7.0 (Secure Env) 🛡️'));
app.listen(process.env.PORT || 3000, () => console.log('NOVA v7 Listening...'));
