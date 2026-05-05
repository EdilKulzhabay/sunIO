import crypto from 'crypto';

const ROBOKASSA_PAYMENT_URL = 'https://auth.robokassa.ru/Merchant/Index.aspx';

const encodeRobokassaParam = (value) => encodeURIComponent(String(value));

const sanitizeReceiptName = (name) => String(name || '')
    .replace(/[\r\n\t]/g, ' ')
    .replace(/[^\p{L}\p{N}\s.,№-]/gu, ' ')
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
    isTest = false,
}) => {
    const login = String(merchantLogin || '').trim();
    const password = String(password1 || '').trim();
    const sum = String(outSum || '').trim();
    const invoiceId = String(invId || '').trim();
    const receiptJson = JSON.stringify(receipt);
    const receiptEncoded = encodeRobokassaParam(receiptJson);
    const shpParams = userId
        ? [{ name: 'Shp_userId', value: String(userId) }]
        : [];
    const sortedShpParams = [...shpParams].sort((a, b) => a.name.localeCompare(b.name));
    const signatureParts = [login, sum, invoiceId, receiptEncoded, password];

    sortedShpParams.forEach((param) => {
        signatureParts.push(`${param.name}=${param.value}`);
    });

    const signature = crypto
        .createHash('md5')
        .update(signatureParts.join(':'))
        .digest('hex')
        .toUpperCase();

    const params = [
        `MerchantLogin=${encodeRobokassaParam(login)}`,
        `OutSum=${encodeRobokassaParam(sum)}`,
        `InvId=${encodeRobokassaParam(invoiceId)}`,
        `Description=${encodeRobokassaParam(description)}`,
        `Receipt=${encodeRobokassaParam(receiptEncoded)}`,
    ];

    sortedShpParams.forEach((param) => {
        params.push(`${param.name}=${encodeRobokassaParam(param.value)}`);
    });

    params.push(`SignatureValue=${encodeRobokassaParam(signature)}`);

    if (isTest) {
        params.push('IsTest=1');
    }

    return `${ROBOKASSA_PAYMENT_URL}?${params.join('&')}`;
};
