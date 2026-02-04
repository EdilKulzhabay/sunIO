import { UnifiedVideoContentPage } from "../../components/User/UnifiedVideoContentPage";
import { useParams } from "react-router-dom";

export const ClientConsciousnessLibrary = () => {
    const { id } = useParams();
    return (
        <UnifiedVideoContentPage
            contentType="consciousness-library"
            fetchPath={`/api/consciousness-library/`}
            id={id || ''}
        />
    );
};
