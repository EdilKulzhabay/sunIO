import { UnifiedVideoContentPage } from "../../components/User/UnifiedVideoContentPage";
import { useParams } from "react-router-dom";

export const ClientRelationshipWorkshop = () => {
    const { id } = useParams();
    return (
        <UnifiedVideoContentPage
            contentType="relationship-workshop"
            fetchPath={`/api/relationship-workshop/`}
            id={id || ''}
        />
    );
};
