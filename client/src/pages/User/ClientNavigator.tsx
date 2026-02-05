import { UserLayout } from "../../components/User/UserLayout"
import { BackNav } from "../../components/User/BackNav"
import api from "../../api"
import { useState } from "react"
import { useEffect } from "react"
import navigatorMobile from "../../assets/navigatorMobile.png"
import { Switch } from "../../components/User/Switch"
import { useNavigate } from "react-router-dom"
import navigatorConsciousnessLibrary from "../../assets/navigatorConsciousnessLibrary.png"
import navigatorRelationshipWorkshop from "../../assets/navigatorRelationshipWorkshop.png"
import navigatorSpiritForge from "../../assets/navigatorSpiritForge.png"
import navigatorMastersTower from "../../assets/navigatorMastersTower.png"
import navigatorHealthLab from "../../assets/navigatorHealthLab.png"
import navigatorFemininityGazebo from "../../assets/navigatorFemininityGazebo.png"
import navigatorBegginingJourney from "../../assets/navigatorBegginingJourney.png"

export const ClientNavigator = () => {
    const navigate = useNavigate();
    const [content, setContent] = useState<any>(null);
    const [showDescription, setShowDescription] = useState(true);
    const fetchContent = async () => {
        const response = await api.get(`/api/dynamic-content/name/navigator`);
        if (response.data.success) {
            setContent(response.data.data);
        }
    };

    useEffect(() => {
        fetchContent();
    }, []);

    return (
        <UserLayout>
            <BackNav title="Навигатор" />
            <div className="mt-2 pb-10 bg-[#031F23]">
                <p className="mt-4 px-4" dangerouslySetInnerHTML={{ __html: content?.content }}></p>
                <div className='relative'>
                    <div className="relative flex justify-center items-center">
                        <img 
                            src={navigatorMobile} 
                            alt={"Навигатор"} 
                            className='w-full h-auto rounded-lg object-top z-10' 
                        />
                    </div>
                    <div 
                        className="absolute inset-0 z-10 lg:hidden"
                        style={{
                            background: 'linear-gradient(to top, #031F2300 80%, #031F23 99%)',
                        }}
                    />
                    <div 
                        className="absolute inset-0 z-10 lg:hidden"
                        style={{
                            background: 'linear-gradient(to bottom, #031F2300 60%, #031F23 100%)',
                        }}
                    />
                    <div 
                        className="absolute inset-0 z-10 hidden lg:block"
                        style={{
                            background: 'linear-gradient(to right, #031F2300 70%, #031F23 100%)',
                        }}
                    />
                    <div 
                        className="absolute inset-0 z-10 hidden lg:block"
                        style={{
                            background: 'linear-gradient(to left, #031F2300 70%, #031F23 100%)',
                        }}
                    />
                    <button onClick={() => navigate("/client/consciousness-library")} className="absolute top-[19%] left-[28%] w-[116px] h-[40px] z-20">
                        <img src={navigatorConsciousnessLibrary} alt={""} className="object-cover w-full h-full" />
                    </button>
                    <button onClick={() => navigate("/client/spirit-forge")} className="absolute top-[30%] left-[20%] w-[93px] h-[40px] z-20">
                        <img src={navigatorSpiritForge} alt={""} className="object-cover w-full h-full" />
                    </button>
                    <button onClick={() => navigate("/client/relationship-workshop")} className="absolute top-[40%] left-[20%] w-[96px] h-[61px] z-20">
                        <img src={navigatorRelationshipWorkshop} alt={""} className="object-cover w-full h-full" />
                    </button>
                    <button onClick={() => navigate("/client/masters-tower")} className="absolute top-[40%] left-[72%] w-[78px] h-[61px] z-20">
                        <img src={navigatorMastersTower} alt={""} className="object-cover w-full h-full" />
                    </button>
                    <button onClick={() => navigate("/client/health-lab")} className="absolute top-[53%] left-[7%] w-[107px] h-[61px] z-20">
                        <img src={navigatorHealthLab} alt={""} className="object-cover w-full h-full" />
                    </button>
                    <button onClick={() => navigate("/client/femininity-gazebo")} className="absolute top-[65%] left-[65%] w-[115px] h-[61px] z-20">
                        <img src={navigatorFemininityGazebo} alt={""} className="object-cover w-full h-full" />
                    </button>
                    <button onClick={() => navigate("/client/beggining-journey")} className="absolute top-[72%] left-[22%] w-[99px] h-[61px] z-20">
                        <img src={navigatorBegginingJourney} alt={""} className="object-cover w-full h-full" />
                    </button>
                </div>
            </div>
            <div className="px-4 mt-2 pb-10 bg-[#031F23]">
                <div className="flex items-center justify-between">
                    <div className="">Показывать описание</div>
                    <Switch
                        checked={showDescription}
                        onChange={() => { setShowDescription(!showDescription); }} 
                    />
                </div>
            </div>
        </UserLayout>
    )
}