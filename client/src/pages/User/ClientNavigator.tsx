import { UserLayout } from "../../components/User/UserLayout"
import { BackNav } from "../../components/User/BackNav"
import api from "../../api"
import { useState } from "react"
import { useEffect } from "react"
import navigatorMobile from "../../assets/navigatorMobile.jpg"
import navigatorDesktop from "../../assets/navigatorDesktop.png"
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
    const [userData, setUserData] = useState<any>(null);
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

    const fetchUserData = async () => {
        const user = JSON.parse(localStorage.getItem('user') || '{}');
        const response = await api.get(`/api/user/${user._id}`);
        if (response.data.success) {
            setUserData(response.data.data);
            setShowDescription(response.data.data.showNavigatorDescriptions);
        }
    }

    useEffect(() => {
        fetchContent();
        fetchUserData();
    }, []);

    const closeModal = () => {
        setIsModalOpen(false);
        setSelectedContent(null);
    };

    const updateShowDescription = async () => {
        const response = await api.put(`/api/user/${userData._id}`, { showNavigatorDescriptions: !showDescription });
        if (response.data.success) {
            setShowDescription(!showDescription);
        }
    }

    return (
        <UserLayout>
            <div className="max-h-screen">
                <div className="lg:flex lg:flex-row lg:justify-between lg:items-center lg:pr-5">
                    <BackNav title="Навигатор" />
                    <div className="lg:block hidden">
                        <div className="flex items-center gap-x-4">
                            <div className="">Показывать описание</div>
                            <Switch
                                checked={showDescription}
                                onChange={() => { 
                                    updateShowDescription();
                                }} 
                            />
                        </div>
                    </div>
                </div>
                
                <div className="-mt-2 bg-[#031F23]">
                    <p className="px-4 lg:w-1/2" dangerouslySetInnerHTML={{ __html: content?.content }}></p>
                    <div className='relative'>
                        <div className="relative flex justify-center items-center lg:hidden">
                            <img 
                                src={navigatorMobile} 
                                alt={"Навигатор"} 
                                className=' rounded-lg object-top z-10' 
                            />
                        </div>
                        <div className="relative hidden lg:block justify-center items-center">
                            <img 
                                src={navigatorDesktop} 
                                alt={"Навигатор"} 
                                className=' rounded-lg object-top z-10' 
                            />
                        </div>
                        <div 
                            className="absolute inset-0 z-10"
                            style={{
                                background: 'linear-gradient(to top, #031F2300 80%, #031F23 99%)',
                            }}
                        />
                        <div 
                            className="absolute inset-0 z-10"
                            style={{
                                background: 'linear-gradient(to bottom, #031F2300 60%, #031F23 100%)',
                            }}
                        />
                        <button onClick={() => {
                            if (showDescription) {
                                setIsModalOpen(true)
                                setSelectedContent(descriptions.find((item: NavigatorDescription) => item.name === "consciousness-library") || null)
                            } else {
                                navigate("/client/consciousness-library")
                            }
                        }} className="absolute top-[19%] left-[25%] w-[116px] h-[40px] z-20 lg:top-[35%] lg:left-[60%] cursor-pointer">
                            <img src={navigatorConsciousnessLibrary} alt={""} className="object-cover w-full h-full" />
                        </button>
                        <button onClick={() => {
                            if (showDescription) {
                                setIsModalOpen(true)
                                setSelectedContent(descriptions.find((item: NavigatorDescription) => item.name === "spirit-forge") || null)
                            } else {
                                navigate("/client/spirit-forge")
                            }
                        }} className="absolute top-[33%] left-[18%] w-[93px] h-[40px] z-20 lg:top-[50%] lg:left-[42%] cursor-pointer">
                            <img src={navigatorSpiritForge} alt={""} className="object-cover w-full h-full" />
                        </button>
                        <button onClick={() => {
                            if (showDescription) {
                                setIsModalOpen(true)
                                setSelectedContent(descriptions.find((item: NavigatorDescription) => item.name === "relationship-workshop") || null)
                            } else {
                                navigate("/client/relationship-workshop")
                            }
                        }} className="absolute top-[43%] left-[20%] w-[96px] h-[61px] z-20 lg:top-[48%] lg:left-[15%] cursor-pointer">
                            <img src={navigatorRelationshipWorkshop} alt={""} className="object-cover w-full h-full" />
                        </button>
                        <button onClick={() => {
                            if (showDescription) {
                                setIsModalOpen(true)
                                setSelectedContent(descriptions.find((item: NavigatorDescription) => item.name === "masters-tower") || null)
                            } else {
                                navigate("/client/masters-tower")
                            }
                        }} className="absolute top-[43%] left-[72%] w-[78px] h-[61px] z-20 lg:top-[63%] lg:left-[77%] cursor-pointer">
                            <img src={navigatorMastersTower} alt={""} className="object-cover w-full h-full" />
                        </button>
                        <button onClick={() => {
                            if (showDescription) {
                                setIsModalOpen(true)
                                setSelectedContent(descriptions.find((item: NavigatorDescription) => item.name === "health-lab") || null)
                            } else {
                                navigate("/client/health-lab")
                            }
                        }} className="absolute top-[56%] left-[7%] w-[107px] h-[61px] z-20 lg:top-[76%] lg:left-[9%] cursor-pointer">
                            <img src={navigatorHealthLab} alt={""} className="object-cover w-full h-full" />
                        </button>
                        <button onClick={() => {
                            if (showDescription) {
                                setIsModalOpen(true)
                                setSelectedContent(descriptions.find((item: NavigatorDescription) => item.name === "femininity-gazebo") || null)
                            } else {
                                navigate("/client/femininity-gazebo")
                            }
                        }} className="absolute top-[68%] left-[65%] w-[115px] h-[61px] z-20 lg:top-[74%] lg:left-[86%] cursor-pointer">
                            <img src={navigatorFemininityGazebo} alt={""} className="object-cover w-full h-full" />
                        </button>
                        <button onClick={() => {
                            navigate("/client/beggining-journey")
                        }} className="absolute top-[75%] left-[22%] w-[99px] h-[61px] z-20 lg:top-[88%] lg:left-[45%] cursor-pointer">
                            <img src={navigatorBegginingJourney} alt={""} className="object-cover w-full h-full" />
                        </button>
                    </div>
                    <div className="px-4 mt-2 pb-10 lg:hidden">
                        <div className="flex items-center justify-between">
                            <div className="">Показывать описание</div>
                            <Switch
                                checked={showDescription}
                                onChange={() => { 
                                    updateShowDescription();
                                }} 
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
                </div>
            )}
        </UserLayout>
    )
}