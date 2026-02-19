import { UnifiedVideoContentPage } from "../../components/User/UnifiedVideoContentPage";
import { useParams } from "react-router-dom";

export const ClientParablesOfLife = () => {
    const { id } = useParams();
    return (
        <UnifiedVideoContentPage
            contentType="parables-of-life"
            fetchPath={`/api/parables-of-life/`}
            id={id || ''}
        />
    );
};
