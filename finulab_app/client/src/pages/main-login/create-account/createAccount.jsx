import './createAccount.css';

import axios from 'axios';
import {useNavigate} from 'react-router-dom';
import {useRef, useState, useEffect} from 'react';
import BeatLoader from 'react-spinners/BeatLoader';
import {useDispatch, useSelector} from 'react-redux';
import {getDate, getMonth, getUnixTime, getYear} from 'date-fns';
import ReactCrop, {convertToPercentCrop, makeAspectCrop} from 'react-image-crop';
import {DeveloperModeSharp, Key, KeyboardBackspace, Person, RadioButtonUnchecked, Visibility, VisibilityOff, CameraAlt, CheckCircleOutline, HighlightOffSharp} from '@mui/icons-material';

import generalOpx from '../../../functions/generalFunctions';

import {login} from '../../../reduxStore/user';
import {setInterests} from '../../../reduxStore/interests';
import {setWatchlist} from '../../../reduxStore/watchlist';
import {updateAccessState} from '../../../reduxStore/accessToken';
import {setModeratorStatus} from '../../../reduxStore/moderatorStatus';
import {selectSignUpSupport} from '../../../reduxStore/signUpSupport';

const birthMonthOptns = [
    "Jan", "Feb", "Mar",  
    "Apr", "May", "Jun",
    "Jul", "Aug", "Sep",
    "Oct", "Nov", "Dec"
];
const birthDateOptns = [
    1, 2, 3, 4, 5, 6, 7, 
    8, 9, 10, 11, 12, 13,
    14, 15, 16, 17, 18, 19,
    20, 21, 22, 23, 24, 25, 
    26, 27, 28, 29, 30, 31
];

export default function CreateAccount(props) {
    const dispatch = useDispatch();
    const signUpSupport = useSelector(selectSignUpSupport);

    const today = new Date();
    const todayYear = getYear(today);

    let birthYearsOptns = [];
    for(let byo_i = 0; byo_i < 151; byo_i++) {
        birthYearsOptns.push(todayYear - byo_i);
    }


    const [translateXAmt, setTranslateXAmt] = useState("0px");

    const [accountSetUpNo, setAccountSetUpNo] = useState(1);
    const [accountTopDesc, setAccountTopDesc] = useState(
        {
            "email": "", 
            "birthMonth": birthMonthOptns[getMonth(today)],
            "birthDate": getDate(today),
            "birthYear": todayYear,
            "username": "", 
            "password": "",

            "oneTimeCode": "",
            "updatedEmail": "",

            "watchlist": []
        }
    );
    const [accountUnderDesc, setAccountUnderDesc] = useState(
        {
            "bio": "", 
            "profileImage": "",
            "wallpaper": ""
        }
    );

    const accountTopDescHandler = (e) => {
        const {name, value} = e.target;
        setAccountTopDesc(
            {
                ...accountTopDesc, [name]: value
            }
        );
    }
    const accountTopDescWatchlistHandler = (watching) => {
        if(accountTopDesc.watchlist.includes(watching)) {
            let watchlistFunction = [...accountTopDesc.watchlist.filter(list_elem => list_elem !== watching)];
            setAccountTopDesc(
                {
                    ...accountTopDesc, "watchlist": watchlistFunction
                }
            );
        } else {
            let watchlistFunction = [...accountTopDesc.watchlist, watching];
            setAccountTopDesc(
                {
                    ...accountTopDesc, "watchlist": watchlistFunction
                }
            );
        }
    }

    const accountUnderDescHandler = (e) => {
        const {name, value} = e.target;
        setAccountUnderDesc(
            {
                ...accountUnderDesc, [name]: value
            }
        );
    }

    const [termsConditionsAgreed, setTermsConditionsAgreed] = useState(false);
    const termsConditionsAgreedToggle = () => {termsConditionsAgreed ? setTermsConditionsAgreed(false) : setTermsConditionsAgreed(true);}

    const [usernameUnique, setUsernameUnique] = useState(false);
    const usernameUniqueQueryController = useRef(new AbortController());

    useEffect(() => {
        const runQuery = async () => {
            usernameUniqueQueryController.current.abort();
            usernameUniqueQueryController.current = new AbortController();

            try {
                const uniquenessQuery = await generalOpx.axiosInstance.put(`/users/username-unique`, {"queryableUsername": `${accountTopDesc.username}`.toLowerCase()}, {signal: usernameUniqueQueryController.current.signal});

                if(uniquenessQuery.data["status"] === "success") {
                    setUsernameUnique(uniquenessQuery.data["data"]);
                } else {
                    setUsernameUnique(false);
                }
            } catch(err) {}
        }

        if(accountTopDesc["username"].length < 3) {
            usernameUniqueQueryController.current.abort();
            setUsernameUnique(false);
        } else if(
            `${accountTopDesc.username}`.toLowerCase() === "regex" 
            || `${accountTopDesc.username}`.toLowerCase() === "finu" 
            || `${accountTopDesc.username}`.toLowerCase() === "finulab" 
            || `${accountTopDesc.username}`.toLowerCase() === "finux"
            || `${accountTopDesc.username}`.toLowerCase() === "finuai"
            || `${accountTopDesc.username}`.toLowerCase() === "finudex"
            || `${accountTopDesc.username}`.toLowerCase() === "visitor"
        ) {
            usernameUniqueQueryController.current.abort();
            setUsernameUnique(false);
        } else {
            runQuery();
        }
    }, [accountTopDesc["username"]]);

    const [passwordVisibility, setPasswordVisibility] = useState(false);
    const passwordVisibilityToggle = () => {passwordVisibility ? setPasswordVisibility(false) : setPasswordVisibility(true);}

    const [resendEmailHeight, setResendEmailHeight] = useState("45px");
    const [resendEmailErrorCode, setResendEmailErrorCode] = useState(0);
    const resendEmailHeightToggle = () => {resendEmailHeight === "45px" ? setResendEmailHeight("1000px") : setResendEmailHeight("45px");}

    const [onlyResendCodeLoading, setOnlyResendCodeLoading] = useState(false);
    const onlyResendCode = async () => {
        setOnlyResendCodeLoading(true);

        await generalOpx.axiosInstance.post(`/users/resend-code`).then(
            (response) => {
                if(response.data["status"] === "success") {
                    setResendEmailErrorCode(1);

                    setTimeout(() => {
                        setOnlyResendCodeLoading(false);

                        setResendEmailHeight("45px");
                        setResendEmailErrorCode(0);
                    }, 2000);
                } else {
                    setResendEmailErrorCode(3);

                    setTimeout(() => {
                        setOnlyResendCodeLoading(false);
                        setResendEmailErrorCode(0);
                    }, 2000);
                }
            }
        ).catch(
            () => {
                setResendEmailErrorCode(3);

                setTimeout(() => {
                    setOnlyResendCodeLoading(false);
                    setResendEmailErrorCode(0);
                }, 2000);
            }
        );
    }

    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;
    const [updateEmailResendCodeLoading, setUpdateEmailResendCodeLoading] = useState(false);
    const updateEmailResendCode = async () => {
        setUpdateEmailResendCodeLoading(true);

        if(!regexEmail.test(accountTopDesc.updatedEmail)) {
            setResendEmailErrorCode(2);

            setTimeout(() => {
                setUpdateEmailResendCodeLoading(false);
                setResendEmailErrorCode(0);
            }, 2000);
        } else {
            let updatedEmailTxt = accountTopDesc.updatedEmail;
            await generalOpx.axiosInstance.post(`/users/update-resend-code`, {"email": updatedEmailTxt}).then(
                (response) => {
                    if(response.data["status"] === "success") {
                        setResendEmailErrorCode(1);
        
                        setTimeout(() => {
                            setUpdateEmailResendCodeLoading(false);

                            setAccountTopDesc(
                                {
                                    ...accountTopDesc, "email": updatedEmailTxt, "updatedEmail": ""
                                }
                            );
                            setResendEmailHeight("45px");
                            setResendEmailErrorCode(0);
                        }, 2000);
                    } else if(response.data["status"] === "in-use") {
                        setResendEmailErrorCode(4);

                        setTimeout(() => {
                            setUpdateEmailResendCodeLoading(false);
                            setResendEmailErrorCode(0);
                        }, 2000);
                    } else {
                        setResendEmailErrorCode(3);

                        setTimeout(() => {
                            setUpdateEmailResendCodeLoading(false);
                            setResendEmailErrorCode(0);
                        }, 2000);
                    }
                }
            ).catch(
                () => {
                    setResendEmailErrorCode(3);

                    setTimeout(() => {
                        setUpdateEmailResendCodeLoading(false);
                        setResendEmailErrorCode(0);
                    }, 2000);
                }
            );
        }
    }

    const [emailError, setEmailError] = useState(false);
    const [birthDateError, setBirthDateError] = useState(false);
    const [termsConditionsError, setTermsConditionsError] = useState(false);

    const [usernameError, setUsernameError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);
    const [accountCreationErrorCode, setAccountCreationErrorCode] = useState(0);

    const [oneTimeCodeError, setOneTimeCodeError] = useState(false);
    const [oneTimeCodeRenewed, setOneTimeCodeRenewed] = useState(false);

    const [watchlistError, setWatchlistError] = useState(false);
    

    const passwordNumRegex = /[0-9]/g;
    const passwordCapRegex = /[A-Z]/g;
    const passwordSmllRegex = /[a-z]/g;
    const usernameRegex = /^[a-zA-Z0-9_.-]+$/;
    const [watchlistOptns, setWatchlistOptns] = useState([]);

    const [continueLoading, setContinueLoading] = useState(false);
    const continue_wSetup = async (no) => {
        setContinueLoading(true);

        if(no === 1) {
            let oneErrorFound = false;
            let uniqueEmailErrorFound = false;
            if(!regexEmail.test(accountTopDesc.email)) {
                setEmailError(true);
                oneErrorFound = true;
            } else {
                const uniqueEmailAddress = await generalOpx.axiosInstance.put(`/users/forgot-login`, {"type": "sign-up", "email": accountTopDesc.email});

                if(uniqueEmailAddress.data["status"] !== "success") {
                    setEmailError(true);
                    oneErrorFound = true;
                    uniqueEmailErrorFound = true;
                    setAccountCreationErrorCode(3);
                }
            }

            if(todayYear - accountTopDesc.birthYear <= 13) {
                oneErrorFound = true;
                setBirthDateError(true);
            }

            if(!termsConditionsAgreed) {
                oneErrorFound = true;
                setTermsConditionsError(true);
            }
            
            if(oneErrorFound) {
                setTranslateXAmt("-10px");

                setTimeout(() => {
                    setTranslateXAmt("10px");
                    setTimeout(() => {
                        setTranslateXAmt("0px");

                        if(uniqueEmailErrorFound) {
                            setTimeout(() => {
                                setAccountCreationErrorCode(0);
                            }, 3000);
                        }
                    }, 100);
                }, 100);
            } else {
                setEmailError(false);
                setTranslateXAmt("-100% - 10px");
                setAccountSetUpNo(prevState => prevState + 1);
            }
        } else if(no === 2) {
            let errorFound = false;

            if(!usernameUnique) {
                errorFound = true;
                setUsernameError(true);
            } else if(accountTopDesc.username.length < 3 || accountTopDesc.username.length > 20) {
                errorFound = true;
                setUsernameError(true);
            } else if(!usernameRegex.test(accountTopDesc.username)) {
                errorFound = true;
                setUsernameError(true);
            } else {
                setUsernameError(false);
            }

            if(accountTopDesc.password.length < 8) {
                errorFound = true;
                setPasswordError(true);
            } else if(accountTopDesc.password.match(passwordNumRegex) === null) {
                errorFound = true;
                setPasswordError(true);
            } else if(accountTopDesc.password.match(passwordCapRegex) === null) {
                errorFound = true;
                setPasswordError(true);
            } else if(accountTopDesc.password.match(passwordSmllRegex) === null) {
                errorFound = true;
                setPasswordError(true);
            } else {
                setPasswordError(false);
            }

            if(errorFound) {
                setTranslateXAmt("-100% - 20px");

                setTimeout(() => {
                    setTranslateXAmt("-100%");
                    setTimeout(() => {
                        setTranslateXAmt("-100% - 10px");
                    }, 100);
                }, 100);
            } else {
                await generalOpx.axiosInstance.post(`/users/sign-up`, 
                    {
                        "email": accountTopDesc.email,
                        "username": accountTopDesc.username,
                        "password": accountTopDesc.password,
                        "birthDate": accountTopDesc.birthDate,
                        "birthYear": accountTopDesc.birthYear,
                        "birthMonth": accountTopDesc.birthMonth
                    }
                ).then(
                    (response) => {
                        if(response.data["status"] === "success") {
                            const utlizeToken = String(response.data["accessToken"]) + "..use";
                            dispatch(
                                updateAccessState(utlizeToken)
                            );

                            setTranslateXAmt("-200% - 20px");
                            setAccountSetUpNo(prevState => prevState + 1);
                        } else {
                            setAccountCreationErrorCode(1);
                            setTranslateXAmt("-100% - 20px");

                            setTimeout(() => {
                                setTranslateXAmt("-100%");
                                setTimeout(() => {
                                    setTranslateXAmt("-100% - 10px");

                                    setTimeout(() => {
                                        setAccountCreationErrorCode(0);
                                    }, 1800);
                                }, 100);
                            }, 100);
                        }
                    }
                ).catch(
                    (error) => {
                        setAccountCreationErrorCode(1);
                        setTranslateXAmt("-100% - 20px");

                        setTimeout(() => {
                            setTranslateXAmt("-100%");
                            setTimeout(() => {
                                setTranslateXAmt("-100% - 10px");

                                setTimeout(() => {
                                    setAccountCreationErrorCode(0);
                                }, 1800);
                            }, 100);
                        }, 100);
                    }
                );
            }
        } else if(no === 3) {
            const codeConfirmation = await generalOpx.axiosInstance.post(`/users/sign-up-confirmation`, {"oneTimeCode": accountTopDesc.oneTimeCode});

            if(codeConfirmation.data["status"] === "success") {
                setOneTimeCodeError(false);
                setTranslateXAmt("-300% - 30px");
                setAccountSetUpNo(prevState => prevState + 1);
            } else if(codeConfirmation.data["status"] === "re-sent") {
                setOneTimeCodeError(true);
                setOneTimeCodeRenewed(true);
                setTranslateXAmt("-200% - 30px");

                setTimeout(() => {
                    setTranslateXAmt("-200% - 10px");
                    setTimeout(() => {
                        setTranslateXAmt("-200% - 20px");
                    }, 100);
                }, 100);
            } else {
                setOneTimeCodeError(true);
                setTranslateXAmt("-200% - 30px");

                setTimeout(() => {
                    setTranslateXAmt("-200% - 10px");
                    setTimeout(() => {
                        setTranslateXAmt("-200% - 20px");
                    }, 100);
                }, 100);
            }
        } else if(no === 4) {
            if(accountUnderDesc.bio.length > 280) {
                setTranslateXAmt("-300% - 40px");

                setTimeout(() => {
                    setTranslateXAmt("-300% - 20px");
                    setTimeout(() => {
                        setTranslateXAmt("-300% - 30px");
                    }, 100);
                }, 100);
            } else {
                let watchlistOptnsFunction = [], stock_push_i = 0, crypto_push_i = 0;
                const stocksForSelection = await generalOpx.axiosInstance.put(`/stock-market-data/rankings`, {"sortBy": "marketCap"});
                const cryptosForSelection = await generalOpx.axiosInstance.put(`/crypto-market-data/rankings`, {"sortBy": "marketCap"});

                if(stocksForSelection.data["status"] === "success") {
                    if(cryptosForSelection.data["status"] === "success") {
                        const iterationCount = stocksForSelection.data["data"].length + cryptosForSelection.data["data"].length;
                        for(let i = 0; i < iterationCount; i++) {
                            if(i % 2 === 0) {
                                watchlistOptnsFunction.push(
                                    stocksForSelection.data["data"][stock_push_i]
                                );
                                stock_push_i = stock_push_i + 1;
                            } else if(i % 2 === 1) {
                                watchlistOptnsFunction.push(
                                    cryptosForSelection.data["data"][crypto_push_i]
                                );
                                crypto_push_i = crypto_push_i + 1;
                            }
                        }
                        
                        setWatchlistOptns(watchlistOptnsFunction);
                    } else {
                        setWatchlistOptns(stocksForSelection.data["data"]);
                    }
                }

                setTranslateXAmt("-400% - 40px");
                setAccountSetUpNo(prevState => prevState + 1);
            }
        } else if(no === 5) {
            if(accountTopDesc.watchlist.length === 0) {
                setWatchlistError(true);
                setTranslateXAmt("-400% - 50px");
                
                setTimeout(() => {
                    setTranslateXAmt("-400% - 30px");
                    setTimeout(() => {
                        setTranslateXAmt("-400% - 40px");
                    }, 100);
                }, 100);
            } else {
                await generalOpx.axiosInstance.post(`/users/sign-up-finalization`, 
                    {
                        "bio": accountUnderDesc.bio,
                        "watchlist": accountTopDesc.watchlist,
                        "profileImage": profileImageUpdatedSource,
                        "profileWallpaper": wallpaperImageUpdatedSource
                    }
                ).then(
                    (response) => {
                        if(response.data["status"] === "success") {
                            const creationTimestamp = getUnixTime(today);

                            dispatch(
                                setInterests(
                                    []
                                )
                            );

                            dispatch(
                                setWatchlist(
                                    accountTopDesc.watchlist
                                )
                            );
                            
                            dispatch(
                                setModeratorStatus(
                                    []
                                )
                            );

                            dispatch(
                                login(
                                    {
                                        user: accountTopDesc.username,
                                        profilePicture: profileImageUpdatedSource,
                                        profileWallpaper: wallpaperImageUpdatedSource,
                                        finuxEarned: 0,
                                        walletAddress: response.data["data"],
                                        monetized: false,
                                        verified: false,
                                        verificationData: {},
                                        createdAt: creationTimestamp
                                    }
                                )
                            );
                        } else {
                            setAccountCreationErrorCode(2);
                            setTranslateXAmt("-400% - 50px");
                            
                            setTimeout(() => {
                                setTranslateXAmt("-400% - 30px");
                                setTimeout(() => {
                                    setTranslateXAmt("-400% - 40px");

                                    setTimeout(() => {
                                        setAccountCreationErrorCode(0);
                                    }, 1800);
                                }, 100);
                            }, 100);
                        }
                    }
                ).catch(
                    () => {
                        setAccountCreationErrorCode(2);
                        setTranslateXAmt("-400% - 50px");
                        
                        setTimeout(() => {
                            setTranslateXAmt("-400% - 30px");
                            setTimeout(() => {
                                setTranslateXAmt("-400% - 40px");

                                setTimeout(() => {
                                    setAccountCreationErrorCode(0);
                                }, 1800);
                            }, 100);
                        }, 100);
                    }
                );
            }
        }

        setContinueLoading(false);
    }

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
        const utilizeFile = base64ToFile(dataUrl, `${accountTopDesc.username}-setup-profileImage`);

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
        const utilizeFile = base64ToFile(dataUrl, `${accountTopDesc.username}-setup-profileWallpaper`);

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
    
    useEffect(() => {
        if(!(props.view === null || props.view === undefined)) {
            if(props.view === "confirm-account") {
                if(!signUpSupport["dataLoading"]) {
                    setAccountTopDesc(
                        {
                            ...accountTopDesc, "email": signUpSupport["data"]["email"], "username": signUpSupport["data"]["username"]
                        }
                    );

                    setAccountSetUpNo(3);
                    setTranslateXAmt("-200% - 20px");
                }
            } else if(props.view === "finalize-account") {
                if(!signUpSupport["dataLoading"]) {
                    setAccountTopDesc(
                        {
                            ...accountTopDesc, "email": signUpSupport["data"]["email"], "username": signUpSupport["data"]["username"]
                        }
                    );

                    setAccountUnderDesc(
                        {
                            ...accountUnderDesc, "bio": signUpSupport["data"]["bio"]
                        }
                    );

                    setProfileImageUpdatedSource(signUpSupport["data"]["profileImage"]);
                    setWallpaperImageUpdatedSource(signUpSupport["data"]["profileWallpaper"]);

                    setAccountSetUpNo(4);
                    setTranslateXAmt("-300% - 30px");
                }
            }
        }
    }, [props.view, signUpSupport]);

    return(
        <div className="finulab-createAccountWrapper">
            <div className="main-loginHeader" 
                    style={{
                        "marginTop": "48px", "marginLeft": "16px", "color": 1 === 1 ? "var(--primary-bg-01)" : "var(--secondary-bg-03)"
                    }}
                >
                Welcome!
            </div>
            <div className="finulab-createAccountContainer">
                <div className="finulab-createAccountInnerContainer"
                        style={{"transform": `translateX(calc(${translateXAmt}))`}}
                    >
                    <div className="finulab-createAccountInnerContDetails">
                        <div className="main-loginInputCont">
                            <Person className="main-loginbodyInputIcon"/>
                            <input type="text"
                                name="email"
                                value={accountTopDesc["email"]}
                                onChange={accountTopDescHandler}
                                placeholder='Email'
                                autoCapitalize='off'
                                autoComplete='off'
                                className="main-createAccountInput" 
                                style={emailError && !regexEmail.test(accountTopDesc["email"]) ? 
                                    {"border": "solid 1px var(--primary-red-09)"} : 
                                    {}
                                }
                            />
                        </div>

                        <div className="finulab-createAccountBirthdaySetContainer">
                            <div className="finulab-createAccountBirthdaySetHead">Birthdate</div>
                            <div className="finulab-createAccountBirthDaySetterOptionsContainer">
                                <select name="birthMonth" 
                                        value={accountTopDesc["birthMonth"]} 
                                        onChange={accountTopDescHandler}
                                        className="finulab-createAccountBirthDayMonthSelect"
                                    >
                                    {birthMonthOptns.map((m_optn, index) => (
                                            <option key={`month-${index}`} value={m_optn}>{m_optn}</option>
                                        ))
                                    }
                                </select>
                                <select name="birthDate" 
                                        value={accountTopDesc["birthDate"]}
                                        onChange={accountTopDescHandler}
                                        className="finulab-createAccountBirthDayMonthSelect"
                                    >
                                    {birthDateOptns.map((d_optn, index) => (
                                            <option key={`date-${index}`} value={d_optn}>{d_optn}</option>
                                        ))
                                    }
                                </select>
                                <select name="birthYear"
                                        value={accountTopDesc["birthYear"]}
                                        onChange={accountTopDescHandler}
                                        className="finulab-createAccountBirthDayMonthSelect"
                                    >
                                    {birthYearsOptns.map((y_optn, index) => (
                                            <option key={`year-${index}`} value={y_optn}>{y_optn}</option>
                                        ))
                                    }
                                </select>
                            </div>
                            {birthDateError && (todayYear - accountTopDesc["birthYear"] <= 13) ?
                                <div className="finulab-createAccountBirthdaySetHead" 
                                        style={{"marginTop": "12px", "marginBottom": "0", "color": "var(--primary-red-09)"}}
                                    >
                                    You must be over 13 years old to create an account.
                                </div> : null
                            }
                        </div>

                        <div className="finulab-agreeToTermsandConditionsContainer"
                                style={termsConditionsError && !termsConditionsAgreed ? 
                                    {"color": "var(--primary-red-09)"} : {}
                                }
                            >
                            <input type="checkbox" 
                                id="finulab-agreeToTermsandConditionsCheckbox"
                                onChange={() => termsConditionsAgreedToggle()}
                                checked={termsConditionsAgreed} 
                                className="finulab-agreeToTermsandConditionsInput"
                            />
                            <div className="finulab-agreeToTermsandConditionsContainerBlockEllipse">
                                <label 
                                        htmlFor="finulab-agreeToTermsandConditionsCheckbox"
                                    >
                                    I have read and accepted the&nbsp;
                                </label>
                                <button className="finulab-termsandconidtionsViewerBtn">Terms and Conditions.</button>
                            </div>
                        </div>
                    </div>
                    <div className="finulab-createAccountInnerContDetails">
                        <div className="main-loginInputCont">
                            <Person className="main-loginbodyInputIcon"/>
                            <input type="text"
                                name="username"
                                value={accountTopDesc["username"]}
                                onChange={accountTopDescHandler}
                                placeholder='Username'
                                autoCapitalize='off'
                                autoComplete='off'
                                className="main-createAccountInput" 
                                style={usernameError && (!usernameUnique ||
                                    !usernameRegex.test(accountTopDesc["username"]) || accountTopDesc["username"].length < 3 || accountTopDesc["username"].length > 20) ?
                                    {"border": "solid 1px var(--primary-red-09)"} : {}
                                }
                            />
                        </div>
                        <div className="finulab-createAccountRequirequirementsContainer">
                            <div className="finulab-createAccountRequirementsHeader">Username must be:</div>
                            <div className="finulab-createAccountRequirementsBodyDesc">
                                {usernameUnique ?
                                    <CheckCircleOutline className="finulab-createAccountRequirementsBodyDescGreenIcon"/> :
                                    <>
                                        {usernameError ?
                                            <HighlightOffSharp className="finulab-createAccountRequirementsBodyDescRedIcon"/> : 
                                            <RadioButtonUnchecked className="finulab-createAccountRequirementsBodyDescIcon"/>
                                        }
                                    </>
                                }
                                unique
                            </div>
                            <div className="finulab-createAccountRequirementsBodyDesc">
                                {usernameRegex.test(accountTopDesc["username"]) && accountTopDesc["username"].length >= 3 
                                    && accountTopDesc["username"].length <= 20 ?
                                    <CheckCircleOutline className="finulab-createAccountRequirementsBodyDescGreenIcon"/> :
                                    <>
                                        {usernameError ?
                                            <HighlightOffSharp className="finulab-createAccountRequirementsBodyDescRedIcon"/> : 
                                            <RadioButtonUnchecked className="finulab-createAccountRequirementsBodyDescIcon"/>
                                        }
                                    </>
                                }
                                between 3 to 20 alphanumeric characters
                            </div>
                        </div>
                        <div className="main-loginInputCont" style={{"marginTop": "48px"}}>
                            <Key className="main-loginbodyInputIcon"/>
                            <input type={passwordVisibility ? "text" : "password"}
                                name="password"
                                value={accountTopDesc["password"]}
                                onChange={accountTopDescHandler}
                                placeholder='Password'
                                autoCapitalize='off'
                                autoComplete='off'
                                className="main-createAccountInput"
                                style={passwordError && (accountTopDesc["password"].length < 8 ||
                                        accountTopDesc["password"].match(passwordNumRegex) === null || accountTopDesc["password"].match(passwordCapRegex) === null || accountTopDesc["password"].match(passwordCapRegex) === null
                                    ) ?
                                    {"border": "solid 1px var(--primary-red-09)"} : {}
                                }
                            />
                            <button className="main-loginpswdInputVisibilityBtn"
                                    onClick={() => passwordVisibilityToggle()}
                                >
                                {passwordVisibility ?
                                    <VisibilityOff className="main-loginpswdInputIcon"/> :
                                    <Visibility className="main-loginpswdInputIcon"/>
                                }
                            </button>
                        </div>
                        <div className="finulab-createAccountRequirequirementsContainer">
                            <div className="finulab-createAccountRequirementsHeader">Password must be:</div>
                            <div className="finulab-createAccountRequirementsBodyDesc">
                                {accountTopDesc["password"].length >= 8 ?
                                    <CheckCircleOutline className="finulab-createAccountRequirementsBodyDescGreenIcon"/> :
                                    <>
                                        {passwordError ?
                                            <HighlightOffSharp className="finulab-createAccountRequirementsBodyDescRedIcon"/> : 
                                            <RadioButtonUnchecked className="finulab-createAccountRequirementsBodyDescIcon"/>
                                        }
                                    </>
                                }
                                at least 8 characters long
                            </div>
                            <div className="finulab-createAccountRequirementsBodyDesc">
                                {accountTopDesc["password"].match(passwordNumRegex) === null ?
                                    <>
                                        {passwordError ?
                                            <HighlightOffSharp className="finulab-createAccountRequirementsBodyDescRedIcon"/> : 
                                            <RadioButtonUnchecked className="finulab-createAccountRequirementsBodyDescIcon"/>
                                        }
                                    </> : 
                                    <CheckCircleOutline className="finulab-createAccountRequirementsBodyDescGreenIcon"/>
                                }
                                include 1 numeric character
                            </div>
                            <div className="finulab-createAccountRequirementsBodyDesc">
                                {accountTopDesc["password"].match(passwordCapRegex) === null || 
                                    accountTopDesc["password"].match(passwordSmllRegex) === null ?
                                    <>
                                        {passwordError ?
                                            <HighlightOffSharp className="finulab-createAccountRequirementsBodyDescRedIcon"/> : 
                                            <RadioButtonUnchecked className="finulab-createAccountRequirementsBodyDescIcon"/>
                                        }
                                    </> : 
                                    <CheckCircleOutline className="finulab-createAccountRequirementsBodyDescGreenIcon"/>
                                }
                                include 1 small and capital letter
                            </div>
                        </div>
                        {accountCreationErrorCode === 1 ?
                            <div className="finulab-createAccountOneTimeErrorCodeDesc"
                                    style={{"marginTop": "auto", "color": "var(--primary-red-09)"}}
                                >
                                An error occured, please try again later.
                            </div> : null
                        }
                    </div>
                    <div className="finulab-createAccountInnerContDetails">
                        <div className="main-loginInputCont">
                            <DeveloperModeSharp className="main-loginbodyInputIcon"/>
                            <input type="text"
                                name="oneTimeCode"
                                value={accountTopDesc["oneTimeCode"]}
                                onChange={accountTopDescHandler}
                                placeholder='One Time Code'
                                autoCapitalize='off'
                                autoComplete='off'
                                className="main-createAccountInput" 
                                style={oneTimeCodeError || oneTimeCodeRenewed ? 
                                    {"border": "solid 1px var(--primary-red-09)"} : {}
                                }
                            />
                        </div>
                        {resendEmailErrorCode === 0 ?
                            <div className="finulab-createAccountOneTimeErrorCodeDesc"
                                    style={{"color": "var(--primary-bg-05)"}}
                                >
                                {oneTimeCodeRenewed ?
                                    <>
                                        Code Expired, recheck {accountTopDesc.email} for the new one-time code.
                                    </> : 
                                    <>
                                        Check your email at {accountTopDesc.email} for the one-time code.
                                    </>
                                }
                            </div> : 
                            <div className="finulab-createAccountOneTimeErrorCodeDesc"
                                    style={resendEmailErrorCode === 1 ?
                                        {"color": "var(--primary-green-09)"} : {"color": "var(--primary-red-09)"}
                                    }
                                >
                                {resendEmailErrorCode === 1 ?
                                    <>
                                        <CheckCircleOutline className="finulab-createAccountRequirementsBodyDescGreenIcon"/> Code Sent!
                                    </> :
                                    <>
                                        {resendEmailErrorCode === 2 ?
                                            `Please enter a valid email.` : 
                                            <>
                                                {resendEmailErrorCode === 3 ?
                                                    `An error occured, please try later.` : 
                                                    <>
                                                        {resendEmailErrorCode === 4 ?
                                                            `Please input another email, address already in use.` : null
                                                        }
                                                    </>
                                                }
                                            </>
                                        }
                                    </>
                                }
                            </div>
                        }
                        <div className="finulab-createAccountEmailResendOptnsContainer"
                                style={{"maxHeight": `${resendEmailHeight}`}}
                            >
                            <div className="finulab-createAccountEmailUpdateInputCont">
                                <Person className="main-loginbodyInputIcon"/>
                                <input type="text"
                                    name="updatedEmail"
                                    value={accountTopDesc["updatedEmail"]}
                                    onChange={accountTopDescHandler}
                                    placeholder='Email'
                                    autoCapitalize='off'
                                    autoComplete='off'
                                    className="main-createAccountUpdateEmailInput" 
                                />
                                <button className="finulab-createAccountEmailUpdtRsndBtn"
                                        onClick={() => updateEmailResendCode()}
                                        disabled={onlyResendCodeLoading || updateEmailResendCodeLoading}
                                    >
                                    {updateEmailResendCodeLoading ?
                                        <BeatLoader 
                                            color='var(--primary-bg-01)'
                                            size={5}
                                        /> : `Update & Resend`
                                    }
                                </button>
                            </div>
                            <button className="finulab-createAccountEmailResendOptnsBtn"
                                    onClick={() => onlyResendCode()}
                                    disabled={onlyResendCodeLoading || updateEmailResendCodeLoading}
                                    style={{
                                        "marginBottom": "12px", "color": "var(--primary-bg-01)", "backgroundColor": "var(--secondary-bg-03)",
                                        "border": "solid 1px var(--primary-bg-01)"
                                    }}
                                >
                                {onlyResendCodeLoading ?
                                    <BeatLoader 
                                        color='var(--primary-bg-01)'
                                        size={5}
                                    /> : `Only Resend`
                                }
                            </button>
                            <button className="finulab-createAccountEmailResendOptnsBtn"
                                    style={{"backgroundColor": ""}}
                                    onClick={() => resendEmailHeightToggle()}
                                    disabled={onlyResendCodeLoading || updateEmailResendCodeLoading}
                                >
                                Didn't get Code?
                            </button>
                        </div>
                    </div>
                    <div className="finulab-createAccountInnerContDetails">
                        <div className="profile-setUpEditProfileSettingsImageHeader"
                                style={{"borderBottom": "none"}}
                            >
                            <div className="profile-setUpEditProfileSettingsImageHeaderDesc"
                                    style={{"marginLeft": "0"}}
                                >
                                {profileImageSource === "" && wallpaperImageSource === "" ?
                                    null : 
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
                                    `Set-up Profile` : 
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
                                        onClick={() => continue_wSetup(accountSetUpNo)}
                                    >
                                    {continueLoading ?
                                        <BeatLoader 
                                            color='var(--secondary-bg-03)'
                                            size={5}
                                        /> : `Skip`
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
                                <div className="profile-setUpEditProfileSettingsGeneralBioContainer"
                                        style={{"marginTop": "auto", "marginBottom": "auto"}}
                                    >
                                    <div className="profile-setUpEditProfileSettingsGeneralBioHeader">
                                        <span>Bio</span>
                                        <span 
                                            style={{
                                                "marginLeft": "auto",
                                                "color": accountUnderDesc["bio"].length > 280 ? "var(--primary-red-09)" : "var(--primary-bg-05)"
                                            }}
                                            >
                                            {accountUnderDesc["bio"].length} / 280
                                        </span>
                                    </div>
                                    <textarea 
                                        name={"bio"}
                                        value={accountUnderDesc["bio"]}
                                        onChange={accountUnderDescHandler}
                                        placeholder='What are you all about?'
                                        className="profile-setUpEditProfileSettingsGeneralBioTxtArea"
                                    ></textarea>
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
                    <div className="finulab-createAccountInnerContDetails">
                        <div className="finulab-createAccountWatchlistSelectionContainer">
                            {accountTopDesc.watchlist.length === 0 ?
                                <div className="finulab-createAccountWatchlistSelectionContainerNoWatchlingNotice"
                                        style={watchlistError ? {"color": "var(--primary-red-09)"} : {}}
                                    >
                                    Set-up Your Watchlist
                                </div> : 
                                <>
                                    {accountTopDesc.watchlist.map((wat_desc, index) => (
                                            <div className="finulab-createAccountWatchlistElem">
                                                {wat_desc}&nbsp;&nbsp;|&nbsp;&nbsp;
                                                <button className="finulab-createAccountWatchlistElemRmvBtn" onClick={() => accountTopDescWatchlistHandler(wat_desc)}>X</button>
                                            </div>
                                        ))
                                    }
                                </>
                            }
                        </div>
                        <div className="finulab-createAccountWatchlistOptnsOverallContainer">
                            {watchlistOptns.length === 0 ?
                                null : 
                                <>
                                    {watchlistOptns.map((list_desc, index) => {
                                            if(!(list_desc["type"] === null || list_desc["type"] === undefined)) {
                                                return <label 
                                                        htmlFor={`finulab-createAccountWatchlistCheckInput-${index}`}
                                                        className="finulab-createAccountWatchlistOptnsInsideAsstContainer"
                                                        style={accountTopDesc.watchlist.includes(`${list_desc["type"]}:-${list_desc["symbol"]}`) ?
                                                            {"border": "solid 1px var(--primary-blue-10)"} : {}
                                                        }
                                                    >
                                                    <div className="finulab-createAccountWatchlistImgandCheckCont">
                                                        <img src={list_desc["profileImage"]} alt="" className="finulab-createAccountWatchlistOptnsAsstImg" />
                                                        <input 
                                                            type="checkbox" 
                                                            id={`finulab-createAccountWatchlistCheckInput-${index}`}
                                                            checked={accountTopDesc.watchlist.includes(`${list_desc["type"]}:-${list_desc["symbol"]}`) ? true : false}
                                                            onChange={() => accountTopDescWatchlistHandler(`${list_desc["type"]}:-${list_desc["symbol"]}`)} 
                                                            className="finulab-createAccountWatchlistCheckInput" 
                                                        />
                                                    </div>
                                                    <div className="finulab-createAccountWatchlistOptnsDesc">{list_desc["symbol"]}</div>
                                                    <div className="finulab-createAccountWatchlistOptnsDesc" style={{"marginTop": "0", "fontWeight": "normal"}}>{list_desc["name"]}</div> 
                                                    <div className="finulab-createAccountWatchlistPriceChngContainer">
                                                        <div className="finulab-createAccountPriceChngDesc">${generalOpx.formatFigures.format(list_desc["close"])}</div>
                                                        <div className="finulab-createAccountPriceChngDesc" 
                                                                style={{
                                                                    "textAlign": "right", 
                                                                    "color": list_desc["changePerc"] >= 0 ? "var(--primary-green-09)" : "var(--primary-red-09)"
                                                                }}
                                                            >
                                                            {generalOpx.formatFigures.format(Math.abs(list_desc["changePerc"] * 100))}%
                                                        </div>
                                                    </div>
                                                </label>
                                            }
                                    })
                                    }
                                </>
                            }
                            
                        </div>
                    </div>
                </div>
            </div>
            <div className="finulab-createAccountUnderlineContainer">
                <div className="finulab-createAccountUnderlineFilled"
                    style={{
                        "width": `calc(${accountSetUpNo} * (100% / 5))`,
                        "minWidth": `calc(${accountSetUpNo} * (100% / 5))`,
                        "maxWidth": `calc(${accountSetUpNo} * (100% / 5))`,
                    }}    
                />
            </div>
            <div className="finulab-createAccountContinueBtnOvrlContainer">
                {accountCreationErrorCode === 2 ?
                    <div className="finulab-createAccountContinueErrorNotice">
                        An error occured, please try again later.
                    </div> : 
                    <>
                        {accountCreationErrorCode === 3 ?
                            <div className="finulab-createAccountContinueErrorNotice">
                                Please input a unique email, address already in use.
                            </div> : null
                        }
                    </>
                }
                <button className="finulab-createAccountContinueBtn"
                        disabled={continueLoading}
                        onClick={() => continue_wSetup(accountSetUpNo)}
                    >
                    {continueLoading ?
                        <BeatLoader 
                            color='var(--secondary-bg-03)'
                            size={7}
                        /> : `Continue`
                    }
                </button>
            </div>
        </div>
    )
}