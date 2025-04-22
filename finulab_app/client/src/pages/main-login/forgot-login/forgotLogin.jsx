import {useState} from "react";
import {useNavigate} from 'react-router-dom';
import BeatLoader from 'react-spinners/BeatLoader';
import {useDispatch, useSelector} from "react-redux";
import {CheckCircleOutline, DeveloperModeSharp, HighlightOffSharp, Key, Person, RadioButtonUnchecked, Visibility, VisibilityOff} from "@mui/icons-material";
import generalOpx from "../../../functions/generalFunctions";

export default function ForgotLogin(props) {
    const navigate = useNavigate();

    const [accountSetUpNo, setAccountSetUpNo] = useState(1);
    const [translateXAmt, setTranslateXAmt] = useState("0px");
    const [continueLoading, setContinueLoading] = useState(false);
    const [forgotLogin_desc, setForgotLogin_desc] = useState({"email": "", "oneTimeCode": "", "password": "", "c_password": ""});

    const forgotLogin_descHandler = (e) => {
        const {name, value} = e.target;
        setForgotLogin_desc(
            {
                ...forgotLogin_desc, [name]: value
            }
        );
    }

    const [passwordVisibility, setPasswordVisibility] = useState(false);
    const passwordVisibilityToggle = () => {passwordVisibility ? setPasswordVisibility(false) : setPasswordVisibility(true);}

    const [emailError, setEmailError] = useState(false);
    const [passwordError, setPasswordError] = useState(false);
    const [oneTimeCodeError, setOneTimeCodeError] = useState(false);
    const [oneTimeCodeRenewed, setOneTimeCodeRenewed] = useState(false);
    const [resendEmailErrorCode, setResendEmailErrorCode] = useState(0);
    const [accountReaccessErrorCode, setAccountReaccessErrorCode] = useState(0);

    const passwordNumRegex = /[0-9]/g;
    const passwordCapRegex = /[A-Z]/g;
    const passwordSmllRegex = /[a-z]/g;
    const regexEmail = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/i;

    const [onlyResendCodeLoading, setOnlyResendCodeLoading] = useState(false);
    const onlyResendCode = async () => {
        setOnlyResendCodeLoading(true);

        await generalOpx.axiosInstance.post(`/users/forgot-resend-code`, {"email": forgotLogin_desc.email}).then(
            (response) => {
                if(response.data["status"] === "success") {
                    setResendEmailErrorCode(1);

                    setTimeout(() => {
                        setResendEmailErrorCode(0);
                        setOnlyResendCodeLoading(false);
                    }, 2000);
                } else {
                    setResendEmailErrorCode(2);

                    setTimeout(() => {
                        setResendEmailErrorCode(0);
                        setOnlyResendCodeLoading(false);
                    }, 2000);
                }
            }
        ).catch(
            () => {
                setResendEmailErrorCode(2);

                setTimeout(() => {
                    setResendEmailErrorCode(0);
                    setOnlyResendCodeLoading(false);
                }, 2000);
            }
        );
    }

    const continue_wReaccess = async (no) => {
        setContinueLoading(true);

        if(no === 1) {
            if(!regexEmail.test(forgotLogin_desc.email)) {
                setEmailError(true);
                setTranslateXAmt("-10px");

                setTimeout(() => {
                    setTranslateXAmt("10px");
                    setTimeout(() => {
                        setTranslateXAmt("0px");
                        setContinueLoading(false);
                    }, 100);
                }, 100);
            } else {
                const uniqueEmailAddress = await generalOpx.axiosInstance.put(`/users/forgot-login`, {"type": "forgot-login", "email": forgotLogin_desc.email});
                
                if(uniqueEmailAddress.data["status"] === "success") {
                    setEmailError(false);
                    setTranslateXAmt("-100% - 10px");
                    setAccountSetUpNo(prevState => prevState + 1);

                    setContinueLoading(false);
                } else {
                    setAccountReaccessErrorCode(1);
                    
                    setEmailError(true);
                    setTranslateXAmt("-10px");

                    setTimeout(() => {
                        setTranslateXAmt("10px");
                        setTimeout(() => {
                            setTranslateXAmt("0px");

                            setTimeout(() => {
                                setAccountReaccessErrorCode(0);
                                setContinueLoading(false);
                            }, 3000);
                        }, 100);
                    }, 100);
                }
            }
        } else if(no === 2) {
            const codeConfirmation = await generalOpx.axiosInstance.post(`/users/forgot-login-confirmation`, {"email": forgotLogin_desc.email, "oneTimeCode": forgotLogin_desc.oneTimeCode});
            
            if(codeConfirmation.data["status"] === "success") {
                setOneTimeCodeError(false);
                setTranslateXAmt("-200% - 20px");
                setAccountSetUpNo(prevState => prevState + 1);

                setContinueLoading(false);
            } else if(codeConfirmation.data["status"] === "re-sent") {
                setOneTimeCodeError(true);
                setOneTimeCodeRenewed(true);
                setTranslateXAmt("-100% - 20px");

                setTimeout(() => {
                    setTranslateXAmt("-100%");
                    setTimeout(() => {
                        setTranslateXAmt("-100% - 10px");
                        setContinueLoading(false);
                    }, 100);
                }, 100);
            } else {
                setOneTimeCodeError(true);
                setTranslateXAmt("-100% - 20px");

                setTimeout(() => {
                    setTranslateXAmt("-100%");
                    setTimeout(() => {
                        setTranslateXAmt("-100% - 10px");
                        setContinueLoading(false);
                    }, 100);
                }, 100);
            }
        } else if(no === 3) {
            let errorFound = false;

            if(forgotLogin_desc.password.length < 8) {
                errorFound = true;
                setPasswordError(true);
            } else if(forgotLogin_desc.password.match(passwordNumRegex) === null) {
                errorFound = true;
                setPasswordError(true);
            } else if(forgotLogin_desc.password.match(passwordCapRegex) === null) {
                errorFound = true;
                setPasswordError(true);
            } else if(forgotLogin_desc.password.match(passwordSmllRegex) === null) {
                errorFound = true;
                setPasswordError(true);
            } else if(forgotLogin_desc.password !== forgotLogin_desc.c_password) {
                errorFound = true;
                setPasswordError(true);
            } else {
                setPasswordError(false);
            }

            if(errorFound) {
                setTranslateXAmt("-200% - 30px");
                setOneTimeCodeError(true);

                setTimeout(() => {
                    setTranslateXAmt("-200% - 10px");
                    setTimeout(() => {
                        setTranslateXAmt("-200% - 20px");
                        setContinueLoading(false);
                    }, 100);
                }, 100);
            } else {
                const changePassword = await generalOpx.axiosInstance.post(`/users/forgot-login-finalization`, 
                    {
                        "email": forgotLogin_desc.email, 
                        "password": forgotLogin_desc.password,
                        "c_password": forgotLogin_desc.c_password,
                        "oneTimeCode": forgotLogin_desc.oneTimeCode
                    }
                );

                if(changePassword.data["status"] === "success") {
                    setAccountReaccessErrorCode(3);

                    setTimeout(() => {
                        setAccountReaccessErrorCode(0);
                        setContinueLoading(false);
                        navigate(`/main-login`);
                    }, 3000);
                } else {
                    setAccountReaccessErrorCode(2);

                    setTimeout(() => {
                        setAccountReaccessErrorCode(0);
                        setContinueLoading(false);
                    }, 3000);
                }
            }
        }
    }
    
    return(
        <div className="finulab-createAccountWrapper">
            <div className="main-loginHeader" 
                    style={{
                        "marginTop": "48px", "marginLeft": "16px", "color": 1 === 1 ? "var(--primary-bg-01)" : "var(--secondary-bg-03)"
                    }}
                >
                Welcome Back!
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
                                value={forgotLogin_desc.email}
                                onChange={forgotLogin_descHandler}
                                placeholder='Email'
                                autoCapitalize='off'
                                autoComplete='off'
                                className="main-createAccountInput" 
                                style={emailError && !regexEmail.test(forgotLogin_desc.email) ? 
                                    {"border": "solid 1px var(--primary-red-09)"} : 
                                    {}
                                }
                            />
                        </div>
                    </div>
                    <div className="finulab-createAccountInnerContDetails">
                        <div className="main-loginInputCont">
                            <DeveloperModeSharp className="main-loginbodyInputIcon"/>
                            <input type="text"
                                name="oneTimeCode"
                                value={forgotLogin_desc.oneTimeCode}
                                onChange={forgotLogin_descHandler}
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
                                        Code Expired, recheck {forgotLogin_desc.email} for the new one-time code.
                                    </> : 
                                    <>
                                        Check your email at {forgotLogin_desc.email} for the one-time code.
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
                                            `An error occured, please try later.` : null
                                        }
                                    </>
                                }
                            </div>
                        }
                        <div className="finulab-createAccountEmailResendOptnsContainer"
                                style={{"maxHeight": `45px`}}
                            >
                            <button className="finulab-createAccountEmailResendOptnsBtn"
                                    onClick={() => onlyResendCode()}
                                    disabled={onlyResendCodeLoading}
                                    style={{
                                        "color": "var(--primary-bg-01)", "backgroundColor": "var(--secondary-bg-03)", "border": "solid 1px var(--primary-bg-01)"
                                    }}
                                >
                                {onlyResendCodeLoading ?
                                    <BeatLoader 
                                        color='var(--primary-bg-01)'
                                        size={7}
                                    /> : `Resend Code`
                                }
                            </button>
                        </div>
                    </div>
                    <div className="finulab-createAccountInnerContDetails">
                        <div className="main-loginInputCont" style={{"marginTop": "48px"}}>
                            <Key className="main-loginbodyInputIcon"/>
                            <input type={passwordVisibility ? "text" : "password"}
                                name="password"
                                value={forgotLogin_desc.password}
                                onChange={forgotLogin_descHandler}
                                placeholder='Password'
                                autoCapitalize='off'
                                autoComplete='off'
                                className="main-createAccountInput"
                                style={passwordError && (forgotLogin_desc.password.length < 8 ||
                                        forgotLogin_desc.password.match(passwordNumRegex) === null || forgotLogin_desc.password.match(passwordCapRegex) === null || forgotLogin_desc.password.match(passwordCapRegex) === null
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
                                {forgotLogin_desc.password.length >= 8 ?
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
                                {forgotLogin_desc.password.match(passwordNumRegex) === null ?
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
                                {forgotLogin_desc.password.match(passwordCapRegex) === null || 
                                    forgotLogin_desc.password.match(passwordSmllRegex) === null ?
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
                            <div className="finulab-createAccountRequirementsBodyDesc">
                                {forgotLogin_desc.password !== ""
                                    && (forgotLogin_desc.password === forgotLogin_desc.c_password) ?
                                    <CheckCircleOutline className="finulab-createAccountRequirementsBodyDescGreenIcon"/> :
                                    <>
                                        {passwordError ?
                                            <HighlightOffSharp className="finulab-createAccountRequirementsBodyDescRedIcon"/> : 
                                            <RadioButtonUnchecked className="finulab-createAccountRequirementsBodyDescIcon"/>
                                        }
                                    </>
                                }
                                be match the confirm password field
                            </div>
                        </div>
                        <div className="main-loginInputCont" style={{"marginTop": "48px"}}>
                            <Key className="main-loginbodyInputIcon"/>
                            <input type={passwordVisibility ? "text" : "password"}
                                name="c_password"
                                value={forgotLogin_desc.c_password}
                                onChange={forgotLogin_descHandler}
                                placeholder='Confirm Password'
                                autoCapitalize='off'
                                autoComplete='off'
                                className="main-createAccountInput"
                                style={passwordError && (forgotLogin_desc.c_password.length < 8 ||
                                        forgotLogin_desc.c_password.match(passwordNumRegex) === null || forgotLogin_desc.c_password.match(passwordCapRegex) === null || forgotLogin_desc.c_password.match(passwordCapRegex) === null
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
                    </div>
                </div>
            </div>
            <div className="finulab-createAccountUnderlineContainer">
                <div className="finulab-createAccountUnderlineFilled"
                    style={{
                        "width": `calc(${accountSetUpNo} * (100% / 3))`,
                        "minWidth": `calc(${accountSetUpNo} * (100% / 3))`,
                        "maxWidth": `calc(${accountSetUpNo} * (100% / 3))`,
                    }}    
                />
            </div>
            <div className="finulab-createAccountContinueBtnOvrlContainer">
                {accountReaccessErrorCode === 0 ?
                    null : 
                    <>
                        {accountReaccessErrorCode === 1 ?
                            <div className="finulab-createAccountContinueErrorNotice">
                                No account found under this email.
                            </div> : 
                            <>
                                {accountReaccessErrorCode === 2 ?
                                    <div className="finulab-createAccountContinueErrorNotice">
                                        An error occured, please try again later.
                                    </div> : 
                                    <>
                                        {accountReaccessErrorCode === 3 ?
                                            <div className="finulab-createAccountContinueErrorNotice" style={{"color": "var(--primary-green-09)"}}>
                                                <CheckCircleOutline className="finulab-createAccountRequirementsBodyDescGreenIcon"/>
                                                Success, password changed.
                                            </div> : null
                                        }
                                    </>
                                }
                            </>
                        }
                    </>
                }
                <button className="finulab-createAccountContinueBtn"
                        disabled={continueLoading}
                        onClick={() => continue_wReaccess(accountSetUpNo)}
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