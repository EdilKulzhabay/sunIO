import { UnifiedVideoContentPage } from "../../components/User/UnifiedVideoContentPage";
import { useParams } from "react-router-dom";

export const ClientAnalysisRealization = () => {
    const { id } = useParams();
    return (
        <UnifiedVideoContentPage
            contentType="analysis-realization"
            fetchPath={`/api/analysis-realization/`}
            id={id || ''}
        />
    );
};
