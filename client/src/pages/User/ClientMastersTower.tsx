import { UnifiedVideoContentPage } from "../../components/User/UnifiedVideoContentPage";
import { useParams } from "react-router-dom";

export const ClientMastersTower = () => {
    const { id } = useParams();
    return (
        <UnifiedVideoContentPage
            contentType="masters-tower"
            fetchPath={`/api/masters-tower/`}
            id={id || ''}
        />
    );
};
