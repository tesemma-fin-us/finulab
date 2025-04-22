import '../../../../layout/app-layout.css';

import axios from 'axios';
import {throttle} from 'lodash';
import {useNavigate} from 'react-router-dom';
import 'react-image-crop/dist/ReactCrop.css';
import BeatLoader from 'react-spinners/BeatLoader';
import {useDispatch, useSelector} from 'react-redux';
import {useRef, useState, useLayoutEffect, useEffect, useMemo, useCallback} from 'react';
import ReactCrop, {convertToPercentCrop, makeAspectCrop} from 'react-image-crop';
import {AppRegistrationSharp, AssuredWorkload, BorderColorSharp, CameraAlt, CheckCircleOutline, Close, CloseSharp, DeleteSharp, ElderlySharp, FollowTheSignsSharp, HighlightOffOutlined, KeyboardBackspace, LockPersonSharp, PaymentsSharp, PersonRemoveSharp, PostAdd, Search, TrendingUp, Tsunami, Verified} from '@mui/icons-material';

import Post from '../../../../components/post';
import generalOpx from '../../../../functions/generalFunctions';
import FinulabNotification from '../../../../components/notification/notification';
import FinulabNetworkDesc from '../../../../components/networkDesc/finulabNetworkDesc';
import MiniaturizedPrediction from '../../../../components/miniaturized/prediction/mini-prediction';
import FinulabProfileWatchlist from '../../../../components/profileWatchlist/finulabProfileWatchlist';

import {selectUser} from '../../../../reduxStore/user';
import {setViewMedia} from '../../../../reduxStore/viewMedia';
import {setModeratorStatus, selectModeratorStatus} from '../../../../reduxStore/moderatorStatus';
import {setQuickNotifications, selectNotifications} from '../../../../reduxStore/notifications';
import {setPostCommunityOptns, selectPostCommunityOptns} from '../../../../reduxStore/postCommunityOptns';
import {setMarketHoldings, addToMarketHoldings, selectMarketHoldings} from '../../../../reduxStore/marketHoldings';
import {setPostEngagement, addToPostEngagement, selectPostEngagement} from '../../../../reduxStore/postEngagement';
import {updateProfilePageInformationState, selectPageInformationState} from '../../../../reduxStore/pageInformation';
import {setPredictionEngagement, addToPredictionEngagement, selectPredictionEngagement} from '../../../../reduxStore/predictionEngagement';
import {setNetworkCommunities, setNetworkFollowing, setNetworkFollowers, selectNetworkDesc} from '../../../../reduxStore/networkDesc';
import {setProfileDesc, 
    setPosts, updatePosts, updateProcessedHeights, processPostsHeights, clearProcessedHeights, 
    setMarkets, updateMarkets, updateMarketsProcessedHeights, processMarketsPostsHeights, clearMarketsProcessedHeights,
    setEngaged, updateEnagedProcessedHeights, processEngagedPostsHeights, clearEngagedProcessedHeights,
    setNotifications, updateNotifications, setProfileWatchlist,
    selectProfileData
} from '../../../../reduxStore/profileData';
import CommunityRules from '../../../../components/communityRules/communityRules';
import { format, getUnixTime } from 'date-fns';

export default function InnerCommunityProfilePage(props) {
    const navigate = useNavigate();
    const dispatch = useDispatch();
    const appState = useSelector(selectPageInformationState);

    const user = useSelector(selectUser);
    const networkDesc = useSelector(selectNetworkDesc);
    const profileData = useSelector(selectProfileData);
    const u_notifications = useSelector(selectNotifications);
    const u_postEngagement = useSelector(selectPostEngagement);
    const u_marketHoldings = useSelector(selectMarketHoldings);
    const u_moderatorStatus = useSelector(selectModeratorStatus);
    const postCommunityOptns = useSelector(selectPostCommunityOptns);
    const u_predictionEngagement = useSelector(selectPredictionEngagement);
    
    const contentBodyRef = useRef();
    const [contentBodyWidth, setContentBodyWidth] = useState([0, false]);
    useLayoutEffect(() => {
        const contentBodyWidthFunction = () => {
            if(contentBodyRef.current) {
                const bodyWidth = contentBodyRef.current.getBoundingClientRect().width;
                setContentBodyWidth([bodyWidth, true]);

                let profilePageInformation = {...appState["profile"]};
                profilePageInformation["wallHeight"] = bodyWidth * (1 / 3);
                dispatch(
                    updateProfilePageInformationState(profilePageInformation)
                );
            }
        }

        window.addEventListener('resize', contentBodyWidthFunction);
        contentBodyWidthFunction();
        return () => window.removeEventListener('resize', contentBodyWidthFunction);
    }, [contentBodyRef.current]);

    const scrollController = useRef();
    useEffect(() => {
        if(props.f_viewPort === "small") {
            if(contentBodyWidth[1]) {
                const handleScrollHomePage = (e) => {
                    if(!(props.displayView === "communities" || props.displayView === "following" || props.displayView === "followers")) {
                        let profilePageInformation = {...appState["profile"]};
    
                        if(profilePageInformation["view"] === props.displayView) {
                            const c_scrollTopKey = ((1/3) * contentBodyWidth[0]) + 177.5;
                            const c_scrollTopTest = document.documentElement.scrollTop >= c_scrollTopKey;

                            profilePageInformation["fixed"] = c_scrollTopTest;
                            if(props.displayView === "") {
                                profilePageInformation["scrollTop"] = document.documentElement.scrollTop;
                                
                                if(c_scrollTopTest) {
                                    if(profilePageInformation["secondaryScrollTop"] < c_scrollTopKey) {profilePageInformation["secondaryScrollTop"] = c_scrollTopKey;}
                                    if(profilePageInformation["tertiaryScrollTop"] < c_scrollTopKey) {profilePageInformation["tertiaryScrollTop"] = c_scrollTopKey;}
                                    if(profilePageInformation["quaterneryScrollTop"] < c_scrollTopKey) {profilePageInformation["quaterneryScrollTop"] = c_scrollTopKey;}
                                } else {
                                    profilePageInformation["secondaryScrollTop"] = document.documentElement.scrollTop;
                                    profilePageInformation["tertiaryScrollTop"] = document.documentElement.scrollTop;
                                    profilePageInformation["quaterneryScrollTop"] = document.documentElement.scrollTop;
                                }
                            } else if(props.displayView === "markets") {
                                profilePageInformation["secondaryScrollTop"] = document.documentElement.scrollTop;
        
                                if(c_scrollTopTest) {
                                    if(profilePageInformation["scrollTop"] < c_scrollTopKey) {profilePageInformation["scrollTop"] = c_scrollTopKey;}
                                    if(profilePageInformation["tertiaryScrollTop"] < c_scrollTopKey) {profilePageInformation["tertiaryScrollTop"] = c_scrollTopKey;}
                                    if(profilePageInformation["quaterneryScrollTop"] < c_scrollTopKey) {profilePageInformation["quaterneryScrollTop"] = c_scrollTopKey;}
                                } else {
                                    profilePageInformation["scrollTop"] = document.documentElement.scrollTop;
                                    profilePageInformation["tertiaryScrollTop"] = document.documentElement.scrollTop;
                                    profilePageInformation["quaterneryScrollTop"] = document.documentElement.scrollTop;
                                }
                            } else if(props.displayView === "engaged" || props.displayView === "watchlist") {
                                profilePageInformation["tertiaryScrollTop"] = document.documentElement.scrollTop;
        
                                if(c_scrollTopTest) {
                                    if(profilePageInformation["scrollTop"] < c_scrollTopKey) {profilePageInformation["scrollTop"] = c_scrollTopKey;}
                                    if(profilePageInformation["secondaryScrollTop"] < c_scrollTopKey) {profilePageInformation["secondaryScrollTop"] = c_scrollTopKey;}
                                    if(profilePageInformation["quaterneryScrollTop"] < c_scrollTopKey) {profilePageInformation["quaterneryScrollTop"] = c_scrollTopKey;}
                                } else {
                                    profilePageInformation["scrollTop"] = document.documentElement.scrollTop;
                                    profilePageInformation["secondaryScrollTop"] = document.documentElement.scrollTop;
                                    profilePageInformation["quaterneryScrollTop"] = document.documentElement.scrollTop;
                                }
                            } else if(props.displayView === "notifications") {
                                profilePageInformation["quaterneryScrollTop"] = document.documentElement.scrollTop;
        
                                if(c_scrollTopTest) {
                                    if(profilePageInformation["scrollTop"] < c_scrollTopKey) {profilePageInformation["scrollTop"] = c_scrollTopKey;}
                                    if(profilePageInformation["secondaryScrollTop"] < c_scrollTopKey) {profilePageInformation["secondaryScrollTop"] = c_scrollTopKey;}
                                    if(profilePageInformation["tertiaryScrollTop"] < c_scrollTopKey) {profilePageInformation["tertiaryScrollTop"] = c_scrollTopKey;}
                                } else {
                                    profilePageInformation["scrollTop"] = document.documentElement.scrollTop;
                                    profilePageInformation["secondaryScrollTop"] = document.documentElement.scrollTop;
                                    profilePageInformation["tertiaryScrollTop"] = document.documentElement.scrollTop;
                                }
                            }
        
                            dispatch(
                                updateProfilePageInformationState(profilePageInformation)
                            );
                        } else {
                            profilePageInformation["view"] = props.displayView;
                            dispatch(
                                updateProfilePageInformationState(profilePageInformation)
                            );
                        }
                    }
                }
                
                const throttledHandleScrollHomePage = throttle(handleScrollHomePage, 50);
                document.addEventListener('scroll', throttledHandleScrollHomePage, { passive: true });

                return () => {
                    document.removeEventListener('scroll', throttledHandleScrollHomePage);
                };
            }
        } else {
            if(contentBodyWidth[1]) {
                const handleScrollHomePage = (e) => {
                    if(!(props.displayView === "communities" || props.displayView === "following" || props.displayView === "followers")) {
                        let profilePageInformation = {...appState["profile"]};
    
                        if(profilePageInformation["view"] === props.displayView) {
                            const c_scrollTopKey = ((1/3) * contentBodyWidth[0]) + 177.5;
                            const c_scrollTopTest = scrollController.current.scrollTop >= c_scrollTopKey;
        
                            profilePageInformation["fixed"] = c_scrollTopTest;
                            if(props.displayView === "") {
                                profilePageInformation["scrollTop"] = scrollController.current.scrollTop;
                                
                                if(c_scrollTopTest) {
                                    if(profilePageInformation["secondaryScrollTop"] < c_scrollTopKey) {profilePageInformation["secondaryScrollTop"] = c_scrollTopKey;}
                                    if(profilePageInformation["tertiaryScrollTop"] < c_scrollTopKey) {profilePageInformation["tertiaryScrollTop"] = c_scrollTopKey;}
                                    if(profilePageInformation["quaterneryScrollTop"] < c_scrollTopKey) {profilePageInformation["quaterneryScrollTop"] = c_scrollTopKey;}
                                } else {
                                    profilePageInformation["secondaryScrollTop"] = scrollController.current.scrollTop;
                                    profilePageInformation["tertiaryScrollTop"] = scrollController.current.scrollTop;
                                    profilePageInformation["quaterneryScrollTop"] = scrollController.current.scrollTop;
                                }
                            } else if(props.displayView === "markets") {
                                profilePageInformation["secondaryScrollTop"] = scrollController.current.scrollTop;
        
                                if(c_scrollTopTest) {
                                    if(profilePageInformation["scrollTop"] < c_scrollTopKey) {profilePageInformation["scrollTop"] = c_scrollTopKey;}
                                    if(profilePageInformation["tertiaryScrollTop"] < c_scrollTopKey) {profilePageInformation["tertiaryScrollTop"] = c_scrollTopKey;}
                                    if(profilePageInformation["quaterneryScrollTop"] < c_scrollTopKey) {profilePageInformation["quaterneryScrollTop"] = c_scrollTopKey;}
                                } else {
                                    profilePageInformation["scrollTop"] = scrollController.current.scrollTop;
                                    profilePageInformation["tertiaryScrollTop"] = scrollController.current.scrollTop;
                                    profilePageInformation["quaterneryScrollTop"] = scrollController.current.scrollTop;
                                }
                            } else if(props.displayView === "engaged" || props.displayView === "watchlist") {
                                profilePageInformation["tertiaryScrollTop"] = scrollController.current.scrollTop;
        
                                if(c_scrollTopTest) {
                                    if(profilePageInformation["scrollTop"] < c_scrollTopKey) {profilePageInformation["scrollTop"] = c_scrollTopKey;}
                                    if(profilePageInformation["secondaryScrollTop"] < c_scrollTopKey) {profilePageInformation["secondaryScrollTop"] = c_scrollTopKey;}
                                    if(profilePageInformation["quaterneryScrollTop"] < c_scrollTopKey) {profilePageInformation["quaterneryScrollTop"] = c_scrollTopKey;}
                                } else {
                                    profilePageInformation["scrollTop"] = scrollController.current.scrollTop;
                                    profilePageInformation["secondaryScrollTop"] = scrollController.current.scrollTop;
                                    profilePageInformation["quaterneryScrollTop"] = scrollController.current.scrollTop;
                                }
                            } else if(props.displayView === "notifications") {
                                profilePageInformation["quaterneryScrollTop"] = scrollController.current.scrollTop;
        
                                if(c_scrollTopTest) {
                                    if(profilePageInformation["scrollTop"] < c_scrollTopKey) {profilePageInformation["scrollTop"] = c_scrollTopKey;}
                                    if(profilePageInformation["secondaryScrollTop"] < c_scrollTopKey) {profilePageInformation["secondaryScrollTop"] = c_scrollTopKey;}
                                    if(profilePageInformation["tertiaryScrollTop"] < c_scrollTopKey) {profilePageInformation["tertiaryScrollTop"] = c_scrollTopKey;}
                                } else {
                                    profilePageInformation["scrollTop"] = scrollController.current.scrollTop;
                                    profilePageInformation["secondaryScrollTop"] = scrollController.current.scrollTop;
                                    profilePageInformation["tertiaryScrollTop"] = scrollController.current.scrollTop;
                                }
                            }
        
                            dispatch(
                                updateProfilePageInformationState(profilePageInformation)
                            );
                        } else {
                            profilePageInformation["view"] = props.displayView;
                            dispatch(
                                updateProfilePageInformationState(profilePageInformation)
                            );
                        }
                    }
                }
        
                const scrollElement = scrollController.current;
                scrollElement.addEventListener('scroll', handleScrollHomePage, {passive: true});
        
                return () => {
                    if(scrollElement) {
                        scrollElement.removeEventListener('scroll', handleScrollHomePage);
                    }
                };
            }
        }
    }, [contentBodyWidth, props.displayView, appState["profile"]["view"]]);
    
    const base64ToFile = (base64String, fileName = 'unknown') => {
        const mimeType = base64String.match(/^data:(image\/\w+);base64,/)[1];
        const base64Data = base64String.replace(/^data:image\/\w+;base64,/, "");
        
        const byteCharacters = atob(base64Data);
        const byteNumbers = new Array(byteCharacters.length);
        for(let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        const byteArray = new Uint8Array(byteNumbers);
        
        
        const blob = new Blob([byteArray], { type: mimeType });
        
        const extension = mimeType.split('/')[1];
        const finalFileName = fileName + '.' + extension;
        
        return new File([blob], finalFileName, { type: mimeType });
    }

    const imgRef = useRef(null);
    const wallpaperImgRef = useRef(null);
    const previewCanvasRef = useRef(null);
    const previewWallpaperCanvasRef = useRef(null);

    const [crop, setCrop] = useState({});
    const [wallpaperCrop, setWallpaperCrop] = useState({});

    const [profileImageError, setProfileImageError] = useState(0);
    const [profileImageSource, setProfileImageSource] = useState("");
    const [wallpaperImageSource, setWallpaperImageSource] = useState("");
    const [profileImageUpdatedSource, setProfileImageUpdatedSource] = useState("");
    const [wallpaperImageUpdatedSource, setWallpaperImageUpdatedSource] = useState("");

    const [editProfile, setEditProfile] = useState(false);
    const [profileSettings, setProfileSettings] = useState({"bio": ""});
    const editProfileToggle = () => {editProfile ? setEditProfile(false) : setEditProfile(true);}
    const editProfileSettingsHandler = (e) => {
        const {name, value} = e.target;
        setProfileSettings(
            {
                ...profileSettings, [name]: value
            }
        );
    }

    const overlayRef = useRef();
    const overlayContainerRef = useRef();
    const [saveProfileSettings, setSaveProfileSettings] = useState(false);
    useEffect(() => {
        if(overlayContainerRef.current && overlayRef.current) {
            const handleClickOutside = (event) => {
                if(overlayRef) {
                    if(overlayContainerRef.current?.contains(event?.target) && !overlayRef.current?.contains(event?.target)) {
                        if(!saveProfileSettings && profileImageSource === "" && wallpaperImageSource === "") {setEditProfile(false);}
                    }
                }
            }
    
            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            }
        }
    }, [crop, profileImageSource, wallpaperCrop, wallpaperImageSource, editProfile, saveProfileSettings]);

    const profileImageHandler = async (e) => {
        const file = e.target.files?.[0];
        if(!file) return;

        const reader = new FileReader();
        reader.addEventListener("load", () => 
            {
                const imgElement = new Image();
                const imgUrl = reader.result?.toString() || "";

                imgElement.addEventListener("load", (e) => 
                    {
                        const {naturalWidth, naturalHeight} = e.currentTarget;
                        if(naturalWidth < 90 || naturalHeight < 90) {
                            setProfileImageError(1);

                            setTimeout(() => {
                                setProfileImageError(0);
                                return;
                            }, 2000);
                        }
                    }
                );

                setProfileImageSource(imgUrl);
            }
        );
        reader.readAsDataURL(file);
    }
    const wallpaperImageHandler = async (e) => {
        const file = e.target.files?.[0];
        if(!file) return;

        const reader = new FileReader();
        reader.addEventListener("load", () => 
            {
                const imgElement = new Image();
                const imgUrl = reader.result?.toString() || "";
                
                imgElement.addEventListener("load", (e) => 
                    {
                        const {naturalWidth, naturalHeight} = e.currentTarget;
                        if(naturalWidth < 390 || naturalHeight < 130) {
                            setProfileImageError(2);

                            setTimeout(() => {
                                setProfileImageError(0);
                                return;
                            }, 2000);
                        }
                    }
                );

                setWallpaperImageSource(imgUrl)
            }
        );
        reader.readAsDataURL(file);
    }

    const onProfileImageLoad = (e) => {
        const {width, height} = e.currentTarget;
        const cropWidthInPercent = (90 / width) * 100;
        const cropHeightInPercent = (90 / height) * 100;

        const crop = makeAspectCrop(
            {
                unit: "%",
                width: cropWidthInPercent,
                height: cropHeightInPercent
            }, 1,
            width,
            height
        );
        setCrop(crop)
    }
    const onWallpaperImageLoad = (e) => {
        const {width, height} = e.currentTarget;
        const cropWidthInPercent = (390 / width) * 100;
        const cropHeightInPercent = (130 / height) * 100;

        const crop = makeAspectCrop(
            {
                unit: "%",
                width: cropWidthInPercent,
                height: cropHeightInPercent
            }, 3 / 1,
            width,
            height
        );
        setWallpaperCrop(crop);
    }

    const setCanvasPreview = (image, canvas, crop) => {
        const ctx = canvas.getContext("2d");
        if(!ctx) {
            throw new Error("No 2d context");
        }

        canvas.width = Math.floor((crop.width * image.width) / 100);
        canvas.height = Math.floor((crop.height * image.height) / 100);
        
        const cropX = ((crop.x * image.width) / 100);
        const cropY = ((crop.y * image.height) / 100);

        ctx.translate(-cropX, -cropY);
        ctx.drawImage(
            image,
            0, 
            0, 
            image.naturalWidth,
            image.naturalHeight,
            0,
            0,
            image.width,
            image.height
        );

        ctx.restore();
    }

    const [applyLoading, setApplyLoading] = useState(false);
    const [applyLoadingError, setApplyLoadingError] = useState(0);
    const profileImageUpdatedSourceHandler = async () => {
        setApplyLoading(true);

        setCanvasPreview(
            imgRef.current,
            previewCanvasRef.current,
            convertToPercentCrop(
                crop,
                imgRef.current.width,
                imgRef.current.height
            )
        );

        const dataUrl = previewCanvasRef.current.toDataURL();
        const utilizeFile = base64ToFile(dataUrl, `${props.userId}-profileImage`);

        await generalOpx.axiosInstance.put(`/users/upload`, {}).then(
            async (response) => {
                if(response.data["status"] === "success") {
                    await axios.put(response.data["data"], utilizeFile, {headers: {"Content-Type": "image/jpeg"}});

                    setProfileImageUpdatedSource(String(response.data["data"].split('?')[0]));
                    setProfileImageSource("");
                    setApplyLoading(false);
                } else {
                    setApplyLoadingError(1);

                    setTimeout(() => {
                        setApplyLoadingError(0);
                        setApplyLoading(false);
                    }, 2000);
                }
            }
        ).catch(
            () => {
                setApplyLoadingError(1);

                setTimeout(() => {
                    setApplyLoadingError(0);
                    setApplyLoading(false);
                }, 2000);
            }
        );
    }
    const profileWallpaperUpdatedSourceHandler = async () => {
        setApplyLoading(true);

        setCanvasPreview(
            wallpaperImgRef.current,
            previewWallpaperCanvasRef.current,
            convertToPercentCrop(
                wallpaperCrop,
                wallpaperImgRef.current.width,
                wallpaperImgRef.current.height
            )
        );

        const dataUrl = previewWallpaperCanvasRef.current.toDataURL();
        const utilizeFile = base64ToFile(dataUrl, `${props.userId}-profileWallpaper`);

        await generalOpx.axiosInstance.put(`/users/upload`, {}).then(
            async (response) => {
                if(response.data["status"] === "success") {
                    await axios.put(response.data["data"], utilizeFile, {headers: {"Content-Type": "image/jpeg"}});

                    setWallpaperImageUpdatedSource(String(response.data["data"].split('?')[0]));
                    setWallpaperImageSource("");
                    setApplyLoading(false);
                } else {
                    setApplyLoadingError(1);

                    setTimeout(() => {
                        setApplyLoadingError(0);
                        setApplyLoading(false);
                    }, 2000);
                }
            }
        ).catch(
            () => {
                setApplyLoadingError(1);

                setTimeout(() => {
                    setApplyLoadingError(0);
                    setApplyLoading(false);
                }, 2000);
            }
        );
    }

    const profileSettingsSetter = async () => {
        setSaveProfileSettings(true);

        const ownUpdateSettings = await generalOpx.axiosInstance.post(`/users/community-update-settings`, 
            {
                "bio": profileSettings.bio,
                "communityName": props.userId,
                "profileImage": profileImageUpdatedSource === "" ? profileData["profileDesc"]["data"]["profilePicture"] : profileImageUpdatedSource,
                "wallpaperImage": wallpaperImageUpdatedSource === "" ? profileData["profileDesc"]["data"]["profileWallpaper"] : wallpaperImageUpdatedSource
            }
        );

        if(ownUpdateSettings.data["status"] === "success") {
            let profileDesc = {...profileData["profileDesc"]["data"]};
            profileDesc["bio"] = profileSettings.bio;
            profileDesc["profilePicture"] = profileImageUpdatedSource === "" ? profileData["profileDesc"]["data"]["profilePicture"] : profileImageUpdatedSource;
            profileDesc["profileWallpaper"] = wallpaperImageUpdatedSource === "" ? profileData["profileDesc"]["data"]["profileWallpaper"] : wallpaperImageUpdatedSource;

            dispatch(
                setProfileDesc(
                    {
                        "data": profileDesc,
                        "dataLoading": false
                    }
                )
            );

            let u_moderatorStatusCopy = [...u_moderatorStatus];
            if(u_moderatorStatusCopy.some(u_modCommDesc => u_modCommDesc.community === props.userId)) {
                const u_modUpdateIndex = u_moderatorStatus.findIndex(u_modCommDesc => u_modCommDesc.community === props.userId);
                u_moderatorStatusCopy[u_modUpdateIndex] = {
                    "community": props.userId,
                    "profileImage": profileImageUpdatedSource === "" ? profileData["profileDesc"]["data"]["profilePicture"] : profileImageUpdatedSource,
                    "type": u_moderatorStatus[u_modUpdateIndex]["type"]
                };

                dispatch(
                    setModeratorStatus(
                        u_moderatorStatusCopy
                    )
                );
            }

            setCrop({});
            setWallpaperCrop({});
            setProfileImageUpdatedSource("")
            setWallpaperImageUpdatedSource("");

            setEditProfile(false);
        } else {
            setProfileImageError(4);

            setTimeout(() => {
                setProfileImageError(0);
            }, 2000);
        }

        setSaveProfileSettings(false);
    }


    const setupViewMedia = (selectedImg) => {
        dispatch(
            setViewMedia(
                {
                    "index": 0,
                    "media": [[selectedImg, "photo"]]
                }
            )
        );
    }

    const [setProfileCalled, setSetProfileCalled] = useState("");
    const [modDeleteEditorStat, setModDeleteEditorStat] = useState([]);
    const [modSettingsEditorSettings, setModSettingsEditorSettings] = useState([]);
    const setProfile = async () => {
        const userId = props.userId;
        
        if(setProfileCalled !== userId) {
            setSetProfileCalled(userId);

            if(user) {
                if(u_moderatorStatus.some(modStat => modStat.community === userId)) {
                    const profileDesc = await generalOpx.axiosInstance.put(`/users/own-community-desc`, {"community": userId});
                    if(profileDesc.data["status"] === "success") {
                        dispatch(
                            setProfileDesc(
                                {
                                    "data": profileDesc.data["data"],
                                    "dataLoading": false
                                }
                            )
                        );
    
                        setProfileSettings(
                            {
                                "bio": profileDesc.data["data"]["bio"]
                            }
                        );
                        setModDeleteEditorStat(
                            Array(profileDesc.data["data"]["moderatorsPrivileges"].length).fill([false, "25px", 0])
                        );
                        setModSettingsEditorSettings([...profileDesc.data["data"]["moderatorsPrivileges"]]);
                    }
                } else {
                    const profileDesc = await generalOpx.axiosInstance.put(`/users/general-community-desc`, {"community": userId});
                    if(profileDesc.data["status"] === "success") {
                        dispatch(
                            setProfileDesc(
                                {
                                    "data": profileDesc.data["data"],
                                    "dataLoading": false
                                }
                            )
                        );
                    }
                }
            } else {
                const profileDesc = await generalOpx.axiosInstance.put(`/users/general-community-desc`, {"community": userId});
                if(profileDesc.data["status"] === "success") {
                    dispatch(
                        setProfileDesc(
                            {
                                "data": profileDesc.data["data"],
                                "dataLoading": false
                            }
                        )
                    );
                }
            }
        }
    }

    useMemo(() => {
        if(!(props.userId === null || props.userId === undefined || props.userId === "")) {
            if(!(props.displayView === null || props.displayView === undefined)) {
                if(profileData["profileDesc"]["dataLoading"]) {
                    setProfile();
                    
                    if(scrollController.current) {
                        if(props.f_viewPort === "small") {
                            document.documentElement.scrollTop = 0;
                        } else {
                            scrollController.current.scrollTop = 0;
                        }
                    }
                } else if(props.userId !== profileData["profileDesc"]["data"]["username"]) {
                    dispatch(
                        setProfileDesc(
                            {
                                "data": {},
                                "dataLoading": true
                            }
                        )
                    );

                    if(scrollController.current) {
                        if(props.f_viewPort === "small") {
                            document.documentElement.scrollTop = 0;
                        } else {
                            scrollController.current.scrollTop = 0;
                        }
                    }

                    dispatch(
                        updateProfilePageInformationState(
                            {
                                "view": "unknown",
                                "fixed": false,
                                "visible": true, 
                                "wallHeight": appState["profile"]["wallHeight"],
                                "scrollTop": 0,
                                "secondaryScrollTop": 0,
                                "tertiaryScrollTop": 0,
                                "quaterneryScrollTop": 0
                            }
                        )
                    );

                    setProfile();
                } else {
                    if(user) {
                        if(u_moderatorStatus.some(modStat => modStat.community === props.userId)) {
                            setProfileSettings(
                                {
                                    "bio": profileData["profileDesc"]["data"]["bio"]
                                }
                            );
                            setModDeleteEditorStat(
                                Array(profileData["profileDesc"]["data"]["moderatorsPrivileges"].length).fill([false, "25px", 0])
                            );
                            setModSettingsEditorSettings([...profileData["profileDesc"]["data"]["moderatorsPrivileges"]]);
                        }
                    }

                    if(scrollController.current) {
                        setTimeout(() => {
                            let targetScrollTop = 0;
                            if(props.displayView === "") {
                                targetScrollTop = appState["profile"]["scrollTop"];
                            } else if(props.displayView === "rules") {
                                targetScrollTop = appState["profile"]["secondaryScrollTop"];
                            } else if(props.displayView === "moderators") {
                                targetScrollTop = appState["profile"]["tertiaryScrollTop"];
                            } else if(props.displayView === "notifications") {
                                targetScrollTop = appState["profile"]["quaterneryScrollTop"];
                            }

                            if(props.f_viewPort === "small") {
                                document.documentElement.scrollTop = targetScrollTop;
                            } else {
                                if((scrollController.current?.scrollHeight - scrollController.current?.clientHeight) >= targetScrollTop) {
                                    scrollController.current.scrollTop = targetScrollTop;
                                }
                            }
                        }, 0);
                    }
                }
            }
        }
    }, [props.userId, props.displayView, scrollController.current]);

    const [homePagePostsBeingUpdated, setHomePagePostsBeingUpdated] = useState(false);
    const pullPosts = async (type, p_ninclude) => {
        const username = props.userId;

        if(type === "primary" || profileData["posts"]["data"].length < profileData["posts"]["dataCount"]) {
            if(!homePagePostsBeingUpdated) {
                if(type === "secondary") {setHomePagePostsBeingUpdated(true);}

                await generalOpx.axiosInstance.put(`/content/posts/community`,
                    {
                        "type": type,
                        "community": username,
                        "idsToExclude": p_ninclude,
                    }
                ).then(
                    async (response) => {
                        if(response.data["status"] === "success") {
                            if(type === "primary") {
                                let processedHeightsFunction = {
                                    "postHeights": Array(response.data["data"].length).fill(0),
                                    "processedRefs": {}
                                }
                                dispatch(
                                    updateProcessedHeights(processedHeightsFunction)
                                );
    
                                if(user && response.data["data"].length > 0) {
                                    if(u_postEngagement.length === 0) {
                                        const postIds = [...response.data["data"].map(p_data => p_data._id)];
                                        const postEngagements = await generalOpx.axiosInstance.put(`/content/posts/post-engagements`, {"postIds": postIds});
    
                                        if(postEngagements.data["status"] === "success" && postEngagements.data["data"].length > 0) {
                                            dispatch(
                                                setPostEngagement(postEngagements.data["data"])
                                            );
                                        }
                                    } else {
                                        const postIdsToEliminate = [...u_postEngagement.map(p_data => p_data.postId)];
                                        const postIds = [...response.data["data"].filter(({_id}) => !postIdsToEliminate.includes(_id)).map(({_id}) => _id)];
    
                                        if(postIds.length > 0) {
                                            const postEngagements = await generalOpx.axiosInstance.put(`/content/posts/post-engagements`, {"postIds": postIds});
                                            if(postEngagements.data["status"] === "success" && postEngagements.data["data"].length > 0) {
                                                dispatch(
                                                    addToPostEngagement(postEngagements.data["data"])
                                                );
                                            }
                                        }
                                    }
                                }
                                
                                dispatch(
                                    setPosts(
                                        {
                                            "username": username,
                                            "data": response.data["data"],
                                            "dataCount": response.data["dataCount"],
                                            "dataLoading": false
                                        }
                                    )
                                );
                            } else if(type === "secondary") {
                                let processedHeightsFunction = {
                                    "postHeights": [...profileData["processedHeights"]["postHeights"]].concat(Array(response.data["data"].length).fill(0)),
                                    "processedRefs": {...profileData["processedHeights"]["processedRefs"]}
                                }
                                dispatch(
                                    updateProcessedHeights(processedHeightsFunction)
                                );
    
                                if(user && response.data["data"].length > 0) {
                                    const postIdsToEliminate = [...u_postEngagement.map(p_data => p_data.postId)];
                                    const postIds = [...response.data["data"].filter(({_id}) => !postIdsToEliminate.includes(_id)).map(({_id}) => _id)];
    
                                    if(postIds.length > 0) {
                                        const postEngagements = await generalOpx.axiosInstance.put(`/content/posts/post-engagements`, {"postIds": postIds});
                                        if(postEngagements.data["status"] === "success" && postEngagements.data["data"].length > 0) {
                                            dispatch(
                                                addToPostEngagement(postEngagements.data["data"])
                                            );
                                        }
                                    }
                                }
    
                                dispatch(
                                    setPosts(
                                        {
                                            "username": username,
                                            "data": [...profileData["posts"]["data"], ...response.data["data"]],
                                            "dataCount": profileData["posts"]["dataCount"],
                                            "dataLoading": false
                                        }
                                    )
                                );
                            }

                            setHomePagePostsBeingUpdated(false);
                        }
                    }
                );
            }
        }
    }

    const postsObserverRef = useRef();
    const lastPostElementRef = useCallback(node => 
        {
            if(props.displayView !== "") return;
            if(profileData["posts"]["dataLoading"]) return;
            if(homePagePostsBeingUpdated) return;
            if(postsObserverRef.current) postsObserverRef.current.disconnect();
            
            postsObserverRef.current = new IntersectionObserver(entries => 
                {
                    if(entries[0].isIntersecting && profileData["posts"]["data"].length < profileData["posts"]["dataCount"]) {
                        let p_ninclude = [];
                        for(let i = 0; i < profileData["posts"]["data"].length; i++) {
                            p_ninclude.push(profileData["posts"]["data"][i]["_id"]);
                        }
                        console.log("function called");
                        pullPosts("secondary", p_ninclude)
                    }
                }
            );

            if(node) postsObserverRef.current.observe(node);
        }, [profileData["posts"]["dataCount"], homePagePostsBeingUpdated]
    );

    const [notificationsBeingUpdated, setNotificationsBeingUpdated] = useState(false);
    const pullNotifications = async (type, p_ninclude) => {
        const username = props.userId;
        if(type === "primary" || profileData["notifications"]["data"].length < profileData["notifications"]["dataCount"]) {
            await generalOpx.axiosInstance.put(`/notifications/community`, 
                {
                    "type": type,
                    "p_ninclude": p_ninclude,
                    "community": username
                }
            ).then(
                async (response) => {
                    if(response.data["status"] === "success") {
                        if(type === "primary") {
                            dispatch(
                                setNotifications(
                                    {
                                        "username": username,
                                        "data": response.data["data"],
                                        "dataCount": response.data["dataCount"],
                                        "dataLoading": false
                                    }
                                )
                            );

                            if(response.data["data"].length > 0) {
                                if(!response.data["data"][0]["read"]) {
                                    await generalOpx.axiosInstance.post(`/notifications/community-mark-as-read`, {"community": username});
                                }
                            }
                        } else if(type === "secondary") {
                            dispatch(
                                updateNotifications(response.data["data"])
                            );
                        }

                        setNotificationsBeingUpdated(false);
                    }
                }
            );
        }
    }

    const notificationsObserverRef = useRef();
    const lastNotificationElementRef = useCallback(node => 
        {
            if(props.displayView !== "notifications") return;
            if(profileData["notifications"]["dataLoading"]) return;
            if(notificationsBeingUpdated) return;
            if(notificationsObserverRef.current) notificationsObserverRef.current.disconnect();
            notificationsObserverRef.current = new IntersectionObserver(entries => 
                {
                    if(entries[0].isIntersecting && profileData["notifications"]["data"].length < profileData["notifications"]["dataCount"]) {
                        setNotificationsBeingUpdated(true);

                        let p_ninclude = [];
                        for(let i = 0; i < profileData["notifications"]["data"].length; i++) {
                            p_ninclude.push(profileData["notifications"]["data"][i]["_id"]);
                        }
                        pullNotifications("secondary", p_ninclude);
                    }
                }
            );
            if(node) notificationsObserverRef.current.observe(node);
        }, [profileData, notificationsBeingUpdated]
    );

    useEffect(() => {
        if(!(props.userId === null || props.userId === undefined || props.userId === "")) {
            if(props.displayView === "") {
                if(profileData["posts"]["dataLoading"]) {
                    dispatch(
                        clearProcessedHeights()
                    );
        
                    pullPosts("primary", []);
                } else {
                    if(profileData["posts"]["username"] !== props.userId) {
                        dispatch(
                            clearProcessedHeights()
                        );
        
                        dispatch(
                            setPosts(
                                {
                                    "username": "",
                                    "data": [],
                                    "dataCount": 0,
                                    "dataLoading": true
                                }
                            )
                        );
        
                        pullPosts("primary", []);
                    }
                }
            } else if(props.displayView === "notifications") {
                if(profileData["notifications"]["dataLoading"]) {
                    pullNotifications("primary", []);
                } else {
                    if(profileData["notifications"]["username"] !== props.userId) {
                        dispatch(
                            setNotifications(
                                {
                                    "username": "",
                                    "data": [],
                                    "dataCount": 0,
                                    "dataLoading": true
                                }
                            )
                        );

                        pullNotifications("primary", []);
                    }
                }

                if(Object.keys(u_notifications["communities"]["data"]).includes(props.userId)) {
                    const {[props.userId]:_, ...cleaned_communitiesData} = {...u_notifications["communities"]["data"]};
                    console.log({[props.userId]: [], ...cleaned_communitiesData});
                    dispatch(
                        setQuickNotifications(
                            {
                                "unread": {
                                    "data": u_notifications["unread"]["data"],
                                    "dataLoading": false
                                },
                                "communities": {
                                    "data": {[props.userId]: [], ...cleaned_communitiesData},
                                    "dataLoading": false
                                }
                            }
                        )
                    );
                }
            }
        }
    }, [props.userId, props.displayView]);

    const handlePostMount = useCallback((node, index, picArr, vidArr) => {
        if(node && !profileData["processedHeights"]["processedRefs"][index]) {
            if(!(node === undefined || node === null)) {
                if(profileData["processedHeights"]["processedRefs"][index] === undefined || profileData["processedHeights"]["processedRefs"][index] === null) {
                    let timeOutTime = 0;
                    picArr.length + vidArr.length === 0 ? timeOutTime = 400 : vidArr.length > 0 ? timeOutTime = 2500 : timeOutTime = 1500;

                    setTimeout(() => {
                        const { height } = node.getBoundingClientRect();
                        
                        if(!(height === undefined || height === null || height === 0) && (height > 0)) {
                            dispatch(
                                processPostsHeights({"index": index, "height": height})
                            );
                        }
                    }, timeOutTime);
                }
            }
        }
    }, [profileData["posts"]["username"]]);

    const handleMarketMount = useCallback((node, index, type) => {
        if(node && !profileData["marketsProcessedHeights"]["processedRefs"][index]) {
            if(!(node === undefined || node === null)) {
                if(profileData["marketsProcessedHeights"]["processedRefs"][index] === undefined || profileData["marketsProcessedHeights"]["processedRefs"][index] === null) {
                    let timeOutTime = 0;
                    type === "yes-or-no" ? timeOutTime = 400 : timeOutTime = 1200;

                    setTimeout(() => {
                        const { height } = node.getBoundingClientRect();

                        if(!(height === undefined || height === null || height === 0) && (height > 0)) {
                            dispatch(
                                processMarketsPostsHeights({"index": index, "height": height})
                            );
                        }
                    }, timeOutTime);
                }
            }
        }
    }, [profileData["markets"]["username"]]);

    const handleEngagedPostMount = useCallback((node, index, picArr, vidArr) => {
        if(node && !profileData["engagedProcessedHeights"]["processedRefs"][index]) {
            if(!(node === undefined || node === null)) {
                if(profileData["engagedProcessedHeights"]["processedRefs"][index] === undefined || profileData["engagedProcessedHeights"]["processedRefs"][index] === null) {
                    let timeOutTime = 0;
                    picArr.length + vidArr.length === 0 ? timeOutTime = 400 : vidArr.length > 0 ? timeOutTime = 2500 : timeOutTime = 1500;

                    setTimeout(() => {
                        const { height } = node.getBoundingClientRect();
                        
                        if(!(height === undefined || height === null || height === 0) && (height > 0)) {
                            dispatch(
                                processEngagedPostsHeights({"index": index, "height": height})
                            );
                        }
                    }, timeOutTime);
                }
            }
        }
    }, [profileData["engaged"]["username"], profileData["engaged"]["type"]]);

    const handleEngagedMarketMount = useCallback((node, index, type) => {
        if(node && !profileData["engagedProcessedHeights"]["processedRefs"][index]) {
            if(!(node === undefined || node === null)) {
                if(profileData["engagedProcessedHeights"]["processedRefs"][index] === undefined || profileData["engagedProcessedHeights"]["processedRefs"][index] === null) {
                    let timeOutTime = 0;
                    type === "yes-or-no" ? timeOutTime = 400 : timeOutTime = 1200;

                    setTimeout(() => {
                        const { height } = node.getBoundingClientRect();

                        if(!(height === undefined || height === null || height === 0) && (height > 0)) {
                            dispatch(
                                processEngagedPostsHeights({"index": index, "height": height})
                            );
                        }
                    }, timeOutTime);
                }
            }
        }
    }, [profileData["engaged"]["username"], profileData["engaged"]["type"]]);

    const [networkFollowingBeingUpdated, setNetworkFollowingBeingUpdated] = useState(false);
    const pullFollowing = async (type, u_ninclude) => {
        if(type === "primary" || networkDesc["following"]["data"].length < networkDesc["following"]["dataCount"]) {
            const username = props.userId;
            await generalOpx.axiosInstance.put(`/users/p_community-members`, 
                {
                    "type": type,
                    "community": username,
                    "u_ninclude": u_ninclude
                }
            ).then(
                async (response) => {
                    if(response.data["status"] === "success") {
                        if(type === "primary") {
                            dispatch(
                                setNetworkFollowing(
                                    {
                                        "username": username,
                                        "data": response.data["data"],
                                        "dataCount": response.data["dataCount"],
                                        "dataLoading": false
                                    }
                                )
                            );
                        } else if(type === "secondary") {
                            dispatch(
                                setNetworkFollowing(
                                    {
                                        "username": username,
                                        "data": [...networkDesc["following"]["data"], ...response.data["data"]],
                                        "dataCount": networkDesc["following"]["dataCount"],
                                        "dataLoading": false
                                    }
                                )
                            );
                        }
                    }
                }
            );

            setNetworkFollowingBeingUpdated(false);
        }
    }

    const followingObserverRef = useRef();
    const networkFollowingLastElementRef = useCallback(node => 
        {
            if(props.displayView !== "following") return;
            if(networkDesc["following"]["dataLoading"]) return;
            if(networkFollowingBeingUpdated) return;
            if(followingObserverRef.current) followingObserverRef.current.disconnect();
            followingObserverRef.current = new IntersectionObserver(entries => 
                {
                    if(entries[0].isIntersecting && networkDesc["following"]["data"].length < networkDesc["following"]["dataCount"]) {
                        setNetworkFollowingBeingUpdated(true);

                        let u_ninclude = [];
                        for(let i = 0; i < networkDesc["following"]["data"].length; i++) {
                            u_ninclude.push(networkDesc["following"]["data"][i]["username"]);
                        }
                        pullFollowing("secondary", u_ninclude);
                    }
                }
            );
            if(node) followingObserverRef.current.observe(node);
        }, [networkDesc, networkFollowingBeingUpdated]
    );

    useEffect(() => {
        if(!(props.userId === null || props.userId === undefined || props.userId === "")) {
            if(props.displayView === "following") {
                if(networkDesc["following"]["dataLoading"]) {
                    pullFollowing("primary", []);
                } else {
                    if(networkDesc["following"]["username"] !== props.userId) {
                        dispatch(
                            setNetworkFollowing(
                                {
                                    "username": "",
                                    "data": [],
                                    "dataCount": 0,
                                    "dataLoading": true
                                }
                            )
                        );

                        pullFollowing("primary", []);
                    }
                }
            }
        }
    }, [props.userId, props.displayView]);

    const [displayUnfollowBtn, setDisplayUnFollowBtn] = useState(false);
    const displayUnfollowBtnToggle = () => {displayUnfollowBtn ? setDisplayUnFollowBtn(false) : setDisplayUnFollowBtn(true);}

    const uf_overlayRef = useRef();
    const uf_overlayContainerRef = useRef();
    useEffect(() => {
        if(uf_overlayRef.current && uf_overlayContainerRef.current && displayUnfollowBtn) {
            const handleClickOutside = (event) => {
                if(uf_overlayRef) {
                    if(!uf_overlayContainerRef.current?.contains(event?.target) && !uf_overlayRef.current?.contains(event?.target)) {
                        setDisplayUnFollowBtn(false);
                    }
                }
            }

            document.addEventListener("mousedown", handleClickOutside);
            return () => {
                document.removeEventListener("mousedown", handleClickOutside);
            }
        }
    }, [profileData, displayUnfollowBtn]);

    const followProfile = async () => {
        let profileDataCopy = {...profileData["profileDesc"]["data"]};
        if(profileDataCopy["followingStatus"] !== 1) {
            profileDataCopy["followingStatus"] = 1;
            profileDataCopy["membersCount"] = profileDataCopy["membersCount"] + 1;

            dispatch(
                setProfileDesc(
                    {
                        "data": profileDataCopy,
                        "dataLoading": false
                    }
                )
            );

            if(!postCommunityOptns["dataLoading"]) {
                let postCommunityOptnsCopy = [...postCommunityOptns["data"]];
                postCommunityOptnsCopy.push(
                    {
                        "communityName": props.userId,
                        "profilePicture": profileData["profileDesc"]["data"]["profilePicture"]
                    }
                );

                dispatch(
                    setPostCommunityOptns(
                        {
                            "data": postCommunityOptnsCopy,
                            "dataLoading": false
                        }
                    )
                )
            }

            await generalOpx.axiosInstance.post(`/users/join-community`, {"joining": props.userId});
        }
    }

    const unfollowProfile = async () => {
        let profileDataCopy = {...profileData["profileDesc"]["data"]};
        if(profileDataCopy["followingStatus"] === 1) {
            profileDataCopy["followingStatus"] = 0;
            profileDataCopy["membersCount"] = profileDataCopy["membersCount"] - 1;

            dispatch(
                setProfileDesc(
                    {
                        "data": profileDataCopy,
                        "dataLoading": false
                    }
                )
            );
            setDisplayUnFollowBtn(false);

            if(!postCommunityOptns["dataLoading"]) {
                let postCommunityOptnsCopy = [...postCommunityOptns["data"]].filter(comm_optn => comm_optn.communityName !== props.userId);

                dispatch(
                    setPostCommunityOptns(
                        {
                            "data": postCommunityOptnsCopy,
                            "dataLoading": false
                        }
                    )
                )
            }

            await generalOpx.axiosInstance.post(`/users/leave-community`, {"leaving": props.userId});
        }
    }

    const [community_rulesSupport, setCommunity_rulesSupport] = useState({"header": "", "description": ""});
    const [community_rulesSupportDisabled, setCommunity_rulesSupportDisabled] = useState(false);
    
    const community_rulesSupportAdd = () => {
        if(!community_rulesSupportDisabled) {setCommunity_rulesSupportDisabled(true);}
    }

    const delete_newRule = () => {
        setCommunity_rulesSupportDisabled(false);
        setCommunity_rulesSupport({"header": "", "description": ""});
    }

    const community_rulesSupportChangeHandler = (e) => {
        const {name, value} = e.target;
        setCommunity_rulesSupport(
            {
                ...community_rulesSupport, [name]: value
            }
        );
    }

    const [saveNewRuleLoading, setSaveNewRuleLoading] = useState(false);
    const [saveNewRuleErrorStat, setSaveNewRuleErrorStat] = useState(0);
    const saveNewRule = async () => {
        setSaveNewRuleLoading(true);

        let community_rulesCopy = [...profileData["profileDesc"]["data"]["rules"]];
        community_rulesCopy.push(community_rulesSupport);

        await generalOpx.axiosInstance.post(`/users/community-update-rules`, 
            {
                "communityRules": community_rulesCopy,
                "communityName": props.userId
            }
        ).then(
            (response) => {
                if(response.data["status"] === "success") {
                    let profileDataCopy = {...profileData["profileDesc"]["data"]};
                    profileDataCopy["rules"] = community_rulesCopy;

                    dispatch(
                        setProfileDesc(
                            {
                                "data": profileDataCopy,
                                "dataLoading": false
                            }
                        )
                    );

                    setSaveNewRuleLoading(false);
                    setCommunity_rulesSupportDisabled(false);
                    setCommunity_rulesSupport({"header": "", "description": ""});
                } else {
                    setSaveNewRuleErrorStat(1);

                    setTimeout(() => {
                        setSaveNewRuleErrorStat(0);
                        setSaveNewRuleLoading(false);
                    }, 2000);
                }
            }
        ).catch(
            () => {
                setSaveNewRuleErrorStat(1);

                setTimeout(() => {
                    setSaveNewRuleErrorStat(0);
                    setSaveNewRuleLoading(false);
                }, 2000);
            }
        );
    }

    const [modSettingsEditorStat, setModSettingsEditorStat] = useState(false);
    const [modSettingsEditorWidth, setModSettingsEditorWidth] = useState("25px");
    const modSettingsEditorStatToggle = () => {
        modSettingsEditorStat ? setModSettingsEditorStat(false) : setModSettingsEditorStat(true);
        modSettingsEditorStat ? setModSettingsEditorWidth("25px") : setModSettingsEditorWidth("179px");
    }

    const modSettingsEditorHandler = (e) => {
        const {name, value} = e.target;
        const targets = name.split("-");

        const target_desc = targets[0];
        const target_index = Number(targets[1]);

        setModSettingsEditorSettings((prevSettings) =>
            prevSettings.map((item, index) => {
                if(index !== target_index) return item;
    
                if(target_desc === "modType") {
                    return { ...item, modType: value };
                } else if(target_desc === "rewardPerc") {
                    if(value === "") {
                        return { ...item, rewardPerc: value };
                    } else {
                        const dig_regex = /^\d+$/;
                        if(dig_regex.test(value)) {
                            return { ...item, rewardPerc: value };
                        }
                    }
                }
                return item;
            })
        );
    }

    const [saveModSettingsStat, setSaveModSettingsStat] = useState(false);
    const [saveModSettingsError, setSaveModSettingsError] = useState(0);
    const saveModSettings = async () => {
        setSaveModSettingsStat(true);

        let errorIded = false;
        let superModCount = 0, sumRewardPerc = 0;
        for(let i = 0; i < modSettingsEditorSettings.length; i++) {
            if(modSettingsEditorSettings[i]["modType"] === "superMod") {superModCount = superModCount + 1;}

            if(isNaN(Number(modSettingsEditorSettings[i]["rewardPerc"])) || !isFinite(Number(modSettingsEditorSettings[i]["rewardPerc"]))) {
                errorIded = true;
                break;
            } else {
                sumRewardPerc = sumRewardPerc + (Number(modSettingsEditorSettings[i]["rewardPerc"]) / 100);
            }
        }

        if(superModCount === 0) {
            setSaveModSettingsError(2);

            setTimeout(() => {
                setSaveModSettingsError(0);
                setSaveModSettingsStat(false);
            }, 2000);
        } else if(errorIded) {
            setSaveModSettingsError(3);

            setTimeout(() => {
                setSaveModSettingsError(0);
                setSaveModSettingsStat(false);
            }, 2000);
        } else if(sumRewardPerc !== 1) {
            setSaveModSettingsError(3);

            setTimeout(() => {
                setSaveModSettingsError(0);
                setSaveModSettingsStat(false);
            }, 2000);
        } else {
            await generalOpx.axiosInstance.post(`/users/community-update-privileges`, 
                {
                    "communityName": props.userId,
                    "moderatorsPrivileges": modSettingsEditorSettings
                }
            ).then(
                (response) => {
                    if(response.data["status"] === "success") {
                        setSaveModSettingsError(1);

                        let profileDataCopy = {...profileData["profileDesc"]["data"]};
                        profileDataCopy["moderatorsPrivileges"] = [...modSettingsEditorSettings];

                        dispatch(
                            setProfileDesc(
                                {
                                    "data": profileDataCopy,
                                    "dataLoading": false
                                }
                            )
                        );

                        setTimeout(() => {
                            setSaveModSettingsError(0);
                            setSaveModSettingsStat(false);

                            setModSettingsEditorStat(false);
                            setModSettingsEditorWidth("25px");
                        }, 2000);
                    } else {
                        setSaveModSettingsError(4);

                        setTimeout(() => {
                            setSaveModSettingsError(0);
                            setSaveModSettingsStat(false);
                        }, 2000);
                    }
                }
            ).catch(
                () => {
                    setSaveModSettingsError(4);

                    setTimeout(() => {
                        setSaveModSettingsError(0);
                        setSaveModSettingsStat(false);
                    }, 2000);
                }
            )
        }
    }

    const modDeleteEditorStatToggle = (sM_i) => {
        let modDeleteEditorStatFunction = [...modDeleteEditorStat];
        modDeleteEditorStatFunction[sM_i][1] === "179px" ? modDeleteEditorStatFunction[sM_i] = [false, "25px", 0] : modDeleteEditorStatFunction[sM_i] = [false, "179px", 0];

        setModDeleteEditorStat(modDeleteEditorStatFunction);
    }

    const modDeleteSave = async (sM_i) => {
        let modDeleteEditorStatFunction = [...modDeleteEditorStat];
        modDeleteEditorStatFunction[sM_i] = [true, modDeleteEditorStatFunction[sM_i][1], 0];
        setModDeleteEditorStat(modDeleteEditorStatFunction);

        if(Number(profileData["profileDesc"]["data"]["moderatorsPrivileges"][sM_i]["rewardPerc"]) !== 0) {
            let modDeleteEditorStatFunctionV2 = [...modDeleteEditorStat];
            modDeleteEditorStatFunctionV2[sM_i] = [true, modDeleteEditorStatFunctionV2[sM_i][1], 2];
            setModDeleteEditorStat(modDeleteEditorStatFunctionV2);

            setTimeout(() => {
                let modDeleteEditorStatFunctionV3 = [...modDeleteEditorStat];
                modDeleteEditorStatFunctionV3[sM_i] = [false, modDeleteEditorStatFunctionV3[sM_i][1], 0];
                setModDeleteEditorStat(modDeleteEditorStatFunctionV3);
            }, 2000);
        } else {
            let superModCount = 0;
            const modToRemove = profileData["profileDesc"]["data"]["moderatorsPrivileges"][sM_i]["username"];
            const filtered_privileges = [...profileData["profileDesc"]["data"]["moderatorsPrivileges"].filter(mP_desc => mP_desc.username !== modToRemove)];

            for(let i = 0; i < filtered_privileges.length; i++) {
                if(filtered_privileges[i]["modType"] === "superMod") {
                    superModCount = superModCount + 1;
                }
            }

            if(superModCount === 0) {
                let modDeleteEditorStatFunctionV2 = [...modDeleteEditorStat];
                modDeleteEditorStatFunctionV2[sM_i] = [true, modDeleteEditorStatFunctionV2[sM_i][1], 1];
                setModDeleteEditorStat(modDeleteEditorStatFunctionV2);

                setTimeout(() => {
                    let modDeleteEditorStatFunctionV3 = [...modDeleteEditorStat];
                    modDeleteEditorStatFunctionV3[sM_i] = [false, modDeleteEditorStatFunctionV3[sM_i][1], 0];
                    setModDeleteEditorStat(modDeleteEditorStatFunctionV3);
                }, 2000);
            } else {
                await generalOpx.axiosInstance.post(`/users/community-remove-mod`, 
                    {
                        "modToRemove": modToRemove,
                        "communityName": props.userId
                    }
                ).then(
                    (response) => {
                        if(response.data["status"] === "success") {
                            let modDeleteEditorStatFunctionV2 = [...modDeleteEditorStat];
                            modDeleteEditorStatFunctionV2[sM_i] = [false, "25px", 0];
                            setModDeleteEditorStat(modDeleteEditorStatFunctionV2);

                            setTimeout(() => {
                                let profileDataCopy = {...profileData["profileDesc"]["data"]};
                                profileDataCopy["moderators"] = [...profileData["profileDesc"]["data"]["moderators"].filter(m_desc => m_desc !== modToRemove)];
                                profileDataCopy["moderatorsQuickDesc"] = [...profileData["profileDesc"]["data"]["moderatorsQuickDesc"].filter(mqD_desc => mqD_desc.username !== modToRemove)];
                                profileDataCopy["moderatorsPrivileges"] = [...profileData["profileDesc"]["data"]["moderatorsPrivileges"].filter(mP_desc => mP_desc.username !== modToRemove)];

                                dispatch(
                                    setProfileDesc(
                                        {
                                            "data": profileDataCopy,
                                            "dataLoading": false
                                        }
                                    )
                                );
                                
                                let modDeleteEditorStatFunctionV3 = [...modDeleteEditorStat].filter((_, index) => index !== sM_i);
                                setModDeleteEditorStat(modDeleteEditorStatFunctionV3);

                                let modSettingsEditorSettingsFunctionV3 = [...modSettingsEditorSettings].filter((_, index) => index !== sM_i);
                                setModSettingsEditorSettings(modSettingsEditorSettingsFunctionV3);
                            }, 500);
                        } else {
                            let modDeleteEditorStatFunctionV2 = [...modDeleteEditorStat];
                            modDeleteEditorStatFunctionV2[sM_i] = [true, modDeleteEditorStatFunctionV2[sM_i][1], 3];
                            setModDeleteEditorStat(modDeleteEditorStatFunctionV2);

                            setTimeout(() => {
                                let modDeleteEditorStatFunctionV3 = [...modDeleteEditorStat];
                                modDeleteEditorStatFunctionV3[sM_i] = [false, modDeleteEditorStatFunctionV3[sM_i][1], 0];
                                setModDeleteEditorStat(modDeleteEditorStatFunctionV3);
                            }, 2000);
                        }
                    }
                ).catch(
                    () => {
                        let modDeleteEditorStatFunctionV2 = [...modDeleteEditorStat];
                        modDeleteEditorStatFunctionV2[sM_i] = [true, modDeleteEditorStatFunctionV2[sM_i][1], 3];
                        setModDeleteEditorStat(modDeleteEditorStatFunctionV2);

                        setTimeout(() => {
                            let modDeleteEditorStatFunctionV3 = [...modDeleteEditorStat];
                            modDeleteEditorStatFunctionV3[sM_i] = [false, modDeleteEditorStatFunctionV3[sM_i][1], 0];
                            setModDeleteEditorStat(modDeleteEditorStatFunctionV3);
                        }, 2000);
                    }
                )
            }
        }
    }

    const [communityModeratorsQuery, setCommunityModeratorsQuery] = useState("");
    const [communityModeratorsAddSearch, setCommunityModeratorsAddSearch] = useState(false);
    const communityModeratorsAddSearchToggle = () => {
        communityModeratorsAddSearch ? setCommunityModeratorsAddSearch(false) : setCommunityModeratorsAddSearch(true);
        if(communityModeratorsAddSearch) {setCommunityModeratorsQuery("");}
    }

    const communityModeratorsQueryHandler = (e) => {
        const {value} = e.target;
        setCommunityModeratorsQuery(value);
    }

    const communityModeratorsQueryController = useRef(new AbortController());
    const [communityModeratorsResults, setCommunityModeratorsResults] = useState([]);
    useEffect(() => {
        const runQuery = async () => {
            communityModeratorsQueryController.current.abort();
            communityModeratorsQueryController.current = new AbortController();

            try {
                const query_forModerators = await generalOpx.axiosInstance.put(`/users/search?q=${communityModeratorsQuery}`, {}, {signal: communityModeratorsQueryController.current.signal});

                if(query_forModerators.data["status"] === "success") {
                    setCommunityModeratorsResults(query_forModerators.data["data"]);
                }
            } catch(err) {}
        }

        if(communityModeratorsQuery === "") {
            setCommunityModeratorsResults([]);
        } else {
            runQuery();
        }
    }, [communityModeratorsQuery]);

    const [communityModAddStat, setCommunityModAddStat] = useState(false);
    const [communityModAddErrorNotice, setCommunityModAddErrorNotice] = useState(0);
    const addModeratorSave = async (modToAdd) => {
        setCommunityModAddStat(true);

        if(profileData["profileDesc"]["data"]["moderators"].includes(modToAdd)) {
            setCommunityModAddStat(false);
        } else {
            await generalOpx.axiosInstance.post(`/users/community-add-mod`, 
                {
                    "modToAdd": modToAdd,
                    "communityName": props.userId
                }
            ).then(
                (response) => {
                    if(response.data["status"] === "success") {
                        setCommunityModAddErrorNotice(1);

                        const now = new Date(), nowUnix = getUnixTime(now);
                        let profileDataCopy = {...profileData["profileDesc"]["data"]};
                        profileDataCopy["moderators"] = [...profileData["profileDesc"]["data"]["moderators"], modToAdd];
                        profileDataCopy["moderatorsQuickDesc"] = [...profileData["profileDesc"]["data"]["moderatorsQuickDesc"], {...response.data["data"]}];
                        profileDataCopy["moderatorsPrivileges"] = [...profileData["profileDesc"]["data"]["moderatorsPrivileges"], {"username": modToAdd, "modType": "mod", "rewardPerc": "0", "timeStamp": nowUnix}];
                        
                        dispatch(
                            setProfileDesc(
                                {
                                    "data": profileDataCopy,
                                    "dataLoading": false
                                }
                            )
                        );

                        let modDeleteEditorStatFunctionV3 = [...modDeleteEditorStat, [false, "25px", 0]];
                        setModDeleteEditorStat(modDeleteEditorStatFunctionV3);
                        
                        let modSettingsEditorSettingsFunctionV3 = [...modSettingsEditorSettings, {"username": modToAdd, "modType": "mod", "rewardPerc": "0", "timeStamp": nowUnix}];
                        setModSettingsEditorSettings(modSettingsEditorSettingsFunctionV3);

                        setTimeout(() => {
                            setCommunityModAddErrorNotice(0);
                            setCommunityModAddStat(false);
                        }, 2000);
                    } else {
                        setCommunityModAddErrorNotice(2);

                        setTimeout(() => {
                            setCommunityModAddErrorNotice(0);
                            setCommunityModAddStat(false);
                        }, 2000);
                    }
                }
            ).catch(
                () => {
                    setCommunityModAddErrorNotice(2);

                    setTimeout(() => {
                        setCommunityModAddErrorNotice(0);
                        setCommunityModAddStat(false);
                    }, 2000);
                }
            );
        }
    }

    const analyzePostCharCount = (text, timeStamp, type) => {
        let charPerLine = 0;
        if(type === "title") {
            charPerLine = (53 / 507.625) * contentBodyWidth[0];
        } else if(type === "post") {
            charPerLine = (65 / 507.525) * contentBodyWidth[0];
        }

        if(timeStamp <= 1743517206) {
            const text_Breakdown = {
                "tabs": (text.match(/\t/g) || []).length,
                "lineBreaks": (text.match(/(\r\n|\n|\r)/g) || []).length,
                "formFeeds": (text.match(/\f/g) || []).length,
                "verticalTabs": (text.match(/\v/g) || []).length,
                "lineSeparators": (text.match(/\u2028/g) || []).length,
                "paragraphSeparators": (text.match(/\u2029/g) || []).length,
                "totalLength": text.length
            };

            const lines = Math.ceil(
                ((text_Breakdown.totalLength - (
                    text_Breakdown.lineBreaks + text_Breakdown.formFeeds + text_Breakdown.verticalTabs + text_Breakdown.lineSeparators + text_Breakdown.paragraphSeparators
                )) / charPerLine) + (text_Breakdown.lineBreaks + text_Breakdown.formFeeds + text_Breakdown.verticalTabs + text_Breakdown.lineSeparators + text_Breakdown.paragraphSeparators)
            );
            
            return lines;
        } else {
            const parser = new DOMParser();
            const doc = parser.parseFromString(text, 'text/html');

            const innerText = doc.body.textContent.trim();

            const pTags = doc.getElementsByTagName('p').length;
            const brTags = doc.getElementsByTagName('br').length;
            const divTags = doc.getElementsByTagName('div').length;

            const text_Breakdown = {
                "tabs": (innerText.match(/\t/g) || []).length,
                "lineBreaks": (innerText.match(/(\r\n|\n|\r)/g) || []).length,
                "formFeeds": (innerText.match(/\f/g) || []).length,
                "verticalTabs": (innerText.match(/\v/g) || []).length,
                "lineSeparators": (innerText.match(/\u2028/g) || []).length,
                "paragraphSeparators": (innerText.match(/\u2029/g) || []).length,
                "totalLength": innerText.length
            };

            const lines = Math.ceil(
                ((text_Breakdown.totalLength - (
                    text_Breakdown.lineBreaks + text_Breakdown.formFeeds + text_Breakdown.verticalTabs + text_Breakdown.lineSeparators + text_Breakdown.paragraphSeparators
                )) / charPerLine) + (pTags + brTags + divTags - 1) +
                (text_Breakdown.lineBreaks + text_Breakdown.formFeeds + text_Breakdown.verticalTabs + text_Breakdown.lineSeparators + text_Breakdown.paragraphSeparators)
            );

            return lines;
        }
    }

    return(
        <div
                ref={scrollController}
                className={props.f_viewPort === "small" ? "small-homePageContentBodyWrapper" : "large-homePageContentBodyWrapper"}
            >
            {!profileData["profileDesc"]["dataLoading"] && editProfile ?
                <div className="profile-SetUpImageCropContainer" ref={overlayContainerRef}>
                    <div className="app-largeViewFixedInnerWindowSideFixers"
                        style={props.f_viewPort === "small" ? {"width": "0px", "minWidth": "0px", "maxWidth": "0px"} : {}}
                    />
                    <div className="app-largeViewFixedInnerWindowMainFixer"
                            style={props.f_viewPort === "small" ? {"margin": "0", "width": "100%", "minWidth": "100%", "maxWidth": "100%"} : {}}
                        >
                        <div className="profile-SetUpEditProfileSettingsContainer" ref={overlayRef}
                                style={props.f_viewPort === "small" ? {"width": "100%", "minWidth": "100%", "maxWidth": "100%"} : {}}
                            >

                            <div className="profile-setUpEditProfileSettingsImageHeader">
                                <div className="profile-setUpEditProfileSettingsImageHeaderDesc">
                                    {profileImageSource === "" && wallpaperImageSource === "" ?
                                        <button className="profile-setUpEditProfileSettingsImageHeaderBackBtn"
                                                onClick={() => editProfileToggle()}
                                            >
                                            <CloseSharp />
                                        </button> : 
                                        <>
                                            {wallpaperImageSource === "" ?
                                                <button className="profile-setUpEditProfileSettingsImageHeaderBackBtn"
                                                        onClick={() => {setProfileImageSource("");}}
                                                    >
                                                    <KeyboardBackspace />
                                                </button> :
                                                <button className="profile-setUpEditProfileSettingsImageHeaderBackBtn"
                                                        onClick={() => {setWallpaperImageSource("");}}
                                                    >
                                                    <KeyboardBackspace />
                                                </button>
                                            }
                                        </>
                                    }
                                    {profileImageSource === "" && wallpaperImageSource === "" ?
                                        `Edit Profile` : 
                                        <>
                                            {wallpaperImageSource === "" ?
                                                `Edit Profile Image` : `Edit Profile Wallpaper`
                                            }
                                        </>
                                    }
                                </div>
                                {applyLoadingError === 1 ?
                                    <span style={{"marginLeft": "10px", "fontSize": "0.8rem","color": "var(--primary-red-09)"}}>
                                        Error occured, please try later.
                                    </span> : null
                                }
                                {profileImageSource === "" && wallpaperImageSource === "" ?
                                    <button className="profile-setUpEditProfileSettingsImageHeaderApplyBtn"
                                            disabled={profileSettings.bio.length > 280}
                                            onClick={() => profileSettingsSetter()}
                                            style={{"backgroundColor": profileSettings.bio.length > 280 ? "var(--primary-bg-05)" : "var(--primary-bg-01)"}}
                                        >
                                        {saveProfileSettings ?
                                            <BeatLoader 
                                                color='var(--secondary-bg-03)'
                                                size={5}
                                            /> : `Save`
                                        }
                                    </button> :
                                    <>
                                        {wallpaperImageSource === "" ?
                                            <button className="profile-setUpEditProfileSettingsImageHeaderApplyBtn"
                                                    onClick={() => profileImageUpdatedSourceHandler()}
                                                >
                                                {applyLoading ?
                                                    <BeatLoader 
                                                        color='var(--secondary-bg-03)'
                                                        size={5}
                                                    /> : `Apply`
                                                }
                                            </button> :
                                            <button className="profile-setUpEditProfileSettingsImageHeaderApplyBtn"
                                                    onClick={() => profileWallpaperUpdatedSourceHandler()}
                                                >
                                                {applyLoading ?
                                                    <BeatLoader 
                                                        color='var(--secondary-bg-03)'
                                                        size={5}
                                                    /> : `Apply`
                                                }
                                            </button>
                                        }
                                    </>
                                }
                            </div>
                            {profileImageSource === "" && wallpaperImageSource === "" ?
                                <div className="profile-setUpEditProfileSettingsGeneralDataContainer">
                                    {wallpaperImageUpdatedSource === "" ?
                                        <>
                                            {profileData["profileDesc"]["data"]["profileWallpaper"] === "" ?
                                                <div className="profile-setUpEditProfileSettingsGeneralWallpaper"/> :
                                                <img src={profileData["profileDesc"]["data"]["profileWallpaper"]} alt="" className="profile-setUpEditProfileSettingsGeneralWallpaperImg" />
                                            }
                                        </> : <img src={wallpaperImageUpdatedSource} alt="" className="profile-setUpEditProfileSettingsGeneralWallpaperImg" />
                                    }
                                    {profileImageUpdatedSource === "" ?
                                        <>
                                            {profileData["profileDesc"]["data"]["profilePicture"] === "" ?
                                                <div className="profile-setUpEditProfileSettingsGeneralProfileImgNonImage"/> :
                                                <img src={profileData["profileDesc"]["data"]["profilePicture"]} alt="" className="profile-setUpEditProfileSettingsGeneralProfileImg" />
                                            }
                                        </> : <img src={profileImageUpdatedSource} alt="" className="profile-setUpEditProfileSettingsGeneralProfileImg" />
                                    }
                                    <input type="file" 
                                        accept="image/*" 
                                        id="large-profilePageUpdateProfilePicId" 
                                        onChange={profileImageHandler}
                                        style={{"display": "none"}} 
                                    />
                                    <input type="file" 
                                        accept="image/*" 
                                        onChange={wallpaperImageHandler}
                                        id="large-profilePageUpdateProfileWallPaperId" 
                                        style={{"display": "none"}} 
                                    />
                                    {profileImageError === 1 ?
                                        <div className="large-profilePageUpdateProfilePicError">Image must be at least 90 x 90 pixels.</div> : 
                                        <>
                                            {profileImageError === 2 ?
                                                <div className="large-profilePageUpdateProfilePicError">Image must be at least 390 x 112 pixels.</div> : 
                                                <>
                                                    {profileImageError === 4 ?
                                                        <div className="large-profilePageUpdateProfilePicError">An error occured, please try again later.</div> : null
                                                    }
                                                </>
                                            }
                                        </>
                                    }
                                    <label htmlFor="large-profilePageUpdateProfilePicId" className="large-profilePageUpdateProfilePicLabel">
                                        <CameraAlt />
                                    </label>
                                    <label htmlFor="large-profilePageUpdateProfileWallPaperId" className="large-profilePageUpdateProfileWallPaperLabel">
                                        <CameraAlt />
                                    </label>
                                    <div className="profile-setUpEditProfileSettingsGeneralBioContainer"
                                            style={{"marginTop": "74px"}}
                                        >
                                        <div className="profile-setUpEditProfileSettingsGeneralBioHeader">
                                            <span>Bio</span>
                                            <span 
                                                style={{
                                                    "marginLeft": "auto",
                                                    "color": profileSettings["bio"].length > 280 ? "var(--primary-red-09)" : "var(--primary-bg-05)"
                                                }}
                                                >
                                                {profileSettings["bio"].length} / 280
                                            </span>
                                        </div>
                                        <textarea 
                                            name={"bio"}
                                            value={profileSettings["bio"]}
                                            onChange={editProfileSettingsHandler}
                                            placeholder='What are you all about?'
                                            className="profile-setUpEditProfileSettingsGeneralBioTxtArea"
                                        ></textarea>
                                    </div>
                                </div> : 
                                <>
                                    {wallpaperImageSource === "" ?
                                        <div className="profile-setUpEditProfileSettingsImageEditorContainer">
                                            <ReactCrop 
                                                    crop={crop}
                                                    onChange={
                                                        (pixelCrop, percentCrop) => setCrop(percentCrop)
                                                    }
                                                    keepSelection
                                                    aspect={1}
                                                >
                                                <img ref={imgRef} src={profileImageSource} 
                                                    alt="Upload" 
                                                    onLoad={onProfileImageLoad} 
                                                    style={{"maxHeight": "calc((100vh * 0.55) - 46px)", "objectFit": "contain"}}
                                                />
                                            </ReactCrop>
                                        </div> : 
                                        <div className="profile-setUpEditProfileSettingsImageEditorContainer">
                                            <ReactCrop 
                                                    crop={wallpaperCrop}
                                                    onChange={
                                                        (pixelCrop, percentCrop) => setWallpaperCrop(percentCrop)
                                                    }
                                                    keepSelection
                                                    aspect={3 / 1}
                                                >
                                                <img ref={wallpaperImgRef} src={wallpaperImageSource} 
                                                    alt="Upload" 
                                                    onLoad={onWallpaperImageLoad} 
                                                    style={{"maxHeight": "calc((100vh * 0.55) - 46px)", "objectFit": "contain"}}
                                                />
                                            </ReactCrop>
                                        </div>
                                    }
                                </>
                            }
                        </div>
                        {wallpaperImageSource === "" ?
                            <>
                                {crop &&
                                    <canvas
                                        ref={previewCanvasRef}
                                        style={{
                                            "display": "none",
                                            "border": "1px solid black",
                                            "objectFit": "cover",
                                            "width": 90,
                                            "height": 90
                                        }}
                                    />
                                }
                            </> :
                            <>
                                {crop &&
                                    <canvas
                                        ref={previewWallpaperCanvasRef}
                                        style={{
                                            "display": "none",
                                            "border": "1px solid black",
                                            "objectFit": "cover",
                                            "width": 390,
                                            "height": 130
                                        }}
                                    />
                                }
                            </>
                        }
                    </div>
                    <div className="app-largeViewFixedInnerWindowSideFixers"
                        style={props.f_viewPort === "small" ? {"width": "0px", "minWidth": "0px", "maxWidth": "0px"} : {}}
                    />
                    
                </div> : null
            }
            {props.displayView === "following" ?
                <div 
                        ref={contentBodyRef}
                        className={props.f_viewPort === "small" ? "small-homePageContentBody" : "large-homePageContentBody"}
                    >
                    <div className="large-homePageContentBodyMargin"/>
                    {networkDesc["following"]["dataLoading"] ?
                        <>
                            <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                <div className="large-stocksPostInnerContainer" style={{"height": "144px", "minHeight": "144px", "maxHeight": "144px"}}>
                                    <FinulabNetworkDesc loading={true}/>
                                </div>
                            </div>
                            <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                <div className="large-stocksPostInnerContainer" style={{"height": "144px", "minHeight": "144px", "maxHeight": "144px"}}>
                                    <FinulabNetworkDesc loading={true}/>
                                </div>
                            </div>
                            <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                <div className="large-stocksPostInnerContainer" style={{"height": "144px", "minHeight": "144px", "maxHeight": "144px"}}>
                                    <FinulabNetworkDesc loading={true}/>
                                </div>
                            </div>
                            <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                <div className="large-stocksPostInnerContainer" style={{"height": "144px", "minHeight": "144px", "maxHeight": "144px"}}>
                                    <FinulabNetworkDesc loading={true}/>
                                </div>
                            </div>
                            <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                <div className="large-stocksPostInnerContainer" style={{"height": "144px", "minHeight": "144px", "maxHeight": "144px"}}>
                                    <FinulabNetworkDesc loading={true}/>
                                </div>
                            </div>
                            <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                <div className="large-stocksPostInnerContainer" style={{"height": "144px", "minHeight": "144px", "maxHeight": "144px"}}>
                                    <FinulabNetworkDesc loading={true}/>
                                </div>
                            </div>
                            <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                <div className="large-stocksPostInnerContainer" style={{"height": "144px", "minHeight": "144px", "maxHeight": "144px"}}>
                                    <FinulabNetworkDesc loading={true}/>
                                </div>
                            </div>
                            <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                <div className="large-stocksPostInnerContainer" style={{"height": "144px", "minHeight": "144px", "maxHeight": "144px"}}>
                                    <FinulabNetworkDesc loading={true}/>
                                </div>
                            </div>
                            <div className="large-homePagePostContainer">
                                <div className="large-stocksPostInnerContainer" style={{"height": "144px", "minHeight": "144px", "maxHeight": "144px"}}>
                                    <FinulabNetworkDesc loading={true}/>
                                </div>
                            </div>
                            <div className="large-homePageProfileNoDataContainer"
                                style={{
                                    "minHeight": `calc(100vh - 51px - 36px)`
                                }}
                            />
                        </> : 
                        <>
                            {networkDesc["following"]["data"].length === 0 ?
                                <div className="large-homePageProfileNoDataContainer"
                                        style={{
                                            "minHeight": `calc(100vh - 51px - 36px)`
                                        }}
                                    >
                                    <img src="/assets/Finulab_Icon.png" alt="" className="large-marketPageNoDateNoticeImg" />
                                    <div className="large-marketPageNoDataONotice">
                                        {user ?
                                            <>
                                                {props.userId === user.user ?
                                                    <>
                                                        You aren't following anyone.
                                                    </> : `${props.userId} isn't following anyone.`
                                                }
                                            </> :
                                            <>
                                                {props.userId} isn't following anyone.
                                            </>
                                        }
                                    </div>
                                </div> : 
                                <>
                                    {networkDesc["following"]["data"].map((u_desc, index) => (
                                            <div className="large-homePagePostContainer" 
                                                    key={`profile-following-${u_desc["username"]}`}
                                                    ref={networkDesc["following"]["data"].length - 2 === index ? networkFollowingLastElementRef : null}
                                                    style={networkDesc["following"]["data"].length - 1 === index ?
                                                        {} : {"borderBottom": "solid 1px var(--primary-bg-08)"}
                                                    }
                                                >
                                                <div className="large-stocksPostInnerContainer" 
                                                        style={u_desc["bio"] === "" ?
                                                            {"height": "72px", "minHeight": "72px", "maxHeight": "72px"} : 
                                                            {"height": "144px", "minHeight": "144px", "maxHeight": "144px"}
                                                        }
                                                    >
                                                    <FinulabNetworkDesc 
                                                        loading={false}
                                                        desc_index={index}
                                                        network_type={"U"}
                                                        network_element={u_desc}
                                                    />
                                                </div>
                                            </div>
                                        ))
                                    }
                                </>
                            }
                            <div className="large-homePageProfileNoDataContainer"
                                style={{
                                    "minHeight":`calc(100vh - 51px - 36px)`
                                }}
                            />
                        </>
                    }
                </div> : 
                <div 
                        ref={contentBodyRef}
                        className={props.f_viewPort === "small" ? "small-homePageContentBody" : "large-homePageContentBody"}
                    >
                    <div className="large-homePageContentBodyMargin"/>
                    {contentBodyWidth[1] === true ?
                        <>
                            <div className="large-profilePageWallpaperProfileImageWrapper">
                                {profileData["profileDesc"]["dataLoading"] ?
                                    <div className="large-profilePageWallpaperNonImage"
                                        style={{"height": `${appState["profile"]["wallHeight"]}px`, "minHeight": `${appState["profile"]["wallHeight"]}px`, "minHeight": `${appState["profile"]["wallHeight"]}px`}}
                                    /> : 
                                    <>
                                        {profileData["profileDesc"]["data"]["profileWallpaper"] === "" ?
                                            <div className="large-profilePageWallpaperNonImage"
                                                style={{"height": `${appState["profile"]["wallHeight"]}px`, "minHeight": `${appState["profile"]["wallHeight"]}px`, "minHeight": `${appState["profile"]["wallHeight"]}px`}}
                                            /> :
                                            <button className="large-profilePageWallpaperBtn"
                                                    onClick={() => setupViewMedia(profileData["profileDesc"]["data"]["profileWallpaper"])}
                                                >
                                                <img src={profileData["profileDesc"]["data"]["profileWallpaper"]} alt="" 
                                                    className="large-profilePageWallpaper" 
                                                    style={{"height": `${appState["profile"]["wallHeight"]}px`, "minHeight": `${appState["profile"]["wallHeight"]}px`, "minHeight": `${appState["profile"]["wallHeight"]}px`}}
                                                />
                                            </button>
                                        }
                                    </>
                                }
                                {profileData["profileDesc"]["dataLoading"] ?
                                    <div className="large-profilePageProfileImageLoading"/> :
                                    <>
                                        {profileData["profileDesc"]["data"]["profilePicture"] === "" ?
                                            <div className="large-profilePageProfileImageNoImg"
                                                    style={generalOpx.profilePictureGradients[`${props.userId}`.length % 5]}
                                                >
                                                <div className="large-profilePageProfileImageNoImgInnerCont">
                                                    <img src="/assets/Favicon.png" alt="" className="large-homePageHeaderProfileImgNonUser" />
                                                    <Tsunami className="larg-homePageHeaderProfileImageColorizedIconV2"/>
                                                </div>
                                            </div> : 
                                            <button className="large-profilePageProfileImageBtn"
                                                    onClick={() => setupViewMedia(profileData["profileDesc"]["data"]["profilePicture"])}
                                                >
                                                <img src={profileData["profileDesc"]["data"]["profilePicture"]} alt="" className="large-profilePageProfileImage" /> 
                                            </button>
                                        }
                                    </>
                                }
                                {profileData["profileDesc"]["dataLoading"] ?
                                    null :
                                    <>
                                        {user ? 
                                            <>
                                                {profileData["profileDesc"]["data"]["moderators"].includes(user.user) ? 
                                                    <>
                                                        <button className="profile-profilePageUpdateSettingsEditBtn"
                                                                onClick={() => editProfileToggle()}
                                                                style={{"width": "140px", "minWidth": "140px", "maxWidth": "140px"}}
                                                            >
                                                            Edit Community
                                                        </button>            
                                                    </> : 
                                                    <>
                                                        {profileData["profileDesc"]["data"]["followingStatus"] === 1 ?
                                                            <button className="profile-profilePageUpdateSettingsEditBtn"
                                                                    ref={uf_overlayContainerRef}
                                                                    onClick={() => displayUnfollowBtnToggle()}
                                                                >
                                                                Joined
                                                            </button> : 
                                                            <button className="profile-profilePageUpdateSettingsEditBtn"
                                                                    onClick={user ? () => followProfile() : () => navigate(`/login`)}
                                                                    style={{"color": "var(--secondary-bg-03)", "backgroundColor": "var(--primary-bg-01)"}}  
                                                                >
                                                                Join
                                                            </button>
                                                        }
                                                        {user && displayUnfollowBtn ?
                                                            <button className="profile-unfollowBtn"
                                                                    ref={uf_overlayRef}
                                                                    onClick={() => unfollowProfile()}
                                                                >
                                                                Leave {props.userId}
                                                                <PersonRemoveSharp className="profile-unfollowBtnIcon"/>
                                                            </button> : null
                                                        }
                                                    </>
                                                }
                                            </> : 
                                            <button className="profile-profilePageUpdateSettingsEditBtn"
                                                    onClick={() => navigate(`/login`)}
                                                    style={{"color": "var(--secondary-bg-03)", "backgroundColor": "var(--primary-bg-01)"}}  
                                                >
                                                Join
                                            </button>
                                        }
                                    </>
                                }
                            </div>
                            <div className="large-profilePageBioWrapper">
                                {profileData["profileDesc"]["dataLoading"] ?
                                    <div className="large-profilePageUsernameDescLoading"/> : 
                                    <div className="large-profilePageUsernameDesc">
                                        {profileData["profileDesc"]["data"]["username"]}
                                    </div>
                                }
                                <div className="large-profilePageBioDescContainer">
                                    <div className="large-profilePageBioDesc">
                                        {profileData["profileDesc"]["dataLoading"] ?
                                            "" : `${profileData["profileDesc"]["data"]["bio"]}`
                                        }
                                    </div>
                                </div>
                                <div className="large-profilePageNetworkDescContainer">
                                    {profileData["profileDesc"]["dataLoading"] ?
                                        <>
                                            <div className="large-profilePageNetworkDescLoading"/>
                                        </> : 
                                        <>
                                            <button className="large-profilePageNetworkDescBtn"
                                                    onClick={() => navigate(`/profile/${props.userId}/moderators`)}
                                                >
                                                <div className="large-profilePageNetworkDesc">
                                                    {generalOpx.formatLargeFigures(profileData["profileDesc"]["data"]["moderators"].length, 2)}&nbsp;<span className="large-profilePageNetworkDescSpecifier">Moderators</span>
                                                </div>
                                            </button>
                                            <button className="large-profilePageNetworkDescBtn"
                                                    onClick={() => navigate(`/profile/${props.userId}/following`)}
                                                >
                                                <div className="large-profilePageNetworkDesc">
                                                    {generalOpx.formatLargeFigures(profileData["profileDesc"]["data"]["membersCount"], 2)}&nbsp;<span className="large-profilePageNetworkDescSpecifier">Members</span>
                                                </div>
                                            </button>
                                        </>
                                    }
                                </div>
                            </div>
                            <div className="large-homePageInnerTopOptionsContainer"
                                    style={{
                                            ...{"width": `${contentBodyWidth[0]}px`, "minWidth": `${contentBodyWidth[0]}px`, "maxWidth": `${contentBodyWidth[0]}px`},
                                            ...(appState["profile"]["fixed"] ? {"position": "fixed", "top": "51px"} : {})
                                        }
                                    }
                                >
                                {profileData["profileDesc"]["dataLoading"] ?
                                    null : 
                                    <>
                                        {user ?
                                            <>
                                                {profileData["profileDesc"]["data"]["moderators"].includes(user.user) ?
                                                    <>
                                                        <button className="large-homePageInnerTopOptionsBtn"
                                                                onClick={() => navigate(`/profile/${props.userId}`)}
                                                                style={{"width": "calc((100% / 4) - 20px)", "minWidth": "calc((100% / 4) - 20px)", "maxWidth": "calc((100% / 4) - 20px)"}}
                                                            >
                                                            <span className="large-homePageInnerTopOptionsBtnDesc" 
                                                                    style={props.displayView === "" ? {"color": "var(--primary-bg-01)"} : {}}
                                                                >
                                                                Posts
                                                                {props.displayView === "" ?
                                                                    <div className="large-homePageInnerTopOptionsBtnOutline"/> : null
                                                                }
                                                            </span>
                                                        </button>
                                                        <button className="large-homePageInnerTopOptionsBtn"
                                                                onClick={() => navigate(`/profile/${props.userId}/rules`)}
                                                                style={{"width": "calc((100% / 4) - 20px)", "minWidth": "calc((100% / 4) - 20px)", "maxWidth": "calc((100% / 4) - 20px)"}}
                                                            >
                                                            <span className="large-homePageInnerTopOptionsBtnDesc"
                                                                    style={props.displayView === "rules" ? {"color": "var(--primary-bg-01)"} : {}}
                                                                >
                                                                Rules
                                                                {props.displayView === "rules" ?
                                                                    <div className="large-homePageInnerTopOptionsBtnOutline"/> : null
                                                                }
                                                            </span>
                                                        </button>
                                                        <button className="large-homePageInnerTopOptionsBtn"
                                                                onClick={() => navigate(`/profile/${props.userId}/moderators`)}
                                                                style={{"width": "calc((100% / 4) - 20px)", "minWidth": "calc((100% / 4) - 20px)", "maxWidth": "calc((100% / 4) - 20px)"}}
                                                            >
                                                            <span className="large-homePageInnerTopOptionsBtnDesc" 
                                                                    style={props.displayView === "moderators" ? {"color": "var(--primary-bg-01)"} : {}}
                                                                >
                                                                Mods
                                                                {props.displayView === "moderators" ?
                                                                    <div className="large-homePageInnerTopOptionsBtnOutline"/> : null
                                                                }
                                                            </span>
                                                        </button>
                                                        <button className="large-homePageInnerTopOptionsBtn"
                                                                onClick={() => navigate(`/profile/${props.userId}/notifications`)}
                                                                style={{"width": "calc((100% / 4) - 20px)", "minWidth": "calc((100% / 4) - 20px)", "maxWidth": "calc((100% / 4) - 20px)"}}
                                                            >
                                                            <span className="large-homePageInnerTopOptionsBtnDesc"
                                                                    style={props.displayView === "notifications" ? {"color": "var(--primary-bg-01)"} : {}}
                                                                >
                                                                Notifs
                                                                {props.displayView === "notifications" ?
                                                                    <div className="large-homePageInnerTopOptionsBtnOutline"/> : null
                                                                }
                                                            </span>
                                                        </button>
                                                    </> : 
                                                    <>
                                                        <button className="large-homePageInnerTopOptionsBtn"
                                                                onClick={() => navigate(`/profile/${props.userId}`)}
                                                                style={{"width": "calc((100% / 3) - 20px)", "minWidth": "calc((100% / 3) - 20px)", "maxWidth": "calc((100% / 3) - 20px)"}}
                                                            >
                                                            <span className="large-homePageInnerTopOptionsBtnDesc" 
                                                                    style={props.displayView === "" ? {"color": "var(--primary-bg-01)"} : {}}
                                                                >
                                                                Posts
                                                                {props.displayView === "" ?
                                                                    <div className="large-homePageInnerTopOptionsBtnOutline"/> : null
                                                                }
                                                            </span>
                                                        </button>
                                                        <button className="large-homePageInnerTopOptionsBtn"
                                                                onClick={() => navigate(`/profile/${props.userId}/rules`)}
                                                                style={{"width": "calc((100% / 3) - 20px)", "minWidth": "calc((100% / 3) - 20px)", "maxWidth": "calc((100% / 3) - 20px)"}}
                                                            >
                                                            <span className="large-homePageInnerTopOptionsBtnDesc"
                                                                    style={props.displayView === "rules" ? {"color": "var(--primary-bg-01)"} : {}}
                                                                >
                                                                Rules
                                                                {props.displayView === "rules" ?
                                                                    <div className="large-homePageInnerTopOptionsBtnOutline"/> : null
                                                                }
                                                            </span>
                                                        </button>
                                                        <button className="large-homePageInnerTopOptionsBtn"
                                                                onClick={() => navigate(`/profile/${props.userId}/moderators`)}
                                                                style={{"width": "calc((100% / 3) - 20px)", "minWidth": "calc((100% / 3) - 20px)", "maxWidth": "calc((100% / 3) - 20px)"}}
                                                            >
                                                            <span className="large-homePageInnerTopOptionsBtnDesc"
                                                                    style={props.displayView === "moderators" ? {"color": "var(--primary-bg-01)"} : {}}
                                                                >
                                                                Mods
                                                                {props.displayView === "moderators" ?
                                                                    <div className="large-homePageInnerTopOptionsBtnOutline"/> : null
                                                                }
                                                            </span>
                                                        </button>
                                                    </>
                                                }
                                            </> : 
                                            <>
                                                <button className="large-homePageInnerTopOptionsBtn"
                                                        onClick={() => navigate(`/profile/${props.userId}`)}
                                                        style={{"width": "calc((100% / 3) - 20px)", "minWidth": "calc((100% / 3) - 20px)", "maxWidth": "calc((100% / 3) - 20px)"}}
                                                    >
                                                    <span className="large-homePageInnerTopOptionsBtnDesc" 
                                                            style={props.displayView === "" ? {"color": "var(--primary-bg-01)"} : {}}
                                                        >
                                                        Posts
                                                        {props.displayView === "" ?
                                                            <div className="large-homePageInnerTopOptionsBtnOutline"/> : null
                                                        }
                                                    </span>
                                                </button>
                                                <button className="large-homePageInnerTopOptionsBtn"
                                                        onClick={() => navigate(`/profile/${props.userId}/rules`)}
                                                        style={{"width": "calc((100% / 3) - 20px)", "minWidth": "calc((100% / 3) - 20px)", "maxWidth": "calc((100% / 3) - 20px)"}}
                                                    >
                                                    <span className="large-homePageInnerTopOptionsBtnDesc"
                                                            style={props.displayView === "rules" ? {"color": "var(--primary-bg-01)"} : {}}
                                                        >
                                                        Rules
                                                        {props.displayView === "rules" ?
                                                            <div className="large-homePageInnerTopOptionsBtnOutline"/> : null
                                                        }
                                                    </span>
                                                </button>
                                                <button className="large-homePageInnerTopOptionsBtn"
                                                        onClick={() => navigate(`/profile/${props.userId}/moderators`)}
                                                        style={{"width": "calc((100% / 3) - 20px)", "minWidth": "calc((100% / 3) - 20px)", "maxWidth": "calc((100% / 3) - 20px)"}}
                                                    >
                                                    <span className="large-homePageInnerTopOptionsBtnDesc"
                                                            style={props.displayView === "moderators" ? {"color": "var(--primary-bg-01)"} : {}}
                                                        >
                                                        Mods
                                                        {props.displayView === "moderators" ?
                                                            <div className="large-homePageInnerTopOptionsBtnOutline"/> : null
                                                        }
                                                    </span>
                                                </button>
                                            </>
                                        }
                                    </>
                                }
                            </div>
                            {appState["profile"]["fixed"] ?
                                <div className="large-homePageInnerTopOptionsContainerMargin"/> : null
                            }
                        </> : null
                    }
                    {props.displayView === "" ?
                        <>
                            {profileData["posts"]["dataLoading"] ?
                                <>
                                    <div className="large-homePagePostContainer"
                                            style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                        >
                                        <Post loading={true}/>
                                    </div>
                                    <div className="large-homePagePostContainer"
                                            style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                        >
                                        <Post loading={true}/>
                                    </div>
                                    <div className="large-homePagePostContainer"
                                            style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                        >
                                        <Post loading={true}/>
                                    </div>
                                    <div className="large-homePagePostContainer"
                                            style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                        >
                                        <Post loading={true}/>
                                    </div>
                                    <div className="large-homePagePostContainer"
                                            style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                        >
                                        <Post loading={true}/>
                                    </div>
                                    <div className="large-homePagePostContainer"
                                            style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                        >
                                        <Post loading={true}/>
                                    </div>
                                    <div className="large-homePagePostContainer">
                                        <Post loading={true}/>
                                    </div>
                                    <div className="large-homePageProfileNoDataContainer"
                                        style={{
                                            "minHeight": appState["profile"]["fixed"] ? 
                                                `calc(100vh - 51px - 36px)` : 
                                                `calc(100vh - (${appState["profile"]["wallHeight"]}px + 177.5px + 36px) + ${appState["profile"]["scrollTop"]}px)`
                                        }}
                                    />
                                </> : 
                                <>
                                    {profileData["posts"]["data"].length === 0 ?
                                        <div className="large-homePageProfileNoDataContainer"
                                                style={{
                                                    "minHeight": appState["profile"]["fixed"] ? 
                                                        `calc(100vh - 51px - 36px)` : 
                                                        `calc(100vh - (${appState["profile"]["wallHeight"]}px + 177.5px + 36px) + ${appState["profile"]["scrollTop"]}px)`
                                                }}
                                            >
                                            <img src="/assets/Finulab_Icon.png" alt="" className="large-marketPageNoDateNoticeImg" />
                                            <div className="large-marketPageNoDataONotice">
                                                {user ?
                                                    <>
                                                        {props.userId === user.user ?
                                                            <>
                                                                You don't have any posts yet,&nbsp;
                                                                <button className="large-marketPageNoDataONoticeBtn" onClick={() => navigate("/create-post")}>
                                                                    create one
                                                                </button>.
                                                            </> : `${props.userId} doesn't have any posts yet.`
                                                        }
                                                    </> :
                                                    <>
                                                        {`${props.userId}`} doesn't have any posts yet.
                                                    </>
                                                }
                                            </div>
                                        </div> :
                                        <>
                                            {profileData["posts"]["data"].map((post_desc, index) => (
                                                    <div className="large-homePagePostContainer" key={`profile-post-${post_desc._id}`}
                                                            ref={index === (profileData["posts"]["data"].length - 2) && !homePagePostsBeingUpdated ? lastPostElementRef : null}
                                                            style={index === (profileData["posts"]["data"].length - 1) ? 
                                                                {} : {"borderBottom": "solid 1px var(--primary-bg-08)"}
                                                            }
                                                        >
                                                        <div className="large-stocksPostInnerContainer"
                                                                key={`profile-inner-cont-post-${post_desc["_id"]}`}
                                                                style={
                                                                    {
                                                                        "height": `calc(20px + 40px + ${
                                                                            !user ? 0 : (post_desc.username === user.user || u_moderatorStatus.some(modStat => modStat.community === post_desc.groupId)) && post_desc.userRewards > 0 ? 28 : 0
                                                                        }px + ${
                                                                            post_desc.title === "" ? 0 : (10 + (analyzePostCharCount(post_desc.title, post_desc.timeStamp, "title") * 20))
                                                                        }px + ${
                                                                            post_desc.post === "" ? 0 : analyzePostCharCount(post_desc.post, post_desc.timeStamp, "post") >= 3 ? 
                                                                            79 + 5 + 18 : (16 + (analyzePostCharCount(post_desc.post, post_desc.timeStamp, "post") * 21.58))
                                                                        }px + ${
                                                                            post_desc.photos.length + post_desc.videos.length > 0 ? 16 + 275 : 0
                                                                        }px + 16px + 28px + ${post_desc.title !== "" && post_desc.post === "" ? 10 : 0}px)`,

                                                                        "minHeight": `calc(20px + 40px + ${
                                                                            !user ? 0 : (post_desc.username === user.user || u_moderatorStatus.some(modStat => modStat.community === post_desc.groupId)) && post_desc.userRewards > 0 ? 28 : 0
                                                                        }px + ${
                                                                            post_desc.title === "" ? 0 : (10 + (analyzePostCharCount(post_desc.title, post_desc.timeStamp, "title") * 20))
                                                                        }px + ${
                                                                            post_desc.post === "" ? 0 : analyzePostCharCount(post_desc.post, post_desc.timeStamp, "post") >= 3 ? 
                                                                            79 + 5 + 18 : (16 + (analyzePostCharCount(post_desc.post, post_desc.timeStamp, "post") * 21.58))
                                                                        }px + ${
                                                                            post_desc.photos.length + post_desc.videos.length > 0 ? 16 + 275 : 0
                                                                        }px + 16px + 28px + ${post_desc.title !== "" && post_desc.post === "" ? 10 : 0}px)`,

                                                                        "maxHeight": `calc(20px + 40px + ${
                                                                            !user ? 0 : (post_desc.username === user.user || u_moderatorStatus.some(modStat => modStat.community === post_desc.groupId)) && post_desc.userRewards > 0 ? 28 : 0
                                                                        }px + ${
                                                                            post_desc.title === "" ? 0 : (10 + (analyzePostCharCount(post_desc.title, post_desc.timeStamp, "title") * 20))
                                                                        }px + ${
                                                                            post_desc.post === "" ? 0 : analyzePostCharCount(post_desc.post, post_desc.timeStamp, "post") >= 3 ? 
                                                                            79 + 5 + 18 : (16 + (analyzePostCharCount(post_desc.post, post_desc.timeStamp, "post") * 21.58))
                                                                        }px + ${
                                                                            post_desc.photos.length + post_desc.videos.length > 0 ? 16 + 275 : 0
                                                                        }px + 16px + 28px + ${post_desc.title !== "" && post_desc.post === "" ? 10 : 0}px)`,
                                                                    }
                                                                }
                                                            >
                                                        <Post 
                                                            user={user ? user.user : "visitor"}
                                                            type={"home"}
                                                            view={"mini"}
                                                            details={post_desc}
                                                            loading={false}
                                                        />
                                                        </div>
                                                    </div>
                                                ))
                                            }
                                            {homePagePostsBeingUpdated ?
                                                <>
                                                    <div className="large-homePagePostContainer"
                                                            style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                        >
                                                        <Post loading={true}/>
                                                    </div>
                                                    <div className="large-homePagePostContainer"
                                                            style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                        >
                                                        <Post loading={true}/>
                                                    </div>
                                                    <div className="large-homePagePostContainer"
                                                            style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                        >
                                                        <Post loading={true}/>
                                                    </div>
                                                    <div className="large-homePagePostContainer"
                                                            style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                        >
                                                        <Post loading={true}/>
                                                    </div>
                                                    <div className="large-homePagePostContainer"
                                                            style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                        >
                                                        <Post loading={true}/>
                                                    </div>
                                                    <div className="large-homePagePostContainer"
                                                            style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                        >
                                                        <Post loading={true}/>
                                                    </div>
                                                    <div className="large-homePagePostContainer">
                                                        <Post loading={true}/>
                                                    </div>
                                                </> : null
                                            }
                                            <div className="large-homePageProfileNoDataContainer"
                                                style={{
                                                    "minHeight": appState["profile"]["fixed"] ? 
                                                        `calc(100vh - 51px - 36px)` : 
                                                        `calc(100vh - (${appState["profile"]["wallHeight"]}px + 177.5px + 36px) + ${appState["profile"]["scrollTop"]}px)`
                                                }}
                                            />
                                        </>
                                    }
                                </>
                            }
                        </> :
                        <>
                            {props.displayView === "rules" ?
                                <>
                                    {profileData["profileDesc"]["dataLoading"] ?
                                        <>
                                            <div className="large-homePagePostContainer"
                                                    style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                >
                                                <div className="large-stocksPostInnerContainer" style={{"height": "118px", "minHeight": "118px", "maxHeight": "118px"}}>
                                                    <CommunityRules loading={true}/>
                                                </div>
                                            </div>
                                            <div className="large-homePagePostContainer"
                                                    style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                >
                                                <div className="large-stocksPostInnerContainer" style={{"height": "118px", "minHeight": "118px", "maxHeight": "118px"}}>
                                                    <CommunityRules loading={true}/>
                                                </div>
                                            </div>
                                            <div className="large-homePagePostContainer"
                                                    style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                >
                                                <div className="large-stocksPostInnerContainer" style={{"height": "118px", "minHeight": "118px", "maxHeight": "118px"}}>
                                                    <CommunityRules loading={true}/>
                                                </div>
                                            </div>
                                            <div className="large-homePagePostContainer"
                                                    style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                >
                                                <div className="large-stocksPostInnerContainer" style={{"height": "118px", "minHeight": "118px", "maxHeight": "118px"}}>
                                                    <CommunityRules loading={true}/>
                                                </div>
                                            </div>
                                            <div className="large-homePagePostContainer">
                                                <div className="large-stocksPostInnerContainer" style={{"height": "118px", "minHeight": "118px", "maxHeight": "118px"}}>
                                                    <CommunityRules loading={true}/>
                                                </div>
                                            </div>
                                            <div className="large-homePageProfileNoDataContainer"
                                                style={{
                                                    "minHeight": appState["profile"]["fixed"] ? 
                                                        `calc(100vh - 51px - 36px)` : 
                                                        `calc(100vh - (${appState["profile"]["wallHeight"]}px + 177.5px + 36px) + ${appState["profile"]["secondaryScrollTop"]}px)`
                                                }}
                                            />
                                        </> : 
                                        <>
                                            {profileData["profileDesc"]["data"]["rules"].length === 0 ?
                                                <div className="large-homePageProfileNoDataContainer"
                                                        style={{
                                                            "minHeight": appState["profile"]["fixed"] ? 
                                                                `calc(100vh - 51px - 36px)` : 
                                                                `calc(100vh - (${appState["profile"]["wallHeight"]}px + 177.5px + 36px) + ${appState["profile"]["secondaryScrollTop"]}px)`
                                                        }}
                                                    >
                                                    {user ? 
                                                        <>
                                                            {profileData["profileDesc"]["data"]["moderators"].includes(user.user) ?
                                                                <>
                                                                    {community_rulesSupportDisabled ?
                                                                        <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                                                            <div className="large-stocksPostInnerContainer" style={{"height": "161px", "minHeight": "161px", "maxHeight": "161px"}}>
                                                                                <div className="community-rulesWrapper">
                                                                                    <div className="community-rulesHeader">
                                                                                        <div className="community-rulesHeaderNo">{profileData["profileDesc"]["data"]["rules"].length + 1}.</div>
                                                                                        <input type="text" 
                                                                                            name={"header"}
                                                                                            onChange={community_rulesSupportChangeHandler}
                                                                                            value={community_rulesSupport["header"]}
                                                                                            placeholder="Rule Header"
                                                                                            className="community-ruleHeaderDescriptionInput" 
                                                                                        />
                                                                                    </div>
                                                                                    
                                                                                    <textarea
                                                                                        name={"description"}
                                                                                        onChange={community_rulesSupportChangeHandler}
                                                                                        value={community_rulesSupport["description"]}
                                                                                        placeholder="Rule Description"
                                                                                        className="community-rulesBodyDescTxtArea"
                                                                                    ></textarea>

                                                                                    <div className="community-rulesEditOptnsandOutcomeContainer">
                                                                                        {saveNewRuleErrorStat === 1 ?
                                                                                            <span className="community-rulesEditOptnsErrorNotice">
                                                                                                An error occured, please try again later.
                                                                                            </span> : null
                                                                                        }
                                                                                        <div className="community-rulesEditOptnsContainer"
                                                                                                style={{
                                                                                                    "width": `179px`, "minWidth": `179px`, "maxWidth": `179px`
                                                                                                }}
                                                                                            >
                                                                                            <button className="community-rulesEditOptnsExpandBtn">
                                                                                                <BorderColorSharp className="community-rulesEditOptnsExpandBtnIcon"/>
                                                                                            </button>
                                                                                            <span style={{"fontWeight": "500", "fontSize": "1rem", "color": "var(--primary-bg-05)"}}>&nbsp;|&nbsp;&nbsp;</span>
                                                                                            <button className="community-ruleEditedSaveBtn"
                                                                                                    disabled={
                                                                                                        community_rulesSupport["header"].length === 0 || community_rulesSupport["description"].length === 0 || saveNewRuleLoading
                                                                                                    }
                                                                                                    onClick={() => saveNewRule()}
                                                                                                    style={
                                                                                                        {
                                                                                                            "backgroundColor": community_rulesSupport["header"].length === 0 
                                                                                                                || community_rulesSupport["description"].length === 0 ? "var(--primary-bg-05)" : "var(--primary-green-09)"
                                                                                                        }
                                                                                                    }
                                                                                                >
                                                                                                {saveNewRuleLoading ?
                                                                                                    <BeatLoader 
                                                                                                        color='var(--secondary-bg-03)'
                                                                                                        size={5}
                                                                                                    /> : `Save`
                                                                                                }
                                                                                            </button>
                                                                                            <button className="community-ruleEditedDeleteBtn"
                                                                                                    onClick={() => delete_newRule()}
                                                                                                >
                                                                                                Delete
                                                                                            </button>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        </div> : null
                                                                    }
                                                                    <div className="profile-homeEngagedTopHeaderContainer">
                                                                        <ElderlySharp className="profile-homeEngagedTopHeaderContainerIcon"/>
                                                                        Guide Your Community
                                                                        <div className="profile-homeEngagedTopHeaderOptnsContainer">
                                                                            <button className="profile-homeEngagedTopHeaderOptnBtn"
                                                                                    disabled={community_rulesSupportDisabled}
                                                                                    style={{
                                                                                        "marginRight": "8px",
                                                                                        "color": "var(--secondary-bg-03)",
                                                                                        "backgroundColor": community_rulesSupportDisabled ? "var(--primary-bg-05)" : "var(--primary-bg-01)"
                                                                                    }}
                                                                                    onClick={() => community_rulesSupportAdd()}
                                                                                >
                                                                                Add Rule
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </> : 
                                                                <>
                                                                    <img src="/assets/Finulab_Icon.png" alt="" className="large-marketPageNoDateNoticeImg" />
                                                                    <div className="large-marketPageNoDataONotice">
                                                                        {`${props.userId}`} doesn't have any rules yet.
                                                                    </div>
                                                                </>
                                                            }
                                                        </> : 
                                                        <>
                                                            <img src="/assets/Finulab_Icon.png" alt="" className="large-marketPageNoDateNoticeImg" />
                                                            <div className="large-marketPageNoDataONotice">
                                                                {`${props.userId}`} doesn't have any rules yet.
                                                            </div>
                                                        </>
                                                    }
                                                </div> :
                                                <>
                                                    {profileData["profileDesc"]["data"]["rules"].map((rule_desc, index) => {
                                                            const mod_stat = !user ? false : profileData["profileDesc"]["data"]["moderators"].includes(user.user);

                                                            return <div className="large-homePagePostContainer" 
                                                                    key={`community-rule-${index}`}
                                                                    style={profileData["profileDesc"]["data"]["rules"].length - 1 === index && !mod_stat ? {} : {"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                                >
                                                                <div className="large-stocksPostInnerContainer" 
                                                                        style={mod_stat ?
                                                                            {"height": "161px", "minHeight": "161px", "maxHeight": "161px"} : 
                                                                            {"height": "118px", "minHeight": "118px", "maxHeight": "118px"}
                                                                        }
                                                                    >
                                                                    <CommunityRules 
                                                                        loading={false}
                                                                        rule_index={index}
                                                                        rule_desc={rule_desc}
                                                                        mod_stat={mod_stat}
                                                                        communityName={props.userId}
                                                                    />
                                                                </div>
                                                            </div>
                                                        })
                                                    }
                                                    {community_rulesSupportDisabled ?
                                                        <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                                            <div className="large-stocksPostInnerContainer" style={{"height": "161px", "minHeight": "161px", "maxHeight": "161px"}}>
                                                                <div className="community-rulesWrapper">
                                                                    <div className="community-rulesHeader">
                                                                        <div className="community-rulesHeaderNo">{profileData["profileDesc"]["data"]["rules"].length + 1}.</div>
                                                                        <input type="text" 
                                                                            name={"header"}
                                                                            onChange={community_rulesSupportChangeHandler}
                                                                            value={community_rulesSupport["header"]}
                                                                            placeholder="Rule Header"
                                                                            className="community-ruleHeaderDescriptionInput" 
                                                                        />
                                                                    </div>
                                                                    
                                                                    <textarea
                                                                        name={"description"}
                                                                        onChange={community_rulesSupportChangeHandler}
                                                                        value={community_rulesSupport["description"]}
                                                                        placeholder="Rule Description"
                                                                        className="community-rulesBodyDescTxtArea"
                                                                    ></textarea>

                                                                    <div className="community-rulesEditOptnsandOutcomeContainer">
                                                                        {saveNewRuleErrorStat === 1 ?
                                                                            <span className="community-rulesEditOptnsErrorNotice">
                                                                                An error occured, please try again later.
                                                                            </span> : null
                                                                        }
                                                                        <div className="community-rulesEditOptnsContainer"
                                                                                style={{
                                                                                    "width": `179px`, "minWidth": `179px`, "maxWidth": `179px`
                                                                                }}
                                                                            >
                                                                            <button className="community-rulesEditOptnsExpandBtn">
                                                                                <BorderColorSharp className="community-rulesEditOptnsExpandBtnIcon"/>
                                                                            </button>
                                                                            <span style={{"fontWeight": "500", "fontSize": "1rem", "color": "var(--primary-bg-05)"}}>&nbsp;|&nbsp;&nbsp;</span>
                                                                            <button className="community-ruleEditedSaveBtn"
                                                                                    disabled={
                                                                                        community_rulesSupport["header"].length === 0 || community_rulesSupport["description"].length === 0 || saveNewRuleLoading
                                                                                    }
                                                                                    onClick={() => saveNewRule()}
                                                                                    style={
                                                                                        {
                                                                                            "backgroundColor": community_rulesSupport["header"].length === 0 
                                                                                                || community_rulesSupport["description"].length === 0 ? "var(--primary-bg-05)" : "var(--primary-green-09)"
                                                                                        }
                                                                                    }
                                                                                >
                                                                                {saveNewRuleLoading ?
                                                                                    <BeatLoader 
                                                                                        color='var(--secondary-bg-03)'
                                                                                        size={5}
                                                                                    /> : `Save`
                                                                                }
                                                                            </button>
                                                                            <button className="community-ruleEditedDeleteBtn"
                                                                                    onClick={() => delete_newRule()}
                                                                                >
                                                                                Delete
                                                                            </button>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        </div> : null
                                                    }
                                                    {user ? 
                                                        <>
                                                            {profileData["profileDesc"]["data"]["moderators"].includes(user.user) ? 
                                                                <div className="profile-homeEngagedTopHeaderContainer">
                                                                    <ElderlySharp className="profile-homeEngagedTopHeaderContainerIcon"/>
                                                                    Guide Your Community
                                                                    <div className="profile-homeEngagedTopHeaderOptnsContainer">
                                                                        <button className="profile-homeEngagedTopHeaderOptnBtn"
                                                                                disabled={community_rulesSupportDisabled}
                                                                                style={{
                                                                                    "marginRight": "8px",
                                                                                    "color": "var(--secondary-bg-03)",
                                                                                    "backgroundColor": community_rulesSupportDisabled ? "var(--primary-bg-05)" : "var(--primary-bg-01)"
                                                                                }}
                                                                                onClick={() => community_rulesSupportAdd()}
                                                                            >
                                                                            Add Rule
                                                                        </button>
                                                                    </div>
                                                                </div> : null
                                                            }
                                                        </> : null
                                                    }
                                                    <div className="large-homePageProfileNoDataContainer"
                                                        style={{
                                                            "minHeight": appState["profile"]["fixed"] ? 
                                                                `calc(100vh - 51px - 36px)` : 
                                                                `calc(100vh - (${appState["profile"]["wallHeight"]}px + 177.5px + 36px) + ${appState["profile"]["secondaryScrollTop"]}px)`
                                                        }}
                                                    />
                                                </>
                                            }
                                        </>
                                    }
                                </> : 
                                <>
                                    {props.displayView === "moderators" ?
                                        <>
                                            {user ?
                                                <>
                                                    {u_moderatorStatus.some(modStat => modStat.community === props.userId) ? 
                                                        <>
                                                            {u_moderatorStatus.filter(modStat => modStat.community === props.userId)[0]["type"] === "superMod" ?
                                                                <>
                                                                    <div className="profile-homeEngagedTopHeaderContainer">
                                                                        <AppRegistrationSharp className="profile-homeEngagedTopHeaderContainerIcon"/>
                                                                        {saveModSettingsError === 0 ?
                                                                            `Edit Moderators' Settings`: 
                                                                            <>
                                                                                {saveModSettingsError === 1 ? 
                                                                                    <span
                                                                                            style={{
                                                                                                "display": "flex", 
                                                                                                "alignItems": "center",
                                                                                                "color": "var(--primary-green-09)"
                                                                                            }}
                                                                                        >
                                                                                        <CheckCircleOutline />&nbsp;
                                                                                        Success
                                                                                    </span> : 
                                                                                    <>
                                                                                        {saveModSettingsError === 2 ?
                                                                                            <span
                                                                                                    style={{
                                                                                                        "display": "flex", 
                                                                                                        "alignItems": "center",
                                                                                                        "color": "var(--primary-red-09)"
                                                                                                    }}
                                                                                                >
                                                                                                <HighlightOffOutlined />&nbsp;
                                                                                                There must be at least 1 superMod.
                                                                                            </span> : 
                                                                                            <>
                                                                                                {saveModSettingsError === 3 ?
                                                                                                    <span
                                                                                                            style={{
                                                                                                                "display": "flex", 
                                                                                                                "alignItems": "center",
                                                                                                                "color": "var(--primary-red-09)"
                                                                                                            }}
                                                                                                        >
                                                                                                        <HighlightOffOutlined />&nbsp;
                                                                                                        Percents must sum up to 100.
                                                                                                    </span> : 
                                                                                                    <span
                                                                                                            style={{
                                                                                                                "display": "flex", 
                                                                                                                "alignItems": "center",
                                                                                                                "color": "var(--primary-red-09)"
                                                                                                            }}
                                                                                                        >
                                                                                                        <HighlightOffOutlined />&nbsp;
                                                                                                        An error occured, please try later.
                                                                                                    </span>
                                                                                                }
                                                                                            </>
                                                                                        }
                                                                                    </>
                                                                                }
                                                                            </>
                                                                        }
                                                                        <div className="profile-homeEngagedTopHeaderOptnsContainer">
                                                                            <div className="community-rulesEditOptnsContainer"
                                                                                    style={{
                                                                                        "width": `${modSettingsEditorWidth}`, "minWidth": `${modSettingsEditorWidth}`, "maxWidth": `${modSettingsEditorWidth}`, 
                                                                                        "marginRight": "8px"
                                                                                    }}
                                                                                >
                                                                                <button className="community-rulesEditOptnsExpandBtn"
                                                                                        onClick={() => modSettingsEditorStatToggle()}
                                                                                    >
                                                                                    <BorderColorSharp className="community-rulesEditOptnsExpandBtnIcon"/>
                                                                                </button>
                                                                                <span style={{"fontWeight": "500", "fontSize": "1rem", "color": "var(--primary-bg-05)"}}>&nbsp;|&nbsp;&nbsp;</span>
                                                                                <button className="community-ruleEditedSaveBtn"
                                                                                        disabled={saveModSettingsStat}
                                                                                        onClick={() => saveModSettings()}
                                                                                    >
                                                                                    {saveModSettingsStat ?
                                                                                        <BeatLoader 
                                                                                            color='var(--secondary-bg-03)'
                                                                                            size={5}
                                                                                        /> : `Save`
                                                                                    }
                                                                                </button>
                                                                                <button className="community-ruleEditedCancelBtn"
                                                                                        onClick={() => modSettingsEditorStatToggle()}
                                                                                    >
                                                                                    Cancel
                                                                                </button>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="large-homePageCommunitySearchWrapper">
                                                                        <div className="large-homePageCommunitySearchBarContainer"
                                                                                style={communityModeratorsAddSearch ?
                                                                                    {} : 
                                                                                    {"width": "25px", "minWidth": "25px", "maxWidth": "25px"}
                                                                                }
                                                                            >
                                                                            <button className="large-homePageSearchBarInputBtn"
                                                                                    style={{"marginLeft": "0.5px"}}
                                                                                    onClick={() => communityModeratorsAddSearchToggle()}
                                                                                >
                                                                                <Search className="large-homePageSearchBarWatchlistInputIcon"/>
                                                                            </button>
                                                                            <input type="text" 
                                                                                value={communityModeratorsQuery}
                                                                                onChange={communityModeratorsQueryHandler}
                                                                                placeholder="add moderators for community"
                                                                                className="large-homePageSearchBarInput" 
                                                                                style={{"marginLeft": "0px"}}
                                                                            />
                                                                        </div>
                                                                        <button className="large-homePageWatchlistSearchBarInputBtn"
                                                                                style={communityModeratorsAddSearch ?
                                                                                    {} : {"display": "none"}
                                                                                }
                                                                                onClick={() => communityModeratorsAddSearchToggle()}
                                                                            >
                                                                            <Close className="large-homePageSearchBarWatchlistInputIcon"/>
                                                                        </button>
                                                                    </div>
                                                                </> : null
                                                            }
                                                        </> : null
                                                    }
                                                </> : null
                                            }
                                            {profileData["profileDesc"]["dataLoading"] ?
                                                <>
                                                    <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                                        <div className="large-stocksPostInnerContainer" style={{"height": "144px", "minHeight": "144px", "maxHeight": "144px"}}>
                                                            <FinulabNetworkDesc loading={true}/>
                                                        </div>
                                                    </div>
                                                    <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                                        <div className="large-stocksPostInnerContainer" style={{"height": "144px", "minHeight": "144px", "maxHeight": "144px"}}>
                                                            <FinulabNetworkDesc loading={true}/>
                                                        </div>
                                                    </div>
                                                    <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                                        <div className="large-stocksPostInnerContainer" style={{"height": "144px", "minHeight": "144px", "maxHeight": "144px"}}>
                                                            <FinulabNetworkDesc loading={true}/>
                                                        </div>
                                                    </div>
                                                    <div className="large-homePageProfileNoDataContainer"
                                                        style={{
                                                            "minHeight": appState["profile"]["fixed"] ? 
                                                                `calc(100vh - 51px - 36px)` : 
                                                                `calc(100vh - (${appState["profile"]["wallHeight"]}px + 177.5px + 36px) + ${appState["profile"]["tertiaryScrollTop"]}px)`
                                                        }}
                                                    />
                                                </> : 
                                                <>
                                                    {u_moderatorStatus.some(modStat => modStat.community === props.userId) ? 
                                                        <>
                                                            {communityModeratorsAddSearch ?
                                                                <>
                                                                    {communityModeratorsResults.length === 0 ?
                                                                        null : 
                                                                        <>
                                                                            {communityModeratorsResults.map((commModRslt_desc, index) => (
                                                                                    <div className="community-moderatorSearchResultsContainer"
                                                                                            key={`community-modResult-${commModRslt_desc.username}`}
                                                                                            style={communityModeratorsResults.length - 1 === index ?
                                                                                                {"borderBottom": "none"} : {}
                                                                                            }
                                                                                        >
                                                                                        <img src={commModRslt_desc.profilePicture} alt="" className="community-moderatorSearchResultsProfileImg" />
                                                                                        <div className="community-moderatorSearchResultsUsernameDesc">{commModRslt_desc.username}</div>
                                                                                        {communityModAddErrorNotice === 1 ?
                                                                                            <div className="community-moderatorSearchResultsAddDesc">
                                                                                                <CheckCircleOutline className="community-moderatorSearchResultsAddDescIcon" />
                                                                                                Success
                                                                                            </div> : 
                                                                                            <>
                                                                                                {communityModAddErrorNotice === 2 ?
                                                                                                    <div className="community-moderatorSearchResultsAddDesc"
                                                                                                            style={{"color": "var(--primary-red-09)"}}
                                                                                                        >
                                                                                                        <HighlightOffOutlined className="community-moderatorSearchResultsAddDescIcon" />
                                                                                                        Error occured, please try later.
                                                                                                    </div> : null
                                                                                                }
                                                                                            </>
                                                                                        }
                                                                                        <button className="community-moderatorSearchResultsUserAddBtn"
                                                                                                disabled={communityModAddStat}
                                                                                                style={profileData["profileDesc"]["data"]["moderators"].includes(commModRslt_desc.username) ?
                                                                                                    {} : {"color": "var(--secondary-bg-03)", "backgroundColor": "var(--primary-bg-01"}
                                                                                                }
                                                                                                onClick={profileData["profileDesc"]["data"]["moderators"].includes(commModRslt_desc.username) ?
                                                                                                    () => {} : () => addModeratorSave(commModRslt_desc.username)
                                                                                                }
                                                                                            >
                                                                                            {profileData["profileDesc"]["data"]["moderators"].includes(commModRslt_desc.username) ?
                                                                                                `Added` : 
                                                                                                <>
                                                                                                    {communityModAddStat ?
                                                                                                        <BeatLoader 
                                                                                                            color='var(--secondary-bg-03)'
                                                                                                            size={5}
                                                                                                        /> : `Add`
                                                                                                    }
                                                                                                </>
                                                                                            }
                                                                                        </button>
                                                                                    </div>
                                                                                ))
                                                                            }
                                                                        </>
                                                                    }
                                                                </> :
                                                                <>
                                                                    {profileData["profileDesc"]["data"]["moderators"].map((mod_user, index) => {
                                                                            const u_desc = profileData["profileDesc"]["data"]["moderatorsQuickDesc"].filter(m_qD => m_qD.username === mod_user)[0];
                                                                            const u_secondaryDesc = profileData["profileDesc"]["data"]["moderatorsPrivileges"].filter(mp_qD => mp_qD.username === mod_user)[0];
                                                                            const u_secondaryDesc_target = profileData["profileDesc"]["data"]["moderatorsPrivileges"].findIndex(mp_qD => mp_qD.username === mod_user)
                                                                            
                                                                            return <div className="large-homePagePostContainer" 
                                                                                    key={`community-moderator-${mod_user}`}
                                                                                    style={profileData["profileDesc"]["data"]["moderators"].length - 1 === index ?
                                                                                        {} : {"borderBottom": "solid 1px var(--primary-bg-08)"}
                                                                                    }
                                                                                >
                                                                                <div className="large-stocksPostInnerContainer" 
                                                                                        style={u_desc["bio"] === "" ?
                                                                                            {"height": "109px", "minHeight": "109px", "maxHeight": "109px"} : 
                                                                                            {"height": "181px", "minHeight": "181px", "maxHeight": "181px"}
                                                                                        }
                                                                                    >
                                                                                    <div className="finulab-profileWatchlistWrapper">
                                                                                        <div className="finulab-profileWatchlistHeader">
                                                                                            <button className='profile-NotificationRightImgBtn' 
                                                                                                    onClick={() => navigate(`/profile/${mod_user}`)}
                                                                                                >
                                                                                                    {u_desc["profilePicture"] === "" ?
                                                                                                        <div className="post-headerProfileImageNone"
                                                                                                                style={generalOpx.profilePictureGradients[`${mod_user}`.length % 5]}
                                                                                                            >
                                                                                                            <img src="/assets/Favicon.png" alt="" className="large-homePageHeaderProfileImgNonUser" />
                                                                                                            <Tsunami className="post-headerProfileImageNoneIcon"/>
                                                                                                        </div> : <img src={u_desc["profilePicture"]} alt="" className="profile-NotificationRightImg" />
                                                                                                    }
                                                                                            </button>
                                                                                            <button className="profile-networkDescUsernameDescBtn"
                                                                                                    onClick={() => navigate(`/profile/${mod_user}`)}
                                                                                                >
                                                                                                <div className="profile-networkDescUsernameDesc">
                                                                                                    {mod_user}
                                                                                                </div>
                                                                                            </button>
                                                                                            {modDeleteEditorStat.length === 0 || modDeleteEditorStat[u_secondaryDesc_target][2] === 0 ?
                                                                                                null : 
                                                                                                <>
                                                                                                    {modDeleteEditorStat[u_secondaryDesc_target][2] === 1 ?
                                                                                                        <span className="community-rulesDeleteOutcomeNotice">
                                                                                                            <HighlightOffOutlined className="community-rulesDeleteOutcomeNoticeIcon"/>
                                                                                                            There must be at least 1 superMod.
                                                                                                        </span> : 
                                                                                                        <>
                                                                                                            {modDeleteEditorStat[u_secondaryDesc_target][2] === 2 ?
                                                                                                                <span className="community-rulesDeleteOutcomeNotice">
                                                                                                                    <HighlightOffOutlined className="community-rulesDeleteOutcomeNoticeIcon"/>
                                                                                                                    Reward Percent must be 0 prior to removal.
                                                                                                                </span> :
                                                                                                                <span className="community-rulesDeleteOutcomeNotice">
                                                                                                                    <HighlightOffOutlined className="community-rulesDeleteOutcomeNoticeIcon"/>
                                                                                                                    An error occured, please try again later.
                                                                                                                </span>
                                                                                                            }
                                                                                                        </>
                                                                                                    }
                                                                                                </>
                                                                                            }
                                                                                            {u_moderatorStatus.filter(modStat => modStat.community === props.userId)[0]["type"] === "superMod" ?
                                                                                                <div className="community-rulesEditOptnsContainer"
                                                                                                        style={modDeleteEditorStat.length === 0 ?
                                                                                                            {
                                                                                                                "width": `25px`, "minWidth": `25px`, "maxWidth": `25px`
                                                                                                            } : 
                                                                                                            {
                                                                                                                "width": `${modDeleteEditorStat[u_secondaryDesc_target][1]}`, "minWidth": `${modDeleteEditorStat[u_secondaryDesc_target][1]}`, "maxWidth": `${modDeleteEditorStat[u_secondaryDesc_target][1]}`
                                                                                                            }
                                                                                                        }
                                                                                                    >
                                                                                                    <button className="community-rulesEditOptnsExpandBtn"
                                                                                                            disabled={modDeleteEditorStat.length === 0 ? true :
                                                                                                                modDeleteEditorStat[u_secondaryDesc_target][0]
                                                                                                            }
                                                                                                            onClick={() => modDeleteEditorStatToggle(u_secondaryDesc_target)}
                                                                                                        >
                                                                                                        <DeleteSharp className="community-rulesEditOptnsExpandBtnIcon"/>
                                                                                                    </button>
                                                                                                    <span style={{"fontWeight": "500", "fontSize": "1rem", "color": "var(--primary-bg-05)"}}>&nbsp;|&nbsp;&nbsp;</span>
                                                                                                    <button className="community-ruleEditedDeleteBtn"
                                                                                                            style={{"marginLeft": "0px"}}
                                                                                                            disabled={modDeleteEditorStat.length === 0 ? true :
                                                                                                                modDeleteEditorStat[u_secondaryDesc_target][0]
                                                                                                            }
                                                                                                            onClick={() => modDeleteSave(u_secondaryDesc_target)}
                                                                                                        >
                                                                                                        {modDeleteEditorStat.length === 0 ?
                                                                                                            `Delete` :
                                                                                                            <>
                                                                                                                {modDeleteEditorStat[u_secondaryDesc_target][0] ?
                                                                                                                    <BeatLoader 
                                                                                                                        color='var(--secondary-bg-03)'
                                                                                                                        size={5}
                                                                                                                    /> : `Delete`
                                                                                                                }
                                                                                                            </>
                                                                                                        }
                                                                                                    </button>
                                                                                                    <button className="community-ruleEditedCancelBtn"
                                                                                                            disabled={modDeleteEditorStat.length === 0 ? true :
                                                                                                                modDeleteEditorStat[u_secondaryDesc_target][0]
                                                                                                            }
                                                                                                            onClick={() => modDeleteEditorStatToggle(u_secondaryDesc_target)}
                                                                                                        >
                                                                                                        Cancel
                                                                                                    </button>
                                                                                                </div> : null
                                                                                            }
                                                                                        </div>
                                                                                        <div className="finulab-profileWatchlistNameBodyContainer">
                                                                                            {u_desc["bio"] === "" ?
                                                                                                null : 
                                                                                                <button className="profile-NotificationNavigateToBtn"
                                                                                                        onClick={() => navigate(`/profile/${mod_user}`)}
                                                                                                    >
                                                                                                    <div className="profile-NotificationLongMsgContainer">
                                                                                                        <div className="profile-NotificationLongMsgDesc">
                                                                                                            {u_desc["bio"]}
                                                                                                        </div>
                                                                                                    </div>
                                                                                                </button>
                                                                                            }
                                                                                            <div className="finulab-communityModSettingsEditorContainer">
                                                                                                <div className="finulab-communityModSettingsEditorSegement">
                                                                                                    <span className="finulab-communityModSettingsEditorSegementHeader">Mod Type</span>
                                                                                                    {modSettingsEditorStat ?
                                                                                                        <select className="finulab-communityModSettingsModTypeSelect"
                                                                                                                name={`modType-${u_secondaryDesc_target}`}
                                                                                                                onChange={modSettingsEditorHandler}
                                                                                                                value={modSettingsEditorSettings[u_secondaryDesc_target]["modType"]}
                                                                                                            >
                                                                                                            <option value={"superMod"}>superMod</option>
                                                                                                            <option value={"mod"}>mod</option>
                                                                                                        </select> :
                                                                                                        <span style={{"marginLeft": "5px", "fontWeight": "500", "color": "var(--primary-bg-01)"}}>
                                                                                                            {u_secondaryDesc["modType"]}
                                                                                                        </span>
                                                                                                    }
                                                                                                </div>
                                                                                                <div className="finulab-communityModSettingsEditorSegement">
                                                                                                    <span className="finulab-communityModSettingsEditorSegementHeaderV2">Reward Percent</span>
                                                                                                    {modSettingsEditorStat ?
                                                                                                        <input type="text" 
                                                                                                            name={`rewardPerc-${u_secondaryDesc_target}`}
                                                                                                            onChange={modSettingsEditorHandler}
                                                                                                            value={modSettingsEditorSettings[u_secondaryDesc_target]["rewardPerc"]}
                                                                                                            placeholder='Reward %'
                                                                                                            className="finulab-communityModSettingsRewardPercInput" 
                                                                                                        /> : 
                                                                                                        <span style={{"marginLeft": "5px", "fontWeight": "500", "color": "var(--primary-bg-01)"}}>
                                                                                                            {u_secondaryDesc["rewardPerc"]}%
                                                                                                        </span>
                                                                                                    }
                                                                                                </div>
                                                                                                <div className="finulab-communityModSettingsEditorSegementV2">
                                                                                                    <span className="finulab-communityModSettingsEditorSegementHeaderV3" 
                                                                                                            style={{"textAlign": "right"}}
                                                                                                        >
                                                                                                        {format(new Date(u_secondaryDesc["timeStamp"] * 1000), "MMM d, yyyy hh:mm a")}
                                                                                                    </span>
                                                                                                </div>
                                                                                            </div>
                                                                                        </div>
                                                                                    </div>
                                                                                </div>
                                                                            </div>
                                                                        })
                                                                    }
                                                                </>
                                                            }
                                                            <div className="large-homePageProfileNoDataContainer"
                                                                style={{
                                                                    "minHeight": appState["profile"]["fixed"] ? 
                                                                        `calc(100vh - 51px - 36px)` : 
                                                                        `calc(100vh - (${appState["profile"]["wallHeight"]}px + 177.5px + 36px) + ${appState["profile"]["tertiaryScrollTop"]}px)`
                                                                }}
                                                            />
                                                        </> : 
                                                        <>
                                                            {profileData["profileDesc"]["data"]["moderators"].map((mod_user, index) => {
                                                                    const u_desc = profileData["profileDesc"]["data"]["moderatorsQuickDesc"].filter(m_qD => m_qD.username === mod_user)[0];

                                                                    return <div className="large-homePagePostContainer" 
                                                                            key={`community-moderator-${mod_user}`}
                                                                            style={profileData["profileDesc"]["data"]["moderators"].length - 1 === index ?
                                                                                {} : {"borderBottom": "solid 1px var(--primary-bg-08)"}
                                                                            }
                                                                        >
                                                                        <div className="large-stocksPostInnerContainer" 
                                                                                style={u_desc["bio"] === "" ?
                                                                                    {"height": "72px", "minHeight": "72px", "maxHeight": "72px"} : 
                                                                                    {"height": "144px", "minHeight": "144px", "maxHeight": "144px"}
                                                                                }
                                                                            >
                                                                            <FinulabNetworkDesc 
                                                                                loading={false}
                                                                                desc_index={index}
                                                                                network_type={"U"}
                                                                                network_element={u_desc}
                                                                            />
                                                                        </div>
                                                                    </div>
                                                                })
                                                            }
                                                            <div className="large-homePageProfileNoDataContainer"
                                                                style={{
                                                                    "minHeight": appState["profile"]["fixed"] ? 
                                                                        `calc(100vh - 51px - 36px)` : 
                                                                        `calc(100vh - (${appState["profile"]["wallHeight"]}px + 177.5px + 36px) + ${appState["profile"]["tertiaryScrollTop"]}px)`
                                                                }}
                                                            />
                                                        </>
                                                    }
                                                </>
                                            }
                                        </> : 
                                        <>
                                            {props.displayView === "notifications" ?
                                                <>
                                                    {profileData["notifications"]["dataLoading"] ?
                                                        <>
                                                            <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                                                <div className="large-stocksPostInnerContainer" style={{"height": "102px", "minHeight": "102px", "maxHeight": "102px"}}>
                                                                    <FinulabNotification loading={true}/>
                                                                </div>
                                                            </div>
                                                            <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                                                <div className="large-stocksPostInnerContainer" style={{"height": "102px", "minHeight": "102px", "maxHeight": "102px"}}>
                                                                    <FinulabNotification loading={true}/>
                                                                </div>
                                                            </div>
                                                            <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                                                <div className="large-stocksPostInnerContainer" style={{"height": "102px", "minHeight": "102px", "maxHeight": "102px"}}>
                                                                    <FinulabNotification loading={true}/>
                                                                </div>
                                                            </div>
                                                            <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                                                <div className="large-stocksPostInnerContainer" style={{"height": "102px", "minHeight": "102px", "maxHeight": "102px"}}>
                                                                    <FinulabNotification loading={true}/>
                                                                </div>
                                                            </div>
                                                            <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                                                <div className="large-stocksPostInnerContainer" style={{"height": "102px", "minHeight": "102px", "maxHeight": "102px"}}>
                                                                    <FinulabNotification loading={true}/>
                                                                </div>
                                                            </div>
                                                            <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                                                <div className="large-stocksPostInnerContainer" style={{"height": "102px", "minHeight": "102px", "maxHeight": "102px"}}>
                                                                    <FinulabNotification loading={true}/>
                                                                </div>
                                                            </div>
                                                            <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                                                <div className="large-stocksPostInnerContainer" style={{"height": "102px", "minHeight": "102px", "maxHeight": "102px"}}>
                                                                    <FinulabNotification loading={true}/>
                                                                </div>
                                                            </div>
                                                            <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                                                <div className="large-stocksPostInnerContainer" style={{"height": "102px", "minHeight": "102px", "maxHeight": "102px"}}>
                                                                    <FinulabNotification loading={true}/>
                                                                </div>
                                                            </div>
                                                            <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                                                <div className="large-stocksPostInnerContainer" style={{"height": "102px", "minHeight": "102px", "maxHeight": "102px"}}>
                                                                    <FinulabNotification loading={true}/>
                                                                </div>
                                                            </div>
                                                            <div className="large-homePagePostContainer">
                                                                <div className="large-stocksPostInnerContainer" style={{"height": "102px", "minHeight": "102px", "maxHeight": "102px"}}>
                                                                    <FinulabNotification loading={true}/>
                                                                </div>
                                                            </div>
                                                            <div className="large-homePageProfileNoDataContainer"
                                                                style={{
                                                                    "minHeight": appState["profile"]["fixed"] ? 
                                                                        `calc(100vh - 51px - 36px)` : 
                                                                        `calc(100vh - (${appState["profile"]["wallHeight"]}px + 177.5px + 36px) + ${appState["profile"]["quaterneryScrollTop"]}px)`
                                                                }}
                                                            />
                                                        </> : 
                                                        <>
                                                            {profileData["notifications"]["data"].length === 0 ?
                                                                <div className="large-homePageProfileNoDataContainer"
                                                                        style={{
                                                                            "minHeight": appState["profile"]["fixed"] ? 
                                                                                `calc(100vh - 51px - 36px)` : 
                                                                                `calc(100vh - (${appState["profile"]["wallHeight"]}px + 177.5px + 36px) + ${appState["profile"]["quaterneryScrollTop"]}px)`
                                                                        }}
                                                                    >
                                                                    <img src="/assets/Finulab_Icon.png" alt="" className="large-marketPageNoDateNoticeImg" />
                                                                    <div className="large-marketPageNoDataONotice">
                                                                        You don't have any notifications yet.
                                                                    </div>
                                                                    <div className="large-marketPageNoDataTNotice">
                                                                        Start engaging with people to fill up your feed.
                                                                    </div>
                                                                </div> :
                                                                <>
                                                                    {profileData["notifications"]["data"].map((notification_desc, index) => (
                                                                            <div className="large-homePagePostContainer" 
                                                                                    key={`profile-notification-${notification_desc["_id"]}`}
                                                                                    ref={profileData["notifications"]["data"].length - 2 === index ? lastNotificationElementRef : null}
                                                                                    style={profileData["notifications"]["data"].length - 1 === index ?
                                                                                        {} : {"borderBottom": "solid 1px var(--primary-bg-08)"}
                                                                                    }
                                                                                >
                                                                                <div className="large-stocksPostInnerContainer" 
                                                                                        style={notification_desc["secondaryMessage"] === "" ?
                                                                                            {"height": "102px", "minHeight": "102px", "maxHeight": "102px"} : 
                                                                                            {"height": "174px", "minHeight": "174px", "maxHeight": "174px"}
                                                                                        }
                                                                                    >
                                                                                    <FinulabNotification 
                                                                                        loading={false} 
                                                                                        desc_index={index}
                                                                                        notificationDesc={notification_desc}
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                    }
                                                                    <div className="large-homePageProfileNoDataContainer"
                                                                        style={{
                                                                            "minHeight": appState["profile"]["fixed"] ? 
                                                                                `calc(100vh - 51px - 36px)` : 
                                                                                `calc(100vh - (${appState["profile"]["wallHeight"]}px + 177.5px + 36px) + ${appState["profile"]["quaterneryScrollTop"]}px)`
                                                                        }}
                                                                    />
                                                                </>
                                                            }
                                                        </>
                                                    }
                                                </> : 
                                                <>
                                                    {props.displayView === "watchlist" ?
                                                        <>
                                                            {profileData["profileDesc"]["dataLoading"] || profileData["watchlist"]["dataLoading"] ?
                                                                <>
                                                                    <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                                                        <div className="large-stocksPostInnerContainer" style={{"height": "174px", "minHeight": "174px", "maxHeight": "174px"}}>
                                                                            <FinulabProfileWatchlist loading={true}/>
                                                                        </div>
                                                                    </div>
                                                                    <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                                                        <div className="large-stocksPostInnerContainer" style={{"height": "174px", "minHeight": "174px", "maxHeight": "174px"}}>
                                                                            <FinulabProfileWatchlist loading={true}/>
                                                                        </div>
                                                                    </div>
                                                                    <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                                                        <div className="large-stocksPostInnerContainer" style={{"height": "174px", "minHeight": "174px", "maxHeight": "174px"}}>
                                                                            <FinulabProfileWatchlist loading={true}/>
                                                                        </div>
                                                                    </div>
                                                                    <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                                                        <div className="large-stocksPostInnerContainer" style={{"height": "174px", "minHeight": "174px", "maxHeight": "174px"}}>
                                                                            <FinulabProfileWatchlist loading={true}/>
                                                                        </div>
                                                                    </div>
                                                                    <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                                                        <div className="large-stocksPostInnerContainer" style={{"height": "174px", "minHeight": "174px", "maxHeight": "174px"}}>
                                                                            <FinulabProfileWatchlist loading={true}/>
                                                                        </div>
                                                                    </div>
                                                                    <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                                                        <div className="large-stocksPostInnerContainer" style={{"height": "174px", "minHeight": "174px", "maxHeight": "174px"}}>
                                                                            <FinulabProfileWatchlist loading={true}/>
                                                                        </div>
                                                                    </div>
                                                                    <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                                                        <div className="large-stocksPostInnerContainer" style={{"height": "174px", "minHeight": "174px", "maxHeight": "174px"}}>
                                                                            <FinulabProfileWatchlist loading={true}/>
                                                                        </div>
                                                                    </div>
                                                                    <div className="large-homePagePostContainer" style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}>
                                                                        <div className="large-stocksPostInnerContainer" style={{"height": "174px", "minHeight": "174px", "maxHeight": "174px"}}>
                                                                            <FinulabProfileWatchlist loading={true}/>
                                                                        </div>
                                                                    </div>
                                                                    <div className="large-homePagePostContainer">
                                                                        <div className="large-stocksPostInnerContainer" style={{"height": "174px", "minHeight": "174px", "maxHeight": "174px"}}>
                                                                            <FinulabProfileWatchlist loading={true}/>
                                                                        </div>
                                                                    </div>
                                                                    <div className="large-homePageProfileNoDataContainer"
                                                                        style={{
                                                                            "minHeight": appState["profile"]["fixed"] ? 
                                                                                `calc(100vh - 51px - 36px)` : 
                                                                                `calc(100vh - (${appState["profile"]["wallHeight"]}px + 177.5px + 36px) + ${appState["profile"]["tertiaryScrollTop"]}px)`
                                                                        }}
                                                                    />
                                                                </> : 
                                                                <>
                                                                    {profileData["profileDesc"]["data"]["watchlist"].slice(0, 
                                                                        profileData["profileDesc"]["data"]["watchlist"].length - profileData["watchlist"]["notCovered"].length).map((asst, index) => (
                                                                            <div className="large-homePagePostContainer" 
                                                                                    key={`profile-watchlist-${asst}`}
                                                                                    ref={profileData["profileDesc"]["data"]["watchlist"].length - profileData["watchlist"]["notCovered"].length - 1 === index ? lastProfileWatchlistElementRef : null}
                                                                                    style={profileData["profileDesc"]["data"]["watchlist"].length - profileData["watchlist"]["notCovered"].length - 1 === index ?
                                                                                        {} : {"borderBottom": "solid 1px var(--primary-bg-08)"}
                                                                                    }
                                                                                >
                                                                                <div className="large-stocksPostInnerContainer" 
                                                                                        style={{"height": "174px", "minHeight": "174px", "maxHeight": "174px"}}
                                                                                    >
                                                                                    <FinulabProfileWatchlist 
                                                                                        loading={false}
                                                                                        type={asst.slice(0, 1)}
                                                                                        price_desc={asst.slice(0, 1) === "S" ?
                                                                                            profileData["watchlist"]["stocks"]["support"].filter(asst_prc_desc => asst_prc_desc.symbol === asst.slice(3, asst.length))[0] :
                                                                                            profileData["watchlist"]["cryptos"]["support"].filter(asst_prc_desc => asst_prc_desc.symbol === asst.slice(3, asst.length))[0]
                                                                                        }
                                                                                        asset_desc={asst.slice(0, 1) === "S" ?
                                                                                            profileData["watchlist"]["stocks"]["data"].filter(asst_rl_desc => asst_rl_desc.symbol === asst.slice(3, asst.length))[0] :
                                                                                            profileData["watchlist"]["cryptos"]["data"].filter(asst_rl_desc => asst_rl_desc.symbol === asst.slice(3, asst.length))[0]
                                                                                        }
                                                                                    />
                                                                                </div>
                                                                            </div>
                                                                        ))
                                                                    }
                                                                    <div className="large-homePageProfileNoDataContainer"
                                                                        style={{
                                                                            "minHeight": appState["profile"]["fixed"] ? 
                                                                                `calc(100vh - 51px - 36px)` : 
                                                                                `calc(100vh - (${appState["profile"]["wallHeight"]}px + 177.5px + 36px) + ${appState["profile"]["tertiaryScrollTop"]}px)`
                                                                        }}
                                                                    />
                                                                </>
                                                            }
                                                        </> : null
                                                    }
                                                </>
                                            }
                                        </>
                                    }
                                </>
                            }
                        </>
                    }
                    {/*contentBodyWidth[1] === true ?
                        <div className="large-homePageContentCreateWrapper" 
                                style={
                                    {
                                        ...{"width": `${contentBodyWidth[0]}px`, "minWidth": `${contentBodyWidth[0]}px`, "maxWidth": `${contentBodyWidth[0]}px`},
                                        
                                    }
                                }
                            >
                            {/*appState["profile"]["visible"] ? 
                                {
                                    ...{"width": `${contentBodyWidth[0] - 20}px`, "minWidth": `${contentBodyWidth[0] - 20}px`, "maxWidth": `${contentBodyWidth[0] - 20}px`},
                                    
                                }
                                {"marginLeft": `${contentBodyWidth[0] - 110}px`, "backgroundColor": "rgba(0, 110, 230, 0.85)"} :
                                {"marginLeft": `${contentBodyWidth[0] - 110}px`, "backgroundColor": "rgba(0, 110, 230, 0.05)"}
                            *--/}
                            <button className="large-homePageContentCreateSection">
                                <PostAdd className="large-homePageContentCreateSectionIcon"/>
                                <span className="large-homePageContentCreateSectionDesc">Post</span>
                            </button>
                            <div className="large-homePageContentCreateSectionDivider"/>
                            <button className="large-homePageContentCreateSection">
                                <AssuredWorkload className="large-homePageContentCreateSectionIcon"/>
                                <span className="large-homePageContentCreateSectionDesc">Pair</span>
                            </button>
                        </div> : null
                    */}
                </div>
            }
        </div>
    )
}