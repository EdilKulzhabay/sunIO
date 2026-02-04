import { UnifiedVideoContentPage } from "../../components/User/UnifiedVideoContentPage";
import { useParams } from "react-router-dom";

export const ClientPsychodiagnostics = () => {
    const { id } = useParams();
    return (
        <UnifiedVideoContentPage
            contentType="psychodiagnostics"
            fetchPath={`/api/psychodiagnostics/`}
            id={id || ''}
        />
    );
};
