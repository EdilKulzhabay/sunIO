import { UnifiedVideoContentPage } from "../../components/User/UnifiedVideoContentPage";
import { useParams } from "react-router-dom";

export const ClientMeditation = () => {
    const { id } = useParams();
    return (
        <UnifiedVideoContentPage
            contentType="meditation"
            fetchPath={`/api/meditation/`}
            id={id || ''}
        />
    );
};
