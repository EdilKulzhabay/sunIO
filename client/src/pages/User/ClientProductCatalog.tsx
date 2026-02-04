import { UnifiedVideoContentPage } from "../../components/User/UnifiedVideoContentPage";
import { useParams } from "react-router-dom";

export const ClientProductCatalog = () => {
    const { id } = useParams();
    return (
        <UnifiedVideoContentPage
            contentType="product-catalog"
            fetchPath={`/api/product-catalog/`}
            id={id || ''}
        />
    );
};
