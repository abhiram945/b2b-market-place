import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendEmail } from './notificationSender.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const generateInvoice = async (order, buyer) => {
    const doc = new PDFDocument({ size: 'A4', margin: 30 });
    const invoiceName = `invoice_${order._id}.pdf`;
    const filePath = path.join(__dirname, '..', 'uploads', 'invoices', invoiceName);

    const stream = fs.createWriteStream(filePath);
    doc.pipe(stream);

    // --- Header ---
    // Logo placeholder (Circular with text as per image)
    doc.circle(60, 60, 40).lineWidth(2).stroke('#000');
    doc.fillColor('#ed1c24').fontSize(12).text('TECHTRONICS', 30, 50, { width: 60, align: 'center' });
    doc.fillColor('#000').fontSize(8).text('Global Technology Partner', 25, 75, { width: 70, align: 'center' });
    
    // Company Name & Address
    doc.fillColor('#ed1c24').fontSize(24).font('Helvetica-Bold').text('Techtronics Technologies FZCO', 110, 35);
    doc.fillColor('#000').fontSize(10).font('Helvetica').text('101, A2, DZO IFZA 7069, DSO, Dubai, UAE', 110, 65, { align: 'center', width: 400 });
    doc.font('Helvetica-Bold').text('P: +971 52 860 9234   E: uae@techtronicsmea.com', 110, 80, { align: 'center', width: 400 });
    doc.font('Helvetica').text('TRN: 104055163000003  IMPEX : 25075  DCM2: AE-1170666', 110, 95, { align: 'center', width: 400 });

    doc.fontSize(14).font('Helvetica-Bold').text('COMMERCIAL INVOICE', 450, 15, { align: 'right' });

    doc.moveTo(30, 115).lineTo(565, 115).stroke();

    // --- Info Grid ---
    let y = 125;
    const col1 = 35;
    const col1Val = 130;
    const col2 = 300;
    const col2Val = 420;

    const drawRow = (label1, val1, label2, val2) => {
        doc.fontSize(8).font('Helvetica-Bold').text(label1, col1, y);
        doc.font('Helvetica').text(`: ${val1 || ''}`, col1Val, y);
        doc.font('Helvetica-Bold').text(label2, col2, y);
        doc.font('Helvetica').text(`: ${val2 || ''}`, col2Val, y);
        y += 12;
    };

    drawRow('Buyer ID', buyer._id.toString().slice(-8).toUpperCase(), 'Invoice Number', order._id.toString().slice(-8).toUpperCase());
    drawRow('Buyer Order No.', '-', 'Invoice Date', new Date(order.orderDate).toLocaleDateString());
    drawRow('Buyer Order Date', new Date(order.orderDate).toLocaleDateString(), 'Due Date', new Date(order.orderDate).toLocaleDateString());
    drawRow('Delivery Note No', '-', 'Shipping/Inco Term', 'EXW');
    drawRow('POL', 'DUBAI', 'POD Customs Office', '-');
    drawRow('POD', '-', 'Shopping By', '-');
    drawRow('DOC Currency', 'USD ($)', 'Payment Term', '100% Advance');
    drawRow('HAWB/BL/HBL No.', '-', 'AWB/BL/HBL DT.', '-');

    doc.moveTo(30, y + 5).lineTo(565, y + 5).stroke();
    y += 15;

    // --- Address Sections ---
    const addrColWidth = 170;
    doc.fontSize(7).font('Helvetica-Bold');
    doc.text('BILL TO, CONSIGNEE, NOTIFY (Customer\'s Name & Address)', 35, y, { width: addrColWidth, underline: true });
    doc.text('SHIP TO (Consignee\'s Details)', 215, y, { width: addrColWidth, underline: true });
    doc.text('NOTIFY TO (Notify Party)', 395, y, { width: addrColWidth, underline: true });
    
    y += 15;
    const addrStartHero = y;
    
    const drawAddr = (x, name, company, address, tel, email) => {
        let cy = addrStartHero;
        doc.fontSize(8).font('Helvetica-Bold').text('NAME', x, cy);
        doc.font('Helvetica').text(`: ${name}`, x + 45, cy);
        cy += 12;
        doc.font('Helvetica-Bold').text('ADDRESS', x, cy);
        doc.font('Helvetica').text(`: ${company}`, x + 45, cy);
        cy += 10;
        doc.text(`  ${address || ''}`, x + 45, cy, { width: addrColWidth - 50 });
        cy += 25;
        doc.font('Helvetica-Bold').text('Kind. Attn.', x, cy);
        doc.font('Helvetica').text(`: ${name}`, x + 45, cy);
        cy += 12;
        doc.font('Helvetica-Bold').text('TEL', x, cy);
        doc.font('Helvetica').text(`: ${tel || '-'}`, x + 45, cy);
        cy += 12;
        doc.font('Helvetica-Bold').text('Email', x, cy);
        doc.font('Helvetica').text(`: ${email}`, x + 45, cy);
        cy += 12;
        doc.font('Helvetica-Bold').text('VAT No.', x, cy);
        doc.font('Helvetica').text(': -', x + 45, cy);
        cy += 12;
        doc.font('Helvetica-Bold').text('EXIM Code', x, cy);
        doc.font('Helvetica').text(': -', x + 45, cy);
    };

    drawAddr(35, buyer.fullName, buyer.companyName, buyer.address, buyer.phoneNumber, buyer.email);
    drawAddr(215, buyer.fullName, buyer.companyName, buyer.address, buyer.phoneNumber, buyer.email);
    drawAddr(395, '-', '-', '-', '-', '-');

    y += 100;
    doc.moveTo(30, y).lineTo(565, y).stroke();
    y += 5;

    // --- Table Header ---
    doc.fontSize(8).font('Helvetica-Bold');
    doc.text('Sl No.', 35, y);
    doc.text('Description of Goods', 70, y);
    doc.text('C.O.O.', 300, y);
    doc.text('H.S.C.', 350, y);
    doc.text('Quantity', 410, y);
    doc.text('Unit Price', 470, y);
    doc.text('Sub Total', 530, y);

    y += 15;
    doc.moveTo(30, y).lineTo(565, y).stroke();
    y += 5;

    // --- Table Rows ---
    doc.font('Helvetica');
    order.items.forEach((item, index) => {
        const subtotal = item.quantity * item.price;
        doc.text(index + 1, 35, y);
        doc.text(item.productTitle, 70, y, { width: 220 });
        doc.text('UAE', 300, y);
        doc.text('84713010', 350, y);
        doc.text(item.quantity, 410, y);
        doc.text(item.price.toFixed(2), 470, y);
        doc.text(subtotal.toFixed(2), 530, y);
        y += 20;
    });

    // Fill table space if needed
    if (y < 500) y = 500;

    doc.moveTo(30, y).lineTo(565, y).stroke();
    y += 5;

    // --- Totals ---
    doc.font('Helvetica-Bold').text('GRANT TOTAL', 35, y);
    doc.text(`${order.totalPrice.toFixed(2)}`, 530, y);
    doc.text(`${order.items.reduce((sum, item) => sum + item.quantity, 0)} Nos.`, 410, y);
    y += 15;
    doc.moveTo(30, y).lineTo(565, y).stroke();
    y += 5;

    doc.fontSize(8).font('Helvetica-Bold').text('Total Quantity In Word :', 35, y);
    doc.font('Helvetica').text('Forty Units Only', 130, y); // Placeholder for words
    doc.font('Helvetica-Bold').text('Total Ammount in Word :', 300, y);
    doc.font('Helvetica').text('Fifteen Thousand Dollars Only', 420, y); // Placeholder for words
    
    y += 20;
    
    // --- Bank Details ---
    doc.fontSize(9).font('Helvetica-Bold').text('Beneficiary Bank Details', 35, y, { underline: true });
    y += 15;
    
    const drawBankRow = (label, val, label2, val2) => {
        doc.fontSize(8).font('Helvetica-Bold').text(label, 35, y);
        doc.font('Helvetica').text(`: ${val}`, 110, y);
        if (label2) {
            doc.font('Helvetica-Bold').text(label2, 300, y);
            doc.font('Helvetica').text(`: ${val2}`, 400, y);
        }
        y += 12;
    };

    drawBankRow('A/C Name', 'Techtronics Technologies FZCO');
    drawBankRow('Address', '101, Building A2, Dubai Digital Park, DSO, Dubai, UAE');
    drawBankRow('A/C Currency', 'USD ($)', 'IBAN No', 'AE24 0400 0003 3293 0994 001');
    drawBankRow('Bank Name', 'NATIONAL BANK OF RAS AL KHAIMAH (PJSC)', 'Swift Code', 'NRAKAEAKXXX');
    drawBankRow('A/C No.', '0332930994001', 'Bank Branch', 'UMM HURRAIR DUBAI');

    // --- Footer Notes ---
    y += 10;
    doc.fontSize(6).font('Helvetica').fillColor('#333');
    const notes = [
        "Declaration: This invoice reflects the accurate price of goods described, and all details are true except for typographical errors.",
        "Payment Terms: Payments must be made to the specified bank account. Cash transactions with employees or associates, including payments against invoices, are strictly prohibited.",
        "Late Payments: Delayed payments will incur a 4% monthly interest.",
        "Order Cancellation/Returns: All sales are final. If a customer cancels an order after placement or post-shipment, the deposit will be forfeited.",
        "Product Warranty: Manufacturer's warranties apply; claims must be directed to the manufacturer.",
        "ETA: Estimated delivery times are subject to transport and customs delays."
    ];
    notes.forEach(note => {
        doc.text(note, 35, y);
        y += 8;
    });

    y += 10;
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#000').text('This is a computer-generated invoice and does not require a signature or company stamp.', 35, y, { align: 'center', width: 500 });
    y += 12;
    doc.text('For any clarification or assistance regarding this invoice please contact our Accounts Department at accounts@techtronicsmea.com', 35, y, { align: 'center', width: 500 });

    doc.end();

    return new Promise((resolve, reject) => {
        stream.on('finish', async () => {
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
