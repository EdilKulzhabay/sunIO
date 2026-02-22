import { UserLayout } from "../../components/User/UserLayout"
import { BackNav } from "../../components/User/BackNav"
import api from "../../api"
import { useState } from "react"
import { useEffect } from "react"
import navigatorMobile from "../../assets/navigatorMobile.jpg"
import navigatorDesktop from "../../assets/navigatorDesktop.png"
import { Switch } from "../../components/User/Switch"
import { useNavigate } from "react-router-dom"
import { Link } from "react-router-dom"
import navigatorConsciousnessLibraryMobile from "../../assets/navigatorConsciousnessLibraryMobile.png"
import navigatorRelationshipWorkshopMobile from "../../assets/navigatorRelationshipWorkshopMobile.png"
import navigatorSpiritForgeMobile from "../../assets/navigatorSpiritForgeMobile.png"
import navigatorMastersTowerMobile from "../../assets/navigatorMastersTowerMobile.png"
import navigatorHealthLabMobile from "../../assets/navigatorHealthLabMobile.png"
import navigatorFemininityGazeboMobile from "../../assets/navigatorFemininityGazeboMobile.png"
import navigatorBegginingJourneyMobile from "../../assets/navigatorBegginingJourneyMobile.png"
import navigatorConsciousnessLibraryDesktop from "../../assets/navigatorConsciousnessLibraryDesktop.png"
import navigatorRelationshipWorkshopDesktop from "../../assets/navigatorRelationshipWorkshopDesktop.png"
import navigatorSpiritForgeDesktop from "../../assets/navigatorSpiritForgeDesktop.png"
import navigatorMastersTowerDesktop from "../../assets/navigatorMastersTowerDesktop.png"
import navigatorHealthLabDesktop from "../../assets/navigatorHealthLabDesktop.png"
import navigatorFemininityGazeboDesktop from "../../assets/navigatorFemininityGazeboDesktop.png"
import navigatorBegginingJourneyDesktop from "../../assets/navigatorBegginingJourneyDesktop.png"
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
    const [loading, setLoading] = useState(false);

    const fetchContent = async () => {
        const response = await api.get(`/api/dynamic-content/name/navigator`);
        if (response.data.success) {
            setContent(response.data.data);
        }
        const descriptionsResponse = await api.get(`api/navigator-descriptions`)
        if (descriptionsResponse.data.success) {
            setDescriptions(descriptionsResponse.data.data)
        }
        setLoading(false);
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
        setLoading(true);
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

    if (loading) {
        return (
            <div className="flex justify-center items-center h-screen bg-[#031F23]">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
            </div>
        );
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
                        }} className="absolute top-[10%] left-[50%] w-[95px] h-[61px] z-20 lg:w-[176px] lg:h-[72px] lg:top-[25%] lg:left-[49%] cursor-pointer">
                            <img src={navigatorConsciousnessLibraryMobile} alt="" className="object-cover w-full h-full block lg:hidden" />
                            <img src={navigatorConsciousnessLibraryDesktop} alt="" className="object-cover w-full h-full hidden lg:block" />
                        </button>
                        <button onClick={() => {
                            if (showDescription) {
                                setIsModalOpen(true)
                                setSelectedContent(descriptions.find((item: NavigatorDescription) => item.name === "spirit-forge") || null)
                            } else {
                                navigate("/client/spirit-forge")
                            }
                        }} className="absolute top-[28%] left-[32%] w-[72px] h-[61px] z-20 lg:w-[140px] lg:h-[72px] lg:top-[44%] lg:left-[37%] cursor-pointer">
                            <img src={navigatorSpiritForgeMobile} alt="" className="object-cover w-full h-full block lg:hidden" />
                            <img src={navigatorSpiritForgeDesktop} alt="" className="object-cover w-full h-full hidden lg:block" />
                        </button>
                        <button onClick={() => {
                            if (showDescription) {
                                setIsModalOpen(true)
                                setSelectedContent(descriptions.find((item: NavigatorDescription) => item.name === "relationship-workshop") || null)
                            } else {
                                navigate("/client/relationship-workshop")
                            }
                        }} className="absolute top-[43%] left-[20%] w-[96px] h-[61px] z-20 lg:w-[157px] lg:h-[93px] lg:top-[60%] lg:left-[24%] cursor-pointer">
                            <img src={navigatorRelationshipWorkshopMobile} alt="" className="object-cover w-full h-full block lg:hidden" />
                            <img src={navigatorRelationshipWorkshopDesktop} alt="" className="object-cover w-full h-full hidden lg:block" />
                        </button>
                        <button onClick={() => {
                            if (showDescription) {
                                setIsModalOpen(true)
                                setSelectedContent(descriptions.find((item: NavigatorDescription) => item.name === "masters-tower") || null)
                            } else {
                                navigate("/client/masters-tower")
                            }
                        }} className="absolute top-[43%] left-[72%] w-[78px] h-[61px] z-20 lg:w-[129px] lg:h-[93px] lg:top-[63%] lg:left-[75%] cursor-pointer">
                            <img src={navigatorMastersTowerMobile} alt="" className="object-cover w-full h-full block lg:hidden" />
                            <img src={navigatorMastersTowerDesktop} alt="" className="object-cover w-full h-full hidden lg:block" />
                        </button>
                        <button onClick={() => {
                            if (showDescription) {
                                setIsModalOpen(true)
                                setSelectedContent(descriptions.find((item: NavigatorDescription) => item.name === "health-lab") || null)
                            } else {
                                navigate("/client/health-lab")
                            }
                        }} className="absolute top-[56%] left-[7%] w-[107px] h-[61px] z-20 lg:w-[173px] lg:h-[93px] lg:top-[76%] lg:left-[9%] cursor-pointer">
                            <img src={navigatorHealthLabMobile} alt="" className="object-cover w-full h-full block lg:hidden" />
                            <img src={navigatorHealthLabDesktop} alt="" className="object-cover w-full h-full hidden lg:block" />
                        </button>
                        <button onClick={() => {
                            if (showDescription) {
                                setIsModalOpen(true)
                                setSelectedContent(descriptions.find((item: NavigatorDescription) => item.name === "femininity-gazebo") || null)
                            } else {
                                navigate("/client/femininity-gazebo")
                            }
                        }} className="absolute top-[69%] left-[66%] w-[115px] h-[61px] z-20 lg:w-[186px] lg:h-[93px] lg:top-[74%] lg:left-[84%] cursor-pointer">
                            <img src={navigatorFemininityGazeboMobile} alt="" className="object-cover w-full h-full block lg:hidden" />
                            <img src={navigatorFemininityGazeboDesktop} alt="" className="object-cover w-full h-full hidden lg:block" />
                        </button>
                        <button onClick={() => {
                            navigate("/client/beggining-journey")
                        }} className="absolute top-[78%] left-[27%] w-[99px] h-[61px] z-20 lg:w-[183px] lg:h-[72px] lg:top-[82%] lg:left-[35%] cursor-pointer">
                            <img src={navigatorBegginingJourneyMobile} alt="" className="object-cover w-full h-full block lg:hidden" />
                            <img src={navigatorBegginingJourneyDesktop} alt="" className="object-cover w-full h-full hidden lg:block" />
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
            <div className="flex-1 bg-[#031F23]">
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
                                className="absolute top-[26px] right-5 cursor-pointer"
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

                            <Link
                                className="block bg-[#C4841D] text-white py-2.5 text-center font-medium rounded-full mt-4 w-full" 
                                to={selectedContent.link}
                            >
                                <p>Перейти</p>
                            </Link>
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
                                className="absolute top-[26px] right-5 cursor-pointer"
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

                            <Link
                                className="block bg-[#C4841D] text-white py-2.5 text-center font-medium rounded-full mt-4 w-full" 
                                to={selectedContent.link}
                            >
                                <p>Перейти</p>
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </UserLayout>  
    )
}