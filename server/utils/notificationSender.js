import nodemailer from 'nodemailer';
import twilio from 'twilio';
import NotificationSubscription from '../models/NotificationSubscription.js';
import dotenv from 'dotenv';

dotenv.config();
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
const twilioWhatsAppFrom = process.env.TWILIO_WHATSAPP_FROM || process.env.TWILIO_PHONE_NUMBER;
export const WHATSAPP_TEMPLATE_KEYS = Object.freeze({
    ACCOUNT_STATUS_UPDATE: 'ACCOUNT_STATUS_UPDATE',
    PRODUCT_ALERT: 'PRODUCT_ALERT',
    INVOICE_READY_NOTICE: 'INVOICE_READY_NOTICE',
    ORDER_STATUS_UPDATE: 'ORDER_STATUS_UPDATE',
});

const twilioWhatsAppContentSidByTemplate = {
    [WHATSAPP_TEMPLATE_KEYS.ACCOUNT_STATUS_UPDATE]: process.env.TWILIO_WHATSAPP_CONTENT_SID_ACCOUNT_STATUS_UPDATE,
    [WHATSAPP_TEMPLATE_KEYS.PRODUCT_ALERT]: process.env.TWILIO_WHATSAPP_CONTENT_SID_PRODUCT_ALERT,
    [WHATSAPP_TEMPLATE_KEYS.INVOICE_READY_NOTICE]: process.env.TWILIO_WHATSAPP_CONTENT_SID_INVOICE_READY_NOTICE,
    [WHATSAPP_TEMPLATE_KEYS.ORDER_STATUS_UPDATE]: process.env.TWILIO_WHATSAPP_CONTENT_SID_ORDER_STATUS_UPDATE,
};

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
        console.log("No SMTP was configured")
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
                    <h2 style="color: #2563eb;">Market Mea Notification</h2>
                    <h3 style="color: #444;">${subject}</h3>
                    <p style="font-size: 16px;">${text}</p>
                    <hr style="border: 1px solid #eee; margin: 20px 0;" />
                    <p style="font-size: 12px; color: #777;">You are receiving this email because you subscribed to product alerts on our platform.</p>
                </div>
            `,
            attachments,
        });
    } catch (error) {
        console.error(`Error sending email to ${to}:`, error);
    }
};

const normalizeWhatsAppAddress = (value) => {
    if (!value) return null;
    return value.startsWith('whatsapp:') ? value : `whatsapp:${value}`;
};

const resolveContentSid = (templateKey, overrideSid) => {
    if (overrideSid) return overrideSid;
    if (!templateKey) return null;

    return twilioWhatsAppContentSidByTemplate[templateKey] || null;
};

const resolveContentVariables = (templateKey, message, templateData, overrideVariables) => {
    if (overrideVariables && typeof overrideVariables === 'object' && !Array.isArray(overrideVariables)) {
        return JSON.stringify(overrideVariables);
    }

    const builders = {
        [WHATSAPP_TEMPLATE_KEYS.ACCOUNT_STATUS_UPDATE]: (data) => ({
            user_name: data.userName,
            status: data.status,
        }),
        [WHATSAPP_TEMPLATE_KEYS.PRODUCT_ALERT]: (data) => ({
            customer_name: data.customerName,
            product_title: data.productTitle,
            alert_message_text: data.alertMessageText,
        }),
        [WHATSAPP_TEMPLATE_KEYS.INVOICE_READY_NOTICE]: (data) => ({
            user_name: data.userName,
            order_id: data.orderId,
        }),
        [WHATSAPP_TEMPLATE_KEYS.ORDER_STATUS_UPDATE]: (data) => ({
            user_name: data.userName,
            order_id: data.orderId,
            order_status: data.orderStatus,
        }),
    };

    const builder = builders[templateKey];
    if (builder) {
        return JSON.stringify(builder(templateData || {}));
    }

    return JSON.stringify({ 1: message });
};

export const sendWhatsApp = async (to, message, options = {}) => {
    if (!twilioClient) {
        console.log(`[WHATSAPP] Twilio client is not initialized. To=${to}`);
        return;
    }

    try {
        const toUser = normalizeWhatsAppAddress(to);
        const from = normalizeWhatsAppAddress(twilioWhatsAppFrom);
        const contentSid = resolveContentSid(options.templateKey, options.contentSid);

        if (!toUser) {
            console.log('[WHATSAPP] Missing recipient phone number. Aborting send.');
            return;
        }

        if (!from) {
            console.log(`[WHATSAPP] Missing sender configuration for ${toUser}. Set TWILIO_WHATSAPP_FROM or TWILIO_PHONE_NUMBER.`);
            return;
        }

        const payload = {
            to: toUser,
        };

        if (contentSid) {
            payload.contentSid = contentSid;
            payload.contentVariables = resolveContentVariables(
                options.templateKey,
                message,
                options.templateData,
                options.contentVariables
            );
        } else if (options.templateKey) {
            console.log(`[WHATSAPP] Missing content SID for template "${options.templateKey}". Check the matching TWILIO_WHATSAPP_CONTENT_SID_* env var.`);
            return;
        } else {
            payload.body = message;
        }

        payload.from = from;

        const response = await twilioClient.messages.create(payload);
        return response;
    } catch (error) {
        console.error(`[WHATSAPP] Error sending WhatsApp to ${to}:`, error?.message || error);
        throw error;
    }
};

export const processProductNotifications = async (updatedProduct, oldPrice, oldStock) => {
    try {
        // Find all active subscriptions for this product
        const subscriptions = await NotificationSubscription.find({
            product: updatedProduct._id,
            status: 'active'
        }).populate('user', 'email phoneNumber');

        if (subscriptions.length === 0) return;

        await Promise.all(subscriptions.map(async (sub) => {
            const user = sub.user;
            if (!user) return;

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
                await sendEmail(user.email, subject, message);
                if (user.phoneNumber) {
                    await sendWhatsApp(user.phoneNumber, message, {
                        templateKey: WHATSAPP_TEMPLATE_KEYS.PRODUCT_ALERT,
                        templateData: {
                            customerName: user.fullName,
                            productTitle: updatedProduct.title,
                            alertMessageText: message,
                        },
                    });
                } else {
                    console.log(`[Notification] Skipped WhatsApp for user ${user.email} (no phone number).`);
                }
            }
        }));
    } catch (error) {
        console.error('Error in notification service:', error);
    }
};
