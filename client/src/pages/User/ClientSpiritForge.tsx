import { UnifiedVideoContentPage } from "../../components/User/UnifiedVideoContentPage";
import { useParams } from "react-router-dom";

export const ClientSpiritForge = () => {
    const { id } = useParams();
    return (
        <UnifiedVideoContentPage
            contentType="spirit-forge"
            fetchPath={`/api/spirit-forge/`}
            id={id || ''}
        />
    );
};
