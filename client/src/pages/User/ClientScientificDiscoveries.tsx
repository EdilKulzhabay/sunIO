import { UnifiedVideoContentPage } from "../../components/User/UnifiedVideoContentPage";
import { useParams } from "react-router-dom";

export const ClientScientificDiscoveries = () => {
    const { id } = useParams();
    return (
        <UnifiedVideoContentPage
            contentType="scientific-discoveries"
            fetchPath={`/api/scientific-discoveries/`}
            id={id || ''}
        />
    );
};
