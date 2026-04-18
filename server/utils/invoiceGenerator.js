import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendEmail } from './notificationSender.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const numberToWords = (num) => {
    const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
    const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];

    const convert = (n) => {
        if (n < 20) return a[n];
        if (n < 100) return b[Math.floor(n / 10)] + (n % 10 !== 0 ? ' ' + a[n % 10] : '');
        if (n < 1000) return a[Math.floor(n / 100)] + ' Hundred' + (n % 100 !== 0 ? ' ' + convert(n % 100) : '');
        if (n < 1000000) return convert(Math.floor(n / 1000)) + ' Thousand' + (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '');
        if (n < 1000000000) return convert(Math.floor(n / 1000000)) + ' Million' + (n % 1000000 !== 0 ? ' ' + convert(n % 1000000) : '');
        return '';
    };

    if (num === 0) return 'Zero';
    const parts = num.toLocaleString('en-US', { minimumFractionDigits: 2 }).split('.');
    let res = convert(parseInt(parts[0].replace(/,/g, '')));
    if (parts.length > 1 && parseInt(parts[1]) > 0) {
        res += ' and ' + convert(parseInt(parts[1])) + ' Cents';
    }
    return res + ' Only';
};

const toTitleCase = (str) => {
    if (!str) return '';
    return str.toLowerCase().split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
};

export const generateInvoice = async (order, buyer) => {
    const doc = new PDFDocument({ size: 'A4', margin: 25 });
    const invoiceName = `invoice_${order._id}.pdf`;
    const filePath = path.join(__dirname, '..', 'uploads', 'invoices', invoiceName);

    const stream = fs.createWriteStream(filePath);
    if (!fs.existsSync(path.dirname(filePath))) {
        fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }
    doc.pipe(stream);

    const RED = '#ed1c24';
    const logoPath = path.join(__dirname, '..', 'data', 'pdf-logo.png');

    // --- Header ---
    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 25, 12, { width: 90 });
    }

    doc.fillColor(RED).fontSize(22).font('Helvetica-Bold').text('Techtronics Technologies FZCO', 0, 25, { align: 'center', width: doc.page.width });
    doc.fillColor('#000').fontSize(11).font('Helvetica').text('101, A2, DZO IFZA 7069, DSO, Dubai, UAE', 0, 52, { align: 'center', width: doc.page.width });
    doc.fontSize(11).font('Helvetica-Bold').text('+971 4 229 6506   uae@techtronicsmea.com', 0, 68, { align: 'center', width: doc.page.width });
    
    // TRN Line
    const trnText = "TRN: 104055163000003 IMPEX: 25075 DCM2: AE-1170666";
    doc.fontSize(9.5);
    const totalTrnWidth = doc.widthOfString(trnText) + 10;
    let currentTrnX = (doc.page.width - totalTrnWidth) / 2;
    const trnY = 84;

    doc.font('Helvetica').text('TRN: ', currentTrnX, trnY);
    currentTrnX += doc.widthOfString('TRN: ');
    doc.font('Helvetica-Bold').text('104055163000003 ', currentTrnX, trnY);
    currentTrnX += doc.widthOfString('104055163000003 ');
    doc.font('Helvetica').text(' IMPEX: ', currentTrnX, trnY);
    currentTrnX += doc.widthOfString(' IMPEX: ');
    doc.fillColor(RED).font('Helvetica-Bold').text('25075 ', currentTrnX, trnY);
    currentTrnX += doc.widthOfString('25075 ');
    doc.fillColor('#000').font('Helvetica').text(' DCM2:', currentTrnX, trnY);
    currentTrnX += doc.widthOfString(' DCM2:');
    doc.fillColor(RED).font('Helvetica-Bold').text('AE-1170666', currentTrnX, trnY);

    doc.moveTo(25, 105).lineTo(570, 105).lineWidth(1.5).stroke('#000');

    // --- Bill To / Ship To ---
    let y = 120;
    
    const drawBoxedHeader = (x, text) => {
        doc.fillColor(RED).roundedRect(x, y, 130, 18, 9).fill();
        doc.fillColor('#FFF').fontSize(10).font('Helvetica-Bold').text(text, x + 35, y + 4);
    };

    drawBoxedHeader(30, 'BILL TO');
    drawBoxedHeader(310, 'SHIP TO');

    y += 25;
    const buyerName = toTitleCase(buyer.fullName);
    const buyerCompany = toTitleCase(buyer.companyName);
    doc.fillColor('#000').fontSize(14).font('Helvetica-Bold').text(buyerName, 30, y);
    doc.text(buyerName, 310, y);
    y += 16;
    doc.fontSize(10).font('Helvetica-Bold').text(buyerCompany, 30, y);
    doc.text(buyerCompany, 310, y);
    y += 12;
    doc.fontSize(10).font('Helvetica').text(buyer.email, 30, y);
    doc.text(buyer.email, 310, y);
    y += 12;
    doc.text(buyer.address, 30, y, { width: 250 });
    doc.text(buyer.address, 310, y, { width: 250 });

    y += 50;
    
    // --- Invoice Info Grid ---
    doc.moveTo(25, y).lineTo(570, y).lineWidth(0.5).stroke('#000');
    y += 6;
    
    const drawInfoCol = (label, val, x) => {
        doc.fontSize(9).font('Helvetica').text(label, x, y);
        doc.font('Helvetica-Bold').text(val, x, y + 12);
    };

    drawInfoCol('INVOICE NO.', order._id.toString().toUpperCase(), 30);
    drawInfoCol('DATE', new Date(order.orderDate).toLocaleDateString(), 180);
    drawInfoCol('DUE DATE', new Date(order.orderDate).toLocaleDateString(), 330);
    drawInfoCol('SALES EMPLOYEE', 'ADMIN', 480);
    
    y += 32;
    doc.moveTo(25, y).lineTo(570, y).lineWidth(0.5).stroke('#000');
    y += 6;

    // --- Items Table ---
    const colX = [30, 75, 270, 335, 415, 480];
    const colHeaders = ['S NO.', 'DESCRIPTION', 'EXW', 'UNIT PRICE', 'QTY', 'TOTAL'];

    doc.fontSize(10).font('Helvetica-Bold');
    colHeaders.forEach((h, i) => doc.text(h, colX[i], y));
    
    y += 16;
    doc.moveTo(25, y).lineTo(570, y).lineWidth(0.5).stroke('#000');
    y += 6;

    doc.font('Helvetica').fontSize(9);
    order.items.forEach((item, index) => {
        if (y > 700) { doc.addPage(); y = 40; }
        const itemY = y;
        const subtotal = item.quantity * item.price;
        const titleHeight = doc.heightOfString(item.productTitle, { width: 180 });
        
        doc.text(index + 1, colX[0], itemY);
        doc.font('Helvetica-Bold').text(item.productBrand, colX[1], itemY);
        doc.font('Helvetica').text(item.productTitle, colX[1], itemY + 12, { width: 180 });
        
        doc.text(item.location || 'DUBAI', colX[2], itemY);
        doc.text(`$${item.price.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, colX[3], itemY);
        doc.text(item.quantity, colX[4], itemY);
        doc.text(`$${subtotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, colX[5], itemY);
        
        y += Math.max(42, titleHeight + 18);
        doc.moveTo(25, y).lineTo(570, y).lineWidth(0.2).stroke('#EEE');
        y += 6;
    });

    if (y > 600) { doc.addPage(); y = 40; } else if (y < 350) { y = 350; }
    
    doc.moveTo(25, y).lineTo(570, y).lineWidth(0.5).stroke('#000');
    y += 6;

    // --- Totals ---
    const totalsX = 400;
    const totalsValX = 480;
    doc.font('Helvetica-Bold').fontSize(11);
    doc.text('SUBTOTAL', totalsX, y);
    doc.text(`$${order.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, totalsValX, y);
    y += 18;
    doc.text('TAX', totalsX, y);
    doc.text('0', totalsValX, y);
    y += 18;
    doc.text('TOTAL', totalsX, y);
    doc.text(`$${order.totalPrice.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, totalsValX, y);
    
    y += 22;
    doc.moveTo(25, y).lineTo(570, y).lineWidth(1).stroke('#ed1c24');
    y += 12;

    // --- Payment Details ---
    doc.fillColor('#ed1c24').fontSize(16).font('Helvetica-Bold').text('Payment Details', 30, y);
    y += 20;

    const drawBankRow = (label, val) => {
        doc.fillColor('#000').fontSize(10).font('Helvetica-Bold').text(label, 30, y);
        doc.font('Helvetica').text(val, 160, y);
        y += 18;
        doc.moveTo(30, y).lineTo(570, y).lineWidth(0.1).stroke('#DDD');
        y += 4;
    };

    drawBankRow('Beneficiary Name:', 'Techtronics Technologies FZCO');
    drawBankRow('Beneficiary Address:', '101,Building A2, Dubai Digital Park, Dubai Silicon Oasis, Dubai, UAE');
    drawBankRow('Currency:', 'USD ($)');
    drawBankRow('Bank Name:', process.env.BANK_NAME);
    drawBankRow('Account Number:', process.env.BANK_ACC_NUMBER);
    drawBankRow('IBAN Number:', process.env.IBAN_NUMBER);
    drawBankRow('SWIFT Code:', process.env.SWIFT_CODE);
    drawBankRow('Bank Branch:', process.env.BANK_BRANCH);

    y += 10;
    doc.fontSize(8).font('Helvetica-Bold').text('Total Quantity In Word :', 30, y);
    doc.font('Helvetica').text(numberToWords(order.items.reduce((sum, i) => sum + i.quantity, 0)).replace(' Only', ''), 145, y);
    y += 14;
    doc.font('Helvetica-Bold').text('Total Amount in Word :', 30, y);
    doc.font('Helvetica').text(numberToWords(order.totalPrice), 145, y);

    // --- Declarations ---
    y += 20;
    if (y > 720) { doc.addPage(); y = 40; }
    doc.fontSize(6.5).font('Helvetica').fillColor('#444');
    const declarations = [
        "Declaration: Prices and details are correct; subject to typographical errors.",
        "Payment Terms: Pay only to the listed bank account. Cash payments to staff or associates are not allowed.",
        "Late Payments: 4% monthly interest on overdue amounts.",
        "Order Cancellation / Returns: All sales are final. Cancelled orders forfeit the deposit. If approved by Techtronics, a 15% restocking fee applies.",
        "Resale Restrictions: Some Dell parts cannot be resold to certain countries (e.g., USA, Canada, UAE).",
        "Product Warranty: Manufacturer warranty applies. Claims must be made with the manufacturer. Techtronics may offer back-to-origin support only with prior approval.",
        "Order Verification: Customers must confirm specifications with the manufacturer.",
        "Finance Charges: 4% monthly charge on overdue balances; credits may be applied against dues.",
        "ETA: Delivery times are estimates and may change due to transport or customs delays.",
        "DOA Claims: Report DOA with a video to Techtronics HO within 48 hours of delivery."
    ];
    declarations.forEach(d => {
        doc.text(d, 30, y);
        y += 8;
    });

    // --- Final Footer Lines ---
    y += 10;
    // if (y > 780) { doc.addPage(); y = 40; }
    doc.fontSize(8).font('Helvetica-Bold').fillColor('#000').text('This is a computer-generated invoice and does not require a signature or company stamp.', 30, y, { align: 'center', width: 540 });
    y += 14;
    doc.text('For any clarification or assistance regarding this invoice please contact our Accounts Department at uae@techtronicsmea.com', 30, y, { align: 'center', width: 540 });

    doc.end();

    return new Promise((resolve, reject) => {
        stream.on('finish', async () => {
            try {
                await sendEmail(
                    buyer.email,
                    `Invoice for Order ${order._id.toString().toUpperCase()}`,
                    `Dear ${toTitleCase(buyer.fullName)},\n\nPlease find attached the commercial invoice for your order.\n\nBest regards,\nTechtronics Technologies`,
                    [{ filename: invoiceName, path: filePath }]
                );
            } catch (err) {
                console.error('Email sending failed:', err);
            }
            resolve(`/api/orders/${order._id}/invoice`);
        });
        stream.on('error', reject);
    });
};
