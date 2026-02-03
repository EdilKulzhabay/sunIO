import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MyInput } from "../components/Admin/MyInput";
import { MyButton } from "../components/Admin/MyButton";
import { useAuth } from "../contexts/AuthContext";
import { toast } from "react-toastify";

export const Register = () => {
    const [telegramId, setTelegramId] = useState("");
    const [telegramUserName, setTelegramUserName] = useState("");
    const [phone, setPhone] = useState("");
    
    useEffect(() => {
        setTelegramId(localStorage.getItem("telegramId") || "");
        setTelegramUserName(localStorage.getItem("telegramUserName") || "");
        setPhone(localStorage.getItem("phone") || "");
    }, []);
    
    const [fullName, setFullName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(false);
    const { register } = useAuth();

    const handleRegister = async () => {
        // Валидация
        if (!fullName || !email || !phone || !password || !confirmPassword) {
            toast.error("Все поля обязательны для заполнения");
            return;
        }

        if (password !== confirmPassword) {
            toast.error("Пароли не совпадают");
            return;
        }

        if (password.length < 6) {
            toast.error("Пароль должен содержать минимум 6 символов");
            return;
        }

        if (!email.includes("@")) {
            toast.error("Некорректный email");
            return;
        }

        try {
            setLoading(true);
            await register(fullName, email, phone, telegramId);
            toast.success("Регистрация успешна!");
        } catch (error: any) {
            toast.error(error.response?.data?.message || error.message || "Ошибка регистрации");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100">
            <div className="flex flex-col items-center justify-center bg-white p-10 rounded-lg shadow-md w-full max-w-md">
                <h1 className="text-2xl font-bold mb-6">Регистрация</h1>
                
                <MyInput 
                    label="Полное имя" 
                    type="text" 
                    value={fullName} 
                    onChange={(e) => setFullName(e.target.value)} 
                    placeholder="Введите ваше полное имя"
                />
                
                <MyInput 
                    label="Email" 
                    type="email" 
                    value={email} 
                    onChange={(e) => setEmail(e.target.value)} 
                    placeholder="Введите ваш email"
                />
                
                <MyInput 
                    label="Телефон" 
                    type="tel" 
                    value={phone} 
                    onChange={(e) => setPhone(e.target.value)} 
                    placeholder="Введите ваш номер телефона"
                />
                
                <MyInput 
                    label="Пароль" 
                    type="password" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    placeholder="Придумайте пароль"
                />
                
                <MyInput 
                    label="Подтвердите пароль" 
                    type="password" 
                    value={confirmPassword} 
                    onChange={(e) => setConfirmPassword(e.target.value)} 
                    placeholder="Повторите пароль"
                />
                
                <Link 
                    to={telegramId && telegramUserName 
                        ? `/login/${telegramId}/${telegramUserName}` 
                        : "/login"
                    } 
                    className="text-blue-500 hover:underline mb-4"
                >
                    Уже есть аккаунт? Войдите
                </Link>
                
                <MyButton 
                    text={loading ? "Регистрация..." : "Зарегистрироваться"} 
                    onClick={handleRegister} 
                    className="mt-4"
                    disabled={loading}
                />
            </div>
        </div>
    );
};