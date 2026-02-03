import { useState, useEffect } from 'react';
import { AdminLayout } from '../../components/Admin/AdminLayout';
import { MyInput } from '../../components/Admin/MyInput';
import { MyButton } from '../../components/Admin/MyButton';
import { useAuth } from '../../contexts/AuthContext';
import api from '../../api';
import { toast } from 'react-toastify';
import { User, Mail, Lock } from 'lucide-react';

export const ProfileAdmin = () => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [loadingPassword, setLoadingPassword] = useState(false);
    
    const [profileData, setProfileData] = useState({
        fullName: '',
        phone: '',
    });

    const [passwordData, setPasswordData] = useState({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
    });

    useEffect(() => {
        if (user) {
            setProfileData({
                fullName: user.fullName || '',
                phone: user.phone || '',
            });
        }
    }, [user]);

    const handleUpdateProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const response = await api.put('/api/user/profile/update', { ...profileData, userId: user?._id });
            toast.success('Профиль успешно обновлен');
            if (response.data.success) {
                setProfileData(response.data.data);
            }
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Ошибка обновления профиля');
        } finally {
            setLoading(false);
        }
    };

    const handleChangePassword = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (passwordData.newPassword !== passwordData.confirmPassword) {
            toast.error('Новые пароли не совпадают');
            return;
        }

        if (passwordData.newPassword.length < 6) {
            toast.error('Пароль должен содержать минимум 6 символов');
            return;
        }

        setLoadingPassword(true);

        try {
            await api.put('/api/user/profile/change-password', {
                currentPassword: passwordData.currentPassword,
                newPassword: passwordData.newPassword,
            });
            toast.success('Пароль успешно изменен');
            setPasswordData({
                currentPassword: '',
                newPassword: '',
                confirmPassword: '',
            });
        } catch (error: any) {
            toast.error(error.response?.data?.message || 'Ошибка изменения пароля');
        } finally {
            setLoadingPassword(false);
        }
    };

    return (
        <AdminLayout>
            <div className="space-y-6 max-w-3xl">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Профиль</h1>
                    <p className="text-gray-600 mt-1">Управление вашим профилем и настройками</p>
                </div>

                {/* Информация о пользователе */}
                <div className="bg-white rounded-lg shadow p-6">
                    <div className="flex items-center gap-4 mb-6">
                        <div className="w-20 h-20 bg-blue-100 rounded-full flex items-center justify-center">
                            <User size={40} className="text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-2xl font-semibold">{user?.fullName}</h2>
                            <p className="text-gray-600 flex items-center gap-2 mt-1">
                                <Mail size={16} />
                                {user?.mail}
                            </p>
                            <span className={`inline-block mt-2 px-3 py-1 rounded-full text-sm ${
                                user?.role === 'admin' 
                                    ? 'bg-purple-100 text-purple-700' 
                                    : 'bg-gray-100 text-gray-700'
                            }`}>
                                {user?.role === 'admin' ? 'Администратор' : 'Пользователь'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Форма редактирования профиля */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-xl font-semibold mb-4">Редактировать профиль</h3>
                    <form onSubmit={handleUpdateProfile} className="space-y-4">
                        <MyInput
                            label="Полное имя"
                            type="text"
                            value={profileData.fullName}
                            onChange={(e) => setProfileData({ ...profileData, fullName: e.target.value })}
                            placeholder="Введите ваше полное имя"
                        />

                        <MyInput
                            label="Телефон"
                            type="tel"
                            value={profileData.phone}
                            onChange={(e) => setProfileData({ ...profileData, phone: e.target.value })}
                            placeholder="+7 (___) ___-__-__"
                        />

                        <div className="flex justify-end pt-2">
                            <MyButton
                                text={loading ? 'Сохранение...' : 'Сохранить изменения'}
                                type="submit"
                                disabled={loading}
                            />
                        </div>
                    </form>
                </div>

                {/* Форма изменения пароля */}
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-xl font-semibold mb-4 flex items-center gap-2">
                        <Lock size={20} />
                        Изменить пароль
                    </h3>
                    <form onSubmit={handleChangePassword} className="space-y-4">
                        <MyInput
                            label="Текущий пароль"
                            type="password"
                            value={passwordData.currentPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                            placeholder="Введите текущий пароль"
                        />

                        <MyInput
                            label="Новый пароль"
                            type="password"
                            value={passwordData.newPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                            placeholder="Введите новый пароль"
                        />

                        <MyInput
                            label="Подтвердите новый пароль"
                            type="password"
                            value={passwordData.confirmPassword}
                            onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                            placeholder="Повторите новый пароль"
                        />

                        <div className="flex justify-end pt-2">
                            <MyButton
                                text={loadingPassword ? 'Изменение...' : 'Изменить пароль'}
                                type="submit"
                                disabled={loadingPassword}
                            />
                        </div>
                    </form>
                </div>
            </div>
        </AdminLayout>
    );
};

