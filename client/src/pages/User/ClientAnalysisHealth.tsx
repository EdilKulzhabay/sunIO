import { UnifiedVideoContentPage } from "../../components/User/UnifiedVideoContentPage";
import { useParams } from "react-router-dom";

export const ClientAnalysisHealth = () => {
    const { id } = useParams();
    return (
        <UnifiedVideoContentPage
            contentType="analysis-health"
            fetchPath={`/api/analysis-health/`}
            id={id || ''}
        />
    );
};
