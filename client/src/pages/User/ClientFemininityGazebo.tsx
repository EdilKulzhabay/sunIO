import { UnifiedVideoContentPage } from "../../components/User/UnifiedVideoContentPage";
import { useParams } from "react-router-dom";

export const ClientFemininityGazebo = () => {
    const { id } = useParams();
    return (
        <UnifiedVideoContentPage
            contentType="femininity-gazebo"
            fetchPath={`/api/femininity-gazebo/`}
            id={id || ''}
        />
    );
};
