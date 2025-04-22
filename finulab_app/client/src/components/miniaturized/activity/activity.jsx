import './activity.css';
import '../portfolio/mini-portfolio.css';

import {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import {ExpandMoreSharp, LaunchSharp, RepeatSharp} from '@mui/icons-material';
import { format, fromUnixTime, getDate, getHours, getMinutes, getMonth, getTime, getYear } from 'date-fns';
import generalOpx from '../../../functions/generalFunctions';

export default function FinulabMarketActivity(props) {
    const navigate = useNavigate();
    
    const months = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
    const openLinkInNewTab = (reqKey) => {
        const url = `https://explorer.chainweb.com/mainnet/txdetail/${reqKey}`; 
        window.open(url, '_blank');
    }

    return(
        <div className="miniPortfolio-wrapper">
            <div className="miniaturized-predictionPurchaseHeader">
                <button className="large-homePageRightBarImgBtn"
                        onClick={() => navigate(`/market/outcome/${props.hist_desc["marketId"]}/${props.hist_desc["selection"]}`)}
                    >
                    {props.hist_desc["outcomeImage"] === "" ?
                        <img src={props.hist_desc["predictiveImage"]} alt="" className="miniaturized-predictionPurchaseHeaderImg"/> : 
                        <img src={props.hist_desc["outcomeImage"]} alt="" className="miniaturized-predictionPurchaseHeaderImg"/>
                    }
                </button>
                <div className="miniaturized-predictionPurchaseHeaderDescContainer">
                    <div className="miniaturized-predictionPurchaseHeaderChangeSelectionContainer">
                        {props.hist_desc["outcome"] === "" ?
                            null :
                            <span className="miniaturized-predictionPurchaseHeaderChangeSelectionOutcomeDesc">{props.hist_desc["outcome"]}</span>
                        }
                        {props.hist_desc["selection"] === "yes" ?
                            <button className="miniaturized-predictionPurchaseChangeSelectionBtn"
                                    style={
                                        {
                                            "marginLeft": props.hist_desc["outcome"] === "" ? "0px" : "10px",
                                            "color": "var(--primary-green-09)", 
                                            "backgroundColor": "rgba(46, 204, 113, 0.15)"
                                        }
                                    }
                                >
                                Yes <RepeatSharp className="miniaturized-predictionPurchaseChangeSelectionBtnIcon" style={{"color": "var(--primary-green-09)"}}/>
                            </button> :
                            <button className="miniaturized-predictionPurchaseChangeSelectionBtn"
                                    style={
                                        {
                                            "marginLeft": props.hist_desc["outcome"] === "" ? "0px" : "10px",
                                            "color": "var(--primary-red-09)", 
                                            "backgroundColor": "rgba(223, 83, 68, 0.15)"
                                        }
                                    }
                                >
                                No <RepeatSharp className="miniaturized-predictionPurchaseChangeSelectionBtnIcon" style={{"color": "var(--primary-red-09)"}}/>
                            </button>
                        }
                    </div>
                    <div className="miniaturized-predictionPurchaseHeaderDesc">{props.hist_desc["predictiveQuestion"]}</div>
                </div>
            </div>
            <div className="miniaturized-activitySummaryContainer"
                    style={props.f_viewPort === "small" ? 
                        {"marginLeft": "0px", "width": "100%", "minWidth": "100%", "maxWidth": "100%"} : {}
                    }
                >
                <div className="miniaturized-activityTopLine">
                    <div className="miniaturized-activityTopLineHead">
                        Chain&nbsp;&nbsp;
                        <span className='miniaturized-activityTopLineHeadDesc'>{props.hist_desc["chainId"]}</span>
                    </div>
                    <div className="miniaturized-activityTopLineHead">
                        Quantity&nbsp;&nbsp;
                        <span className='miniaturized-activityTopLineHeadDesc'>{generalOpx.formatFiguresCrypto.format(props.hist_desc["quantity"])} Shares</span>
                    </div>
                    <div className="miniaturized-activityTopLineHead">
                        <div className="miniaturized-activitySummarySectionDescFilled"
                                style={props.hist_desc["requestKey"] === "" ? {"color": "var(--primary-amber-10)", "backgroundColor": "rgba(246, 190, 118, 0.15)"} : {}}
                            >
                            {props.hist_desc["requestKey"] === "" ?
                                `Sent` : `Filled`
                            }
                        </div>
                    </div>
                </div>
                <div className="miniaturized-activityTopLine">
                    <div className="miniaturized-activityTopLineHead">
                        Fee&nbsp;&nbsp;
                        <span className='miniaturized-activityTopLineHeadDesc'>{generalOpx.formatFiguresCrypto.format(props.hist_desc["fee"])} FINUX</span>
                    </div>
                    <div className="miniaturized-activityTopLineHead">
                        Request Key&nbsp;&nbsp;
                        {props.hist_desc["requestKey"] === "" ?
                            <span className='miniaturized-activityTopLineHeadDesc'>Tx in Progress...</span> :
                            <button className="miniaturized-activitySummarySectionDescBtn"
                                    onClick={() => openLinkInNewTab(props.hist_desc["requestKey"])}
                                >
                                {props.hist_desc["requestKey"].slice(0, 3)}...
                                <LaunchSharp className="miniaturized-activitySummarySectionDescIcon"/>
                            </button>
                        }
                    </div>
                    <div className="miniaturized-activityTopLineHead">
                        <span className='miniaturized-activityTopLineHeadSecondaryDesc'>
                            {
                                `${months[getMonth(fromUnixTime(props.hist_desc["openedTimestamp"]))]} ${getDate(fromUnixTime(props.hist_desc["openedTimestamp"]))}, ${getYear(fromUnixTime(props.hist_desc["openedTimestamp"]))}`
                            }
                            {/*
                            at ${format(fromUnixTime(props.hist_desc["openedTimestamp"]), 'h:mm a')}
                            */}
                        </span>
                    </div>
                </div>
                <div className="miniaturized-activitySummarySummarySection" style={{"marginTop": "16px"}}>
                    <div className="miniaturized-activitySummarySectionHeader" style={{"fontWeight": "700"}}>Summary</div>
                    <div className="miniaturized-activitySummarySectionDesc" style={{"marginLeft": "0px"}}>
                        You&nbsp;
                        <span 
                                style={props.hist_desc["action"] === "buy" ? {"color": "var(--primary-green-09)", "fontWeight": "700"} : {"color": "var(--primary-red-09)", "fontWeight": "700"}}
                            >
                            {props.hist_desc["action"] === "buy" ?
                                "bought" : "sold"
                            }
                        </span>&nbsp;{props.hist_desc["outcome"] === "" ? `${props.hist_desc["selection"]}` : `${props.hist_desc["outcome"]}, ${props.hist_desc["selection"]}`} shares at {generalOpx.formatFiguresCrypto.format(props.hist_desc["averagePrice"])} FINUX, for a total of:&nbsp;
                        <span 
                                style={props.hist_desc["action"] === "buy" ? {"color": "var(--primary-red-09)", "fontWeight": "700"} : {"color": "var(--primary-green-09)", "fontWeight": "700"}}
                            >
                            {props.hist_desc["action"] === "buy" ?
                                `- ` : `+ `
                            }
                            {
                                generalOpx.formatFiguresCrypto.format((props.hist_desc["quantity"] * props.hist_desc["averagePrice"]) + props.hist_desc["fee"])
                            }
                        </span>.
                    </div>
                </div>
            </div>
        </div>
    )
}