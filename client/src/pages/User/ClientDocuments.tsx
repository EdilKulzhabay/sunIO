import { UserLayout } from "../../components/User/UserLayout";
import { BackNav } from "../../components/User/BackNav";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "../../api";
import linkArrow from "../../assets/linkArrow.png";

export const ClientDocuments = () => {
    const [userData, setUserData] = useState<any>(null);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [documents, setDocuments] = useState<any[]>([]);
    const [content, setContent] = useState<string>('');

    useEffect(() => {
        // Проверка на блокировку пользователя
        const userStr = localStorage.getItem('user');
        if (userStr) {
            try {
                const user = JSON.parse(userStr);
                if (user && user.isBlocked && user.role !== 'admin') {
                    navigate('/client/blocked-user');
                    return;
                }
            } catch (e) {
                console.error('Ошибка парсинга user из localStorage:', e);
            }
        }

        fetchUserData();
        fetchDocuments();
        fetchContent();
    }, [navigate]);

    const fetchContent = async () => {
        try {
            const response = await api.get('/api/dynamic-content/name/documents');
            setContent(response.data.data.content);
        } catch (error) {
            console.error('Ошибка загрузки контента:', error);
        }
    }

    const fetchDocuments = async () => {
        try {
            const response = await api.get('/api/documents');
            setDocuments(response.data.data);
        } catch (error) {
            console.error('Ошибка загрузки документов:', error);
        }
    }

    const fetchUserData = async () => {
        try {
            if (userData) {
                console.log("1");
            }
            const user = JSON.parse(localStorage.getItem('user') || '{}');
            const response = await api.post('/api/user/profile', { userId: user._id }, {
                headers: {
                    'Content-Type': 'application/json',
                },
            });
            if (response.data.success) {
                setUserData(response.data.user);
                // Проверка на блокировку после получения данных с сервера
                if (response.data.user.isBlocked && response.data.user.role !== 'admin') {
                    navigate('/client/blocked-user');
                    return;
                }
            }
        } catch (error) {
            console.error('Ошибка загрузки данных пользователя:', error);
        } finally {
            setLoading(false);
        }
    }


    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#031F23]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
    }

    return (
        <div>
            <UserLayout>
                <BackNav title="Документы" />
                <div className="flex-1 px-4">

                    <div className="text-white">
                    {content}
                    </div>

                    <div className="mt-5 space-y-4">
                        {documents.map((document) => (
                            <div key={document._id} className="bg-[#114E50] rounded-xl p-4 flex items-center justify-between">
                                <div>
                                    <a href={document.link} target="_blank" rel="noopener noreferrer" className="text-white font-medium text-xl">
                                        {document.title}
                                    </a>
                                </div>
                                <div>
                                    <img src={linkArrow} alt="arrow-link" className="w-5 h-5 object-cover" />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </UserLayout>
        </div>
    );
};