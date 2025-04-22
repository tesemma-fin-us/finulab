import './activity.css';
import '../portfolio/mini-portfolio.css';

import {useSelector} from 'react-redux';
import {LaunchSharp} from '@mui/icons-material';

import generalOpx from '../../../functions/generalFunctions';

import {selectUser} from '../../../reduxStore/user';

export default function FinulabTxs(props) {
    const user = useSelector(selectUser);
    const openLinkInNewTab = (reqKey) => {
        const url = `https://explorer.chainweb.com/mainnet/txdetail/${reqKey}`; 
        window.open(url, '_blank');
    }

    return(
        <div className="miniPortfolio-wrapper">
            <div className="miniaturized-txsSummaryContainer">
                <div className="miniaturized-activityTopLine">
                    <div className="miniaturized-activityTopLineHead">
                        Chain&nbsp;&nbsp;
                        <span className='miniaturized-activityTopLineHeadDesc'>{props.tx_desc["chain"]}</span>
                    </div>
                    <div className="miniaturized-activityTopLineHead">
                        <span className='miniaturized-activityTopLineHeadDesc' style={{"fontWeight": "500"}}>
                            {user.walletAddress === props.tx_desc["fromAccount"] ? 
                                "Sent" : "Received"
                            }
                        </span>
                    </div>
                </div>
                <div className="miniaturized-activityTopLine">
                    <div className="miniaturized-activityTopLineHead">
                        From&nbsp;&nbsp;
                        <span className='miniaturized-activityTopLineHeadDesc'>
                            {props.tx_desc["fromAccount"].slice(0, 7) === "finulab" ? 
                                "Finulab" :
                                <>
                                    {props.tx_desc["fromAccount"].slice(0, 4)}...{props.tx_desc["fromAccount"].slice(-4)}
                                </>
                            }
                        </span>
                    </div>
                    <div className="miniaturized-activityTopLineHead">
                        To&nbsp;&nbsp;
                        <span className='miniaturized-activityTopLineHeadDesc'>
                            {props.tx_desc["toAccount"].slice(0, 7) === "finulab" ? 
                                "Finulab" :
                                <>
                                    {props.tx_desc["toAccount"].slice(0, 4)}...{props.tx_desc["toAccount"].slice(-4)}
                                </>
                            }
                        </span>
                    </div>
                    <div className="miniaturized-activityTopLineHead">
                        <div className="miniaturized-activitySummarySectionDescFilled">Success</div>
                    </div>
                </div>
                <div className="miniaturized-activityTopLine">
                    <div className="miniaturized-activityTopLineHead">
                        Amount&nbsp;&nbsp;
                        <span className='miniaturized-activityTopLineHeadDesc'
                                style={user.walletAddress === props.tx_desc["fromAccount"] ? 
                                    {"color": "var(--primary-red-09)"} : {"color": "var(--primary-green-09)"}
                                }
                            >
                            {generalOpx.formatFiguresCrypto.format(Number(props.tx_desc["amount"]))} FINUX
                        </span>
                    </div>
                    <div className="miniaturized-activityTopLineHead">
                        Request Key&nbsp;&nbsp;
                        <button className="miniaturized-activitySummarySectionDescBtn"
                                onClick={() => openLinkInNewTab(props.tx_desc["requestKey"])}
                            >
                            {props.tx_desc["requestKey"].slice(0, 3)}...
                            <LaunchSharp className="miniaturized-activitySummarySectionDescIcon"/>
                        </button>
                    </div>
                    <div className="miniaturized-activityTopLineHead">
                        <span className='miniaturized-activityTopLineHeadSecondaryDesc'>
                            {
                                new Date(props.tx_desc["blockTime"]).toLocaleString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
                            }
                            {/* hour: 'numeric', minute: 'numeric', hour12: true */}
                        </span>
                    </div>
                </div>
            </div>
        </div>
    )
}