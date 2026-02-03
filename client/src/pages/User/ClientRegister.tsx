import bgGar from '../../assets/bgGar.png';
import { ClientInput } from '../../components/User/ClientInput';
import { useEffect, useState } from 'react';
import { RedButton } from '../../components/User/RedButton';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import api from '../../api';
import { useAuth } from '../../contexts/AuthContext';

export const ClientRegister = () => {
    const [firstName, setFirstName] = useState('');
    const [lastName, setLastName] = useState('');
    const [email, setEmail] = useState('');
    const [phone, setPhone] = useState('');
    const [code, setCode] = useState('');
    const [codeSent, setCodeSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [sendingCode, setSendingCode] = useState(false);
    const { register } = useAuth();
    const navigate = useNavigate();
    const [screenHeight, setScreenHeight] = useState<number>(0);
    useEffect(() => {
        // Загружаем данные из localStorage
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user.fullName) {
                    const nameParts = user.fullName.split(' ');
                    if (nameParts.length >= 2) {
                        setLastName(nameParts[0]);
                        setFirstName(nameParts.slice(1).join(' '));
                    } else if (nameParts.length === 1) {
                        setFirstName(nameParts[0]);
                    }
                }
                if (user.phone) setPhone(user.phone);
                if (user.mail) setEmail(user.mail);
            } catch (e) {
                console.error('Ошибка парсинга пользователя:', e);
            }
        }

        // Также проверяем старые ключи localStorage
        const storedFirstName = localStorage.getItem('firstName');
        const storedLastName = localStorage.getItem('lastName');
        const storedEmail = localStorage.getItem('email');
        const storedPhone = localStorage.getItem('phone');

        if (storedFirstName) setFirstName(storedFirstName);
        if (storedLastName) setLastName(storedLastName);
        if (storedEmail) setEmail(storedEmail);
        if (storedPhone) setPhone(storedPhone);
    }, []);

    const handleSendCode = async () => {
        if (!email.trim() || !email.includes('@')) {
            toast.error('Пожалуйста, введите корректный email');
            return;
        }
        if (phone.trim() === '') {
            toast.error('Пожалуйста, введите телефон');
            return;
        }

        if (firstName.trim() === '') {
            toast.error('Пожалуйста, введите имя');
            return;
        }
        if (lastName.trim() === '') {
            toast.error('Пожалуйста, введите фамилию');
            return;
        }

        setSendingCode(true);
        try {
            const response = await api.post('/api/send-code', {
                mail: email.trim(),
            });

            if (response.data.success) {
                setCodeSent(true);
                toast.success('Код отправлен на email');
            } else {
                toast.error(response.data.message || 'Ошибка отправки кода');
            }
        } catch (error: any) {
            console.error('Ошибка отправки кода:', error);
            toast.error(error.response?.data?.message || 'Ошибка отправки кода');
        } finally {
            setSendingCode(false);
        }
    };

    const handleConfirmCode = async () => {
        if (!code.trim() || code.trim().length !== 6) {
            toast.error('Пожалуйста, введите 6-значный код');
            return;
        }

        setLoading(true);
        try {
            // Подтверждаем код
            const confirmResponse = await api.post('/api/user/code-confirm', {
                mail: email.trim(),
                code: code.trim(),
            });

            if (!confirmResponse.data.success) {
                toast.error(confirmResponse.data.message || 'Неверный код');
                setLoading(false);
                return;
            }

            // Код верный, обновляем пользователя
            const telegramId = localStorage.getItem('telegramId');
            if (!telegramId) {
                toast.error('Ошибка: не найден telegramId');
                setLoading(false);
                return;
            }

            // Обновляем email и пароль через один запрос
            const updateResponse = await api.patch(`/api/users/${telegramId}`, {
                mail: email.trim().toLowerCase(),
                emailConfirmed: true,
            });

            if (updateResponse.data.success && updateResponse.data.data) {
                // Получаем полные данные пользователя для регистрации
                const userStr = localStorage.getItem('user');
                let userData = updateResponse.data.data;
                
                if (userStr) {
                    try {
                        const existingUser = JSON.parse(userStr);
                        userData = {
                            ...userData,
                            fullName: existingUser.fullName || `${lastName} ${firstName}`.trim(),
                            phone: existingUser.phone || phone,
                        };
                    } catch (e) {
                        console.error('Ошибка парсинга user:', e);
                    }
                }

                // Используем метод register из AuthContext для установки токенов
                const fullName = userData.fullName || `${lastName} ${firstName}`.trim();
                const telegramId = localStorage.getItem('telegramId') || undefined;

                try {
                    await register(
                        fullName,
                        email.trim(),
                        userData.phone || phone,
                        telegramId
                    );
                    localStorage.setItem('email', email.trim());
                    toast.success('Регистрация завершена');
                } catch (registerError: any) {
                    console.error('Ошибка регистрации:', registerError);
                    toast.error(registerError.response?.data?.message || 'Ошибка регистрации');
                    return;
                }
            } else {
                toast.error('Ошибка обновления данных');
            }
        } catch (error: any) {
            console.error('Ошибка подтверждения кода:', error);
            toast.error(error.response?.data?.message || 'Ошибка подтверждения кода');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const updateScreenHeight = () => {
            const height = window.innerHeight;
            setScreenHeight(height);
        }
        updateScreenHeight();
        window.addEventListener('resize', updateScreenHeight);
        return () => {
            window.removeEventListener('resize', updateScreenHeight);
        };
    }, []);
    return (
        <div 
            style={{
                backgroundImage: `url(${bgGar})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
            className='min-h-screen px-4 pb-6 flex flex-col justify-between lg:justify-start'
        >
            <div style={{ height: `${screenHeight/3}px` }}></div>
            <div className='flex-1 lg:flex-0 lg:w-[700px] lg:mx-auto'>
                <h1 className='text-[48px] font-semibold text-white leading-12'>Регистрация пользователя</h1>
                {!codeSent && (
                    <div className='mt-6 space-y-3'>
                        <ClientInput
                            placeholder="Фамилия"
                            value={lastName}
                            onChange={(e) => setLastName(e.target.value)}
                            className="w-full"
                            inputType="text"
                            disabled={codeSent}
                        />
                        <ClientInput
                            placeholder="Имя"
                            value={firstName}
                            onChange={(e) => setFirstName(e.target.value)}
                            className="w-full"
                            inputType="text"
                            disabled={codeSent}
                        />
                        <ClientInput
                            placeholder="Телефон"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            className="w-full"
                            inputType="tel"
                            disabled={codeSent}
                        />
                        <ClientInput
                            placeholder="E-mail"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="flex-1"
                            inputType="email"
                            disabled={codeSent}
                        />
                    </div>
                )}
                {codeSent && (
                    <div className='mt-6 space-y-3'>
                        <ClientInput
                            placeholder="Код подтверждения (6 цифр)"
                            value={code}
                            onChange={(e) => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            className="w-full"
                            inputType="text"
                            maxLength={6}
                        />
                    </div>
                )}
            </div>

            <div className='lg:w-[700px] lg:mx-auto'>
                <button 
                    onClick={() => navigate(-1)}
                    className='w-full mt-4 lg:mt-10 bg-white/10 block text-white py-2.5 text-center font-medium rounded-full'
                >Назад</button>
                {codeSent ? (
                    <RedButton
                        text={loading ? 'Подтверждение...' : 'Подтвердить код'}
                        onClick={handleConfirmCode}
                        className='w-full mt-4'
                        disabled={loading || !code.trim()}
                    />
                ) : (
                    <RedButton
                        text="Отправить код"
                        onClick={handleSendCode}
                        className='w-full mt-4'
                        disabled={sendingCode || !email.trim()}
                    />
                )}
            </div>
        </div>
    );
};