import './createCommunity.css';
import '../home/largeView/home.css';
import '../../components/createPost/createPost.css';

import axios from 'axios';
import {useNavigate} from 'react-router-dom';
import {useRef, useState, useEffect} from 'react';
import BeatLoader from 'react-spinners/BeatLoader';
import {useDispatch, useSelector} from 'react-redux';
import {getDate, getMonth, getUnixTime, getYear} from 'date-fns';
import ReactCrop, {convertToPercentCrop, makeAspectCrop} from 'react-image-crop';
import {DeveloperModeSharp, Key, KeyboardBackspace, Person, RadioButtonUnchecked, Visibility, VisibilityOff, CameraAlt, CheckCircleOutline, HighlightOffSharp, ConnectWithoutContactSharp} from '@mui/icons-material';

import generalOpx from '../../functions/generalFunctions';

import {setModeratorStatus, selectModeratorStatus} from '../../reduxStore/moderatorStatus';

export default function CreateCommunity(props) {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const modStatus = useSelector(selectModeratorStatus)

    const [accountDesc, setAccountDesc] = useState({
        "communityName": "",
        "filteredCommunityName": "",
        "bio": ""
    });

    const accountDescHandler = (e) => {
        const {name, value} = e.target;

        if(name === "communityName") {
            if(value === "" || value === "f:-") {
                setAccountDesc(
                    {
                        ...accountDesc, "communityName": "", "filteredCommunityName": ""
                    }
                );
            } else {
                if(accountDesc.filteredCommunityName === "") {
                    setAccountDesc(
                        {
                            ...accountDesc, "communityName": `f:-${value}`, "filteredCommunityName": value
                        }
                    );
                } else {
                    setAccountDesc(
                        {
                            ...accountDesc, "communityName": `f:-${value.slice(3)}`, "filteredCommunityName": value.slice(3)
                        }
                    );
                }
            }
        } else {
            setAccountDesc(
                {
                    ...accountDesc, [name]: value
                }
            );
        }
    }

    const [communityNameUnique, setCommunityNameunique] = useState(false);
    const communityNameUniqueQueryController = useRef(new AbortController());
    useEffect(() => {
        const runQuery = async () => {
            communityNameUniqueQueryController.current.abort();
            communityNameUniqueQueryController.current = new AbortController();

            try {
                const uniquenessQuery = await generalOpx.axiosInstance.put(`/users/community-unique`, {"queryableName": `${accountDesc.communityName}`.toLowerCase()}, {signal: communityNameUniqueQueryController.current.signal});

                if(uniquenessQuery.data["status"] === "success") {
                    setCommunityNameunique(uniquenessQuery.data["data"]);
                } else {
                    setCommunityNameunique(false);
                }
            } catch(err) {}
        }

        if(accountDesc["communityName"].length < 6) {
            communityNameUniqueQueryController.current.abort();
            setCommunityNameunique(false);
        } else if(
            `${accountDesc.communityName}`.toLowerCase() === "f:-regex" 
            || `${accountDesc.communityName}`.toLowerCase() === "f:-finu" 
            || `${accountDesc.communityName}`.toLowerCase() === "f:-finulab" 
            || `${accountDesc.communityName}`.toLowerCase() === "f:-finux"
            || `${accountDesc.communityName}`.toLowerCase() === "f:-finuai"
            || `${accountDesc.communityName}`.toLowerCase() === "f:-finudex"
            || `${accountDesc.communityName}`.toLowerCase() === "f:-visitor"
        ) {
            communityNameUniqueQueryController.current.abort();
            setCommunityNameunique(false);
        } else {
            runQuery();
        }
    }, [accountDesc.communityName]);

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
        const utilizeFile = base64ToFile(dataUrl, `${accountDesc.communityName}-setup-profileImage`);

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
        const utilizeFile = base64ToFile(dataUrl, `${accountDesc.communityName}-setup-profileWallpaper`);

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

    const [continueError, setContinueError] = useState(false);
    const [continueLoading, setContinueLoading] = useState(false);
    const [continueErrorCode, setContinueErrorCode] = useState(0);
    const continue_wCreate = async () => {
        let errorFound = false;
        setContinueLoading(true);

        if(profileImageUpdatedSource === "" || wallpaperImageUpdatedSource === "" 
            || accountDesc.bio === "" || accountDesc.bio.length > 280 || accountDesc.communityName === "" || accountDesc.filteredCommunityName.length < 3 || accountDesc.filteredCommunityName.length > 20
        ) {
            errorFound = true;
            setContinueError(true);
        }

        if(!errorFound) {
            await generalOpx.axiosInstance.post(`/communities/create-community`,
                {
                    "bio": accountDesc.bio,
                    "communityName": accountDesc.communityName,
                    "profileImage": profileImageUpdatedSource,
                    "profileWallpaper": wallpaperImageUpdatedSource
                }
            ).then(
                (response) => {
                    if(response.data["status"] === "success") {
                        let modStatusCopy = [...modStatus];
                        modStatusCopy.push(
                            {
                                "community": accountDesc.communityName,
                                "type": "superMod",
                                "profileImage": profileImageUpdatedSource
                            }
                        );
                        dispatch(
                            setModeratorStatus(modStatusCopy)
                        );
                        setContinueLoading(false);
                        
                        navigate(`/profile/${accountDesc.communityName}`);
                    } else {
                        setContinueErrorCode(1);

                        setTimeout(() => {
                            setContinueErrorCode(0);
                            setContinueLoading(false);
                        }, 2000);
                    }
                }
            ).catch(
                () => {
                    setContinueErrorCode(1);

                    setTimeout(() => {
                        setContinueErrorCode(0);
                        setContinueLoading(false);
                    }, 2000);
                }
            );
        } else {
            setContinueLoading(false);
        }
    }

    return(
        <div
                className={props.f_viewPort === "small" ? "small-homePageContentBodyWrapper" : "large-homePageContentBodyWrapper"}
            >
            <div
                    className={props.f_viewPort === "small" ? "small-homePageContentBody" : "large-homePageContentBody"}
                >
                <div className="large-homePageContentBodyMargin"/>
                <div className="finulab-createCommunityWrapper">
                    <div
                            className={props.f_viewPort === "small" ? "finulab-createCommunityHeaderSmall" : "finulab-createCommunityHeader"}
                            style={{"borderBottom": "none"}}
                        >
                        <div className="profile-setUpEditProfileSettingsImageHeaderDesc"
                                style={{"marginLeft": "10px", "fontSize": "1.15rem"}}
                            >
                            {profileImageSource === "" && wallpaperImageSource === "" ?
                                <>
                                    <ConnectWithoutContactSharp />&nbsp;
                                </> : 
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
                                `Create Community` : 
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
                                    onClick={() => continue_wCreate()}
                                    disabled={continueLoading}
                                    style={{
                                        "fontSize": "1rem",
                                        "width": "100px", "minWidth": "100px", "maxWidth": "100px",
                                        "height": "30px", "minHeight": "30px", "maxHeight": "30px"
                                    }}
                                >
                                {continueLoading ?
                                    <BeatLoader 
                                        color='var(--secondary-bg-03)'
                                        size={5}
                                    /> : `Continue`
                                }
                            </button> :
                            <>
                                {wallpaperImageSource === "" ?
                                    <button className="profile-setUpEditProfileSettingsImageHeaderApplyBtn"
                                            onClick={() => profileImageUpdatedSourceHandler()}
                                            style={{
                                                "fontSize": "1rem",
                                                "width": "100px", "minWidth": "100px", "maxWidth": "100px",
                                                "height": "30px", "minHeight": "30px", "maxHeight": "30px"
                                            }}
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
                                            style={{
                                                "fontSize": "1rem",
                                                "width": "100px", "minWidth": "100px", "maxWidth": "100px",
                                                "height": "30px", "minHeight": "30px", "maxHeight": "30px"
                                            }}
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
                                <div className="profile-setUpEditProfileSettingsGeneralWallpaper"/> : 
                                <img src={wallpaperImageUpdatedSource} alt="" className="profile-setUpEditProfileSettingsGeneralWallpaperImg" />
                            }
                            {profileImageUpdatedSource === "" ?
                                <div className="profile-setUpEditProfileSettingsGeneralProfileImgNonImage"/> : 
                                <img src={profileImageUpdatedSource} alt="" className="profile-setUpEditProfileSettingsGeneralProfileImg" />
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
                            {continueErrorCode === 1 ?
                                <div className="create-communityContinueErrorDesc">
                                    An error occured, please try later.
                                </div> : null
                            }
                            <div className="main-loginInputCont"
                                    style={{
                                        "marginTop": "75px",
                                        "marginLeft": "16px",
                                        "width": "calc(100% - 34px)", "minWidth": "calc(100% - 34px)", "maxWidth": "calc(100% - 34px)"
                                    }}
                                >
                                <Person className="main-loginbodyInputIcon"/>
                                <input type="text"
                                    name="communityName"
                                    value={accountDesc.communityName}
                                    onChange={accountDescHandler}
                                    placeholder='Community Name'
                                    autoCapitalize='off'
                                    autoComplete='off'
                                    className="main-createAccountInput" 
                                    style={{
                                        "fontSize": "1rem"
                                    }}
                                />
                            </div>
                            <div className="profile-setUpEditProfileSettingsGeneralBioContainer"
                                    style={{"marginTop": "24px"}}
                                >
                                <div className="profile-setUpEditProfileSettingsGeneralBioHeader">
                                    <span>Bio</span>
                                    <span 
                                        style={{
                                            "marginLeft": "auto",
                                            "color": accountDesc["bio"].length > 280 ? "var(--primary-red-09)" : "var(--primary-bg-05)"
                                        }}
                                        >
                                        {accountDesc["bio"].length} / 280
                                    </span>
                                </div>
                                <textarea 
                                    name={"bio"}
                                    value={accountDesc["bio"]}
                                    onChange={accountDescHandler}
                                    placeholder='What are you all about?'
                                    className="profile-setUpEditProfileSettingsGeneralBioTxtArea"
                                ></textarea>
                            </div>
                            <div className="finulab-createAccountRequirequirementsContainer" style={{"marginTop": "32px"}}>
                                <div className="finulab-createAccountRequirementsHeader">Requirements:</div>
                                <div className="finulab-createAccountRequirementsBodyDesc" style={{"fontSize": "1.1rem"}}>
                                    {accountDesc.bio !== "" ?
                                        <CheckCircleOutline className="finulab-createAccountRequirementsBodyDescGreenIcon"/> :
                                        <>
                                            {continueError ?
                                                <HighlightOffSharp className="finulab-createAccountRequirementsBodyDescRedIcon"/> : 
                                                <RadioButtonUnchecked className="finulab-createAccountRequirementsBodyDescIcon"/>
                                            }
                                        </>
                                    }
                                    Bio filled in
                                </div>
                                <div className="finulab-createAccountRequirementsBodyDesc" style={{"fontSize": "1.1rem"}}>
                                    {communityNameUnique ?
                                        <CheckCircleOutline className="finulab-createAccountRequirementsBodyDescGreenIcon"/> :
                                        <>
                                            {continueError ?
                                                <HighlightOffSharp className="finulab-createAccountRequirementsBodyDescRedIcon"/> : 
                                                <RadioButtonUnchecked className="finulab-createAccountRequirementsBodyDescIcon"/>
                                            }
                                        </>
                                    }
                                    Unique name
                                </div>
                                <div className="finulab-createAccountRequirementsBodyDesc" style={{"fontSize": "1.1rem"}}>
                                    {profileImageUpdatedSource !== "" ?
                                        <CheckCircleOutline className="finulab-createAccountRequirementsBodyDescGreenIcon"/> :
                                        <>
                                            {continueError ?
                                                <HighlightOffSharp className="finulab-createAccountRequirementsBodyDescRedIcon"/> : 
                                                <RadioButtonUnchecked className="finulab-createAccountRequirementsBodyDescIcon"/>
                                            }
                                        </>
                                    }
                                    Profile image added
                                </div>
                                <div className="finulab-createAccountRequirementsBodyDesc" style={{"fontSize": "1.1rem"}}>
                                    {wallpaperImageUpdatedSource !== "" ?
                                        <CheckCircleOutline className="finulab-createAccountRequirementsBodyDescGreenIcon"/> :
                                        <>
                                            {continueError ?
                                                <HighlightOffSharp className="finulab-createAccountRequirementsBodyDescRedIcon"/> : 
                                                <RadioButtonUnchecked className="finulab-createAccountRequirementsBodyDescIcon"/>
                                            }
                                        </>
                                    }
                                    Profile wallpaper added
                                </div>
                                <div className="finulab-createAccountRequirementsBodyDesc" style={{"fontSize": "1.1rem"}}>
                                    {accountDesc.filteredCommunityName.length >= 3 &&  accountDesc.filteredCommunityName.length <= 20 ?
                                        <CheckCircleOutline className="finulab-createAccountRequirementsBodyDescGreenIcon"/> :
                                        <>
                                            {continueError ?
                                                <HighlightOffSharp className="finulab-createAccountRequirementsBodyDescRedIcon"/> : 
                                                <RadioButtonUnchecked className="finulab-createAccountRequirementsBodyDescIcon"/>
                                            }
                                        </>
                                    }
                                    3 to 20 character name
                                </div>
                            </div>
                        </div> : 
                        <>
                            {wallpaperImageSource === "" ?
                                <div className="profile-setUpEditProfileSettingsImageEditorContainer" style={{"backgroundColor": "var(--secondary-bg-03)"}}>
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
                                <div className="profile-setUpEditProfileSettingsImageEditorContainer" style={{"backgroundColor": "var(--secondary-bg-03)"}}>
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
            </div>
        </div>
    )
}