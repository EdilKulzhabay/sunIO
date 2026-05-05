import crypto from 'crypto';

const ROBOKASSA_PAYMENT_URL = 'https://auth.robokassa.ru/Merchant/Index.aspx';

const encodeRobokassaParam = (value) => encodeURIComponent(String(value))
    .replace(/[!'()*]/g, (char) => `%${char.charCodeAt(0).toString(16).toUpperCase()}`);

const sanitizeReceiptName = (name) => String(name || '')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 128);

export const createRobokassaReceipt = ({
    name,
    sum,
    quantity = 1,
    sno = 'usn_income',
    tax = 'none',
    paymentMethod = 'full_prepayment',
    paymentObject = 'service',
}) => ({
    sno,
    items: [
        {
            name: sanitizeReceiptName(name),
            quantity,
            sum: Number(Number(sum).toFixed(2)),
            payment_method: paymentMethod,
            payment_object: paymentObject,
            tax,
        },
    ],
});

export const createRobokassaPaymentUrl = ({
    merchantLogin,
    password1,
    outSum,
    invId,
    description,
    receipt,
    userId,
}) => {
    const receiptJson = JSON.stringify(receipt);
    const receiptEncoded = encodeRobokassaParam(receiptJson);
    const shpUserId = userId ? `Shp_userId=${userId}` : null;
    const signatureParts = [merchantLogin, outSum, invId, receiptEncoded, password1];

    if (shpUserId) {
        signatureParts.push(shpUserId);
    }

    const signature = crypto
        .createHash('md5')
        .update(signatureParts.join(':'))
        .digest('hex');

    const params = [
        `MerchantLogin=${encodeRobokassaParam(merchantLogin)}`,
        `OutSum=${encodeRobokassaParam(outSum)}`,
        `InvId=${encodeRobokassaParam(invId)}`,
        `Description=${encodeRobokassaParam(description)}`,
        `Receipt=${receiptEncoded}`,
        `SignatureValue=${encodeRobokassaParam(signature)}`,
    ];

    if (userId) {
        params.push(`Shp_userId=${encodeRobokassaParam(userId)}`);
    }

    return `${ROBOKASSA_PAYMENT_URL}?${params.join('&')}`;
};
