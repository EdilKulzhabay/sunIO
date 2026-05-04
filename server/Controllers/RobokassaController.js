import crypto from 'crypto';
import User from '../Models/User.js';
import DepositLog from '../Models/DepositLog.js';
import axios from 'axios';
import 'dotenv/config';
import { getClosedClubSettingsDoc } from '../utils/closedClubSettings.js';
import { createRobokassaPaymentUrl, createRobokassaReceipt } from '../utils/robokassaPayment.js';

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
                const pendingDeposit = await DepositLog.findOne({
                    invId: String(InvId),
                    userId: Shp_userId,
                    status: 'pending',
                });

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
            const club = await getClosedClubSettingsDoc();
            const botPayload = {
                telegramId: user.telegramId,
                ...(club.channelTelegramId ? { channelId: club.channelTelegramId } : {}),
                ...(club.groupTelegramId ? { groupId: club.groupTelegramId } : {}),
            };
            const botResponse = await axios.post(`${process.env.BOT_SERVER_URL}/api/bot/add-user`, botPayload, {
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

    const deposit = await DepositLog.findOne({ invId: String(invId), userId: user._id });
    if (!deposit) {
        console.log(`Депозит ${invId} не найден`);
        return;
    }
    if (deposit.status === 'paid') {
        console.log(`Депозит ${invId} уже обработан`);
        return;
    }

    deposit.status = 'paid';
    await deposit.save();

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

        await DepositLog.create({
            userId,
            userFullName: user.fullName || '',
            invId: String(invId),
            amount: parseFloat(outSum),
            status: 'pending',
        });

        res.json({ success: true, url });
    } catch (error) {
        console.error('Ошибка создания депозита:', error);
        res.status(500).json({ success: false, message: 'Ошибка при создании депозита' });
    }
};

export const getOperationHistory = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await User.findById(userId).select('balance');
        if (!user) {
            return res.status(404).json({ success: false, message: 'Пользователь не найден' });
        }

        const [deposits, purchases] = await Promise.all([
            DepositLog.find({ userId, status: 'paid' }).sort({ createdAt: -1 }),
            [],
        ]);

        res.json({
            success: true,
            data: {
                balance: user.balance || 0,
                depositHistory: deposits,
                purchaseHistory: purchases,
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
