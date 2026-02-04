import { UnifiedVideoContentPage } from "../../components/User/UnifiedVideoContentPage";
import { useParams } from "react-router-dom";

export const ClientAnalysisRelationships = () => {
    const { id } = useParams();
    return (
        <UnifiedVideoContentPage
            contentType="analysis-relationships"
            fetchPath={`/api/analysis-relationships/`}
            id={id || ''}
        />
    );
};
