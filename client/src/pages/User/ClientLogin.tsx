import bgGar from '../../assets/bgGar.png';
import { ClientInput } from '../../components/User/ClientInput';
import { useEffect, useState } from 'react';
import { RedButton } from '../../components/User/RedButton';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { useAuth } from '../../contexts/AuthContext';

export const ClientLogin = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();
    const handleLogin = async () => {
        if (email.trim() === '' || password.trim() === '') {
            toast.error('Пожалуйста, заполните все поля');
            return;
        }

        setLoading(true);
        try {
            await login(email.trim(), password);
            toast.success('Успешный вход');
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message || 'Ошибка входа');
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        const storedEmail = localStorage.getItem('email');
        if (storedEmail) {
            setEmail(storedEmail);
        }
    }, []);

    return (
        <div 
            style={{
                backgroundImage: `url(${bgGar})`,
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundRepeat: 'no-repeat',
            }}
            className='min-h-screen px-4 pb-6 flex flex-col justify-between'
        >
            <div className='h-[200px]'></div>
            <div className='flex-1'>
                <h1 className='text-[48px] font-semibold text-white leading-12'>Авторизация пользователя</h1>
                <div className='mt-6 space-y-3'>
                    <ClientInput
                        placeholder="E-mail"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full"
                        inputType="email"
                    />
                    <ClientInput
                        placeholder="Пароль"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        className="w-full"
                        inputType="password"
                    />
                </div>
                <div className='flex justify-end mt-3 pr-3'>
                    <Link to="/client/register" className='text-sm text-white/40 underline'>Регистрация</Link>
                </div>
            </div>

            <div>
                <button 
                    onClick={() => navigate(-1)}
                    className='w-full mt-4 bg-white/10 block text-white py-2.5 text-center font-medium rounded-full'
                >Назад</button>
                <RedButton 
                    text={loading ? 'Вход...' : 'Войти'} 
                    onClick={handleLogin} 
                    className='w-full mt-4'
                    disabled={loading}
                />
            </div>
        </div>
    );
};