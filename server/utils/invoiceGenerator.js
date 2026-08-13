import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { sendEmail } from './notificationSender.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 * Convert a number into words.
 */
const numberToWords = (num) => {
    const a = [
        '',
        'One',
        'Two',
        'Three',
        'Four',
        'Five',
        'Six',
        'Seven',
        'Eight',
        'Nine',
        'Ten',
        'Eleven',
        'Twelve',
        'Thirteen',
        'Fourteen',
        'Fifteen',
        'Sixteen',
        'Seventeen',
        'Eighteen',
        'Nineteen'
    ];

    const b = [
        '',
        '',
        'Twenty',
        'Thirty',
        'Forty',
        'Fifty',
        'Sixty',
        'Seventy',
        'Eighty',
        'Ninety'
    ];

    const convert = (n) => {
        if (n < 20) return a[n];

        if (n < 100) {
            return (
                b[Math.floor(n / 10)] +
                (n % 10 !== 0 ? ' ' + a[n % 10] : '')
            );
        }

        if (n < 1000) {
            return (
                a[Math.floor(n / 100)] +
                ' Hundred' +
                (n % 100 !== 0 ? ' ' + convert(n % 100) : '')
            );
        }

        if (n < 1000000) {
            return (
                convert(Math.floor(n / 1000)) +
                ' Thousand' +
                (n % 1000 !== 0 ? ' ' + convert(n % 1000) : '')
            );
        }

        if (n < 1000000000) {
            return (
                convert(Math.floor(n / 1000000)) +
                ' Million' +
                (n % 1000000 !== 0 ? ' ' + convert(n % 1000000) : '')
            );
        }

        return '';
    };

    if (num === 0) return 'Zero';

    const parts = Number(num)
        .toLocaleString('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        })
        .split('.');

    let result = convert(
        parseInt(parts[0].replace(/,/g, ''), 10)
    );

    if (parts.length > 1 && parseInt(parts[1], 10) > 0) {
        result +=
            ' and ' +
            convert(parseInt(parts[1], 10)) +
            ' Cents';
    }

    return 'US DOLLAR ' + result + ' Only';
};

const quantityInWords = (quantity) => {
    const words = numberToWords(quantity)
        .replace(/^US DOLLAR /, '')
        .replace(/ Only$/, '');

    return `${words} ${quantity === 1 ? 'pc' : 'pcs'}`;
};

const toTitleCase = (str) => {
    if (!str) return '';

    return str
        .toLowerCase()
        .split(' ')
        .map(
            (word) =>
                word.charAt(0).toUpperCase() +
                word.slice(1)
        )
        .join(' ');
};

const formatCurrency = (amount) => {
    return `$${Number(amount || 0).toLocaleString('en-US', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    })}`;
};

const formatAddress = (address) => {
    if (!address) return '';

    const parts = address.trim().split(/\s+/);

    if (parts.length === 0) return '';

    parts[parts.length - 1] =
        parts[parts.length - 1].toUpperCase();

    return parts.join(' ');
};

export const generateInvoice = async (order, buyer) => {
    const doc = new PDFDocument({
        size: 'A4',
        margin: 25
    });

    const invoiceName = `invoice_${order._id}.pdf`;

    const filePath = path.join(
        __dirname,
        '..',
        'uploads',
        'invoices',
        invoiceName
    );

    const invoiceDir = path.dirname(filePath);

    if (!fs.existsSync(invoiceDir)) {
        fs.mkdirSync(invoiceDir, {
            recursive: true
        });
    }

    const stream = fs.createWriteStream(filePath);

    doc.pipe(stream);

    const RED = '#ed1c24';
    const BLACK = '#000000';
    const GREY = '#444444';
    const LIGHT_GREY = '#DDDDDD';

    const logoPath = path.join(
        __dirname,
        '..',
        'data',
        'pdf-logo.png'
    );

    // =========================================================
    // HEADER
    // =========================================================

    if (fs.existsSync(logoPath)) {
        doc.image(logoPath, 25, 12, {
            width: 90
        });
    }

    doc
        .fillColor(RED)
        .fontSize(22)
        .font('Helvetica-Bold')
        .text(
            'MarketMEA DWC LLC',
            0,
            25,
            {
                align: 'center',
                width: doc.page.width
            }
        );

    doc
        .fillColor(BLACK)
        .fontSize(11)
        .font('Helvetica')
        .text(
            'A3, Business Park Dubai South, Dubai, UAE',
            0,
            52,
            {
                align: 'center',
                width: doc.page.width
            }
        );

    doc
        .fontSize(11)
        .font('Helvetica-Bold')
        .text(
            '+971 4229 6506   info@marketmea.com',
            0,
            68,
            {
                align: 'center',
                width: doc.page.width
            }
        );

    // TRN
    doc
        .fontSize(9.5)
        .font('Helvetica')
        .text(
            'TRN: 105515343900003',
            0,
            84,
            {
                align: 'center',
                width: doc.page.width
            }
        );

    doc
        .moveTo(25, 105)
        .lineTo(570, 105)
        .lineWidth(1.5)
        .stroke(BLACK);

    // =========================================================
    // BILL TO / SHIP TO
    // =========================================================

    let y = 120;

    const drawBoxedHeader = (x, text) => {
        doc
            .fillColor(RED)
            .roundedRect(x, y, 130, 18, 9)
            .fill();

        doc
            .fillColor('#FFFFFF')
            .fontSize(10)
            .font('Helvetica-Bold')
            .text(
                text,
                x + 35,
                y + 4
            );
    };

    drawBoxedHeader(30, 'BILL TO');
    drawBoxedHeader(310, 'SHIP TO');

    y += 25;

    const buyerName =
        toTitleCase(buyer?.fullName) || '';

    const buyerCompany =
        toTitleCase(buyer?.companyName) || '';

    const buyerEmail =
        buyer?.email || '';

    const buyerAddress = formatAddress(buyer?.address || '');

    doc
        .fillColor(BLACK)
        .fontSize(14)
        .font('Helvetica-Bold')
        .text(
            buyerName,
            30,
            y,
            {
                width: 250
            }
        );

    doc.text(
        buyerName,
        310,
        y,
        {
            width: 250
        }
    );

    y += 16;

    doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(
            buyerCompany,
            30,
            y,
            {
                width: 250
            }
        );

    doc.text(
        buyerCompany,
        310,
        y,
        {
            width: 250
        }
    );

    y += 12;

    doc
        .fontSize(10)
        .font('Helvetica')
        .text(
            buyerEmail,
            30,
            y,
            {
                width: 250
            }
        );

    doc.text(
        buyerEmail,
        310,
        y,
        {
            width: 250
        }
    );

    y += 12;

    doc.text(
        buyerAddress,
        30,
        y,
        {
            width: 250
        }
    );

    doc.text(
        buyerAddress,
        310,
        y,
        {
            width: 250
        }
    );

    y += 50;

    // =========================================================
    // INVOICE INFORMATION
    // =========================================================

    doc
        .moveTo(25, y)
        .lineTo(570, y)
        .lineWidth(0.5)
        .stroke(BLACK);

    y += 6;

    const drawInfoCol = (label, value, x) => {
        doc
            .fontSize(9)
            .font('Helvetica')
            .fillColor(BLACK)
            .text(
                label,
                x,
                y
            );

        doc
            .font('Helvetica-Bold')
            .text(
                value || '',
                x,
                y + 12
            );
    };

    drawInfoCol(
        'INVOICE NO.',
        order._id.toString().toUpperCase(),
        30
    );

    drawInfoCol(
        'DATE',
        new Date(order.createdAt).toLocaleDateString(),
        180
    );

    drawInfoCol(
        'DUE DATE',
        new Date(order.createdAt).toLocaleDateString(),
        330
    );

    drawInfoCol(
        'SALES EMPLOYEE',
        'ADMIN',
        480
    );

    y += 32;

    doc
        .moveTo(25, y)
        .lineTo(570, y)
        .lineWidth(0.5)
        .stroke(BLACK);

    y += 6;

    // =========================================================
    // ITEMS TABLE
    // =========================================================

    const colX = [
        30,
        75,
        270,
        335,
        415,
        480
    ];

    const colHeaders = [
        'S NO.',
        'DESCRIPTION',
        'EXW',
        'UNIT PRICE',
        'QTY',
        'TOTAL'
    ];

    doc
        .fontSize(10)
        .font('Helvetica-Bold')
        .fillColor(BLACK);

    colHeaders.forEach((header, index) => {
        doc.text(
            header,
            colX[index],
            y
        );
    });

    y += 16;

    doc
        .moveTo(25, y)
        .lineTo(570, y)
        .lineWidth(0.5)
        .stroke(BLACK);

    y += 6;

    doc
        .font('Helvetica')
        .fontSize(9);

    order.items.forEach((item, index) => {
        if (y > 700) {
            doc.addPage();
            y = 40;
        }

        const itemY = y;

        const quantity = Number(item.quantity || 0);
        const price = Number(item.price || 0);
        const subtotal = quantity * price;

        const title =
            item.productTitle || '';

        const brand =
            item.productBrand || '';

        const location = (item.location || '').toUpperCase();

        const titleHeight =
            doc.heightOfString(
                title,
                {
                    width: 180
                }
            );

        // S NO.
        doc
            .font('Helvetica')
            .text(
                index + 1,
                colX[0],
                itemY
            );

        // DESCRIPTION
        doc
            .font('Helvetica-Bold')
            .text(
                brand,
                colX[1],
                itemY,
                {
                    width: 180
                }
            );

        doc
            .font('Helvetica')
            .text(
                title,
                colX[1],
                itemY + 12,
                {
                    width: 180
                }
            );

        // EXW
        doc.text(
            location,
            colX[2],
            itemY
        );

        // UNIT PRICE
        doc.text(
            formatCurrency(price),
            colX[3],
            itemY
        );

        // QTY
        doc.text(
            quantity,
            colX[4],
            itemY
        );

        // TOTAL
        doc.text(
            formatCurrency(subtotal),
            colX[5],
            itemY
        );

        y += Math.max(
            42,
            titleHeight + 18
        );

        doc
            .moveTo(25, y)
            .lineTo(570, y)
            .lineWidth(0.2)
            .stroke(LIGHT_GREY);

        y += 6;
    });

    if (y > 600) {
        doc.addPage();
        y = 40;
    } else if (y < 350) {
        y = 350;
    }

    doc
        .moveTo(25, y)
        .lineTo(570, y)
        .lineWidth(0.5)
        .stroke(BLACK);

    y += 6;

    // =========================================================
    // TOTALS
    // =========================================================

    const totalsX = 400;
    const totalsValX = 480;

    doc
        .font('Helvetica-Bold')
        .fontSize(11)
        .fillColor(BLACK);

    doc.text(
        'SUBTOTAL',
        totalsX,
        y
    );

    doc.text(
        formatCurrency(order.totalPrice),
        totalsValX,
        y
    );

    y += 18;

    doc.text(
        'TAX',
        totalsX,
        y
    );

    doc.text(
        '$0.00',
        totalsValX,
        y
    );

    y += 18;

    doc.text(
        'TOTAL',
        totalsX,
        y
    );

    doc.text(
        formatCurrency(order.totalPrice),
        totalsValX,
        y
    );

    y += 22;

    doc
        .moveTo(25, y)
        .lineTo(570, y)
        .lineWidth(1)
        .stroke(RED);

    y += 12;

    // =========================================================
    // PAYMENT DETAILS
    // =========================================================

    doc
        .fillColor(RED)
        .fontSize(16)
        .font('Helvetica-Bold')
        .text(
            'Payment Details',
            30,
            y
        );

    y += 20;

    const drawBankRow = (label, value) => {
        doc
            .fillColor(BLACK)
            .fontSize(10)
            .font('Helvetica-Bold')
            .text(
                label,
                30,
                y
            );

        doc
            .font('Helvetica')
            .text(
                value || '',
                160,
                y,
                {
                    width: 400
                }
            );

        y += 18;

        doc
            .moveTo(30, y)
            .lineTo(570, y)
            .lineWidth(0.1)
            .stroke(LIGHT_GREY);

        y += 4;
    };

    // Updated MarketMEA banking information
    drawBankRow('Beneficiary Name:', "MarketMEA DWC LLC");
    drawBankRow('Beneficiary Address:', "A3, Business Park Dubai South, Dubai, UAE");
    drawBankRow('Currency:', "USD ($)");
    drawBankRow('Bank Name:', process.env.BANK_NAME);
    drawBankRow('Account Number:', process.env.BANK_ACC_NUMBER);
    drawBankRow('IBAN Number:', process.env.IBAN_NUMBER);
    drawBankRow('SWIFT Code:', process.env.SWIFT_CODE);
    drawBankRow('Bank Branch:', process.env.BANK_BRANCH);

    // =========================================================
    // AMOUNT IN WORDS
    // =========================================================

    y += 10;

    const totalQuantity =
        order.items.reduce(
            (sum, item) =>
                sum + Number(item.quantity || 0),
            0
        );

    doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(BLACK)
        .text(
            'Total Quantity In Word :',
            30,
            y
        );

    doc
        .font('Helvetica')
        .text(
            quantityInWords(totalQuantity),
            145,
            y,
            {
                width: 400
            }
        );

    y += 14;

    doc
        .font('Helvetica-Bold')
        .text(
            'Total Amount in Word :',
            30,
            y
        );

    doc
        .font('Helvetica')
        .text(
            numberToWords(order.totalPrice),
            145,
            y,
            {
                width: 400
            }
        );

    // =========================================================
    // DECLARATIONS
    // =========================================================

    y += 20;

    if (y > 720) {
        doc.addPage();
        y = 40;
    }

    doc
        .fontSize(6.5)
        .font('Helvetica')
        .fillColor(GREY);

    const declarations = [
        'Declaration: Prices and details are correct; subject to typographical errors.',

        'Payment Terms: Pay only to the listed bank account. Cash payments to staff or associates are not allowed.',

        'Late Payments: 4% monthly interest on overdue amounts.',

        'Order Cancellation / Returns: All sales are final. Cancelled orders forfeit the deposit. If approved by MarketMEA, a 15% restocking fee applies.',

        'Resale Restrictions: Some Dell parts cannot be resold to certain countries (e.g., USA, Canada, UAE).',

        'Product Warranty: Manufacturer warranty applies. Claims must be made with the manufacturer. MarketMEA may offer back-to-origin support only with prior approval.',

        'Order Verification: Customers must confirm specifications with the manufacturer.',

        'Finance Charges: 4% monthly charge on overdue balances; credits may be applied against dues.',

        'ETA: Delivery times are estimates and may change due to transport or customs delays.',

        'DOA Claims: Report DOA with a video to MarketMEA HO within 48 hours of delivery.'
    ];

    declarations.forEach((declaration) => {
        doc.text(
            declaration,
            30,
            y,
            {
                width: 540
            }
        );

        y += 8;
    });

    // =========================================================
    // FOOTER
    // =========================================================

    y += 10;

    if (y > 780) {
        doc.addPage();
        y = 40;
    }

    doc
        .fontSize(8)
        .font('Helvetica-Bold')
        .fillColor(BLACK)
        .text(
            'This is a computer-generated invoice and does not require a signature or company stamp.',
            30,
            y,
            {
                align: 'center',
                width: 540
            }
        );

    y += 14;

    doc
        .fontSize(8)
        .font('Helvetica')
        .text(
            'For any clarification or assistance regarding this invoice please contact our Accounts Department at info@marketmea.com',
            30,
            y,
            {
                align: 'center',
                width: 540
            }
        );

    // =========================================================
    // FINISH PDF
    // =========================================================

    doc.end();

    return new Promise((resolve, reject) => {
        stream.on('finish', async () => {
            try {
                await sendEmail(
                    buyer.email,
                    `Invoice for Order ${order._id
                        .toString()
                        .toUpperCase()}`,
                    `Dear ${toTitleCase(
                        buyer.fullName
                    )},

Please find attached the commercial invoice for your order.

Best regards,
MarketMEA DWC LLC`,
                    [
                        {
                            filename: invoiceName,
                            path: filePath
                        }
                    ]
                );
            } catch (err) {
                console.error(
                    'Email sending failed:',
                    err
                );
            }

            resolve(
                `/api/orders/${order._id}/invoice`
            );
        });

        stream.on('error', reject);
    });
};