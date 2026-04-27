import { useNavigate } from "react-router-dom";
import arrowLeft from "../../assets/arrowLeft.png";
import { isPwaStandalone } from "../../utils/pwaEnv";

/** Круглая кнопка «назад» только в установленной PWA (как на списках практик). */
export function PwaBackButton() {
    const navigate = useNavigate();
    if (!isPwaStandalone()) return null;
    return (
        <button
            type="button"
            onClick={() => navigate(-1)}
            className="flex items-center justify-center w-9 h-9 shrink-0 border border-[#00C5AE] rounded-full cursor-pointer hover:bg-[#00C5AE] transition-colors"
        >
            <img src={arrowLeft} alt="Назад" className="w-6 h-6 object-cover" />
        </button>
    );
}
