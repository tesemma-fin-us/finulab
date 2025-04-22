import './mini-portfolio.css';
import '../../miniaturized/prediction/mini-prediction.css';

import {format} from 'timeago.js';
import {add, getUnixTime} from 'date-fns';
import {useNavigate} from 'react-router-dom';
import {useState, useEffect, useMemo} from 'react';
import {ShoppingBasket, Schedule, RepeatSharp, GavelSharp, CheckSharp, CloseSharp, TrendingUp, TrendingDown, EmojiEventsSharp, EmojiEmotionsSharp} from '@mui/icons-material';

import PortfolioChart from '../../portfolioChart/portfolioChart';
import generalOpx from '../../../functions/generalFunctions';

export default function MiniPortfolio(props) {
    const navigate = useNavigate();

    const graphAdjustment = 50;
    const [plotLoding, setPlotLoading] = useState(true);
    const [plot, setPlot] = useState({"todayPerc": 0, "todayShift": 0, "labels": [], "plot": []});

    useMemo(() => {
        if(props.status === "open") {
            if(plot.labels.length === 0) {
                if(!(props.priceHistory === null || props.priceHistory === undefined)) {
                    if(props.priceHistory.length !== 0) {
                        const now = new Date();
                        const nowUnix = getUnixTime(now);
                        const yesterday = add(now, {"days": -1});
                        const yesterdayUnix = getUnixTime(yesterday);
                        const interval = (nowUnix - yesterdayUnix) / props.priceHistory[0]["data"].length;
    
                        let labelsFunction = [], plotFunction = [];
                        for(let i = 0; i < props.priceHistory[0]["data"].length; i++) {
                            labelsFunction.push(yesterdayUnix + (interval * i));
                            plotFunction.push(props.priceHistory[0]["data"][i]["c"]);
                        }
    
                        let todayPerc, todayShift;
                        isNaN((plotFunction.at(-1) - plotFunction[0]) / plotFunction[0]) ? todayPerc = 0 : todayPerc = (plotFunction.at(-1) - plotFunction[0]) / plotFunction[0];
                        isNaN((plotFunction.at(-1) - plotFunction[0]) / plotFunction[0]) ? 
                            todayShift = 0 : props.type === "yes" ? todayShift = props.holding["yesQuantity"] * (plotFunction.at(-1) - plotFunction[0]): todayShift = props.holding["noQuantity"] * (plotFunction.at(-1) - plotFunction[0])
                        
                        const lastPoint  = labelsFunction.at(-1);                
                        for(let j = 0; j < graphAdjustment; j++) {
                            labelsFunction.push(lastPoint + (interval * (j + 1)));
                            plotFunction.push(null);
                        }
                        
                        setPlot(
                            {
                                "todayPerc": todayPerc,
                                "todayShift": todayShift,
                                "labels": labelsFunction,
                                "plot": plotFunction
                            }
                        );
                        setPlotLoading(false);
                    }
                }
            }
        }
    }, [props]);

    const [viewGainsType, setViewGainsType] = useState("perc");
    const viewGainsTypeToggle = () => {
        viewGainsType === "perc" ? setViewGainsType("shift") : setViewGainsType("perc");
    }
    
    return(
        <div className="miniPortfolio-wrapper">
            <div className="miniaturized-predictionPurchaseHeader">
                {props.loading ?
                    <div className="miniPortfolio-predictionPurchaseHeaderImgLoading"/> :
                    <button className="large-homePageRightBarImgBtn"
                            onClick={() => navigate(`/market/outcome/${props.holding["marketId"]}/${props.type}`)}
                        >
                        {props.holding["outcome"] === "" ? 
                            <img src={props.holding["predictiveImage"]} alt="" className="miniaturized-predictionPurchaseHeaderImg"/> :
                            <img src={props.holding["outcomeImage"]} alt="" className="miniaturized-predictionPurchaseHeaderImg"/>
                        }
                    </button>
                }
                <div className="miniaturized-predictionPurchaseHeaderDescContainer">
                    <div className="miniaturized-predictionPurchaseHeaderChangeSelectionContainer">
                        {props.loading ?
                            <div className="miniPortfolio-predictionTopLineLoading"/> :
                            <>
                                {props.holding["outcome"] === "" ? 
                                    null : 
                                    <span className="miniaturized-predictionPurchaseHeaderChangeSelectionOutcomeDesc">{props.holding["outcome"]}</span>
                                }
                            </>
                        }
                        {props.loading ?
                            null : 
                            <>
                                {props.type === "yes" ? 
                                    <button className="miniaturized-predictionPurchaseChangeSelectionBtn"
                                            style={
                                                {
                                                    "marginLeft": props.holding["outcome"] === "" ? "0px" : "10px",
                                                    "color": "var(--primary-green-09)", 
                                                    "backgroundColor": "rgba(46, 204, 113, 0.15)"
                                                }
                                            }
                                            onClick={() => navigate(`/market/outcome/${props.holding["marketId"]}/${props.type}`)}
                                        >
                                        Yes <RepeatSharp className="miniaturized-predictionPurchaseChangeSelectionBtnIcon" style={{"color": "var(--primary-green-09)"}}/>
                                    </button> : null
                                }
                                {props.type === "no" ?
                                    <button className="miniaturized-predictionPurchaseChangeSelectionBtn"
                                            style={
                                                {
                                                    "marginLeft": props.holding["outcome"] === "" ? "0px" : "10px",
                                                    "color": "var(--primary-red-09)", 
                                                    "backgroundColor": "rgba(223, 83, 68, 0.15)"
                                                }
                                            }
                                            onClick={() => navigate(`/market/outcome/${props.holding["marketId"]}/${props.type}`)}
                                        >
                                        No <RepeatSharp className="miniaturized-predictionPurchaseChangeSelectionBtnIcon" style={{"color": "var(--primary-red-09)"}}/>
                                    </button> : null
                                }
                            </>
                        }
                    </div>
                    {props.loading ?
                        <div className="miniPortfolio-predictionHeaderDescQuestionLoading"/> :
                        <div className="miniaturized-predictionPurchaseHeaderDesc">
                            <button className="large-homePageRightBarImgBtn"
                                    style={{"display": "block", "width": "100%", "minWidth": "100%", "maxWidth": "100%", "whiteSpace": "nowrap", "textOverflow": "ellipsis", "overflow": "hidden", "font": "inherit",}}
                                    onClick={() => navigate(`/market/outcome/${props.holding["marketId"]}/${props.type}`)}
                                >
                                {props.holding["predictiveQuestion"]}
                            </button>
                        </div>
                    }
                </div>
            </div>
            
            <div className="miniPortfolio-body"
                    style={props.f_viewPort === "small" ? 
                        {"marginLeft": "0px", "width": "100%", "minWidth": "100%", "maxWidth": "100%"} : {}
                    }
                >
                <div className="miniPorfolio-bodyChartContainer">
                    {props.status === "closed" ?
                        <div className="miniPortfolio-closedResolutionContainer">
                            
                            <div className="miniPortfolio-closedResultionOutcomeContainer">
                                {props.type === props.holding["resolutionOutcome"] ?
                                    <EmojiEventsSharp className="miniPortfolio-closedResolutionImg" /> : <EmojiEmotionsSharp className="miniPortfolio-closedResolutionImgV2" />
                                }
                                <div className="miniPortfolio-closedResolutionDescContainer">
                                    <div className="mini-Portfolio-closedResultionBodyDesc">
                                        <div className="mini-Portfolio-closedResultionBodyDesc" style={{"margin": "0", "color": "var(--primary-bg-05)"}}>
                                            Resolution: <span style={{"color": "var(--primary-bg-01)"}}>
                                                {props.holding["resolutionOutcome"] === "yes" ?
                                                    `Yes` : `No`
                                                }
                                            </span>
                                        </div>
                                        {props.type === props.holding["resolutionOutcome"] ?
                                            `Congratulations, you won!` : `You'll get them next time champ!`
                                        }
                                    </div>
                                </div>
                            </div>
                        </div> : 
                        <>
                            {plotLoding || props.loading ?
                                <div className="miniPortfolio-bodyChartLoading"/> : 
                                <button className="large-homePageRightBarImgBtn"
                                        onClick={() => navigate(`/market/outcome/${props.holding["marketId"]}/${props.type}`)}
                                        style={{"width": "100%", "minWidth": "100%", "maxWidth": "100%"}}
                                    >
                                    <PortfolioChart labels={plot.labels} plot={plot.plot} loading={plotLoding} graphAdjustment={graphAdjustment} />
                                </button>
                            }
                        </>
                    }
                </div>
                <div className="miniPortfolio-bodyReturnContainer">
                    {props.status === "closed" ?
                        <>
                            <button className="miniPortfolio-bodyReturnBtn"
                                    onClick={() => viewGainsTypeToggle()}
                                    style={props.type === props.holding["resolutionOutcome"] ? 
                                        {"border": "solid 1px var(--primary-green-09)", "color": "var(--primary-green-09)"} :
                                        {"border": "solid 1px var(--primary-red-09)", "color": "var(--primary-red-09)"}
                                    }
                                >
                                {viewGainsType !== "perc" ?
                                    <>
                                        {props.type === "yes" ?
                                            <>
                                                {props.holding["resolutionOutcome"] === "yes" ?
                                                    `${generalOpx.formatFigures.format(Math.abs(((1 - props.holding["yesAveragePrice"]) / props.holding["yesAveragePrice"]) * 100))}%` :
                                                    `${generalOpx.formatFigures.format(Math.abs(((0 - props.holding["yesAveragePrice"]) / props.holding["yesAveragePrice"]) * 100))}%`
                                                }
                                            </> : 
                                            <>
                                                {props.holding["resolutionOutcome"] === "no" ?
                                                    `${generalOpx.formatFigures.format(Math.abs(((1 - props.holding["noAveragePrice"]) / props.holding["noAveragePrice"]) * 100))}%` :
                                                    `${generalOpx.formatFigures.format(Math.abs(((0 - props.holding["noAveragePrice"]) / props.holding["noAveragePrice"]) * 100))}%`
                                                }
                                            </>
                                        }
                                    </> : 
                                    <>
                                        {props.type === "yes" ?
                                            <>
                                                {props.holding["resolutionOutcome"] === "yes" ?
                                                    `${generalOpx.formatFigures.format((props.holding["yesQuantity"] * (1 - props.holding["yesAveragePrice"])))}` :
                                                    `${generalOpx.formatFigures.format((props.holding["yesQuantity"] * (0 - props.holding["yesAveragePrice"])))}`
                                                }
                                            </> : 
                                            <>
                                                {props.holding["resolutionOutcome"] === "no" ?
                                                    `${generalOpx.formatFigures.format((props.holding["noQuantity"] * (1 - props.holding["noAveragePrice"])))}` :
                                                    `${generalOpx.formatFigures.format((props.holding["noQuantity"] * (0 - props.holding["noAveragePrice"])))}`
                                                }
                                            </>
                                        }
                                    </>
                                }
                            </button>
                            <span className="miniPortfolio-headerOwnershipDesc">
                                {viewGainsType !== "perc" ?
                                    `Gain` : `Earnings`
                                }
                            </span>
                        </> : 
                        <>
                            {plotLoding || props.loading ?
                                <>
                                    <div className="miniPortfolio-bodyReturnBtnLoading"/>
                                    <span className="miniPortfolio-headerOwnershipDescLoading"></span>
                                </> : 
                                <>
                                    <button className="miniPortfolio-bodyReturnBtn"
                                            onClick={() => viewGainsTypeToggle()}
                                            style={plot.todayPerc >= 0 ? 
                                                {"border": "solid 1px var(--primary-green-09)", "color": "var(--primary-green-09)"} :
                                                {"border": "solid 1px var(--primary-red-09)", "color": "var(--primary-red-09)"}
                                            }
                                        >
                                        {viewGainsType === "perc" ?
                                            <>
                                                {generalOpx.formatFigures.format(plot.todayPerc * 100)}%
                                            </> : 
                                            <>
                                                {props.type === "yes" ?
                                                    `${generalOpx.formatFigures.format(props.holding["yesQuantity"] * plot.plot.at(0 - graphAdjustment - 1))}` :
                                                    `${generalOpx.formatFigures.format(props.holding["noQuantity"] * plot.plot.at(0 - graphAdjustment - 1))}`
                                                }
                                            </>
                                        }
                                    </button>
                                    <span className="miniPortfolio-headerOwnershipDesc">
                                        {viewGainsType === "perc" ?
                                            <>
                                                {props.type === "yes" ?
                                                    <>
                                                        {generalOpx.formatLargeFigures(props.holding["yesQuantity"], 2)}&nbsp;Shares
                                                    </> : 
                                                    <>
                                                        {generalOpx.formatLargeFigures(props.holding["noQuantity"], 2)}&nbsp;Shares
                                                    </>
                                                }
                                            </> : `Equity`
                                        }
                                    </span>
                                </>
                            }
                        </>
                    }
                </div>
            </div>

            {/*
            <div className="miniPortfolio-furterDescContainer">
                <div className="miniPortfolio-topLine">
                    {detailsLoading || props.loading ?
                        <div className="miniPortfolio-topLineLoading"/> : 
                        <>
                            {details.status === "Live" ?
                                <>
                                    <div className="miniPortfolio-topLineBlinker"/>
                                    <span>{details.status}</span>
                                    <span style={{"marginLeft": "auto"}}>{format(props.holding["predictionEndTimestamp"] * 1000)}</span>
                                </> : 
                                <>
                                    <GavelSharp className="miniPortfolio-topLineGavelIcon"/>
                                    <span>{details.status}</span>
                                </>
                            }
                        </>
                    }
                </div>
                <div className="miniPortfolio-underline">
                    {detailsLoading || props.loading ?
                        null :
                        <div className="miniPortfolio-underlineFill"
                            style={details.liveRatio >= 1 ? 
                                {
                                    "width": "100%",
                                    "minWidth": "100%",
                                    "maxWidth": "100%"
                                } : 
                                {
                                    "width": `${details.liveRatio * 100}%`,
                                    "minWidth": `${details.liveRatio * 100}%`,
                                    "maxWidth": `${details.liveRatio * 100}%`
                                }
                            }
                        />
                    }
                </div>
            </div>
            */}

        </div>
    )
}