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
                const subscriptionEndDate = new Date();
                subscriptionEndDate.setMonth(subscriptionEndDate.getMonth() + 1);
                
                user.hasPaid = true;
                user.paymentDate = new Date();
                user.status = 'client';
                user.paymentAmount = parseFloat(OutSum);
                user.invoiceId = InvId;
                user.subscriptionEndDate = subscriptionEndDate;
                
                await user.save();
                console.log(`Пользователь ${Shp_userId} успешно обновлён. Подписка до: ${subscriptionEndDate}`);
                if (user.telegramId) {
                    try {
                        const botResponse = await axios.post(`${process.env.BOT_SERVER_URL}/api/bot/add-user`, {
                            telegramId: user.telegramId
                        }, {
                            headers: {
                                "Content-Type": "application/json",
                            },
                            timeout: 10000, // 10 секунд таймаут
                        });
        
                        if (botResponse.data.success) {
                            console.log(`Пользователь ${user.telegramId} успешно добавлен в группу и канал`);
                        } else {
                            console.warn(`Частичное выполнение при добавлении пользователя ${user.telegramId}:`, botResponse.data);
                        }
                    } catch (botError) {
                        console.error(`Ошибка при добавлении пользователя ${user.telegramId} в группу/канал:`, botError.message);
                        // Не прерываем выполнение, если ошибка с ботом
                    }
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