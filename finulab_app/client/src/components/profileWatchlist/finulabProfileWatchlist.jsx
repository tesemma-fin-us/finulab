import {useState} from "react";
import {useNavigate} from 'react-router-dom';
import {NorthSharp, SouthSharp} from '@mui/icons-material'
import generalOpx from "../../functions/generalFunctions";

export default function FinulabProfileWatchlist(props) {
    const navigate = useNavigate();

    function getRandomBrightColor() {
        const minBrightness = 100; // Minimum value for each component (0-255)
        let r, g, b;
        
        do {
            r = Math.floor(Math.random() * (256 - minBrightness)) + minBrightness; // 100-255
            g = Math.floor(Math.random() * (256 - minBrightness)) + minBrightness;
            b = Math.floor(Math.random() * (256 - minBrightness)) + minBrightness;
        } while (r < minBrightness || g < minBrightness || b < minBrightness); // Ensure no dark values
        
        return `rgb(${r}, ${g}, ${b})`;
    }
    const [tickerBackground, setTickerBackground] = useState(getRandomBrightColor());

    return(
        <>
            {props.loading ?
                <div className="finulab-profileWatchlistWrapper">
                    <div className="finulab-profileWatchlistHeader">
                        <div className="profile-NotificationRightImgLoading"/>
                        <div className="finulab-profileWatchlistTickerBtnLoading"/>
                        <div className="finulab-profileWatchlistTickerBtnLoading" style={{"marginLeft": "auto"}}/>
                    </div>
                    <div className="finulab-profileWatchlistNameBodyContainer">
                        <div className="profile-NotificationShortMsgContainerLoading"/>
                        <button className="profile-NotificationNavigateToBtn">
                            <div className="profile-NotificationLongMsgContainerLoading">
                                <div className="profile-NotificationLongMsgDescLoading"/>
                                <div className="profile-NotificationLongMsgDescLoading" style={{"marginTop": "3px"}}/>
                                <div className="profile-NotificationLongMsgDescLoading" style={{"marginTop": "3px"}}/>
                            </div>
                        </button>
                    </div>
                </div> :
                <>
                    {props.price_desc === null || props.price_desc === undefined || props.asset_desc === null || props.asset_desc === undefined ?
                        null :
                        <div className="finulab-profileWatchlistWrapper">
                            <div className="finulab-profileWatchlistHeader">
                                <button className='profile-NotificationRightImgBtn' 
                                        onClick={props.type === "S" ? 
                                            () => navigate(`/stocks/S:-${props.asset_desc["symbol"]}`) : () => navigate(`/cryptos/C:-${props.asset_desc["symbol"]}`)
                                        }
                                    >       
                                    <img src={props.asset_desc["profileImage"]} alt="" className="profile-NotificationRightImg" />
                                </button>
                                <button className="finulab-profileWatchlistTickerBtn"
                                        style={{"backgroundColor": `${tickerBackground}`}}
                                        onClick={props.type === "S" ? 
                                            () => navigate(`/stocks/S:-${props.asset_desc["symbol"]}`) : () => navigate(`/cryptos/C:-${props.asset_desc["symbol"]}`)
                                        }
                                    >
                                    {props.asset_desc["symbol"]}
                                </button>
                                <div className="finulab-profileWatchlistChange"
                                        style={props.price_desc["change"] < 0 ?
                                            {"color": "rgba(223, 83, 68, 1)", "backgroundColor": "rgba(223, 83, 68, 0.2)"} :
                                            {"color": "rgba(223, 83, 68, 1)", "backgroundColor": "rgba(223, 83, 68, 0.2)"}
                                        }
                                    >
                                    {props.price_desc["change"] < 0 ?
                                        <SouthSharp className="finulab-profileWatchlistChangeIcon" /> :
                                        <NorthSharp className="finulab-profileWatchlistChangeIcon" />
                                    }
                                    {generalOpx.formatFigures.format(Math.abs(props.price_desc["changePerc"] * 100))}%
                                </div>
                            </div>
                            <div className="finulab-profileWatchlistNameBodyContainer">
                                <button className="profile-NotificationNavigateToBtn"
                                        onClick={props.type === "S" ? 
                                            () => navigate(`/stocks/S:-${props.asset_desc["symbol"]}`) : () => navigate(`/cryptos/C:-${props.asset_desc["symbol"]}`)
                                        }
                                    >
                                    <div className="profile-NotificationShortMsgContainer">
                                        {props.type === "S" ?
                                            <>
                                                {props.asset_desc["polygonIoName"].length < props.asset_desc["alphaVantageName"].length ?
                                                    `${props.asset_desc["polygonIoName"]}` : `${props.asset_desc["alphaVantageName"]}`
                                                }
                                            </> :
                                            <>
                                                {props.asset_desc["name"]}
                                            </>
                                        }&nbsp;&nbsp;&nbsp;-&nbsp;&nbsp;&nbsp;${generalOpx.formatFigures.format(props.price_desc["close"])}
                                    </div>
                                </button>
                                <button className="profile-NotificationNavigateToBtn"
                                        onClick={props.type === "S" ? 
                                            () => navigate(`/stocks/S:-${props.asset_desc["symbol"]}`) : () => navigate(`/cryptos/C:-${props.asset_desc["symbol"]}`)
                                        }
                                    >
                                    <div className="profile-NotificationLongMsgContainer">
                                        <div className="profile-NotificationLongMsgDesc">
                                            {props.asset_desc["description"]}
                                        </div>
                                    </div>
                                </button>
                            </div>
                        </div>
                    }
                </>
            }
        </>
    )
}