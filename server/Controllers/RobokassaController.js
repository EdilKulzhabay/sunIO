import crypto from 'crypto';
import User from '../Models/User.js';
import axios from 'axios';
import 'dotenv/config';

export const handleResult = async (req, res) => {
    try {
        console.log("handleResult req.body:", req.body);
        
        const { OutSum, InvId, SignatureValue, Shp_userId } = req.body;
        
        if (!OutSum || !InvId || !SignatureValue) {
            console.log("Отсутствуют обязательные параметры");
            return res.status(400).send("ERROR: Missing required parameters");
        }

        const password2 = process.env.ROBOKASSA_PASSWORD2;
        
        let signatureString = `${OutSum}:${InvId}:${password2}`;
        if (Shp_userId) {
            signatureString += `:Shp_userId=${Shp_userId}`;
        }
        
        const expectedSignature = crypto
            .createHash('md5')
            .update(signatureString)
            .digest('hex')
            .toUpperCase();
        
        const receivedSignature = SignatureValue.toUpperCase();
        
        console.log("Проверка подписи:");
        console.log("  Строка для хеша:", signatureString);
        console.log("  Ожидаемая подпись:", expectedSignature);
        console.log("  Полученная подпись:", receivedSignature);
        
        if (expectedSignature !== receivedSignature) {
            console.log("Подпись не совпадает!");
            return res.status(400).send("ERROR: Invalid signature");
        }
        
        console.log("Подпись верна!");

        if (Shp_userId) {
            const user = await User.findById(Shp_userId);
            if (user) {
                const pendingDeposit = user.depositHistory.find(
                    d => d.invId === String(InvId) && d.status === 'pending'
                );

                if (pendingDeposit) {
                    await handleDepositResult(user, OutSum, InvId);
                } else {
                    await handleSubscriptionResult(user, OutSum, InvId);
                }
            } else {
                console.log(`Пользователь ${Shp_userId} не найден`);
            }
        }
        
        res.send(`OK${InvId}`);
        
    } catch (error) {
        console.log("Ошибка обработки платежа:", error);
        res.status(500).send("ERROR: Internal server error");
    }
}

const handleSubscriptionResult = async (user, outSum, invId) => {
    const subscriptionEndDate = new Date();
    subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
    
    user.hasPaid = true;
    user.paymentDate = new Date();
    user.status = 'client';
    user.paymentAmount = parseFloat(outSum);
    user.invoiceId = invId;
    user.subscriptionEndDate = subscriptionEndDate;
    
    await user.save();
    console.log(`Подписка оформлена для ${user._id}. До: ${subscriptionEndDate}`);

    if (user.telegramId) {
        try {
            const botResponse = await axios.post(`${process.env.BOT_SERVER_URL}/api/bot/add-user`, {
                telegramId: user.telegramId
            }, {
                headers: { "Content-Type": "application/json" },
                timeout: 10000,
            });
    
            if (botResponse.data.success) {
                console.log(`Пользователь ${user.telegramId} успешно добавлен в группу и канал`);
            } else {
                console.warn(`Частичное выполнение при добавлении пользователя ${user.telegramId}:`, botResponse.data);
            }
        } catch (botError) {
            console.error(`Ошибка при добавлении пользователя ${user.telegramId} в группу/канал:`, botError.message);
        }
    }
};

const handleDepositResult = async (user, outSum, invId) => {
    const amount = parseFloat(outSum);

    const deposit = user.depositHistory.find(d => d.invId === String(invId));
    if (deposit) {
        if (deposit.status === 'paid') {
            console.log(`Депозит ${invId} уже обработан`);
            return;
        }
        deposit.status = 'paid';
        deposit.date = new Date();
    }

    user.balance = (user.balance || 0) + amount;
    await user.save();
    console.log(`Депозит ${invId} обработан. Баланс: ${user.balance}`);
};

export const createDeposit = async (req, res) => {
    try {
        const { userId, amount } = req.body;

        if (!userId || !amount || amount <= 0) {
            return res.status(400).json({ success: false, message: 'Некорректная сумма или пользователь' });
        }

        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'Пользователь не найден' });
        }

        const MERCHANT_LOGIN = process.env.ROBOKASSA_MERCHANT_LOGIN;
        const PASSWORD_1 = process.env.ROBOKASSA_PASSWORD1;

        const outSum = parseFloat(amount).toFixed(2);
        const invId = Date.now();
        const description = 'Пополнение баланса приложения';

        const receipt = {
            sno: 'usn_income',
            items: [
                {
                    name: 'Пополнение баланса приложения',
                    quantity: 1,
                    sum: parseFloat(outSum),
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

        user.depositHistory.push({
            date: new Date(),
            amount: parseFloat(outSum),
            status: 'pending',
            invId: String(invId),
        });
        await user.save();

        res.json({ success: true, url });
    } catch (error) {
        console.error('Ошибка создания депозита:', error);
        res.status(500).json({ success: false, message: 'Ошибка при создании депозита' });
    }
};

export const getOperationHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select('balance depositHistory purchaseHistory');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Пользователь не найден' });
        }

        res.json({
            success: true,
            data: {
                balance: user.balance || 0,
                depositHistory: (user.depositHistory || []).sort((a, b) => new Date(b.date) - new Date(a.date)),
                purchaseHistory: (user.purchaseHistory || []).sort((a, b) => new Date(b.date) - new Date(a.date)),
            },
        });
    } catch (error) {
        console.error('Ошибка получения истории операций:', error);
        res.status(500).json({ success: false, message: 'Ошибка получения истории операций' });
    }
};

export const handleSuccess = async (req, res) => {
    try {
        console.log("handleSuccess req.body:", req.body);
        res.status(200).json({
            success: true,
            message: "Страница успешной оплаты",
        });
    } catch (error) {
        console.log(error);
    }
}

export const handleFail = async (req, res) => {
    try {
        console.log("handleFail req.body:", req.body);
        res.status(200).json({
            success: true,
            message: "Страница неудачной оплаты",
        });
    } catch (error) {
        console.log(error);
    }
}
