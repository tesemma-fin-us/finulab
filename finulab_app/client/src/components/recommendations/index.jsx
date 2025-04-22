import './index.css';

import React from 'react';
import {connect} from 'react-redux';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    Title,
    Legend,
    RadialLinearScale,
    ArcElement, 
    PieController
} from "chart.js";
import {PulseLoader} from 'react-spinners';
import {Pie, PolarArea} from 'react-chartjs-2';
import generalOpx from '../../functions/generalFunctions';
import {Troubleshoot, DriveFileRenameOutlineOutlined, AddTask} from '@mui/icons-material';

import {updateStockPageData} from '../../reduxStore/stockPageData';
import {addToRecommendations, removeFromRecommendations} from '../../reduxStore/recommendations';

const override = {
    display: "block",
    margin: "0 auto"
};

const mapStateToProps = state => (
    {
        stockPageData: state.stockPageData,
        recommendations: state.recommendations
    }
);

const mapDispatchToProps = (dispatch) => {
    return {
        updateStockPageData: (data) => dispatch(updateStockPageData(data)),
        addToRecommendations: (data) => dispatch(addToRecommendations(data)),
        removeFromRecommendations: (data) => dispatch(removeFromRecommendations(data))
    }
}

class RecommendationGraph extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            symbol: "",
            chart: null,
            loading: true,
            distinction: "",

            userRecommendation: "",
            plotPercentagesData: [],

            updateWidth: "95px",
            updateInnerTranslate: "0px",

            primaryTranslate: "0px",
            secondaryTranslate: "0px",
            recSubmissionLoading: [0, 0, 0]
        }
    }

    componentDidMount() {
        this.setRecommendationPlotState();
    }

    componentDidUpdate() {
        if(this.state.loading || this.state.plotPercentagesData === undefined || this.state.plotPercentagesData === null
            || this.state.plotPercentagesData.length === 0 || !this.arraysEqual(this.props.a_recommendations, this.state.plotPercentagesData)) {this.setRecommendationPlotState();}
    }

    arraysEqual = (a, b) => {
        if(a === b) return true;
        if(a == null || b == null) return false;
        if(a.length !== b.length) return false;

        for(let i = 0; i < a.length; i++) {
            if(a[i] !== b[i]) return false;
        }
        return true;
    }

    setRecommendationPlotState = async () => {
        let a_rec = {};
        if(this.props.recommendations["recommendations"].some(rec => rec.symbol === this.props.asset)) {
            a_rec = {...this.props.recommendations["recommendations"].filter(rec => rec.symbol === this.props.asset)[0]};
        }

        this.setState(
            {
                symbol: this.props.asset,
                distinction: this.props.distinction,
                loading: false,

                plotPercentagesData: this.props.a_recommendations,

                updateInnerTranslate: Object.keys(a_rec).length === 0 ? "0px" : a_rec["recommendation"] === "buy" ? "0px" : a_rec["recommendation"] === "hold" ? "calc(-59px - 23.25px)" : "calc(-2 * (59px + 23.25px))"
            }
        );
    }

    render() {
        ChartJS.register(
            CategoryScale,
            LinearScale,
            Title,
            Legend,
            RadialLinearScale,
            ArcElement,
            PieController
        );
        
        const data =  {
            labels: ["buy", "hold", "sell"],
            datasets: [{
                lable: ``,
                data: this.state.loading ? null : this.state.plotPercentagesData,
                backgroundColor: ["#2ecc71", "rgb(242, 127, 22)", "#df5344"],
                borderWidth: this.state.loading || this.state.plotPercentagesData === undefined || this.state.plotPercentagesData === null || this.state.plotPercentagesData.length === 0 ? null :
                    this.state.plotPercentagesData[0] === 0 || this.state.plotPercentagesData[1] === 0|| this.state.plotPercentagesData[2] === 0 ? 0 : 3,
                borderColor: "rgba(0, 0, 0, 0.85)"
            }]
        }

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            },
            hover: {
                mode: null
            },
            scales: {
                r: {
                    ticks: {
                        display: false
                    },
                    grid: {
                        display: false
                    }
                }
            }
        }

        const pie_options = {
            responsive: true,
            maintainAspectRatio: false,
            animation: {
                duration: 0
            },
            plugins: {
                legend: {
                    display: false
                },
                tooltip: {
                    enabled: false
                }
            },
            hover: {
                mode: null
            }
        }

        const updateRecommendationSlider = (type) => {
            this.state.updateWidth === "calc(100% - 10px)" ?
                this.setState(
                    {
                        updateWidth: "95px",
                        updateInnerTranslate: type === "buy" ? "0px" : type === "hold" ? "calc(-59px - 23.25px)" : "calc(-2 * (59px + 23.25px))",

                        recSubmissionLoading: [0, 0, 0]
                    }
                ) : 
                this.setState(
                    {
                        updateWidth: "calc(100% - 10px)",
                        updateInnerTranslate: "0px",

                        recSubmissionLoading: [0, 0, 0]
                    }
                );
        }

        const submitRecommendation = async (type, rec, from) => {
            if(type === "primary") {
                let recSubmissionLoadingFunction = [...this.state.recSubmissionLoading];
                let recSubmissionLoadingFinalized = [...this.state.recSubmissionLoading];
                let updateRecommendationArrTo = [...this.props.stockPageData["stockPageData"]["page"]["data"]["recommendations"]];
                if(rec === "buy") {
                    recSubmissionLoadingFunction[0] = 2;
                    recSubmissionLoadingFinalized[0] = 1;

                    updateRecommendationArrTo[0] = updateRecommendationArrTo[0] + 1;
                } else if(rec === "sell") {
                    recSubmissionLoadingFunction[2] = 2;
                    recSubmissionLoadingFinalized[2] = 1;

                    updateRecommendationArrTo[2] = updateRecommendationArrTo[2] + 1;
                } else if(rec === "hold") {
                    recSubmissionLoadingFunction[1] = 2;
                    recSubmissionLoadingFinalized[1] = 1;

                    updateRecommendationArrTo[1] = updateRecommendationArrTo[1] + 1;
                }
                this.setState(
                    {
                        recSubmissionLoading: recSubmissionLoadingFunction
                    }
                );

                await generalOpx.axiosInstance.post(`/users/modify-recommendation`, 
                    {
                        "rec": rec,
                        "symbol": this.state.symbol,
                        "distinction": this.state.distinction
                    }
                ).then(
                    (response) => {
                        this.setState(
                            {
                                primaryTranslate: "calc(100% + 10px)",
                                secondaryTranslate: "calc(100% + 10px)",
                                recSubmissionLoading: recSubmissionLoadingFinalized
                            }
                        );

                        setTimeout(() => {
                            let a_rec = {"symbol": this.state.symbol, "recommendation": rec};
                            if(this.props.recommendations["recommendations"].some(u_rec => u_rec.symbol === this.state.symbol)) {
                                this.props.removeFromRecommendations(this.state.symbol);
                                this.props.addToRecommendations(a_rec);
                            } else {
                                this.props.addToRecommendations(a_rec);
                            }

                            let pageDataFunction = {...this.props.stockPageData["stockPageData"]["page"]["data"], "recommendations": updateRecommendationArrTo}
                            this.props.updateStockPageData({"data": pageDataFunction, "dataLoading": false});

                            this.setState(
                                {
                                    updateInnerTranslate: rec === "buy" ? "0px" : rec === "hold" ? "calc(-59px - 23.25px)" : "calc(-2 * (59px + 23.25px))",

                                    primaryTranslate: "calc(100% + 10px)",
                                    secondaryTranslate: "0px",
                                    recSubmissionLoading: [0, 0, 0]
                                }
                            );
                        }, 850);
                    }
                ).catch(
                    () => {
                        this.setState(
                            {
                                primaryTranslate: "calc(100% + 10px)",
                                secondaryTranslate: "calc(100% + 10px)",
                                recSubmissionLoading: recSubmissionLoadingFinalized
                            }
                        );

                        setTimeout(() => {
                            let a_rec = {"symbol": this.state.symbol, "recommendation": rec};
                            if(this.props.recommendations["recommendations"].some(u_rec => u_rec.symbol === this.state.symbol)) {
                                this.props.removeFromRecommendations(this.state.symbol);
                                this.props.addToRecommendations(a_rec);
                            } else {
                                this.props.addToRecommendations(a_rec);
                            }

                            let pageDataFunction = {...this.props.stockPageData["stockPageData"]["page"]["data"], "recommendations": updateRecommendationArrTo}
                            this.props.updateStockPageData({"data": pageDataFunction, "dataLoading": false});

                            this.setState(
                                {
                                    updateInnerTranslate: rec === "buy" ? "0px" : rec === "hold" ? "calc(-59px - 23.25px)" : "calc(-2 * (59px + 23.25px))",

                                    primaryTranslate: "calc(100% + 10px)",
                                    secondaryTranslate: "0px",
                                    recSubmissionLoading: [0, 0, 0]
                                }
                            );
                        }, 750);
                    }
                );
            } else if(type === "secondary") {
                if(rec === from) {
                    updateRecommendationSlider(rec);
                } else {
                    let recSubmissionLoadingFunction = [...this.state.recSubmissionLoading];
                    let recSubmissionLoadingFinalized = [...this.state.recSubmissionLoading];
                    let updateRecommendationArrTo = [...this.props.stockPageData["stockPageData"]["page"]["data"]["recommendations"]];
                    if(rec === "buy") {
                        recSubmissionLoadingFunction[0] = 2;
                        recSubmissionLoadingFinalized[0] = 1;

                        updateRecommendationArrTo[0] = updateRecommendationArrTo[0] + 1;
                    } else if(rec === "sell") {
                        recSubmissionLoadingFunction[2] = 2;
                        recSubmissionLoadingFinalized[2] = 1;

                        updateRecommendationArrTo[2] = updateRecommendationArrTo[2] + 1;
                    } else if(rec === "hold") {
                        recSubmissionLoadingFunction[1] = 2;
                        recSubmissionLoadingFinalized[1] = 1;

                        updateRecommendationArrTo[1] = updateRecommendationArrTo[1] + 1;
                    }

                    if(from === "buy") {
                        updateRecommendationArrTo[0] = updateRecommendationArrTo[0] - 1;
                    } else if(from === "sell") {
                        updateRecommendationArrTo[2] = updateRecommendationArrTo[2] - 1;
                    } else if(from === "hold") {
                        updateRecommendationArrTo[1] = updateRecommendationArrTo[1] - 1;
                    }

                    this.setState(
                        {
                            recSubmissionLoading: recSubmissionLoadingFunction
                        }
                    );

                    await generalOpx.axiosInstance.post(`/users/modify-recommendation`, 
                        {
                            "rec": rec,
                            "symbol": this.state.symbol,
                            "distinction": this.state.distinction
                        }
                    ).then(
                        () => {
                            this.setState(
                                {
                                    recSubmissionLoading: recSubmissionLoadingFinalized
                                }
                            );

                            let a_rec = {"symbol": this.state.symbol, "recommendation": rec};
                            if(this.props.recommendations["recommendations"].some(u_rec => u_rec.symbol === this.state.symbol)) {
                                this.props.removeFromRecommendations(this.state.symbol);
                                this.props.addToRecommendations(a_rec);
                            } else {
                                this.props.addToRecommendations(a_rec);
                            }

                            let pageDataFunction = {...this.props.stockPageData["stockPageData"]["page"]["data"], "recommendations": updateRecommendationArrTo}
                            this.props.updateStockPageData({"data": pageDataFunction, "dataLoading": false});

                            updateRecommendationSlider(rec);
                        }
                    ).catch(
                        () => {
                            this.setState(
                                {
                                    recSubmissionLoading: recSubmissionLoadingFinalized
                                }
                            );

                            let a_rec = {"symbol": this.state.symbol, "recommendation": rec};
                            if(this.props.recommendations["recommendations"].some(u_rec => u_rec.symbol === this.state.symbol)) {
                                this.props.removeFromRecommendations(this.state.symbol);
                                this.props.addToRecommendations(a_rec);
                            } else {
                                this.props.addToRecommendations(a_rec);
                            }

                            let pageDataFunction = {...this.props.stockPageData["stockPageData"]["page"]["data"], "recommendations": updateRecommendationArrTo}
                            this.props.updateStockPageData({"data": pageDataFunction, "dataLoading": false});

                            updateRecommendationSlider(rec);
                        }
                    )
                }
            }
        }

        return(
            <div className="large-stocksPageMoreDataRecommendationContainer">
                <div className="large-stocksPageMoreDataAboutTitle" >
                    Recommendation
                </div>
                <div className="large-stocksPageMoreDataAboutRecommendationContainer" style={{"marginTop": "10px"}}>
                    <div className="recommendation-GraphWrapper">
                        {this.state.loading || this.state.plotPercentagesData === undefined || this.state.plotPercentagesData === null
                            || this.state.plotPercentagesData.length === 0 ?
                            <div className="recommendation-GraphUpdateOptnsContainerLoading"/> : 
                            <>
                                {this.props.recommendations["recommendations"].some(rec => rec.symbol === this.state.symbol) ?
                                    <div className="recommendation-GraphUpdateOptnsContainer"
                                            style={{"transform": `translateX(${this.state.secondaryTranslate})`}}
                                        >
                                        <div className="recommendation-GraphUpdateOptnsInnerContainer"
                                                style={{"width": `${this.state.updateWidth}`, "minWidth": `${this.state.updateWidth}`, "maxWidth": `${this.state.updateWidth}`}}
                                            >
                                            <button className="recommendation-GraphUpdateOptnsViewBtn"
                                                    onClick={() => updateRecommendationSlider(this.props.recommendations["recommendations"].filter(rec => rec.symbol === this.state.symbol)[0]["recommendation"])}
                                                >
                                                <DriveFileRenameOutlineOutlined className="recommendation-GraphUpdateOptnsViewBtnIcon"/>
                                            </button>
                                            <div className="recommendation-GraphUpdateOptnsViewSeperator"/>
                                            <div className="recommendation-GraphUpdateOptnsActButnsContainer">
                                                <div className="recommendation-GraphUpdateOptnsActButnsInnerContainer"
                                                        style={{"transform": `translateX(${this.state.updateInnerTranslate})`}}
                                                    >
                                                    <button className="recommendation-GraphOptnsBuyBtn"
                                                            onClick={() => submitRecommendation("secondary", "buy", this.props.recommendations["recommendations"].filter(rec => rec.symbol === this.state.symbol)[0]["recommendation"])}
                                                            style={{"marginRight": "23.25px", "height": "18px", "minHeight": "18px", "maxHeight": "18px", "fontSize": "0.8rem"}}
                                                        >
                                                        Buy
                                                    </button>
                                                    <button className="recommendation-GraphOptnsHoldBtn"
                                                            onClick={() => submitRecommendation("secondary", "hold", this.props.recommendations["recommendations"].filter(rec => rec.symbol === this.state.symbol)[0]["recommendation"])}
                                                            style={{"marginRight": "23.25px", "height": "18px", "minHeight": "18px", "maxHeight": "18px", "fontSize": "0.8rem"}}
                                                        >
                                                        Hold
                                                    </button>
                                                    <button className="recommendation-GraphOptnsSellBtn"
                                                            onClick={() => submitRecommendation("secondary", "sell", this.props.recommendations["recommendations"].filter(rec => rec.symbol === this.state.symbol)[0]["recommendation"])}
                                                            style={{"height": "18px", "minHeight": "18px", "maxHeight": "18px", "fontSize": "0.8rem"}}
                                                        >
                                                        Sell
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    </div> :
                                    <div className="recommendation-GraphOptnsContainer"
                                            style={{"transform": `translateX(${this.state.primaryTranslate})`}}
                                        >
                                        <button className="recommendation-GraphOptnsBuyBtn"
                                                onClick={() => submitRecommendation("primary", "buy", "")}
                                                style={this.state.recSubmissionLoading[0] === 0 ?
                                                    {} : {"backgroundColor": "var(--primary-green-09)"}
                                                }
                                            >
                                            {this.state.recSubmissionLoading[0] === 0 ?
                                                `Buy` : 
                                                <>
                                                    {this.state.recSubmissionLoading[0] === 1  ?
                                                        <AddTask className='recommendation-GraphOptnsBtnIcon'/> : 
                                                        <PulseLoader
                                                            color='black'
                                                            cssOverride={override}
                                                            loading={true}
                                                            size={5}
                                                        />
                                                    }
                                                </>
                                            }
                                        </button>
                                        <button className="recommendation-GraphOptnsHoldBtn"
                                                onClick={() => submitRecommendation("primary", "hold", "")}
                                                style={this.state.recSubmissionLoading[1] === 0 ?
                                                    {} : {"backgroundColor": "var(--primary-amber-09)"}
                                                }
                                            >
                                            {this.state.recSubmissionLoading[1] === 0 ?
                                                `Hold` : 
                                                <>
                                                    {this.state.recSubmissionLoading[1] === 1  ?
                                                        <AddTask className='recommendation-GraphOptnsBtnIcon'/> : 
                                                        <PulseLoader
                                                            color='black'
                                                            cssOverride={override}
                                                            loading={true}
                                                            size={5}
                                                        />
                                                    }
                                                </>
                                            }
                                        </button>
                                        <button className="recommendation-GraphOptnsSellBtn"
                                                onClick={() => submitRecommendation("primary", "sell", "")}
                                                style={this.state.recSubmissionLoading[2] === 0 ?
                                                    {} : {"backgroundColor": "var(--primary-red-09)"}
                                                }
                                            >
                                            {this.state.recSubmissionLoading[2] === 0 ?
                                                `Sell` : 
                                                <>
                                                    {this.state.recSubmissionLoading[2] === 1  ?
                                                        <AddTask className='recommendation-GraphOptnsBtnIcon'/> : 
                                                        <PulseLoader
                                                            color='black'
                                                            cssOverride={override}
                                                            loading={true}
                                                            size={5}
                                                        />
                                                    }
                                                </>
                                            }
                                        </button>
                                    </div>
                                }
                            </>
                        }
                        {!(this.state.loading || this.state.plotPercentagesData === undefined || this.state.plotPercentagesData === null
                            || this.state.plotPercentagesData.length === 0) && (this.state.plotPercentagesData.reduce((accumulator, currentValue) => accumulator + currentValue, 0) === 0) ?
                            <div className="recommendation-GraphContainer">
                                <div className="recommendation-GraphInnerContainer">
                                    <div className="recommendation-GraphInnerContainerNoData">
                                        <Troubleshoot className="recommendation-GraphInnerContainerNoDataIcon"/>
                                        No recommendations yet, be the first
                                    </div>
                                </div>
                            </div> : 
                            <div className="recommendation-GraphContainer">
                                {this.state.loading || this.state.plotPercentagesData === undefined || this.state.plotPercentagesData === null
                                    || this.state.plotPercentagesData.length === 0 ?
                                    <span className="recommendation-GraphDescLoading"/>: 
                                    <span className="recommendation-GraphDesc">
                                        {`Based on ${generalOpx.formatLargeFigures(this.state.plotPercentagesData.reduce((accumulator, currentValue) => accumulator + currentValue, 0), 2)} Responses:`}
                                    </span>
                                }
                                <div className="recommendation-GraphInnerContainer">
                                    {this.state.loading || this.state.plotPercentagesData === undefined || this.state.plotPercentagesData === null
                                        || this.state.plotPercentagesData.length === 0 ?
                                        <div className="recommendation-GraphFiguresContainer">
                                            <div className="recommendation-GraphFiguresLineLoading"/>
                                            <div className="recommendation-GraphFiguresLineLoading"/>
                                            <div className="recommendation-GraphFiguresLineLoading"/>
                                        </div> : 
                                        <div className="recommendation-GraphFiguresContainer">
                                            <div className="recommendation-GraphFiguresLine">
                                                buy
                                                <span style={{"marginLeft": "20px","color": "var(--primary-green-09)"}}>
                                                    {generalOpx.formatFigures.format((this.state.plotPercentagesData[0] / this.state.plotPercentagesData.reduce((accumulator, currentValue) => accumulator + currentValue, 0)) * 100)}%
                                                </span>
                                            </div>
                                            <div className="recommendation-GraphFiguresLine">
                                                hold
                                                <span style={{"marginLeft": "20px","color": "var(--primary-amber-09)"}}>
                                                    {generalOpx.formatFigures.format((this.state.plotPercentagesData[1] / this.state.plotPercentagesData.reduce((accumulator, currentValue) => accumulator + currentValue, 0)) * 100)}%
                                                </span>
                                            </div>
                                            <div className="recommendation-GraphFiguresLine">
                                                sell
                                                <span style={{"marginLeft": "20px","color": "var(--primary-red-09)"}}>
                                                    {generalOpx.formatFigures.format((this.state.plotPercentagesData[2] / this.state.plotPercentagesData.reduce((accumulator, currentValue) => accumulator + currentValue, 0)) * 100)}%
                                                </span>
                                            </div>
                                        </div>
                                    }
                                    {this.state.loading || this.state.plotPercentagesData === undefined || this.state.plotPercentagesData === null
                                        || this.state.plotPercentagesData.length === 0 ?
                                        <div className="recommendation-GraphPieContainer">
                                            <div className="finulab-chartLoading">
                                                <div className="finulab-chartLoadingSpinner"/>
                                                <img src="/assets/Finulab_Icon.png" alt="" className="finulab-chartLoadingImg" />
                                            </div>
                                        </div> :
                                        <div className="recommendation-GraphPieContainer">
                                            {this.state.plotPercentagesData[0] === 0 || this.state.plotPercentagesData[1] === 0|| this.state.plotPercentagesData[2] === 0 ?
                                                <Pie data={data} options={pie_options}
                                                    key={`rec-graph-${this.state.plotPercentagesData[0]}${this.state.plotPercentagesData[1]}${this.state.plotPercentagesData[2]}`}
                                                /> : 
                                                <PolarArea data={data} options={options}
                                                    key={`rec-graph-${this.state.plotPercentagesData[0]}${this.state.plotPercentagesData[1]}${this.state.plotPercentagesData[2]}`}
                                                />
                                            }
                                        </div>
                                    }
                                </div>
                            </div>
                        }
                    </div>
                </div>
            </div>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(RecommendationGraph);