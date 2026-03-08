import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendEmail } from './notificationSender.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateInvoice = async (order, buyer) => {
    const doc = new PDFDocument();
    const invoiceName = `invoice_${order._id}.pdf`;
    const filePath = path.join(__dirname, '..', 'uploads', 'invoices', invoiceName);

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // Add content to the PDF
    doc.fontSize(25).text('Invoice', { align: 'center' });
    doc.moveDown();
    doc.fontSize(12).text(`Order ID: ${order._id}`);
    doc.text(`Date: ${new Date(order.orderDate).toLocaleDateString()}`);
    doc.moveDown();
    doc.text(`Buyer: ${buyer.fullName}`);
    doc.text(`Email: ${buyer.email}`);
    doc.text(`Company: ${buyer.companyName}`);
    doc.moveDown();

    // Table Header
    doc.fontSize(14).text('Items:', { underline: true });
    doc.moveDown(0.5);
    
    order.items.forEach((item, index) => {
        doc.fontSize(12).text(`${index + 1}. ${item.productTitle}`);
        doc.fontSize(10).text(`   Quantity: ${item.quantity} | Price: $${item.price.toFixed(2)} | Subtotal: $${(item.quantity * item.price).toFixed(2)}`);
        doc.moveDown(0.5);
    });

    doc.moveDown();
    doc.fontSize(16).text(`Total Price: $${order.totalPrice.toFixed(2)}`, { align: 'right' });
    doc.moveDown();
    doc.fontSize(20).text('Thank you for your business!', { align: 'center' });

    doc.end();

    return new Promise((resolve, reject) => {
        stream.on('finish', async () => {
            // Send email to buyer
            await sendEmail(
                buyer.email,
                `Invoice for your order ${order._id}`,
                `Please find attached the invoice for your order containing ${order.items.length} items.`,
                [{ filename: invoiceName, path: filePath }]
            );
            resolve(`/api/orders/${order._id}/invoice`);
        });
        stream.on('error', reject);
    });
};
