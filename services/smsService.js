
// services/smsService.js
require('dotenv').config();
const twilio = require('twilio');
const client = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
);

async function sendVerificationCode(to, code) {
    const message = `Tu código de verificación es: ${code}`;
    return client.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER, // número Twilio o WhatsApp sandbox
        to: to.startsWith('whatsapp:') ? to : to
    });
}

module.exports = { sendVerificationCode };