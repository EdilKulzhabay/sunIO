import { UnifiedVideoContentPage } from "../../components/User/UnifiedVideoContentPage";
import { useParams } from "react-router-dom";

export const ClientHealthLab = () => {
    const { id } = useParams();
    return (
        <UnifiedVideoContentPage
            contentType="health-lab"
            fetchPath={`/api/health-lab/`}
            id={id || ''}
        />
    );
};
