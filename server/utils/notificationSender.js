import nodemailer from 'nodemailer';
import twilio from 'twilio';
import NotificationSubscription from '../models/NotificationSubscription.js';
import User from '../models/User.js';
import dotenv from 'dotenv';

dotenv.config();

console.log('SMTP_HOST:', process.env.SMTP_HOST);
console.log('SMTP_PORT:', process.env.SMTP_PORT);
console.log('SMTP_USER:', process.env.SMTP_USER);
console.log('SMTP_PASS:', process.env.SMTP_PASS);
// Initialize Email Transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST, 
  port: Number(process.env.SMTP_PORT),
  secure: false, 
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});
// Initialize Twilio Client
let twilioClient;
const twilioPhoneNumber = process.env.TWILIO_PHONE_NUMBER;

if (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN) {
    try {
        twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    } catch (err) {
        console.error("Failed to initialize Twilio client:", err);
    }
}

export const sendEmail = async (to, subject, text, attachments = []) => {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
        // Fallback to log if not configured
        console.log(`[MOCK EMAIL] To: ${to} | Subject: ${subject} | Body: ${text}`);
        return;
    }

    try {
        const info = await transporter.sendMail({
            from: process.env.SMTP_USER,
            to,
            subject,
            text, 
            html: `
                <div style="font-family: Arial, sans-serif; padding: 20px; color: #333;">
                    <h2 style="color: #2563eb;">Techtronics Ventures Notification</h2>
                    <h3 style="color: #444;">${subject}</h3>
                    <p style="font-size: 16px;">${text}</p>
                    <hr style="border: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #777;">You are receiving this email because you subscribed to product alerts on our platform.</p>
                </div>
            `,
            attachments,
        });
        console.log(`Email sent to ${to}: ${info.messageId}`);
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
    }
};

export const sendWhatsApp = async (to, message) => {
    if (!twilioClient || !twilioPhoneNumber) {
        // Fallback to log if not configured
        console.log(`[MOCK WHATSAPP] To: ${to} | Message: ${message}`);
        return;
    }

    try {
        // Ensure numbers are prefixed for Twilio WhatsApp API
        const from = twilioPhoneNumber.startsWith('whatsapp:') ? twilioPhoneNumber : `whatsapp:${twilioPhoneNumber}`;
        const toUser = to.startsWith('whatsapp:') ? to : `whatsapp:${to}`;

        const response = await twilioClient.messages.create({
            body: message,
            from: from,
            to: toUser
        });

        console.log(`WhatsApp sent to ${to}: ${response.sid}`);
    } catch (error) {
        console.error(`Error sending WhatsApp to ${to}:`, error);
    }
};

export const checkAndSendNotifications = async (updatedProduct, oldPrice, oldStock) => {
    try {
        // Find all active subscriptions for this product
        const subscriptions = await NotificationSubscription.find({
            product: updatedProduct._id,
            status: 'active'
        });

        if (subscriptions.length === 0) return;

        console.log(`Checking ${subscriptions.length} subscriptions for product ${updatedProduct.title}...`);

        for (const sub of subscriptions) {
            const user = await User.findById(sub.user);
            if (!user) continue;

            let shouldNotify = false;
            let message = '';
            let subject = '';

            // Logic: Price Drop
            if (sub.type === 'price' && updatedProduct.price < oldPrice) {
                shouldNotify = true;
                subject = `Price Drop Alert: ${updatedProduct.title}`;
                message = `Good news! The price for ${updatedProduct.title} has dropped from $${oldPrice} to $${updatedProduct.price}. Check it out now!`;
            }

            // Logic: Back in Stock (Old stock was 0, new stock > 0)
            if (sub.type === 'stock' && updatedProduct.stockQty > oldStock) {
                shouldNotify = true;
                subject = `Back in Stock: ${updatedProduct.title}`;
                message = `Hurry up! ${updatedProduct.title} is back in stock with ${updatedProduct.stockQty} units available.`;
            }

            if (shouldNotify) {
                // 1. Send Email
                await sendEmail(user.email, subject, message);
                
                // 2. Send WhatsApp (if phone number is available)
                if (user.phoneNumber) {
                    await sendWhatsApp(user.phoneNumber, message);
                } else {
                    console.log(`[Notification] Skipped WhatsApp for user ${user.email} (no phone number).`);
                }
            }
        }
    } catch (error) {
        console.error('Error in notification service:', error);
    }
};
