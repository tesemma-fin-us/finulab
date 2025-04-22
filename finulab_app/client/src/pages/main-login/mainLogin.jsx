import './mainLogin.css';
import './mainSecondaryLogin.css';

import {useState} from 'react';
import {useDispatch} from 'react-redux';
import {PulseLoader} from 'react-spinners';
import {useNavigate} from 'react-router-dom';
import {Key, Person, Visibility, VisibilityOff} from '@mui/icons-material';

import generalOpx from '../../functions/generalFunctions';
import CreateAccount from './create-account/createAccount';

import {login} from '../../reduxStore/user';
import {setInterests} from '../../reduxStore/interests';
import {setWatchlist} from '../../reduxStore/watchlist';
import {updateAccessState} from '../../reduxStore/accessToken';
import {setSignUpSupport} from '../../reduxStore/signUpSupport';
import {setModeratorStatus} from '../../reduxStore/moderatorStatus';
import ForgotLogin from './forgot-login/forgotLogin';

export default function MainLogin(props) {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const [loginData, setLoginData] = useState({"username": "", "password": ""});
    const loginDataHandler = (e) => {
        const {name, value} = e.target;
        setLoginData(
            {
                ...loginData, [name]: value
            }
        );
    }

    const [passwordVisibility, setPasswordVisibility] = useState(false);
    const passwordVisibilityToggle = () => {passwordVisibility ? setPasswordVisibility(false) : setPasswordVisibility(true);}

    const [loginError, setLoginError] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);
    const submitLogin = async () => {
        setLoginLoading(true);
        await generalOpx.axiosInstance.post("/users/login", loginData).then(
            async (response) => {
                if(response.data["status"] === "success") {
                    const utlizeToken = String(response.data["accessToken"]) + "..use";
                    dispatch(
                        updateAccessState(utlizeToken)
                    );

                    dispatch(
                        setInterests(
                            response.data["interests"]
                        )
                    );

                    dispatch(
                        setWatchlist(
                            response.data["watchlist"]
                        )
                    );

                    dispatch(
                        setModeratorStatus(
                            response.data["moderatorStatus"]
                        )
                    );

                    if(response.data["verificationData"] === null || response.data["verificationData"] === undefined) {
                        dispatch(
                            login(
                                {
                                    user: loginData.username,
                                    profilePicture: response.data["profilePicture"],
                                    profileWallpaper: response.data["profileWallpaper"],
                                    finuxEarned: response.data["finuxEarned"],
                                    walletAddress: response.data["walletAddress"],
                                    monetized: response.data["monetized"],
                                    verified: response.data["verified"],
                                    verificationData: {},
                                    createdAt: response.data["createdAt"]
                                }
                            )
                        );
                    } else {
                        dispatch(
                            login(
                                {
                                    user: loginData.username,
                                    profilePicture: response.data["profilePicture"],
                                    profileWallpaper: response.data["profileWallpaper"],
                                    finuxEarned: response.data["finuxEarned"],
                                    walletAddress: response.data["walletAddress"],
                                    monetized: response.data["monetized"],
                                    verified: response.data["verified"],
                                    verificationData: response.data["verificationData"],
                                    createdAt: response.data["createdAt"]
                                }
                            )
                        );
                    }

                    setLoginLoading(false);
                } else if(response.data["status"] === "requires-full-setup") {
                    const utlizeToken = String(response.data["accessToken"]) + "..use";
                    dispatch(
                        updateAccessState(utlizeToken)
                    );

                    dispatch(
                        setSignUpSupport(
                            {
                                "data": {
                                    "bio": response.data["bio"],
                                    "username": loginData.username,
                                    "email": response.data["email"],
                                    "profileImage": response.data["profile-image"],
                                    "profileWallpaper": response.data["profile-wallpaper"]
                                },
                                "dataLoading": false
                            }
                        )
                    );
                    
                    setLoginLoading(false);
                    navigate(`/finalize-account`);
                } else if(response.data["status"] === "requires-validation") {
                    const utlizeToken = String(response.data["accessToken"]) + "..use";
                    dispatch(
                        updateAccessState(utlizeToken)
                    );

                    dispatch(
                        setSignUpSupport(
                            {
                                "data": {
                                    "username": loginData.username,
                                    "email": response.data["email"]
                                },
                                "dataLoading": false
                            }
                        )
                    );
                    
                    setLoginLoading(false);
                    navigate(`/confirm-account`);
                } else if(response.data["status"] === "error") {
                    setLoginError(true);
                    setLoginLoading(false);
                }
            }
        ).catch(
            () => {
                setLoginError(true);
                setLoginLoading(false);
            }
        );
    }

    return(
        <div className="main-largeLoginWrapper">
            {props.f_viewPort === "small" ? 
                null :
                <div className="main-largeLoginInformationalContainer">
                    <div className="main-largeLoginInformationFinualbTxtContainer">
                        <img src="/assets/Finulab_Logo_Black.png" alt="" className="login-headerLogoImg" />
                    </div>
                    <div className="main-largeLoginInformationFinulabMainDesc">
                        <span className="main-largeLoginInformationFinulabMainDescReal">
                            Post
                        </span>
                        <span className="main-largeLoginInformationFinulabMainDescReal">
                            Predict
                        </span>
                        <span className="main-largeLoginInformationFinulabMainDescReal">
                            Profit
                        </span>
                    </div>
                    <img src="/assets/Finux_Token_Flow_Icon.png" alt="" className="main-largeLoginInfoFinuxFlow" />
                </div>
            }
            <div className="main-largeLoginActualLoginContainer"
                    style={props.f_viewPort === "small" ? 
                        {"width": "100%", "minWidth": "100%", "maxWidth": "100%"} : {}
                    }
                >
                {props.displayView === "" ?
                    <div className="main-largeInsideLoginActualLoginContainer">
                        <div className="main-loginHeader">Log in to Finulab</div>
                        <div className="main-loginInputHeader">Username</div>
                        <div className="main-loginInputCont">
                            <Person className="main-loginbodyInputIcon"/>
                            <input type="text" 
                                name={"username"}
                                value={loginData.username}
                                onChange={loginDataHandler}
                                placeholder=''
                                autoCapitalize='off'
                                autoComplete='off'
                                className="main-loginInput" 
                                style={loginError ? {"border": "solid 1px var(--primary-red-09)"} : {}}
                            />
                        </div>
                        <div className="main-loginInputHeader">Password</div>
                        <div className="main-loginInputCont">
                            <Key className="main-loginbodyInputIcon"/>
                            <input type={passwordVisibility ? "text" : "password"}
                                name={"password"}
                                value={loginData.password}
                                onChange={loginDataHandler}
                                placeholder=''
                                className="main-loginInput" 
                                style={loginError ? {"border": "solid 1px var(--primary-red-09)"} : {}}
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
                        <div className="main-loginOptnsContainer">
                            <button className="main-login_loginBtn"
                                    onClick={() => submitLogin()}
                                >
                                {loginLoading ?
                                    <PulseLoader
                                        color='black'
                                        loading={true}
                                        size={7}
                                    /> : `Login`
                                }
                            </button>
                            <button className="main-login_forgotLoginBtn"
                                    onClick={() => navigate(`/forgot-login`)}
                                >
                                Forgot Login
                            </button>
                        </div>
                        <div className="main-loginInputHeader"
                                style={{"marginTop": "48px"}}
                            >
                            Not on Finulab?&nbsp;&nbsp;
                            <button className="main-loginCreateanAccountBtn" onClick={() => navigate("/create-account")}>Create an account</button>
                        </div>
                        <div className="main-loginGeneralInfo">
                            Finulab © 2024, All Rights Reserved,&nbsp;
                            <button className="main-loginTermsofServiceViewBtn">
                                Terms of Service
                            </button>&nbsp;Apply
                        </div>
                    </div> :
                    <>
                        {props.displayView === "create-account" 
                            || props.displayView === "confirm-account" || props.displayView === "finalize-account" ?
                            <CreateAccount view={props.displayView} /> : 
                            <>
                                {props.displayView === "forgot-login" ?
                                    <ForgotLogin /> : null
                                }
                            </>
                        }
                    </>
                }
            </div>
        </div>
    )
}