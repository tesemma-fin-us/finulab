import '../../../../layout/app-layout.css';

import axios from 'axios';
import {useNavigate} from 'react-router-dom';
import 'react-image-crop/dist/ReactCrop.css';
import {throttle} from 'lodash';
import BeatLoader from 'react-spinners/BeatLoader';
import {useDispatch, useSelector} from 'react-redux';
import {useRef, useState, useLayoutEffect, useEffect, useMemo, useCallback} from 'react';
import ReactCrop, {convertToPercentCrop, makeAspectCrop} from 'react-image-crop';
import {AssuredWorkload, CameraAlt, CloseSharp, FollowTheSignsSharp, KeyboardBackspace, LockPersonSharp, PaymentsSharp, PersonRemoveSharp, PostAdd, TrendingUp, Tsunami, Verified} from '@mui/icons-material';

import Post from '../../../../components/post';
import generalOpx from '../../../../functions/generalFunctions';
import FinulabNotification from '../../../../components/notification/notification';
import FinulabNetworkDesc from '../../../../components/networkDesc/finulabNetworkDesc';
import MiniaturizedPrediction from '../../../../components/miniaturized/prediction/mini-prediction';
import FinulabProfileWatchlist from '../../../../components/profileWatchlist/finulabProfileWatchlist';

import {login, selectUser} from '../../../../reduxStore/user';
import {setViewMedia} from '../../../../reduxStore/viewMedia';
import {selectModeratorStatus} from '../../../../reduxStore/moderatorStatus';
import {setQuickNotifications, selectNotifications} from '../../../../reduxStore/notifications';
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

export default function InnerProfilePage(props) {
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
    const [profileSettings, setProfileSettings] = useState({"email": "", "bio": ""});
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
        const utilizeFile = base64ToFile(dataUrl, `${user.user}-profileImage`);

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
        const utilizeFile = base64ToFile(dataUrl, `${user.user}-profileWallpaper`);

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

        const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
        if(!regexEmail.test(profileSettings.email)) {
            setProfileImageError(3);

            setTimeout(() => {
                setProfileImageError(0);
            }, 2000);
        } else {
            const ownUpdateSettings = await generalOpx.axiosInstance.post(`/users/own-update-settings`, 
                {
                    "bio": profileSettings.bio,
                    "email": profileSettings.email,
                    "profileImage": profileImageUpdatedSource === "" ? profileData["profileDesc"]["data"]["profilePicture"] : profileImageUpdatedSource,
                    "wallpaperImage": wallpaperImageUpdatedSource === "" ? profileData["profileDesc"]["data"]["profileWallpaper"] : wallpaperImageUpdatedSource
                }
            );

            if(ownUpdateSettings.data["status"] === "success") {
                let profileDesc = {...profileData["profileDesc"]["data"]};
                profileDesc["bio"] = profileSettings.bio;
                profileDesc["email"] = profileSettings.email;
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
                dispatch(
                    login(
                        {
                            user: user.user,
                            profilePicture: profileImageUpdatedSource === "" ? profileData["profileDesc"]["data"]["profilePicture"] : profileImageUpdatedSource,
                            profileWallpaper: wallpaperImageUpdatedSource === "" ? profileData["profileDesc"]["data"]["profileWallpaper"] : wallpaperImageUpdatedSource,
                            finuxEarned: user.finuxEarned,
                            walletAddress: user.walletAddress,
                            monetized: user.monetized,
                            verified: user.verified,
                            verificationData: user.verificationData,
                            createdAt: user.createdAt
                        }
                    )
                );

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
    const setProfile = async () => {
        const userId = props.userId;
        
        if(setProfileCalled !== userId) {
            setSetProfileCalled(userId);

            if(user) {
                if(userId === user.user) {
                    const profileDesc = await generalOpx.axiosInstance.put(`/users/own-desc`, {"username": userId});
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
                                "bio": profileDesc.data["data"]["bio"],
                                "email": profileDesc.data["data"]["email"]
                            }
                        );
                    }
                } else {
                    const profileDesc = await generalOpx.axiosInstance.put(`/users/profile-desc`, {"username": userId});
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
                const profileDesc = await generalOpx.axiosInstance.put(`/users/profile-desc`, {"username": userId});
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
                        if(user.user === props.userId) {
                            setProfileSettings(
                                {
                                    "bio": profileData["profileDesc"]["data"]["bio"],
                                    "email": profileData["profileDesc"]["data"]["email"]
                                }
                            );
                        }
                    }

                    if(scrollController.current) {
                        setTimeout(() => {
                            let targetScrollTop = 0;
                            if(props.displayView === "") {
                                targetScrollTop = appState["profile"]["scrollTop"];
                            } else if(props.displayView === "markets") {
                                targetScrollTop = appState["profile"]["secondaryScrollTop"];
                            } else if(props.displayView === "engaged" || props.displayView === "watchlist") {
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
            await generalOpx.axiosInstance.put(`/content/posts/profile`,
                {
                    "type": type,
                    "username": username,
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
                                updatePosts(response.data["data"])
                            );
                        }
                    }
                }
            );
        }

        setHomePagePostsBeingUpdated(false);
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
                        setHomePagePostsBeingUpdated(true);

                        let p_ninclude = [];
                        for(let i = 0; i < profileData["posts"]["data"].length; i++) {
                            p_ninclude.push(profileData["posts"]["data"][i]["_id"]);
                        }
                        pullPosts("secondary", p_ninclude);
                    }
                }
            );
            if(node) postsObserverRef.current.observe(node);
        }, [profileData, homePagePostsBeingUpdated]
    );

    const [homePageMarketsBeingUpdated, setHomePageMarketsBeingUpdated] = useState(false);
    const pullMarkets = async (type, p_ninclude) => {
        if(type === "primary" || profileData["markets"]["data"].length < profileData["markets"]["dataCount"]) {
            const username = props.userId;
            await generalOpx.axiosInstance.put(`/market/profile`, 
                {
                    "type": type,
                    "username": username,
                    "p_ninclude": p_ninclude
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
                                updateMarketsProcessedHeights(processedHeightsFunction)
                            );

                            if(user && response.data["data"].length > 0) {
                                if(u_predictionEngagement.length === 0) {
                                    const predictionIds = [...response.data["data"].map(p_data => p_data._id)];
                                    const predictionEngagements = await generalOpx.axiosInstance.put(`/market/prediction-engagements`, {"predictionIds": predictionIds});

                                    if(predictionEngagements.data["status"] === "success" && predictionEngagements.data["data"].length > 0) {
                                        dispatch(
                                            setPredictionEngagement(predictionEngagements.data["data"])
                                        );
                                    }
                                } else {
                                    const predictionIdsToEliminate = [...u_predictionEngagement.map(h_data => h_data.predictionId)];
                                    const predictionIds = [...response.data["data"].filter(({_id}) => !predictionIdsToEliminate.includes(_id)).map(({_id}) => _id)];

                                    if(predictionIds.length > 0) {
                                        const predictionEngagements = await generalOpx.axiosInstance.put(`/market/prediction-engagements`, {"predictionIds": predictionIds});

                                        if(predictionEngagements.data["status"] === "success" && predictionEngagements.data["data"].length > 0) {
                                            dispatch(
                                                addToPredictionEngagement(predictionEngagements.data["data"])
                                            );
                                        }
                                    }
                                }
                            }

                            dispatch(
                                setMarkets(
                                    {
                                        "username": username,
                                        "data": response.data["data"],
                                        "markets": response.data["markets"],
                                        "dataCount": response.data["dataCount"],
                                        "dataLoading": false
                                    }
                                )
                            );
                        } else if(type === "secondary") {
                            let processedHeightsFunction = {
                                "postHeights": [...profileData["marketsProcessedHeights"]["postHeights"]].concat(Array(response.data["data"].length).fill(0)),
                                "processedRefs": {...profileData["marketsProcessedHeights"]["processedRefs"]}
                            }
                            dispatch(
                                updateMarketsProcessedHeights(processedHeightsFunction)
                            );

                            if(user && response.data["data"].length > 0) {
                                const engPredictionIdsToEliminate = [...u_predictionEngagement.map(h_data => h_data.predictionId)];
                                const engPredictionIds = [...response.data["data"].filter(({_id}) => !engPredictionIdsToEliminate.includes(_id)).map(({_id}) => _id)];

                                if(engPredictionIds.length > 0) {
                                    const predictionEngagements = await generalOpx.axiosInstance.put(`/market/prediction-engagements`, {"predictionIds": engPredictionIds});

                                    if(predictionEngagements.data["status"] === "success" && predictionEngagements.data["data"].length > 0) {
                                        dispatch(
                                            addToPredictionEngagement(predictionEngagements.data["data"])
                                        );
                                    }
                                }
                            }

                            dispatch(
                                updateMarkets(
                                    {
                                        "data": response.data["data"],
                                        "markets": response.data["markets"]
                                    }
                                )
                            )
                        }
                    }
                }
            )
        }

        setHomePageMarketsBeingUpdated(false);
    }

    const marketObserverRef = useRef();
    const lastMarketElementRef = useCallback(node => 
        {
            if(props.displayView !== "markets") return;
            if(profileData["markets"]["dataLoading"]) return;
            if(homePageMarketsBeingUpdated) return;
            if(marketObserverRef.current) marketObserverRef.current.disconnect();
            marketObserverRef.current = new IntersectionObserver(entries => 
                {
                    if(entries[0].isIntersecting && profileData["markets"]["data"].length < profileData["markets"]["dataCount"]) {
                        setHomePageMarketsBeingUpdated(true);

                        let p_ninclude = [];
                        for(let i = 0; i < profileData["markets"]["data"].length; i++) {
                            p_ninclude.push(profileData["markets"]["data"][i]["_id"]);
                        }
                        pullMarkets("secondary", p_ninclude);
                    }
                }
            );
            if(node) marketObserverRef.current.observe(node);
        }, [profileData, homePageMarketsBeingUpdated]
    );

    const [homePageEngagedBeingUpdated, setHomePageEngagedBeingUpdated] = useState(false);
    const pullEngagedPosts = async (type, p_ninclude) => {
        const username = props.userId;
        if(type === "primary" || profileData["engaged"]["data"].length < profileData["engaged"]["dataCount"]) {
            await generalOpx.axiosInstance.put(`/content/posts/engaged`, 
                {
                    "type": type,
                    "p_ninclude": p_ninclude
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
                                updateEnagedProcessedHeights(processedHeightsFunction)
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
                                setEngaged(
                                    {
                                        "username": username,
                                        "type": "posts",
                                        "data": response.data["data"],
                                        "support": [],
                                        "dataCount": response.data["dataCount"],
                                        "dataLoading": false
                                    }
                                )
                            );
                        } else if(type === "secondary") {
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

                            if(response.data["data"].length === 0) {
                                dispatch(
                                    setEngaged(
                                        {
                                            "username": username,
                                            "type": "posts",
                                            "data": profileData["engaged"]["data"],
                                            "support": [],
                                            "dataCount": profileData["engaged"]["data"].length,
                                            "dataLoading": false
                                        }
                                    )
                                );
                            } else {
                                let processedHeightsFunction = {
                                    "postHeights": [...profileData["engagedProcessedHeights"]["postHeights"]].concat(Array(response.data["data"].length).fill(0)),
                                    "processedRefs": {...profileData["engagedProcessedHeights"]["processedRefs"]}
                                }
                                dispatch(
                                    updateEnagedProcessedHeights(processedHeightsFunction)
                                );
                                
                                dispatch(
                                    setEngaged(
                                        {
                                            "username": username,
                                            "type": "posts",
                                            "data": [...profileData["engaged"]["data"], ...response.data["data"]],
                                            "support": [],
                                            "dataCount": profileData["engaged"]["dataCount"],
                                            "dataLoading": false
                                        }
                                    )
                                );
                            }
                        }

                        setHomePageEngagedBeingUpdated(false);
                    }
                }
            );
        }
    }

    const engagedObserverRef = useRef();
    const lastEngagedElementRef = useCallback(node => 
        {
            if(props.displayView !== "engaged") return;
            if(profileData["engaged"]["type"] !== "posts") return;
            if(profileData["engaged"]["dataLoading"]) return;
            if(homePageEngagedBeingUpdated) return;
            if(engagedObserverRef.current) engagedObserverRef.current.disconnect();
            engagedObserverRef.current = new IntersectionObserver(entries => 
                {
                    if(entries[0].isIntersecting && profileData["engaged"]["data"].length < profileData["engaged"]["dataCount"]) {
                        setHomePageEngagedBeingUpdated(true);

                        let p_ninclude = [];
                        for(let i = 0; i < profileData["engaged"]["data"].length; i++) {
                            p_ninclude.push(profileData["engaged"]["data"][i]["_id"]);
                        }
                        pullEngagedPosts("secondary", p_ninclude);
                    }
                }
            );
            if(node) engagedObserverRef.current.observe(node);
        }, [profileData, homePageEngagedBeingUpdated]
    );

    const pullEngagedMarkets = async (type, p_ninclude) => {
        const username = props.userId;
        if(type === "primary" || profileData["engaged"]["data"].length < profileData["engaged"]["dataCount"]) {
            await generalOpx.axiosInstance.put(`/market/engaged`, 
                {
                    "type": type,
                    "p_ninclude": p_ninclude
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
                                updateEnagedProcessedHeights(processedHeightsFunction)
                            );

                            if(user && response.data["data"].length > 0) {
                                if(u_predictionEngagement.length === 0) {
                                    const predictionIds = [...response.data["data"].map(p_data => p_data._id)];
                                    const predictionEngagements = await generalOpx.axiosInstance.put(`/market/prediction-engagements`, {"predictionIds": predictionIds});

                                    if(predictionEngagements.data["status"] === "success" && predictionEngagements.data["data"].length > 0) {
                                        dispatch(
                                            setPredictionEngagement(predictionEngagements.data["data"])
                                        );
                                    }
                                } else {
                                    const predictionIdsToEliminate = [...u_predictionEngagement.map(h_data => h_data.predictionId)];
                                    const predictionIds = [...response.data["data"].filter(({_id}) => !predictionIdsToEliminate.includes(_id)).map(({_id}) => _id)];

                                    if(predictionIds.length > 0) {
                                        const predictionEngagements = await generalOpx.axiosInstance.put(`/market/prediction-engagements`, {"predictionIds": predictionIds});

                                        if(predictionEngagements.data["status"] === "success" && predictionEngagements.data["data"].length > 0) {
                                            dispatch(
                                                addToPredictionEngagement(predictionEngagements.data["data"])
                                            );
                                        }
                                    }
                                }
                            }

                            dispatch(
                                setEngaged(
                                    {
                                        "username": username,
                                        "type": "markets",
                                        "data": response.data["data"],
                                        "support": response.data["markets"],
                                        "dataCount": response.data["dataCount"],
                                        "dataLoading": false
                                    }
                                )
                            );
                        } else if(type === "secondary") {
                            let processedHeightsFunction = {
                                "postHeights": [...profileData["engagedProcessedHeights"]["postHeights"]].concat(Array(response.data["data"].length).fill(0)),
                                "processedRefs": {...profileData["engagedProcessedHeights"]["processedRefs"]}
                            }
                            dispatch(
                                updateEnagedProcessedHeights(processedHeightsFunction)
                            );

                            if(user && response.data["data"].length > 0) {
                                const engPredictionIdsToEliminate = [...u_predictionEngagement.map(h_data => h_data.predictionId)];
                                const engPredictionIds = [...response.data["data"].filter(({_id}) => !engPredictionIdsToEliminate.includes(_id)).map(({_id}) => _id)];

                                if(engPredictionIds.length > 0) {
                                    const predictionEngagements = await generalOpx.axiosInstance.put(`/market/prediction-engagements`, {"predictionIds": engPredictionIds});

                                    if(predictionEngagements.data["status"] === "success" && predictionEngagements.data["data"].length > 0) {
                                        dispatch(
                                            addToPredictionEngagement(predictionEngagements.data["data"])
                                        );
                                    }
                                }
                            }
                            
                            dispatch(
                                setEngaged(
                                    {   
                                        "username": username,
                                        "type": "markets",
                                        "data": [...profileData["engaged"]["data"], ...response.data["data"]],
                                        "support": [...profileData["engaged"]["support"], ...response.data["markets"]],
                                        "dataCount": profileData["engaged"]["dataCount"],
                                        "dataLoading": false
                                    }
                                )
                            );
                        }
                    }
                }
            );

            setHomePageEngagedBeingUpdated(false);
        }
    }
    
    const engagedMarketsObserverRef = useRef();
    const lastMarketEngagedElementRef = useCallback(node => 
        {
            if(props.displayView !== "engaged") return;
            if(profileData["engaged"]["type"] !== "markets") return;
            if(profileData["engaged"]["dataLoading"]) return;
            if(homePageEngagedBeingUpdated) return;
            if(engagedMarketsObserverRef.current) engagedMarketsObserverRef.current.disconnect();
            engagedMarketsObserverRef.current = new IntersectionObserver(entries => 
                {
                    if(entries[0].isIntersecting && profileData["engaged"]["data"].length < profileData["engaged"]["dataCount"]) {
                        setHomePageEngagedBeingUpdated(true);

                        let p_ninclude = [];
                        for(let i = 0; i < profileData["engaged"]["data"].length; i++) {
                            p_ninclude.push(profileData["engaged"]["data"][i]["_id"]);
                        }
                        pullEngagedMarkets("secondary", p_ninclude);
                    }
                }
            );
            if(node) engagedMarketsObserverRef.current.observe(node);
        }, [profileData, homePageEngagedBeingUpdated]
    );

    const [notificationsBeingUpdated, setNotificationsBeingUpdated] = useState(false);
    const pullNotifications = async (type, p_ninclude) => {
        const username = props.userId;
        if(type === "primary" || profileData["notifications"]["data"].length < profileData["notifications"]["dataCount"]) {
            await generalOpx.axiosInstance.put(`/notifications/profile`, 
                {
                    "type": type,
                    "p_ninclude": p_ninclude,
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
                                    await generalOpx.axiosInstance.post(`/notifications/mark-as-read`);
                                }
                            }
                        } else if(type === "secondary") {
                            dispatch(
                                updateNotifications(response.data["data"])
                            )
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
            } else if(props.displayView === "markets") {
                if(profileData["markets"]["dataLoading"]) {
                    dispatch(
                        clearMarketsProcessedHeights()
                    );

                    pullMarkets("primary", []);
                } else {
                    if(profileData["markets"]["username"] !== props.userId) {
                        dispatch(
                            clearMarketsProcessedHeights()
                        );

                        dispatch(
                            setMarkets(
                                {
                                    "username": "",
                                    "data": [],
                                    "markets": [],
                                    "dataCount": 0,
                                    "dataLoading": true
                                }
                            )
                        );

                        pullMarkets("primary", []);
                    }
                }
            } else if(props.displayView === "engaged") {
                if(profileData["engaged"]["dataLoading"]) {
                    dispatch(
                        clearEngagedProcessedHeights()
                    );

                    pullEngagedPosts("primary", []);
                } else {
                    if(profileData["engaged"]["username"] !== props.userId) {
                        dispatch(
                            clearEngagedProcessedHeights()
                        );

                        dispatch(
                            setEngaged(
                                {
                                    "username": "",
                                    "type": "posts",
                                    "data": [],
                                    "support": [],
                                    "dataCount": 0,
                                    "dataLoading": true
                                }
                            )
                        );

                        pullEngagedPosts("primary", []);
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
                
                if(u_notifications["unread"]["data"].length > 0) {
                    dispatch(
                        setQuickNotifications(
                            {
                                "unread": {
                                    "data": [],
                                    "dataLoading": false
                                },
                                "communities": {
                                    "data": u_notifications["communities"]["data"],
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

    const engagedViewTypeToggle = (type) => {
        if(type === "posts") {
            dispatch(
                clearEngagedProcessedHeights()
            );

            dispatch(
                setEngaged(
                    {
                        "username": "",
                        "type": "posts",
                        "data": [],
                        "support": [],
                        "dataCount": 0,
                        "dataLoading": true
                    }
                )
            );

            setTimeout(() => {
                pullEngagedPosts("primary", []);
            }, 0);
        } else if(type === "markets") {
            dispatch(
                clearEngagedProcessedHeights()
            );

            dispatch(
                setEngaged(
                    {
                        "username": "",
                        "type": "markets",
                        "data": [],
                        "support": [],
                        "dataCount": 0,
                        "dataLoading": true
                    }
                )
            );

            setTimeout(() => {
                pullEngagedMarkets("primary", []);
            }, 0);
        }
    }

    const [pullWatchlistUserId, setPullWatchlistUserId] = useState("");
    const [profileWatchlistBeingUpdated, setProfileWatchlistBeingUpdated] = useState(false);
    const pullWatchlist = async (type, symbols, n_covered) => {
        if(pullWatchlistUserId !== props.userId || type === "secondary") {
            setPullWatchlistUserId(props.userId);
            if(type === "primary" || profileData["watchlist"]["notCovered"].length > 0) {
                let stocks = [], cryptos = [];
                for(let i = 0; i < symbols.length; i++) {
                    if(symbols[i].slice(0, 1) === "S") {
                        stocks.push(
                            symbols[i].slice(3, symbols[i].length)
                        );
                    } else if(symbols[i].slice(0, 1) === "C") {
                        cryptos.push(
                            symbols[i].slice(3, symbols[i].length)
                        );
                    }
                }
    
                if(type === "primary") {
                    let profileWatchlistFunction = {
                        "username": props.userId,
                        "notCovered": n_covered,
                        "stocks": {
                            "data": [],
                            "support": []
                        },
                        "cryptos": {
                            "data": [],
                            "support": []
                        },
                        "dataLoading": false
                    };
        
                    if(stocks.length > 0) {
                        const p_watchlistStocksData = await generalOpx.axiosInstance.put(`/stock-market-data/quick-descs`, {"symbols": stocks});
                        if(p_watchlistStocksData.data["status"] === "success") {
                            profileWatchlistFunction["stocks"] = {
                                "data": [...p_watchlistStocksData.data["data"]],
                                "support": [...p_watchlistStocksData.data["support"]]
                            };
                        }
                    }
    
                    if(cryptos.length > 0) {
                        const p_watchlistCryptosData = await generalOpx.axiosInstance.put(`/crypto-market-data/quick-descs`, {"symbols": cryptos});
                        if(p_watchlistCryptosData.data["status"] === "success") {
                            profileWatchlistFunction["cryptos"] = {
                                "data": [...p_watchlistCryptosData.data["data"]],
                                "support": [...p_watchlistCryptosData.data["support"]]
                            };
                        }
                    }
    
                    dispatch(
                        setProfileWatchlist(profileWatchlistFunction)
                    );
                } else if(type === "secondary") {
                    let profileWatchlistFunction = {...profileData["watchlist"]};
                    profileWatchlistFunction["notCovered"] = n_covered;
    
                    if(stocks.length > 0) {
                        const p_watchlistStocksData = await generalOpx.axiosInstance.put(`/stock-market-data/quick-descs`, {"symbols": stocks});
                        if(p_watchlistStocksData.data["status"] === "success") {
                            profileWatchlistFunction["stocks"] = {
                                "data": [...profileWatchlistFunction["stocks"]["data"], ...p_watchlistStocksData.data["data"]],
                                "support": [...profileWatchlistFunction["stocks"]["support"], ...p_watchlistStocksData.data["support"]]
                            };
                        }
                    }
    
                    if(cryptos.length > 0) {
                        const p_watchlistCryptosData = await generalOpx.axiosInstance.put(`/crypto-market-data/quick-descs`, {"symbols": cryptos});
                        if(p_watchlistCryptosData.data["status"] === "success") {
                            profileWatchlistFunction["cryptos"] = {
                                "data": [...profileWatchlistFunction["cryptos"]["data"], ...p_watchlistCryptosData.data["data"]],
                                "support": [...profileWatchlistFunction["cryptos"]["support"], ...p_watchlistCryptosData.data["support"]]
                            };
                        }
                    }
    
                    dispatch(
                        setProfileWatchlist(profileWatchlistFunction)
                    );
                }

                setProfileWatchlistBeingUpdated(false);
            }
        }
    }

    const n_coveredSplitter = (arr) => {
        const firstTen = arr.slice(0, 10), remainder = arr.slice(10);

        return [firstTen, remainder];
    }

    const profileWatchlistObserverRef = useRef();
    const lastProfileWatchlistElementRef = useCallback(node => 
        {
            if(props.displayView !== "watchlist") return;
            if(profileData["watchlist"]["dataLoading"]) return;
            if(profileWatchlistBeingUpdated) return;
            if(profileWatchlistObserverRef.current) profileWatchlistObserverRef.current.disconnect();
            profileWatchlistObserverRef.current = new IntersectionObserver(entries => 
                {
                    if(entries[0].isIntersecting && profileData["watchlist"]["notCovered"].length > 0) {
                        setProfileWatchlistBeingUpdated(true);

                        const [symbols, n_covered] = n_coveredSplitter(profileData["watchlist"]["notCovered"]);
                        pullWatchlist("secondary", symbols, n_covered);
                    }
                }
            );
            if(node) profileWatchlistObserverRef.current.observe(node);
        }, [profileData, profileWatchlistBeingUpdated]
    );

    useEffect(() => {
        if(!(props.userId === null || props.userId === undefined || props.userId === "")) {
            if(props.displayView === "watchlist") {
                if(profileData["watchlist"]["dataLoading"]) {
                    if(!profileData["profileDesc"]["dataLoading"]) {
                        if(profileData["profileDesc"]["data"]["username"] === props.userId) {
                            if(profileData["profileDesc"]["data"]["watchlist"].length > 0) {
                                const [symbols, n_covered] = n_coveredSplitter(profileData["profileDesc"]["data"]["watchlist"]);
                                pullWatchlist("primary", symbols, n_covered);
                            }
                        }
                    }
                } else {
                    if(profileData["watchlist"]["username"] !== props.userId) {
                        dispatch(
                            setProfileWatchlist(
                                {
                                    "username": "",
                                    "notCovered": [],
                                    "stocks": {
                                        "data": [],
                                        "support": []
                                    },
                                    "cryptos": {
                                        "data": [],
                                        "support": []
                                    },
                                    "dataLoading": true
                                }
                            )
                        );

                        if(!profileData["profileDesc"]["dataLoading"]) {
                            if(profileData["profileDesc"]["data"]["username"] === props.userId) {
                                if(profileData["profileDesc"]["data"]["watchlist"].length > 0) {
                                    const [symbols, n_covered] = n_coveredSplitter(profileData["profileDesc"]["data"]["watchlist"]);
                                    pullWatchlist("primary", symbols, n_covered);
                                }
                            }
                        }
                    }
                }
            }
        }
    }, [profileData["profileDesc"]["data"]["username"], props.userId, props.displayView]);

    const [networkCommunitiesBeingUpdated, setNetworkCommunitiesBeingUpdated] = useState(false);
    const pullCommunities = async (type, u_ninclude) => {
        if(type === "primary" || networkDesc["communities"]["data"].length < networkDesc["communities"]["dataCount"]) {
            const username = props.userId;
            await generalOpx.axiosInstance.put(`/users/p_communities-desc`, 
                {
                    "type": type,
                    "username": username,
                    "u_ninclude": u_ninclude
                }
            ).then(
                async (response) => {
                    if(response.data["status"] === "success") {
                        if(type === "primary") {
                            dispatch(
                                setNetworkCommunities(
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
                                setNetworkCommunities(
                                    {
                                        "username": username,
                                        "data": [...networkDesc["communities"]["data"], ...response.data["data"]],
                                        "dataCount": networkDesc["communities"]["dataCount"],
                                        "dataLoading": false
                                    }
                                )
                            );
                        }
                    }
                }
            );

            setNetworkCommunitiesBeingUpdated(false);
        }
    }

    const communitiesObserverRef = useRef();
    const networkCommunityLastElementRef = useCallback(node => 
        {
            if(props.displayView !== "communities") return;
            if(networkDesc["communities"]["dataLoading"]) return;
            if(networkCommunitiesBeingUpdated) return;
            if(communitiesObserverRef.current) communitiesObserverRef.current.disconnect();
            communitiesObserverRef.current = new IntersectionObserver(entries => 
                {
                    if(entries[0].isIntersecting && networkDesc["communities"]["data"].length < networkDesc["communities"]["dataCount"]) {
                        setNetworkCommunitiesBeingUpdated(true);

                        let u_ninclude = [];
                        for(let i = 0; i < networkDesc["communities"]["data"].length; i++) {
                            u_ninclude.push(networkDesc["communities"]["data"][i]["communityName"]);
                        }
                        pullCommunities("secondary", u_ninclude);
                    }
                }
            );
            if(node) communitiesObserverRef.current.observe(node);
        }, [networkDesc, networkCommunitiesBeingUpdated]
    );

    const [networkFollowingBeingUpdated, setNetworkFollowingBeingUpdated] = useState(false);
    const pullFollowing = async (type, u_ninclude) => {
        if(type === "primary" || networkDesc["following"]["data"].length < networkDesc["following"]["dataCount"]) {
            const username = props.userId;
            await generalOpx.axiosInstance.put(`/users/p_following-desc`, 
                {
                    "type": type,
                    "username": username,
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

    const [networkFollowersBeingUpdated, setNetworkFollowersBeingUpdated] = useState(false);
    const pullFollowers = async (type, u_ninclude) => {
        if(type === "primary" || networkDesc["followers"]["data"].length < networkDesc["followers"]["dataCount"]) {
            const username = props.userId;
            await generalOpx.axiosInstance.put(`/users/p_followers-desc`, 
                {
                    "type": type,
                    "username": username,
                    "u_ninclude": u_ninclude
                }
            ).then(
                async (response) => {
                    if(response.data["status"] === "success") {
                        if(type === "primary") {
                            dispatch(
                                setNetworkFollowers(
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
                                setNetworkFollowers(
                                    {
                                        "username": username,
                                        "data": [...networkDesc["followers"]["data"], ...response.data["data"]],
                                        "dataCount": networkDesc["followers"]["dataCount"],
                                        "dataLoading": false
                                    }
                                )
                            );
                        }
                    }
                }
            );

            setNetworkFollowersBeingUpdated(false);
        }
    }

    const followersObserverRef = useRef();
    const networkFollowersLastElementRef = useCallback(node => 
        {
            if(props.displayView !== "followers") return;
            if(networkDesc["followers"]["dataLoading"]) return;
            if(networkFollowersBeingUpdated) return;
            if(followersObserverRef.current) followersObserverRef.current.disconnect();
            followersObserverRef.current = new IntersectionObserver(entries => 
                {
                    if(entries[0].isIntersecting && networkDesc["followers"]["data"].length < networkDesc["followers"]["dataCount"]) {
                        setNetworkFollowersBeingUpdated(true);

                        let u_ninclude = [];
                        for(let i = 0; i < networkDesc["followers"]["data"].length; i++) {
                            u_ninclude.push(networkDesc["followers"]["data"][i]["username"]);
                        }
                        pullFollowers("secondary", u_ninclude);
                    }
                }
            );
            if(node) followersObserverRef.current.observe(node);
        }, [networkDesc, networkFollowersBeingUpdated]
    );

    useEffect(() => {
        if(!(props.userId === null || props.userId === undefined || props.userId === "")) {
            if(props.displayView === "communities") {
                if(networkDesc["communities"]["dataLoading"]) {
                    pullCommunities("primary", []);
                } else {
                    if(networkDesc["communities"]["username"] !== props.userId) {
                        dispatch(
                            setNetworkCommunities(
                                {
                                    "username": "",
                                    "data": [],
                                    "dataCount": 0,
                                    "dataLoading": true
                                }
                            )
                        );

                        pullCommunities("primary", []);
                    }
                }
            } else if(props.displayView === "following") {
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
            } else if(props.displayView === "followers") {
                if(networkDesc["followers"]["dataLoading"]) {
                    pullFollowers("primary", []);
                } else {
                    if(networkDesc["followers"]["username"] !== props.userId) {
                        dispatch(
                            setNetworkFollowers(
                                {
                                    "username": "",
                                    "data": [],
                                    "dataCount": 0,
                                    "dataLoading": true
                                }
                            )
                        );

                        pullFollowers("primary", []);
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
            profileDataCopy["followers"] = profileDataCopy["followers"] + 1;

            dispatch(
                setProfileDesc(
                    {
                        "data": profileDataCopy,
                        "dataLoading": false
                    }
                )
            );

            await generalOpx.axiosInstance.post(`/users/follow-user`, {"following": props.userId})
        }
    }

    const unfollowProfile = async () => {
        let profileDataCopy = {...profileData["profileDesc"]["data"]};
        if(profileDataCopy["followingStatus"] === 1) {
            profileDataCopy["followingStatus"] = 0;
            profileDataCopy["followers"] = profileDataCopy["followers"] - 1;

            dispatch(
                setProfileDesc(
                    {
                        "data": profileDataCopy,
                        "dataLoading": false
                    }
                )
            );
            setDisplayUnFollowBtn(false);

            await generalOpx.axiosInstance.post(`/users/unfollow-user`, {"following": props.userId})
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
                                    <div className="profile-setUpEditProfileSettingEmailContainer">
                                        <div className="profile-setUpEditProfileSettingsEmailHeader">
                                            <span>Email</span>
                                            {profileImageError === 3 ?
                                                <span 
                                                    style={{
                                                        "marginLeft": "auto",
                                                        "color": "var(--primary-red-09)"
                                                    }}
                                                    >
                                                    Please fill in an email
                                                </span> : null
                                            }
                                        </div>
                                        <input type="text" 
                                            name={"email"}
                                            value={profileSettings["email"]}
                                            onChange={editProfileSettingsHandler}
                                            placeholder='email'
                                            className="profile-setUpEditProfileSettingsEmailInput" 
                                        />
                                    </div>
                                    <div className="profile-setUpEditProfileSettingsGeneralBioContainer">
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
                    <div className="app-largeViewFixedInnerWindowSideFixers" style={props.f_viewPort === "small" ? {"width": "0px", "minWidth": "0px", "maxWidth": "0px"} : {}}/>
                </div> : null
            }
            {props.displayView === "communities" || props.displayView === "following" || props.displayView === "followers" ?
                <div 
                        ref={contentBodyRef}
                        className={props.f_viewPort === "small" ? "small-homePageContentBody" : "large-homePageContentBody"}
                    >
                    <div className="large-homePageContentBodyMargin"/>
                    <div className="large-homePageInnerTopOptionsContainer"
                            style={{
                                    ...{"width": `${contentBodyWidth[0]}px`, "minWidth": `${contentBodyWidth[0]}px`, "maxWidth": `${contentBodyWidth[0]}px`},
                                    ...({"position": "fixed", "top": "51px"})
                                }
                            }
                        >
                        <button className="large-homePageInnerTopOptionsBtn"
                                onClick={() => navigate(`/profile/${props.userId}/communities`)}
                                style={{"width": "calc((100% / 3) - 20px)", "minWidth": "calc((100% / 3) - 20px)", "maxWidth": "calc((100% / 3) - 20px)"}}
                            >
                            <span className="large-homePageInnerTopOptionsBtnDesc" 
                                    style={props.displayView === "communities" ? {"color": "var(--primary-bg-01)"} : {}}
                                >
                                Communities
                                {props.displayView === "communities" ?
                                    <div className="large-homePageInnerTopOptionsBtnOutline"/> : null
                                }
                            </span>
                        </button>
                        <button className="large-homePageInnerTopOptionsBtn"
                                onClick={() => navigate(`/profile/${props.userId}/following`)}
                                style={{"width": "calc((100% / 3) - 20px)", "minWidth": "calc((100% / 3) - 20px)", "maxWidth": "calc((100% / 3) - 20px)"}}
                            >
                            <span className="large-homePageInnerTopOptionsBtnDesc"
                                    style={props.displayView === "following" ? {"color": "var(--primary-bg-01)"} : {}}
                                >
                                Following
                                {props.displayView === "following" ?
                                    <div className="large-homePageInnerTopOptionsBtnOutline"/> : null
                                }
                            </span>
                        </button>
                        <button className="large-homePageInnerTopOptionsBtn"
                                onClick={() => navigate(`/profile/${props.userId}/followers`)}
                                style={{"width": "calc((100% / 3) - 20px)", "minWidth": "calc((100% / 3) - 20px)", "maxWidth": "calc((100% / 3) - 20px)"}}
                            >
                            <span className="large-homePageInnerTopOptionsBtnDesc" 
                                    style={props.displayView === "followers" ? {"color": "var(--primary-bg-01)"} : {}}
                                >
                                Followers
                                {props.displayView === "followers" ?
                                    <div className="large-homePageInnerTopOptionsBtnOutline"/> : null
                                }
                            </span>
                        </button>
                    </div>
                    <div className="large-homePageInnerTopOptionsContainerMargin"/>

                    {props.displayView === "communities" ?
                        <>
                            {networkDesc["communities"]["dataLoading"] ?
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
                                    {networkDesc["communities"]["data"].length === 0 ?
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
                                                                You haven't joined any communities.
                                                            </> : `${props.userId} hasn't joined any communities.`
                                                        }
                                                    </> :
                                                    <>
                                                        {`${props.userId}`} hasn't joined any communities.
                                                    </>
                                                }
                                            </div>
                                        </div> : 
                                        <>
                                            {networkDesc["communities"]["data"].map((finunity, index) => (
                                                    <div className="large-homePagePostContainer" 
                                                            key={`profile-communities-${finunity["communityName"]}`}
                                                            ref={networkDesc["communities"]["data"].length - 2 === index ? networkCommunityLastElementRef: null}
                                                            style={networkDesc["communities"]["data"].length - 1 === index ?
                                                                {} : {"borderBottom": "solid 1px var(--primary-bg-08)"}
                                                            }
                                                        >
                                                        <div className="large-stocksPostInnerContainer" 
                                                                style={finunity.bio === "" ? 
                                                                    {"height": "72px", "minHeight": "72px", "maxHeight": "72px"} : 
                                                                    {"height": "144px", "minHeight": "144px", "maxHeight": "144px"}
                                                                }
                                                            >
                                                            <FinulabNetworkDesc 
                                                                loading={false}
                                                                desc_index={index}
                                                                network_type={"C"}
                                                                network_element={finunity}
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
                        </> : 
                        <>
                            {props.displayView === "following" ?
                                <>
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
                                </> : 
                                <>
                                    {props.displayView === "followers" ?
                                        <>
                                            {networkDesc["followers"]["dataLoading"] ?
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
                                                    {networkDesc["followers"]["data"].length === 0 ?
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
                                                                                No followers yet.
                                                                            </> : `No followers yet.`
                                                                        }
                                                                    </> :
                                                                    <>
                                                                        No followers yet.
                                                                    </>
                                                                }
                                                            </div>
                                                        </div> : 
                                                        <>
                                                            {networkDesc["followers"]["data"].map((u_desc, index) => (
                                                                    <div className="large-homePagePostContainer" 
                                                                            key={`profile-followers-${u_desc["username"]}`}
                                                                            ref={networkDesc["followers"]["data"].length - 2 === index ? networkFollowersLastElementRef : null}
                                                                            style={networkDesc["followers"]["data"].length - 1 === index ?
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
                                        </> : null
                                    }
                                </>
                            }
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
                                                {profileData["profileDesc"]["data"]["username"] === user.user ? 
                                                    <>
                                                        <button className="profile-profilePageUpdateSettingsEditBtn"
                                                                onClick={() => editProfileToggle()}
                                                            >
                                                            Edit Profile
                                                        </button>            
                                                    </> : 
                                                    <>
                                                        {profileData["profileDesc"]["data"]["followingStatus"] === 1 ?
                                                            <button className="profile-profilePageUpdateSettingsEditBtn"
                                                                    ref={uf_overlayContainerRef}
                                                                    onClick={() => displayUnfollowBtnToggle()}
                                                                >
                                                                Following
                                                            </button> : 
                                                            <button className="profile-profilePageUpdateSettingsEditBtn"
                                                                    onClick={user ? () => followProfile() : () => navigate(`/login`)}
                                                                    style={{"color": "var(--secondary-bg-03)", "backgroundColor": "var(--primary-bg-01)"}}  
                                                                >
                                                                Follow
                                                            </button>
                                                        }
                                                        {user && displayUnfollowBtn ?
                                                            <button className="profile-unfollowBtn"
                                                                    ref={uf_overlayRef}
                                                                    onClick={() => unfollowProfile()}
                                                                >
                                                                Unfollow {props.userId}
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
                                                Follow
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
                                        {user ? 
                                            <>
                                                {profileData["profileDesc"]["data"]["username"] === user.user ? 
                                                    <>
                                                        {user.verified ?
                                                            <Verified className="large-profilePageVerifiedIcon"/> :
                                                            <button className="large-walletAccountOvrlAccountGetVerifiedBtn"
                                                                    onClick={() => navigate("/get-verified")}
                                                                >
                                                                <Verified className="large-walletAccountOvrlAccountGetVerifiedBtnIcon"/>
                                                                Get Verified
                                                            </button>
                                                        }
                                                    </> : null
                                                }
                                            </> : null
                                        }
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
                                            <div className="large-profilePageNetworkDescLoading"/>
                                            <div className="large-profilePageNetworkDescLoading"/>
                                        </> : 
                                        <>
                                            <button className="large-profilePageNetworkDescBtn"
                                                    onClick={() => navigate(`/profile/${props.userId}/communities`)}
                                                >
                                                <div className="large-profilePageNetworkDesc">
                                                    {generalOpx.formatLargeFigures(profileData["profileDesc"]["data"]["communities"], 2)}&nbsp;<span className="large-profilePageNetworkDescSpecifier">Communities</span>
                                                </div>
                                            </button>
                                            <button className="large-profilePageNetworkDescBtn"
                                                    onClick={() => navigate(`/profile/${props.userId}/following`)}
                                                >
                                                <div className="large-profilePageNetworkDesc">
                                                    {generalOpx.formatLargeFigures(profileData["profileDesc"]["data"]["following"], 2)}&nbsp;<span className="large-profilePageNetworkDescSpecifier">Following</span>
                                                </div>
                                            </button>
                                            <button className="large-profilePageNetworkDescBtn"
                                                    onClick={() => navigate(`/profile/${props.userId}/followers`)}
                                                >
                                                <div className="large-profilePageNetworkDesc">
                                                    {generalOpx.formatLargeFigures(profileData["profileDesc"]["data"]["followers"], 2)}&nbsp;<span className="large-profilePageNetworkDescSpecifier">Followers</span>
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
                                {user ?
                                    <>
                                        {user.user === props.userId ?
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
                                                        onClick={() => navigate(`/profile/${props.userId}/markets`)}
                                                        style={{"width": "calc((100% / 4) - 20px)", "minWidth": "calc((100% / 4) - 20px)", "maxWidth": "calc((100% / 4) - 20px)"}}
                                                    >
                                                    <span className="large-homePageInnerTopOptionsBtnDesc"
                                                            style={props.displayView === "markets" ? {"color": "var(--primary-bg-01)"} : {}}
                                                        >
                                                        Markets
                                                        {props.displayView === "markets" ?
                                                            <div className="large-homePageInnerTopOptionsBtnOutline"/> : null
                                                        }
                                                    </span>
                                                </button>
                                                <button className="large-homePageInnerTopOptionsBtn"
                                                        onClick={() => navigate(`/profile/${props.userId}/engaged`)}
                                                        style={{"width": "calc((100% / 4) - 20px)", "minWidth": "calc((100% / 4) - 20px)", "maxWidth": "calc((100% / 4) - 20px)"}}
                                                    >
                                                    <span className="large-homePageInnerTopOptionsBtnDesc" 
                                                            style={props.displayView === "engaged" ? {"color": "var(--primary-bg-01)"} : {}}
                                                        >
                                                        Engaged
                                                        {props.displayView === "engaged" ?
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
                                                        onClick={() => navigate(`/profile/${props.userId}/markets`)}
                                                        style={{"width": "calc((100% / 3) - 20px)", "minWidth": "calc((100% / 3) - 20px)", "maxWidth": "calc((100% / 3) - 20px)"}}
                                                    >
                                                    <span className="large-homePageInnerTopOptionsBtnDesc"
                                                            style={props.displayView === "markets" ? {"color": "var(--primary-bg-01)"} : {}}
                                                        >
                                                        Markets
                                                        {props.displayView === "markets" ?
                                                            <div className="large-homePageInnerTopOptionsBtnOutline"/> : null
                                                        }
                                                    </span>
                                                </button>
                                                <button className="large-homePageInnerTopOptionsBtn"
                                                        onClick={() => navigate(`/profile/${props.userId}/watchlist`)}
                                                        style={{"width": "calc((100% / 3) - 20px)", "minWidth": "calc((100% / 3) - 20px)", "maxWidth": "calc((100% / 3) - 20px)"}}
                                                    >
                                                    <span className="large-homePageInnerTopOptionsBtnDesc"
                                                            style={props.displayView === "watchlist" ? {"color": "var(--primary-bg-01)"} : {}}
                                                        >
                                                        Watchlist
                                                        {props.displayView === "watchlist" ?
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
                                                onClick={() => navigate(`/profile/${props.userId}/markets`)}
                                                style={{"width": "calc((100% / 3) - 20px)", "minWidth": "calc((100% / 3) - 20px)", "maxWidth": "calc((100% / 3) - 20px)"}}
                                            >
                                            <span className="large-homePageInnerTopOptionsBtnDesc"
                                                    style={props.displayView === "markets" ? {"color": "var(--primary-bg-01)"} : {}}
                                                >
                                                Markets
                                                {props.displayView === "markets" ?
                                                    <div className="large-homePageInnerTopOptionsBtnOutline"/> : null
                                                }
                                            </span>
                                        </button>
                                        <button className="large-homePageInnerTopOptionsBtn"
                                                onClick={() => navigate(`/profile/${props.userId}/watchlist`)}
                                                style={{"width": "calc((100% / 3) - 20px)", "minWidth": "calc((100% / 3) - 20px)", "maxWidth": "calc((100% / 3) - 20px)"}}
                                            >
                                            <span className="large-homePageInnerTopOptionsBtnDesc"
                                                    style={props.displayView === "watchlist" ? {"color": "var(--primary-bg-01)"} : {}}
                                                >
                                                Watchlist
                                                {props.displayView === "watchlist" ?
                                                    <div className="large-homePageInnerTopOptionsBtnOutline"/> : null
                                                }
                                            </span>
                                        </button>
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
                            {!contentBodyWidth[1] || profileData["posts"]["dataLoading"] ?
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
                                                            ref={index === (profileData["posts"]["data"].length - 2) ? lastPostElementRef : null}
                                                            style={index === (profileData["posts"]["data"].length - 1) ? 
                                                                {} : {"borderBottom": "solid 1px var(--primary-bg-08)"}
                                                            }
                                                        >
                                                        <div className="large-stocksPostInnerContainer"
                                                                key={`profile-inner-cont-post-${post_desc["_id"]}`}
                                                                style={
                                                                    {
                                                                        "height": `calc(20px + 40px + ${
                                                                            !user ? 0 : (props.userId === user.user || u_moderatorStatus.some(modStat => modStat.community === post_desc.groupId)) && post_desc.userRewards > 0 ? 28 : 0
                                                                        }px + ${
                                                                            post_desc.title === "" ? 0 : (10 + (analyzePostCharCount(post_desc.title, post_desc.timeStamp, "title") * 20))
                                                                        }px + ${
                                                                            post_desc.post === "" ? 0 : analyzePostCharCount(post_desc.post, post_desc.timeStamp, "post") >= 3 ? 
                                                                            79 + 5 + 18 : (16 + (analyzePostCharCount(post_desc.post, post_desc.timeStamp, "post") * 21.58))
                                                                        }px + ${
                                                                            post_desc.photos.length + post_desc.videos.length > 0 ? 16 + 275 : 0
                                                                        }px + 16px + 28px + ${post_desc.title !== "" && post_desc.post === "" ? 10 : 0}px)`,

                                                                        "minHeight": `calc(20px + 40px + ${
                                                                            !user ? 0 : (props.userId === user.user || u_moderatorStatus.some(modStat => modStat.community === post_desc.groupId)) && post_desc.userRewards > 0 ? 28 : 0
                                                                        }px + ${
                                                                            post_desc.title === "" ? 0 : (10 + (analyzePostCharCount(post_desc.title, post_desc.timeStamp, "title") * 20))
                                                                        }px + ${
                                                                            post_desc.post === "" ? 0 : analyzePostCharCount(post_desc.post, post_desc.timeStamp, "post") >= 3 ? 
                                                                            79 + 5 + 18 : (16 + (analyzePostCharCount(post_desc.post, post_desc.timeStamp, "post") * 21.58))
                                                                        }px + ${
                                                                            post_desc.photos.length + post_desc.videos.length > 0 ? 16 + 275 : 0
                                                                        }px + 16px + 28px + ${post_desc.title !== "" && post_desc.post === "" ? 10 : 0}px)`,

                                                                        "maxHeight": `calc(20px + 40px + ${
                                                                            !user ? 0 :(props.userId === user.user || u_moderatorStatus.some(modStat => modStat.community === post_desc.groupId)) && post_desc.userRewards > 0 ? 28 : 0
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
                                                            target={"profile"}
                                                            verified={false}
                                                            loading={false}
                                                        />
                                                        </div>
                                                    </div>
                                                ))
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
                            {props.displayView === "markets" ?
                                <>
                                    {profileData["markets"]["dataLoading"] ?
                                        <>
                                            <div className="large-homePagePostContainer"
                                                    style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                >
                                                <div className="large-stocksPostInnerContainer"
                                                        style={{"height": "313px", "minHeight": "313px", "maxHeight": "313px"}}
                                                    >
                                                    <MiniaturizedPrediction loading={true}/>
                                                </div>
                                            </div>
                                            <div className="large-homePagePostContainer"
                                                    style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                >
                                                <div className="large-stocksPostInnerContainer"
                                                        style={{"height": "313px", "minHeight": "313px", "maxHeight": "313px"}}
                                                    >
                                                    <MiniaturizedPrediction loading={true}/>
                                                </div>
                                            </div>
                                            <div className="large-homePagePostContainer"
                                                    style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                >
                                                <div className="large-stocksPostInnerContainer"
                                                        style={{"height": "313px", "minHeight": "313px", "maxHeight": "313px"}}
                                                    >
                                                    <MiniaturizedPrediction loading={true}/>
                                                </div>
                                            </div>
                                            <div className="large-homePagePostContainer"
                                                    style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                >
                                                <div className="large-stocksPostInnerContainer"
                                                        style={{"height": "313px", "minHeight": "313px", "maxHeight": "313px"}}
                                                    >
                                                    <MiniaturizedPrediction loading={true}/>
                                                </div>
                                            </div>
                                            <div className="large-homePagePostContainer"
                                                    style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                >
                                                <div className="large-stocksPostInnerContainer"
                                                        style={{"height": "313px", "minHeight": "313px", "maxHeight": "313px"}}
                                                    >
                                                    <MiniaturizedPrediction loading={true}/>
                                                </div>
                                            </div>
                                            <div className="large-homePagePostContainer"
                                                    style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                >
                                                <div className="large-stocksPostInnerContainer"
                                                        style={{"height": "313px", "minHeight": "313px", "maxHeight": "313px"}}
                                                    >
                                                    <MiniaturizedPrediction loading={true}/>
                                                </div>
                                            </div>
                                            <div className="large-homePagePostContainer">
                                                <div className="large-stocksPostInnerContainer"
                                                        style={{"height": "313px", "minHeight": "313px", "maxHeight": "313px"}}
                                                    >
                                                    <MiniaturizedPrediction loading={true}/>
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
                                            {profileData["markets"]["data"].length === 0 ?
                                                <div className="large-homePageProfileNoDataContainer"
                                                        style={{
                                                            "minHeight": appState["profile"]["fixed"] ? 
                                                                `calc(100vh - 51px - 36px)` : 
                                                                `calc(100vh - (${appState["profile"]["wallHeight"]}px + 177.5px + 36px) + ${appState["profile"]["secondaryScrollTop"]}px)`
                                                        }}
                                                    >
                                                    <img src="/assets/Finulab_Icon.png" alt="" className="large-marketPageNoDateNoticeImg" />
                                                    <div className="large-marketPageNoDataONotice">
                                                        {user ?
                                                            <>
                                                                {props.userId === user.user ?
                                                                    <>
                                                                        You haven't created any markets yet
                                                                        {user.verified ?
                                                                            <>
                                                                                ,&nbsp;
                                                                                <button className="large-marketPageNoDataONoticeBtn" onClick={() => navigate("/create-prediction")}>
                                                                                    create one
                                                                                </button>.
                                                                            </> : `.`
                                                                        }
                                                                    </> : `${props.userId} hasn't created any markets yet.`
                                                                }
                                                            </> :
                                                            <>
                                                                {`${props.userId}`} hasn't created any markets yet.
                                                            </>
                                                        }
                                                    </div>
                                                    {user ?
                                                        <>
                                                            {props.userId === user.user ?
                                                                <>
                                                                    {user.verified ?
                                                                        null : 
                                                                        <div className="large-marketPageNoDataTNotice">
                                                                            <button className="large-marketPageNoDataONoticeBtn" onClick={() => navigate("/get-verified")}>
                                                                                Get verified
                                                                            </button>&nbsp;to create one and earn 50% of the collected fees.
                                                                        </div>
                                                                    }
                                                                </> : null
                                                            }
                                                        </> : null
                                                    }
                                                </div> :
                                                <>
                                                    {profileData["markets"]["data"].map((prediction_desc, index) => {
                                                            const marketDesc_toProvide = profileData["markets"]["markets"].filter(doc => doc.predictionId == prediction_desc._id);

                                                            return <div className="large-homePagePostContainer" key={`profile-market-${prediction_desc._id}`}
                                                                    ref={index === (profileData["markets"]["data"].length - 2) ? lastMarketElementRef : null}
                                                                    style={index === (profileData["markets"]["data"].length - 1) ? 
                                                                        {} : {"borderBottom": "solid 1px var(--primary-bg-08)"}
                                                                    }
                                                                >
                                                                <div className="large-stocksPostInnerContainer"
                                                                        key={`profile-inner-cont-market-${prediction_desc["_id"]}`}
                                                                        style={prediction_desc["status"] !== "live" ? {"height": "359px", "minHeight": "359px", "maxHeight": "359px"} :
                                                                            
                                                                            prediction_desc["outcomeType"] === "yes-or-no" ?
                                                                            {"height": "442px", "minHeight": "442px", "maxHeight": "442px"} :
                                                                            marketDesc_toProvide.length === 1 ? {"height": "402px", "minHeight": "402px", "maxHeight": "402px"} : 
                                                                            marketDesc_toProvide.length === 2 ? {"height": "452px", "minHeight": "452px", "maxHeight": "452px"} :
                                                                            marketDesc_toProvide.length === 3 ? {"height": "502px", "minHeight": "502px", "maxHeight": "502px"} :
                                                                            {"height": "542px", "minHeight": "542px", "maxHeight": "542px"}
                                                                        }
                                                                    >
                                                                <MiniaturizedPrediction 
                                                                    pred_location={"market"}
                                                                    mouseOnComponent={1}
                                                                    predictionDesc={prediction_desc} 
                                                                    user={user ? user.user : "visitor"}
                                                                    marketDesc={marketDesc_toProvide}
                                                                    ownership={u_marketHoldings.filter(doc => doc.predictionId === prediction_desc._id)}
                                                                />
                                                                </div>
                                                            </div>
                                                        })
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
                                    {props.displayView === "engaged" ?
                                        <>
                                            <div className="profile-homeEngagedTopHeaderContainer">
                                                <LockPersonSharp className="profile-homeEngagedTopHeaderContainerIcon"/>
                                                Only visible to you.
                                                <div className="profile-homeEngagedTopHeaderOptnsContainer">
                                                    <button className="profile-homeEngagedTopHeaderOptnBtn"
                                                            disabled={homePageEngagedBeingUpdated}
                                                            onClick={() => engagedViewTypeToggle("posts")}
                                                            style={{
                                                                "marginRight": "15px",
                                                                "color": profileData["engaged"]["type"] === "posts" ? "var(--secondary-bg-03)" : "var(--primary-bg-01)",
                                                                "backgroundColor": profileData["engaged"]["type"] === "posts" ? "var(--primary-bg-01)" : "rgba(75, 75, 75, 0.5)"
                                                            }}
                                                        >
                                                        Posts
                                                    </button>
                                                    <button className="profile-homeEngagedTopHeaderOptnBtn"
                                                            disabled={homePageEngagedBeingUpdated}
                                                            onClick={() => engagedViewTypeToggle("markets")}
                                                            style={{
                                                                "color": profileData["engaged"]["type"] === "markets" ? "var(--secondary-bg-03)" : "var(--primary-bg-01)",
                                                                "backgroundColor": profileData["engaged"]["type"] === "markets" ? "var(--primary-bg-01)" : "rgba(75, 75, 75, 0.5)"
                                                            }}
                                                        >
                                                        Markets
                                                    </button>
                                                </div>
                                            </div>
                                            {profileData["engaged"]["type"] === "posts" ?
                                                <>
                                                    {profileData["engaged"]["dataLoading"] ?
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
                                                                        `calc(100vh - (${appState["profile"]["wallHeight"]}px + 177.5px + 36px) + ${appState["profile"]["tertiaryScrollTop"]}px)`
                                                                }}
                                                            />
                                                        </> : 
                                                        <>
                                                            {profileData["engaged"]["data"].length === 0 ?
                                                                <div className="large-homePageProfileNoDataContainer"
                                                                        style={{
                                                                            "minHeight": appState["profile"]["fixed"] ? 
                                                                                `calc(100vh - 51px - 36px)` : 
                                                                                `calc(100vh - (${appState["profile"]["wallHeight"]}px + 177.5px + 36px) + ${appState["profile"]["tertiaryScrollTop"]}px)`
                                                                        }}
                                                                    >
                                                                    <img src="/assets/Finulab_Icon.png" alt="" className="large-marketPageNoDateNoticeImg" />
                                                                    <div className="large-marketPageNoDataONotice">
                                                                        You haven't engaged any posts yet.
                                                                    </div>
                                                                    <div className="large-marketPageNoDataTNotice">
                                                                        Drop a like or dislike on some posts to fill up your feed.
                                                                    </div>
                                                                </div> :
                                                                <>
                                                                    {profileData["engaged"]["data"].map((post_desc, index) => (
                                                                            <div className="large-homePagePostContainer" key={`profile-engaged-post-${post_desc._id}`}
                                                                                    ref={index === (profileData["engaged"]["data"].length - 2) ? lastEngagedElementRef : null}
                                                                                    style={index === (profileData["engaged"]["data"].length - 1) ? 
                                                                                        {} : {"borderBottom": "solid 1px var(--primary-bg-08)"}
                                                                                    }
                                                                                >
                                                                                <div className="large-stocksPostInnerContainer"
                                                                                        key={`profile-inner-cont-engaged-post-${post_desc["_id"]}`}
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
                                                    {profileData["engaged"]["type"] === "markets" ?
                                                        <>
                                                            {profileData["engaged"]["dataLoading"] ?
                                                                <>
                                                                    <div className="large-homePagePostContainer"
                                                                            style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                                        >
                                                                        <MiniaturizedPrediction loading={true}/>
                                                                    </div>
                                                                    <div className="large-homePagePostContainer"
                                                                            style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                                        >
                                                                        <MiniaturizedPrediction loading={true}/>
                                                                    </div>
                                                                    <div className="large-homePagePostContainer"
                                                                            style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                                        >
                                                                        <MiniaturizedPrediction loading={true}/>
                                                                    </div>
                                                                    <div className="large-homePagePostContainer"
                                                                            style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                                        >
                                                                        <MiniaturizedPrediction loading={true}/>
                                                                    </div>
                                                                    <div className="large-homePagePostContainer"
                                                                            style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                                        >
                                                                        <MiniaturizedPrediction loading={true}/>
                                                                    </div>
                                                                    <div className="large-homePagePostContainer"
                                                                            style={{"borderBottom": "solid 1px var(--primary-bg-08)"}}
                                                                        >
                                                                        <MiniaturizedPrediction loading={true}/>
                                                                    </div>
                                                                    <div className="large-homePagePostContainer">
                                                                        <MiniaturizedPrediction loading={true}/>
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
                                                                    {profileData["engaged"]["data"].length === 0 ?
                                                                        <div className="large-homePageProfileNoDataContainer"
                                                                                style={{
                                                                                    "minHeight": appState["profile"]["fixed"] ? 
                                                                                        `calc(100vh - 51px - 36px)` : 
                                                                                        `calc(100vh - (${appState["profile"]["wallHeight"]}px + 177.5px + 36px) + ${appState["profile"]["tertiaryScrollTop"]}px)`
                                                                                }}
                                                                            >
                                                                            <img src="/assets/Finulab_Icon.png" alt="" className="large-marketPageNoDateNoticeImg" />
                                                                            <div className="large-marketPageNoDataONotice">
                                                                                You haven't engaged any markets yet.
                                                                            </div>
                                                                            <div className="large-marketPageNoDataTNotice">
                                                                                Drop a like or dislike on some markets to fill up your feed.
                                                                            </div>
                                                                        </div> :
                                                                        <>
                                                                            {profileData["engaged"]["data"].map((prediction_desc, index) => {
                                                                                    const marketDesc_toProvide = profileData["engaged"]["support"].filter(doc => doc.predictionId == prediction_desc._id);
                                                                                    return <div className="large-homePagePostContainer" key={`profile-engaged-market-${prediction_desc._id}`}
                                                                                            ref={index === (profileData["engaged"]["data"].length - 2) ? lastMarketEngagedElementRef : null}
                                                                                            style={index === (profileData["engaged"]["data"].length - 1) ? 
                                                                                                {} : {"borderBottom": "solid 1px var(--primary-bg-08)"}
                                                                                            }
                                                                                        >
                                                                                        <div className="large-stocksPostInnerContainer"
                                                                                                key={`profile-inner-cont-engaged-market-${prediction_desc["_id"]}`}
                                                                                                style={prediction_desc["status"] !== "live" ? {"height": "359px", "minHeight": "359px", "maxHeight": "359px"} :
                                                                                                    
                                                                                                    prediction_desc["outcomeType"] === "yes-or-no" ?
                                                                                                    {"height": "442px", "minHeight": "442px", "maxHeight": "442px"} :
                                                                                                    marketDesc_toProvide.length === 1 ? {"height": "402px", "minHeight": "402px", "maxHeight": "402px"} : 
                                                                                                    marketDesc_toProvide.length === 2 ? {"height": "452px", "minHeight": "452px", "maxHeight": "452px"} :
                                                                                                    marketDesc_toProvide.length === 3 ? {"height": "502px", "minHeight": "502px", "maxHeight": "502px"} :
                                                                                                    {"height": "542px", "minHeight": "542px", "maxHeight": "542px"}
                                                                                                }
                                                                                            >
                                                                                            <MiniaturizedPrediction 
                                                                                                pred_location={"market"}
                                                                                                mouseOnComponent={1}
                                                                                                predictionDesc={prediction_desc} 
                                                                                                user={user ? user.user : "visitor"}
                                                                                                marketDesc={marketDesc_toProvide}
                                                                                                ownership={u_marketHoldings.filter(doc => doc.predictionId === prediction_desc._id)}
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
                                                        </> : null
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