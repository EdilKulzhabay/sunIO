// import back from "../../assets/back.png";
// import { useNavigate } from "react-router-dom";

export const BackNav = ({ title} : { title: string }) => {
    // const navigate = useNavigate();
    return (
        <div className="flex items-center p-4">
            {/* <button onClick={() => navigate(-1)} className="cursor-pointer">
                <img 
                    src={back}
                    alt="arrow-left"
                    className="w-6 h-6"
                />
            </button> */}
            <h1 className="text-2xl font-semibold">{title}</h1>
        </div>
    )
}