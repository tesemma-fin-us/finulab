import './login.css';

import {useState} from 'react';
import {useDispatch} from 'react-redux';
import {PulseLoader} from 'react-spinners';
import {useNavigate} from 'react-router-dom';
import {Person, Key, Visibility, VisibilityOff} from '@mui/icons-material';

import generalOpx from '../../functions/generalFunctions';

import {login} from '../../reduxStore/user';
import {setInterests} from '../../reduxStore/interests';
import {setWatchlist} from '../../reduxStore/watchlist';
import {updateAccessState} from '../../reduxStore/accessToken';
import {setSignUpSupport} from '../../reduxStore/signUpSupport';
import {setModeratorStatus} from '../../reduxStore/moderatorStatus';

const override = {
    display: "block",
    margin: "0 auto"
};

export default function Login() {
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
        <div className="login-wrapper">
            <div className="login-headerLogoContainer">
                <img src="/assets/Finulab_Logo.png" alt="" className="login-headerLogoImg" />
            </div>
            <div className="login-headerFinulabDesc">
                <span>POST</span>
                <span>PREDICT</span>
                <span>PROFIT</span>
            </div>
            <div className="login-body">
                <div className="login-bodyInputContainer" 
                     style={loginError ? {"border": "solid 1px var(--primary-red-09)"} : {}}
                    >
                    <Person className="login-bodyInputIcon"/>
                    <input type="text" 
                        name="username"
                        autoComplete="off"
                        autoCapitalize="off"
                        value={loginData.username}
                        onChange={loginDataHandler}
                        placeholder="Your Username"
                        className="login-bodyInput" 
                    />
                    {loginError ?
                        <span className="login-bodyInputErrorNotice">Invalid Email or Password</span> : null
                    }
                </div>
                <div className="login-bodyInputContainer" 
                        style={loginError ? {"marginTop": "30px", "border": "solid 1px var(--primary-red-09)"} : {"marginTop": "30px"}}
                    >
                    <Key className="login-bodyInputIcon"/>
                    <input type={passwordVisibility ? "text" : "password"}
                        name="password"
                        autoComplete="off"
                        autoCapitalize="off"
                        value={loginData.password}
                        onChange={loginDataHandler}
                        placeholder="Your Password"
                        className="login-bodyInput" 
                    />
                    <button className="login-inputVisibilityBtn"
                            onClick={() => passwordVisibilityToggle()}
                        >
                        {passwordVisibility ?
                            <VisibilityOff className="login-bodyInputIcon"/> :
                            <Visibility className="login-bodyInputIcon"/>
                        }
                    </button>
                </div>

                <button className="login-button"
                        disabled={loginLoading}
                        onClick={() => submitLogin()}
                    >
                    {loginLoading ?
                        <PulseLoader
                            color='black'
                            cssOverride={override}
                            loading={true}
                            size={5}
                        /> : `Login`
                    }
                </button>

                <div className="login-bodyOtherOptnsContainer">
                    <div className="login-bodyOtherOptnsDivider"/>
                    <span>or</span>
                    <div className="login-bodyOtherOptnsDivider"/>
                </div>
                <div className="login-bodyOtherOptnsContainer">
                    <button className="login-otherOptnButton" onClick={() => navigate(`/forgot-login`)}>Forgot Login</button>
                    <button className="login-otherOptnButton" onClick={() => navigate(`/create-account`)}>Sign-Up</button>
                </div>
                <div className="login-bodyOtherOptnsContainer">
                    <div className="login-bodyOtherOptnsFullDivider"/>
                </div>
                <div className="login-bodyOtherGeneralDescContainer">
                    <button className="login-bodyOtherGeneralDescBtn">About Us</button>
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                    <button className="login-bodyOtherGeneralDescBtn">Terms of Service</button>
                    &nbsp;&nbsp;|&nbsp;&nbsp;
                    <button className="login-bodyOtherGeneralDescBtn">Privacy Policy</button>
                </div>
                <div className="login-bodyOtherGeneralDescContainer" style={{"marginTop": "3px", "marginBottom": "10px"}}>
                    Finulab © 2024, All Rights Reserved
                </div>
            </div>
        </div>
    )
}