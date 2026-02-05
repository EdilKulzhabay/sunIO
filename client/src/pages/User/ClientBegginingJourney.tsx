import { UserLayout } from "../../components/User/UserLayout";
import { BackNav } from "../../components/User/BackNav";
import api from "../../api";
import { useState } from "react";
import { useEffect } from "react";

export const ClientBegginingJourney = () => {
    const [content, setContent] = useState<any>(null);
    const fetchContent = async () => {
        const response = await api.get(`/api/beggining-journey`);
        if (response.data.success) {
            setContent(response.data.data);
        }
    };

    useEffect(() => {
        fetchContent();
    }, []);
    return (
        <UserLayout>
            <BackNav title="Начало путешествия" />
            <div className="px-4 mt-2 pb-10 bg-[#031F23]">
                <p dangerouslySetInnerHTML={{ __html: content?.title }}></p>
                <p dangerouslySetInnerHTML={{ __html: content?.firstText }}></p>
                <p dangerouslySetInnerHTML={{ __html: content?.secondText }}></p>
            </div>
        </UserLayout>
    );
};