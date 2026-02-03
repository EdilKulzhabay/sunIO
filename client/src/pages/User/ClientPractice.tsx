import { UnifiedVideoContentPage } from "../../components/User/UnifiedVideoContentPage";
import { useParams } from "react-router-dom";

export const ClientPractice = () => {
    const { id } = useParams();
    return (
        <UnifiedVideoContentPage
            contentType="practice"
            fetchPath={`/api/practice/`}
            id={id || ''}
        />
    );
};
