import { UnifiedVideoContentPage } from "../../components/User/UnifiedVideoContentPage";
import { useParams } from "react-router-dom";

export const ClientVideoLesson = () => {
    const { id } = useParams();
    return (
        <UnifiedVideoContentPage
            contentType="videoLesson"
            fetchPath={`/api/video-lesson/`}
            id={id || ''}
        />
    );
};
