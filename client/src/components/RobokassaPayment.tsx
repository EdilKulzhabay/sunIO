import { useState } from 'react';
import { MyButton } from './Admin/MyButton';
import { Modal } from './Modal';
import CryptoJS from 'crypto-js';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate, useLocation } from 'react-router-dom';

interface RobokassaPaymentProps {
  amount: number;
  description: string;
  className?: string;
}

export const RobokassaPayment = ({ 
  amount, 
  description, 
  className 
}: RobokassaPaymentProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handlePayment = () => {
    // Проверяем авторизацию
    if (!user) {
      setShowAuthModal(true);
      return;
    }

    setIsLoading(true);

    try {
      const merchantLogin = import.meta.env.VITE_ROBOKASSA_MERCHANT_LOGIN;
      const password1 = import.meta.env.VITE_ROBOKASSA_PASSWORD1;
      const isTestMode = import.meta.env.VITE_ROBOKASSA_TEST_MODE === '1';
      
      // URL клиентского приложения для Success/Fail страниц
      const clientUrl = "https://portal.tochkali.com";
      
      // Генерируем уникальный ID счета
      const invoiceId = Date.now();
      const outSum = amount.toFixed(2);

      // Формируем строку для подписи с дополнительными параметрами
      // Формат: MerchantLogin:OutSum:InvoiceID:Password1[:Shp_param=value]
      let signatureString = `${merchantLogin}:${outSum}:${invoiceId}:${password1}`;
      
      // Добавляем userId если пользователь авторизован
      if (user?._id) {
        signatureString += `:Shp_userId=${user._id}`;
      }
      
      // Генерируем MD5 хеш для подписи
      const signature = CryptoJS.MD5(signatureString).toString();

      // Формируем URL для оплаты
      const baseUrl = isTestMode 
        ? 'https://auth.robokassa.ru/Merchant/Index.aspx'
        : 'https://auth.robokassa.ru/Merchant/Index.aspx';

      const params: Record<string, string> = {
        MerchantLogin: merchantLogin,
        OutSum: outSum,
        InvoiceID: invoiceId.toString(),
        Description: description,
        SignatureValue: signature,
        IsTest: isTestMode ? '1' : '0',
        // URL для перенаправления пользователя после оплаты
        SuccessURL: `${clientUrl}/robokassa_callback/success`,
        FailURL: `${clientUrl}/robokassa_callback/fail`,
      };

      // Добавляем userId если пользователь авторизован
      if (user?._id) {
        params.Shp_userId = user._id;
      }

      const searchParams = new URLSearchParams(params);
      const paymentUrl = `${baseUrl}?${searchParams.toString()}`;

      // Перенаправляем пользователя на страницу оплаты
      window.location.href = paymentUrl;
    } catch (error) {
      console.error('Ошибка при формировании ссылки оплаты:', error);
      alert('Произошла ошибка при переходе к оплате. Попробуйте позже.');
      setIsLoading(false);
    }
  };

  const handleLoginRedirect = () => {
    // Сохраняем текущий путь для возврата после авторизации
    localStorage.setItem('redirectAfterLogin', location.pathname);
    navigate('/login');
  };

  const handleRegisterRedirect = () => {
    // Сохраняем текущий путь для возврата после регистрации
    localStorage.setItem('redirectAfterLogin', location.pathname);
    navigate('/register');
  };

  return (
    <>
      <MyButton
        text={isLoading ? 'Переход к оплате...' : 'Оплатить курс'}
        onClick={handlePayment}
        disabled={isLoading}
        className={className}
      />

      <Modal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        title="Требуется авторизация"
        maxWidth="500px"
        darkMode={true}
      >
        <div className="space-y-4">
          <p className="text-gray-300 text-center">
            Для оплаты курса необходимо авторизоваться или зарегистрироваться в системе.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6">
            <MyButton
              text="Войти"
              onClick={handleLoginRedirect}
              className="flex-1"
            />
            <MyButton
              text="Зарегистрироваться"
              onClick={handleRegisterRedirect}
              className="flex-1"
            />
          </div>
        </div>
      </Modal>
    </>
  );
};

export default RobokassaPayment;

