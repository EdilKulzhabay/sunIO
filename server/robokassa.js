import "dotenv/config";
import { createRobokassaPaymentUrl, createRobokassaReceipt } from "./utils/robokassaPayment.js";

const getUrl = () => {
    const userId = "693450a702829b24c97be926"
    const MERCHANT_LOGIN = process.env.ROBOKASSA_MERCHANT_LOGIN;
    const PASSWORD_1 = process.env.ROBOKASSA_PASSWORD1;
    console.log("MERCHANT_LOGIN = ", MERCHANT_LOGIN)
    
    const outSum = '10.00';
    const invId = Date.now();
    const description = 'Подписка на Клуб .li (30 дней)';
    
    const receipt = createRobokassaReceipt({
        name: description,
        sum: outSum,
    });

    const url = createRobokassaPaymentUrl({
        merchantLogin: MERCHANT_LOGIN,
        password1: PASSWORD_1,
        outSum,
        invId,
        description,
        receipt,
        userId,
    });

    console.log(url)
    
}

getUrl()

