import './activity.css';
import '../portfolio/mini-portfolio.css';

import {useSelector} from 'react-redux';
import {ContentCopy, LaunchSharp} from '@mui/icons-material';

import generalOpx from '../../../functions/generalFunctions';

import {selectUser} from '../../../reduxStore/user';
import {selectWalletDesc} from '../../../reduxStore/walletDesc'

export default function FinulabChains(props) {
    const user = useSelector(selectUser);
    const walletDesc = useSelector(selectWalletDesc);

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
                        <span className='miniaturized-activityTopLineHeadDesc'>{props.chainId}</span>
                    </div>
                </div>
                <div className="miniaturized-activityTopLine">
                    <div className="miniaturized-activityTopLineHeadV2">
                        Balance&nbsp;&nbsp;
                        <span className='miniaturized-activityTopLineHeadDesc'>
                            {walletDesc["balance"]["data"] === null || walletDesc["balance"]["data"] === undefined || !Array.isArray(walletDesc["balance"]["data"]) ?
                                `0.00 FINUX` : 
                                <>
                                    {walletDesc["balance"]["data"].some((desc) => desc[0] === `${props.chainId}`) ?
                                        <span 
                                                style={walletDesc["balance"]["data"].filter((desc) => desc[0] === `${props.chainId}`)[0][1] === 0 ?
                                                    {} : {"color": "var(--primary-green-09)", "fontWeight": "500"}
                                                }
                                            >
                                            {generalOpx.formatFiguresCrypto.format(walletDesc["balance"]["data"].filter((desc) => desc[0] === `${props.chainId}`)[0][1])} FINUX
                                        </span> : `0.00 FINUX`
                                    }
                                </>
                            }
                        </span>
                    </div>
                    <div className="miniaturized-activityTopLineHead"
                            style={{"display": "flex", "alignItems": "center"}}
                        >
                        Address&nbsp;&nbsp;
                        <button className="miniaturized-activitySummarySectionDescAddressBtn"
                                style={{"width": "calc(100% - 65px)", "minWidth": "calc(100% - 65px)", "maxWidth": "calc(100% - 65px)"}}
                            >
                            <span className="miniaturized-activitySummarySectionDescAddressBtnDesc" 
                                    style={{"width": "calc(100% - 12px)", "minWidth": "calc(100% - 12px)", "maxWidth": "calc(100% - 12px)"}}
                                >
                                {user.walletAddress}
                            </span>
                            <ContentCopy className="miniaturized-activitySummarySectionDescIcon"/>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    )
}