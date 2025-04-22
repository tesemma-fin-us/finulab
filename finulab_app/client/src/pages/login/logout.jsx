import './login.css';

import {useState} from 'react';
import {useDispatch} from 'react-redux';
import {PulseLoader} from 'react-spinners';
import {useNavigate} from 'react-router-dom';

import generalOpx from '../../functions/generalFunctions';

import {logout} from '../../reduxStore/user';
import {setInterests} from '../../reduxStore/interests';
import {setWatchlist} from '../../reduxStore/watchlist';
import {updateAccessState} from '../../reduxStore/accessToken';
import {setMarketHoldings} from '../../reduxStore/marketHoldings';
import {setModeratorStatus} from '../../reduxStore/moderatorStatus';

const override = {
    display: "block",
    margin: "0 auto"
};

export default function Logout() {
    const navigate = useNavigate();
    const dispatch = useDispatch();

    const cancelLogout = () => {navigate(-1);}
    
    const [logoutError, setLogoutError] = useState(false);
    const [logoutLoading, setLogoutLoading] = useState(false);
    const continueLogout = async () => {
        setLogoutLoading(true);

        await generalOpx.axiosInstance.post(`/users/logout`).then(
            (response) => {
                if(response.data["status"] === "success") {
                    const utlizeToken = String(response.data["accessToken"]) + "..use";
                    dispatch(
                        updateAccessState(utlizeToken)
                    );

                    dispatch(
                        setInterests([])
                    );

                    dispatch(
                        setWatchlist([])
                    );

                    dispatch(
                        setModeratorStatus([])
                    );

                    dispatch(
                        setMarketHoldings(
                            [{"_id": "finulab_alreadySet"}]
                        )
                    );

                    dispatch(
                        logout()
                    );

                    setTimeout(() => {navigate(`/main-login`);}, 0);
                } else {
                    setLogoutError(true);

                    setTimeout(() => {
                        setLogoutError(false);
                        setLogoutLoading(false);
                    }, 2000);
                }
            }
        ).catch(
            () => {
                setLogoutError(true);

                setTimeout(() => {
                    setLogoutError(false);
                    setLogoutLoading(false);
                }, 2000);
            }
        );
    }

    return(
        <div className="login-wrapper">
            <div className="login-headerLogoContainer">
                <img src="/assets/Finulab_Logo.png" alt="" className="login-headerLogoImg" />
            </div>
            <div className="logout-headerFinulabDesc">
                {!logoutError ?
                    <span>Are you sure you want to logout?</span> : 
                    <span style={{"color": "var(--primary-red-09)"}}>An error occured, please try again later.</span>
                }
            </div>
            <div className="logout-body">
                <button className="logout-cancel"
                        onClick={() => cancelLogout()}
                    >
                    Cancel
                </button>
                <button className="logout-continue"
                        onClick={() => continueLogout()}
                    >
                    {logoutLoading ?
                        <PulseLoader 
                            color='black'
                            loading={true}
                            size={7}
                        /> : `Yes, Logout`
                    }
                </button>
            </div>
        </div>
    )
}