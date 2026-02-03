import crypto from 'crypto';
import "dotenv/config";

const getUrl = () => {
    const userId = "693450a702829b24c97be926"
    const MERCHANT_LOGIN = process.env.ROBOKASSA_MERCHANT_LOGIN;
    const PASSWORD_1 = process.env.ROBOKASSA_PASSWORD1;
    console.log("MERCHANT_LOGIN = ", MERCHANT_LOGIN)
    
    const outSum = '10.00';
    const invId = Date.now();
    const description = 'Подписка на Клуб .li (30 дней)';
    
    const receipt = {
        sno: 'usn_income',
        items: [
            {
            name: 'Подписка на Клуб .li (30 дней)',
            quantity: 1,
            sum: 10.00,
            tax: 'none',
            payment_method: 'prepayment_full',
            payment_object: 'service',
            },
        ],
    };
    
    const receiptJson = JSON.stringify(receipt);
    const receiptEncoded = encodeURIComponent(receiptJson);
    
    const signatureString =
    `${MERCHANT_LOGIN}:${outSum}:${invId}:${receiptEncoded}:${PASSWORD_1}:Shp_userId=${userId}`;
    
    const signature = crypto
    .createHash('md5')
    .update(signatureString)
    .digest('hex');
    
    const url =
    `https://auth.robokassa.ru/Merchant/Index.aspx` +
    `?MerchantLogin=${MERCHANT_LOGIN}` +
    `&OutSum=${outSum}` +
    `&InvId=${invId}` +
    `&Description=${encodeURIComponent(description)}` +
    `&Receipt=${encodeURIComponent(receiptEncoded)}` +
    `&SignatureValue=${signature}` +
    `&Shp_userId=${userId}`;

    console.log(url)
    
}

getUrl()

