import './topBar.css';

import {useSelector} from 'react-redux';
import {DarkModeSwitch} from 'react-toggle-dark-mode';
import {useNavigate, useLocation} from 'react-router-dom'; 
import {Search, Cottage, AccountBalanceWallet, Apps, Newspaper, AccountBalance, Logout} from "@mui/icons-material";

import {selectUser} from '../../reduxStore/user';

export default function TopBar() {
    const user = useSelector(selectUser);

    const page = useLocation();
    const navigate = useNavigate();
    const toggleViewMode = () => {};
    const idPage = (pathname) => {
        const pathnameSplit = String(pathname).split("/");
        return pathnameSplit[1];
    }

    const profileImage = "https://finulab-dev-profile-images.s3.us-east-1.amazonaws.com/1707258973-W%28LDgC%24%28C9W7goZ-KX%28bV%29zD%24R%217cQHTWtY%26%21TzQ%28I27%40UTj-1X5SJyhpJSAkm4%29Ws8eG9BaPdMWtAPCvCQr6X%2BUP%29UZK%2Btesemma.fin-usk9x2zsT%24umgCT%215Xlqt%5EJbYDFtA%21vyqcKuvcc7Ma%24u9rtsd7Taa%2BmUNPX%2Aa1j79iL%5ECR%24edmJRcZhHDWT5b%25N%24%2BCdCxm%29nQjm%23Hj0zx%26yB.jpeg";

    return(
        <div className="large-TopbarWrapper">
            <div className="large-TopbarContainer">
                <div className="large-TopbarFinulabIconContainer">
                    <img src="/assets/Finulab_Icon.png" alt="" className="large-TopbarFinulabIconImg" />
                </div>

                <div className="large-TopbarBuiltOnSearchContainer">
                    <div className="large-TopbarBuiltOnSearchInsideContainer"
                            style={idPage(page.pathname) === "stocks" || idPage(page.pathname) === "cryptos" ?
                                {"transform": "translateY(-45px)"} : {}
                            }
                        >
                        <div className="large-TopbarSearchWrapper">
                            <div className="large-TopbarBuiltonDescContainer">
                                •
                                <span className="large-TopbarBuiltonDescText">built on</span>
                            </div>
                            <img src="https://finulab-dev-posts.s3.amazonaws.com/kadena-kda-logo.png" alt="" className="large-TopbarBuiltOnImg" />
                        </div>
                        <div className="large-TopbarSearchWrapper">
                            <div className="large-TopbarSearchContainer">
                                <Search className="large-TopbarSearchIcon"/>
                                <input type="text" 
                                    placeholder="Search"
                                    className="large-TopbarSearchInput" 
                                />
                            </div>
                        </div>
                    </div>
                </div>
                
                <div className="large-TopbarOptionsContainer">
                    <div className="large-TopbarPageViewOptionsContainer">
                        <button className="large-TopbarPageViewOptnInnerContainer"
                                onClick={() => {navigate("/")}}
                            >
                            <Cottage className={idPage(page.pathname) === "" || idPage(page.pathname) === "profile" ? "large-TopbarPageViewOptnIcon_selected" : "large-TopbarPageViewOptnIcon"}/>
                            <span className={idPage(page.pathname) === "" || idPage(page.pathname) === "profile" ? "large-TopbarPageViewOptnDesc_selected" : "large-TopbarPageViewOptnDesc"}>Home</span>
                        </button>
                        {/*
                        <button className="large-TopbarPageViewOptnInnerContainer"
                                onClick={() => {navigate("/wallet")}}
                            >
                            <AccountBalanceWallet className={idPage(page.pathname) === "wallet" ? "large-TopbarPageViewOptnIcon_selected" : "large-TopbarPageViewOptnIcon"}/>
                            <span className={idPage(page.pathname) === "wallet" ? "large-TopbarPageViewOptnDesc_selected" : "large-TopbarPageViewOptnDesc"}>Wallet</span>
                        </button>
                        */}
                        <button className="large-TopbarPageViewOptnInnerContainer">
                            <Apps className={idPage(page.pathname) === "cryptos" ? "large-TopbarPageViewOptnIcon_selected" : "large-TopbarPageViewOptnIcon"}/>
                            <span className={idPage(page.pathname) === "cryptos" ? "large-TopbarPageViewOptnDesc_selected" : "large-TopbarPageViewOptnDesc"}>Cryptos</span>
                        </button>
                        <button className="large-TopbarPageViewOptnInnerContainer"
                                onClick={() => {navigate("/stocks")}}
                            >
                            <Newspaper className={idPage(page.pathname) === "stocks" ? "large-TopbarPageViewOptnIcon_selected" : "large-TopbarPageViewOptnIcon"}/>
                            <span className={idPage(page.pathname) === "stocks" ? "large-TopbarPageViewOptnDesc_selected" : "large-TopbarPageViewOptnDesc"}>Stocks</span>
                        </button>
                        {/*
                        <button className="large-TopbarPageViewOptnInnerContainer"
                                onClick={() => {navigate("/market")}}
                            >
                            <AccountBalance className={idPage(page.pathname) === "market" ? "large-TopbarPageViewOptnIcon_selected" : "large-TopbarPageViewOptnIcon"}/>
                            <span className={idPage(page.pathname) === "market" ? "large-TopbarPageViewOptnDesc_selected" : "large-TopbarPageViewOptnDesc"}>Markets</span>
                        </button>
                        */}
                        <button className="large-TopbarPageViewOptnInnerContainer"
                               
                               >
                           <Logout className={idPage(page.pathname) === "logout" ? "large-TopbarPageViewOptnIcon_selected" : "large-TopbarPageViewOptnIcon"}/>
                           <span className={idPage(page.pathname) === "logout" ? "large-TopbarPageViewOptnDesc_selected" : "large-TopbarPageViewOptnDesc"}>Exit</span>
                        </button>
                    </div>
                    <div className="large-TopbarDivider"/>
                    <div className="large-TopbarViewModeContainer">
                        <DarkModeSwitch 
                            checked={true}
                            onChange={toggleViewMode}
                            size={20}
                        />
                    </div>
                    {user ?
                        <button className="large-TopbarProfileContainer"
                                onClick={() => {navigate("/profile")}}
                            >
                            <img src={user["profilePicture"]} alt="" className="large-TopbarProfileImg" />
                            <span className="large-TopbarProfileDesc">{user.user}</span>
                            <span className="large-TopbarProfileNotificationsDesc">5</span>
                        </button> : 
                        <>
                            <div className="large-TopbarProfileContainer"
                                style={{"cursor": "auto"}}
                            >
                                <button className="large-TopbarProfileNonUserBtn" onClick={() => navigate("/login")}>Login</button>
                                <span className="large-TopbarProfileDesc" style={{"margin": "0"}}>&nbsp;&nbsp;|&nbsp;&nbsp;</span>
                                <button className="large-TopbarProfileNonUserBtn">Join Us</button>
                            </div>
                        </>
                    }
                </div>
            </div>
        </div>
    )
}