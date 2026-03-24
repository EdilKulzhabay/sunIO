import { UnifiedVideoContentPage } from "../../components/User/UnifiedVideoContentPage";
import { useParams } from "react-router-dom";

export const ClientBroadcastRecording = () => {
    const { id } = useParams();
    return (
        <UnifiedVideoContentPage
            contentType="broadcast-recording"
            fetchPath={`/api/broadcast-recording/`}
            id={id || ''}
        />
    );
};
