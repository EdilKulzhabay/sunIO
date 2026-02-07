import { UserLayout } from "../../components/User/UserLayout"
import { BackNav } from "../../components/User/BackNav"
import api from "../../api"
import { useState } from "react"
import { useEffect } from "react"
import navigatorMobile from "../../assets/navigatorMobile.jpg"
import { Switch } from "../../components/User/Switch"
import { useNavigate } from "react-router-dom"
import navigatorConsciousnessLibrary from "../../assets/navigatorConsciousnessLibrary.png"
import navigatorRelationshipWorkshop from "../../assets/navigatorRelationshipWorkshop.png"
import navigatorSpiritForge from "../../assets/navigatorSpiritForge.png"
import navigatorMastersTower from "../../assets/navigatorMastersTower.png"
import navigatorHealthLab from "../../assets/navigatorHealthLab.png"
import navigatorFemininityGazebo from "../../assets/navigatorFemininityGazebo.png"
import navigatorBegginingJourney from "../../assets/navigatorBegginingJourney.png"
import { X } from "lucide-react"

interface ContentItem {
    title: string;
    description: string;
}

interface NavigatorDescription {
    _id?: string;
    name: string;
    title: string;
    description: string;
    content: ContentItem[];
    link: string;
    eventTitle?: string;
}

export const ClientNavigator = () => {
    const navigate = useNavigate();
    const [content, setContent] = useState<any>(null);
    const [descriptions, setDescriptions] = useState<NavigatorDescription[]>([])
    const [showDescription, setShowDescription] = useState(true);
    const [selectedContent, setSelectedContent] = useState<NavigatorDescription | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false)
    const fetchContent = async () => {
        const response = await api.get(`/api/dynamic-content/name/navigator`);
        if (response.data.success) {
            setContent(response.data.data);
        }
        const descriptionsResponse = await api.get(`api/navigator-descriptions`)
        if (descriptionsResponse.data.success) {
            setDescriptions(descriptionsResponse.data.data)
        }
    };

    useEffect(() => {
        fetchContent();
    }, []);

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedContent(null);
    };

    return (
        <UserLayout>
            <div className="max-h-screen">
                <BackNav title="Навигатор" />
                <div className="-mt-2 bg-[#031F23]">
                    <p className="px-4" dangerouslySetInnerHTML={{ __html: content?.content }}></p>
                    <div className='relative'>
                        <div className="relative flex justify-center items-center">
                            <img 
                                src={navigatorMobile} 
                                alt={"Навигатор"} 
                                className=' rounded-lg object-top z-10' 
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
                        <button onClick={() => {
                            if (showDescription) {
                                setIsModalOpen(true)
                                setSelectedContent(descriptions.find((item: NavigatorDescription) => item.name === "consciousness-library") || null)
                            } else {
                                navigate("/client/consciousness-library")
                            }
                        }} className="absolute top-[19%] left-[28%] w-[116px] h-[40px] z-20">
                            <img src={navigatorConsciousnessLibrary} alt={""} className="object-cover w-full h-full" />
                        </button>
                        <button onClick={() => {
                            if (showDescription) {
                                setIsModalOpen(true)
                                setSelectedContent(descriptions.find((item: NavigatorDescription) => item.name === "spirit-forge") || null)
                            } else {
                                navigate("/client/spirit-forge")
                            }
                        }} className="absolute top-[30%] left-[20%] w-[93px] h-[40px] z-20">
                            <img src={navigatorSpiritForge} alt={""} className="object-cover w-full h-full" />
                        </button>
                        <button onClick={() => {
                            if (showDescription) {
                                setIsModalOpen(true)
                                setSelectedContent(descriptions.find((item: NavigatorDescription) => item.name === "relationship-workshop") || null)
                            } else {
                                navigate("/client/relationship-workshop")
                            }
                        }} className="absolute top-[40%] left-[20%] w-[96px] h-[61px] z-20">
                            <img src={navigatorRelationshipWorkshop} alt={""} className="object-cover w-full h-full" />
                        </button>
                        <button onClick={() => {
                            if (showDescription) {
                                setIsModalOpen(true)
                                setSelectedContent(descriptions.find((item: NavigatorDescription) => item.name === "masters-tower") || null)
                            } else {
                                navigate("/client/masters-tower")
                            }
                        }} className="absolute top-[40%] left-[72%] w-[78px] h-[61px] z-20">
                            <img src={navigatorMastersTower} alt={""} className="object-cover w-full h-full" />
                        </button>
                        <button onClick={() => {
                            if (showDescription) {
                                setIsModalOpen(true)
                                setSelectedContent(descriptions.find((item: NavigatorDescription) => item.name === "health-lab") || null)
                            } else {
                                navigate("/client/health-lab")
                            }
                        }} className="absolute top-[53%] left-[7%] w-[107px] h-[61px] z-20">
                            <img src={navigatorHealthLab} alt={""} className="object-cover w-full h-full" />
                        </button>
                        <button onClick={() => {
                            if (showDescription) {
                                setIsModalOpen(true)
                                setSelectedContent(descriptions.find((item: NavigatorDescription) => item.name === "femininity-gazebo") || null)
                            } else {
                                navigate("/client/femininity-gazebo")
                            }
                        }} className="absolute top-[65%] left-[65%] w-[115px] h-[61px] z-20">
                            <img src={navigatorFemininityGazebo} alt={""} className="object-cover w-full h-full" />
                        </button>
                        <button onClick={() => {
                            navigate("/client/beggining-journey")
                        }} className="absolute top-[72%] left-[22%] w-[99px] h-[61px] z-20">
                            <img src={navigatorBegginingJourney} alt={""} className="object-cover w-full h-full" />
                        </button>
                    </div>
                    <div className="px-4 mt-2 pb-10">
                        <div className="flex items-center justify-between">
                            <div className="">Показывать описание</div>
                            <Switch
                                checked={showDescription}
                                onChange={() => { setShowDescription(!showDescription); }} 
                            />
                        </div>
                    </div>
                </div>
            </div>
            {isModalOpen && selectedContent && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    {/* Мобильная версия: модальное окно снизу */}
                    <div className="flex items-end justify-center min-h-screen sm:hidden">
                        {/* Overlay */}
                        <div 
                            className="fixed inset-0 bg-black/60 transition-opacity z-20"
                            onClick={closeModal}
                        />

                        {/* Modal - снизу на мобильных */}
                        <div 
                            className="relative z-50 px-4 pt-6 pb-8 inline-block w-full bg-[#114E50] rounded-t-[24px] text-left text-white overflow-hidden shadow-xl transform transition-all"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={closeModal}
                                className="absolute top-6 right-5 cursor-pointer"
                            >
                                <X size={24} />
                            </button>
                            <div 
                                className="font-medium text-xl text-white" 
                                dangerouslySetInnerHTML={{ __html: selectedContent.title || "" }} 
                            />
                            <div className="mt-4 text-sm" dangerouslySetInnerHTML={{ __html: selectedContent.description }}></div>
                            <div className="">
                                {selectedContent.content.map((item: ContentItem) => (
                                    <div key={item.title} className="">
                                        <p className="mt-3 font-medium text-md text-white" dangerouslySetInnerHTML={{ __html: item.title }}></p>
                                        <p className="mt-1 text-sm" dangerouslySetInnerHTML={{ __html: item.description }}></p>
                                    </div>
                                ))}
                            </div>

                            <a 
                                className="block bg-[#C4841D] text-white py-2.5 text-center font-medium rounded-full mt-4 w-full" 
                                href={selectedContent.link}
                            >
                                <p>Перейти</p>
                            </a>
                        </div>
                    </div>
                    {/* Десктопная версия: модальное окно по центру */}
                    <div className="hidden sm:flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center">
                        {/* Overlay */}
                        <div 
                            className="fixed inset-0 bg-black/60 transition-opacity z-20"
                            onClick={closeModal}
                        />

                        {/* Modal - снизу на мобильных */}
                        <div 
                            className="relative z-50 w-1/3 px-4 pt-6 pb-8 inline-block  bg-[#114E50] rounded-[24px] text-left text-white overflow-hidden shadow-xl transform transition-all"
                            onClick={(e) => e.stopPropagation()}
                        >
                            <button
                                onClick={closeModal}
                                className="absolute top-6 right-5 cursor-pointer"
                            >
                                <X size={24} />
                            </button>
                            <div 
                                className="[&_h3]:text-xl [&_h3]:font-bold [&_h3]:mb-2 [&_div]:mb-2 [&_span]:font-bold" 
                                dangerouslySetInnerHTML={{ __html: selectedContent.eventTitle || 'Добавить в календарь' }} 
                            />
                        </div>
                    </div>
                </div>
            )}
        </UserLayout>
    )
}