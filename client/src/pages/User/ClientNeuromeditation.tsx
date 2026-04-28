import { UnifiedVideoContentPage } from "../../components/User/UnifiedVideoContentPage";
import { useParams } from "react-router-dom";

export const ClientNeuromeditation = () => {
    const { id } = useParams();
    return (
        <UnifiedVideoContentPage contentType="neuromeditations" fetchPath={`/api/neuromeditations/`} id={id || ""} />
    );
};
