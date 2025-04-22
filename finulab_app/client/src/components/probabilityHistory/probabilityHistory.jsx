import './probabilityHistory.css';
import '../balanceChart/balanceChart.css';

import React from 'react';
import {connect} from 'react-redux';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    Title,
    Tooltip,
    Legend, 
    LineController,
    LineElement,
    PointElement,
    Filler,
    TimeScale
} from "chart.js";
import 'chartjs-adapter-date-fns';
import {Line} from 'react-chartjs-2';
import {BarChart, DoDisturbAlt, Group, TaskAlt, Troubleshoot, Water} from '@mui/icons-material';
import annotationPlugin from 'chartjs-plugin-annotation';
import {add, getUnixTime, fromUnixTime, getMonth, getDate, format} from 'date-fns';

import generalOpx from '../../functions/generalFunctions';
import {setPredictionPlotData, addPredictionPlotData, updatePredictionPlotDataIndex} from '../../reduxStore/predictionPlotData';

const mapStateToProps = state => (
    {
        predictionPlotData: state.predictionPlotData
    }
);

const mapDispatchToProps = (dispatch) => {
    return {
        setPredictionPlotData: (data) => dispatch(setPredictionPlotData(data)),
        addPredictionPlotData: (data) => dispatch(addPredictionPlotData(data)),
        updatePredictionPlotDataIndex: (data) => dispatch(updatePredictionPlotDataIndex(data))
    }
}

const periodTimeUnits = ["hour", "hour", "day", "day"];
const months = ["Jan", "Feb", "Mar","Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

class ProbabilityHistoryChart extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            predictionId: "",
            animationStep: 0,
            blinkState: false,
            mainProbability: 0,
            followingProbability: 0,
            mouseHoveringOnChart: false
        }
    }

    componentDidMount() {
        this.blinkInterval = setInterval(() => {
            this.setState({ 
                blinkState: !this.state.blinkState,
                animationStep: 0, // Reset animation step
            });
        }, 1000); // Blink every 1000ms (1 second for full cycle)
        
        this.animationInterval = setInterval(() => {
            if (this.state.blinkState) {
                this.setState(prevState => ({
                animationStep: Math.min(prevState.animationStep + 0.05, 1) // Increase animation step
                }));
            }
        }, 50); // Update animation 20 times per second

        this.setPredictionPlotDataState();
    }

    componentDidUpdate() {
        if(this.state.loading) {
            this.setPredictionPlotDataState();
        } else if(this.props.predictionId !== this.state.predictionId) {
            this.setPredictionPlotDataState();
        }
    }
    
    componentWillUnmount() {
        clearInterval(this.blinkInterval);
        clearInterval(this.animationInterval);
    }

    setPredictionPlotDataState = async () => {
        if(!(this.props.outcomeType === undefined || this.props.outcomeType === null || this.props.predictionId === undefined || this.props.predictionId === null)) {
            if(this.props.marketDesc.length !== 0) {
                if(this.props.outcomeType === "yes-or-no" || this.props.marketDesc.length === 1 ) {
                    this.setState(
                        {
                            loading: false,
                            predictionId: this.props.predictionId,
                            mainProbability: this.props.marketDesc[0]["probabilityYes"] * 100,
                            followingProbability: this.props.marketDesc[0]["probabilityNo"] * 100
                        }
                    );
                } else {
                    this.setState(
                        {
                            loading: false,
                            predictionId: this.props.predictionId,
                            mainProbability: this.props.marketDesc[0]["probabilityYes"] * 100,
                            followingProbability: this.props.marketDesc[1]["probabilityYes"] * 100,
                        }
                    );
                }

                const now = new Date();
                const nowUnix = getUnixTime(now);
                const yesterday = add(now, {"days": -1});
                const yesterdayUnix = getUnixTime(yesterday);
                const countBack = (nowUnix - yesterdayUnix) / (5 * 60);
                
                if(this.props.outcomeType === "yes-or-no") {
                    const probabilityData = await generalOpx.axiosInstance.put(`/market/probability-history`, 
                        {
                            "to": nowUnix,
                            "from": yesterdayUnix,
                            "countBack": Math.floor(countBack),
                            "marketId": this.props.marketDesc[0]["_id"],
                            "resolution": "5"
                        }
                    );

                    let labels = [], plotOne = [], plotTwo = [];
                    if(probabilityData.data["status"] === "success") {
                        if(probabilityData.data["data"].length > 0) {
                            for(let i = 0; i < probabilityData.data["data"].length; i++) {
                                labels.push(probabilityData.data["data"][i]["t"] * 1000);
                                plotOne.push(probabilityData.data["data"][i]["p_y"] * 100);
                                plotTwo.push((1 - probabilityData.data["data"][i]["p_y"]) * 100);
                            }
                        }
                    }
                    labels = labels.concat(Array(15).fill().map((_, index) => {
                        const k = index + 1;
                        const lastElement = labels.at(-1);
                
                        return lastElement + (k * 5 * 60 * 1000);
                    }));
                    plotOne = plotOne.concat(Array(15).fill(null));
                    plotTwo = plotTwo.concat(Array(15).fill(null));

                    this.props.setPredictionPlotData(
                        {
                            "labels": [labels, [], [], []],
                            "plotOne": [plotOne, [], [], []],
                            "plotTwo": [plotTwo, [], [], []],
                            "dataLoading": false
                        }
                    );
                    this.props.updatePredictionPlotDataIndex(0);
                } else {
                    const probabilityDataOne = await generalOpx.axiosInstance.put(`/market/probability-history`, 
                        {
                            "to": nowUnix,
                            "from": yesterdayUnix,
                            "countBack": Math.floor(countBack),
                            "marketId": this.props.marketDesc[0]["_id"],
                            "resolution": "5"
                        }
                    );
                    const probabilityDataTwo = await generalOpx.axiosInstance.put(`/market/probability-history`, 
                        {
                            "to": nowUnix,
                            "from": yesterdayUnix,
                            "countBack": Math.floor(countBack),
                            "marketId": this.props.marketDesc[1]["_id"],
                            "resolution": "5"
                        }
                    );

                    let labels = [], plotOne = [], plotTwo = [];
                    if(probabilityDataOne.data["status"] === "success") {
                        if(probabilityDataOne.data["data"].length > 0) {
                            for(let i = 0; i < probabilityDataOne.data["data"].length; i++) {
                                labels.push(probabilityDataOne.data["data"][i]["t"] * 1000);
                                plotOne.push(probabilityDataOne.data["data"][i]["p_y"] * 100);
                            }
                        }
                    }
                    if(probabilityDataTwo.data["status"] === "success") {
                        if(probabilityDataTwo.data["data"].length > 0) {
                            for(let j = 0; j < probabilityDataTwo.data["data"].length; j++) {
                                plotTwo.push(probabilityDataTwo.data["data"][j]["p_y"] * 100);
                            }
                        }
                    }
                    labels = labels.concat(Array(15).fill().map((_, index) => {
                        const k = index + 1;
                        const lastElement = labels.at(-1);
                
                        return lastElement + (k * 5 * 60 * 1000);
                    }));
                    plotOne = plotOne.concat(Array(15).fill(null));
                    plotTwo = plotTwo.concat(Array(15).fill(null));

                    this.props.setPredictionPlotData(
                        {
                            "labels": [labels, [], [], []],
                            "plotOne": [plotOne, [], [], []],
                            "plotTwo": [plotTwo, [], [], []],
                            "dataLoading": false
                        }
                    );
                    this.props.updatePredictionPlotDataIndex(0);
                }
                
            }
        }
    }

    render() {
        ChartJS.register(
            CategoryScale,
            LinearScale,
            Title,
            Tooltip,
            Legend,
            LineController,
            LineElement,
            PointElement,
            Filler,
            annotationPlugin,
            TimeScale
        );

        Tooltip.positioners.setTop = (elements, eventPosition) => {
            return {
                x: eventPosition.x,
                y: 0
            };
        }

        const data = {
            labels: this.props.predictionPlotData["predictionPlotData"]["data"]["dataLoading"] ? 
                null : this.props.predictionPlotData["predictionPlotData"]["data"]["labels"][this.props.predictionPlotData["predictionPlotData"]["index"]],
            datasets: [
                {
                    lable: ``,
                    data: this.props.predictionPlotData["predictionPlotData"]["data"]["dataLoading"] ? 
                        null : this.props.predictionPlotData["predictionPlotData"]["data"]["plotOne"][this.props.predictionPlotData["predictionPlotData"]["index"]],
                    pointBorderColor: "#2ecc71",
                    pointBackgroundColor: "#2ecc71",
                    pointRadius: (context) => {
                        const index = context.dataIndex;
                        const datasetLength = context.dataset.data.length;
                        return index === datasetLength - 16 ? 3 : 0;
                    },
                    borderColor: "#2ecc71",
                    borderWidth: 1.25,
                    tension: 0.1,
                    showLine: true
                },
                {
                    lable: ``,
                    data: this.props.predictionPlotData["predictionPlotData"]["data"]["dataLoading"] ? 
                        null : this.props.predictionPlotData["predictionPlotData"]["data"]["plotTwo"][this.props.predictionPlotData["predictionPlotData"]["index"]],
                    pointBorderColor: "#df5344",
                    pointBackgroundColor: "#df5344",
                    pointRadius: (context) => {
                        const index = context.dataIndex;
                        const datasetLength = context.dataset.data.length;
                        return index === datasetLength - 16 ? 3 : 0; 
                    },
                    borderColor: "#df5344",
                    borderWidth: 1.25,
                    tension: 0.1,
                    showLine: true
                }
            ]
        }

        const plugins = [
            {
                id: 'blinkingPoint',
                beforeDraw: (chart, args, options) => {
                    if(chart.data && chart.data.datasets && chart.data.datasets.length > 0) {
                        const ctx = chart.ctx;

                        const lastDataPointIndex = chart.data.datasets[0].data.length - 16;
                        const lastLabelPoint = chart.data.labels[lastDataPointIndex];
                        const lastDataPoint = chart.data.datasets[0].data[lastDataPointIndex];

                        const x = chart.scales['x'].getPixelForValue(lastLabelPoint);
                        const y = chart.scales['y'].getPixelForValue(lastDataPoint);

                        const s_lastDataPointIndex = chart.data.datasets[1].data.length - 16;
                        const s_lastDataPoint = chart.data.datasets[1].data[lastDataPointIndex];

                        const s_x = chart.scales['x'].getPixelForValue(lastLabelPoint);
                        const s_y = chart.scales['y'].getPixelForValue(s_lastDataPoint);
                        
                        const currentRadius = 3 + (10 * this.state.animationStep);
                        const alpha = 0.5 - (0.5 * this.state.animationStep);
                        
                        if(this.state.blinkState) {
                            ctx.fillStyle = `rgba(46, 204, 113, ${alpha})`;
                            ctx.beginPath();
                            ctx.arc(x, y, currentRadius, 0, 2 * Math.PI);
                            ctx.fill();
                        } else {
                            ctx.clearRect(x - 11, y - 11, 22, 22);
                        }

                        if(this.state.blinkState) {
                            ctx.fillStyle = `rgba(223, 83, 68, ${alpha})`;
                            ctx.beginPath();
                            ctx.arc(s_x, s_y, currentRadius, 0, 2 * Math.PI);
                            ctx.fill();
                        } else {
                            ctx.clearRect(s_x - 11, s_y - 11, 22, 22);
                        }
                    }
                }
            }, 
            {
                id: 'verticalLine',
                afterDraw: (chart, args, options) => {
                  if (chart.tooltip._active && chart.tooltip._active.length) {
                    const activePoint = chart.tooltip._active[0];
                    const { ctx } = chart;
                    const { x } = activePoint.element;
                    const { top, bottom } = chart.chartArea;
              
                    ctx.save();
                    ctx.beginPath();
                    ctx.moveTo(x, top + 12);
                    ctx.lineTo(x, bottom);
                    ctx.lineWidth = 1.5;
                    ctx.strokeStyle = '#424242'; // You can change this color
                    ctx.stroke();
                    ctx.restore();
                  }
                }
            }
        ];

        const pointerToThis = this;
        const options = {
            responsive: true,
            maintainAspectRatio: false,
            bezierCurve : false,
            animation: false,
            plugins: {
                annotation: {
                    annotations: {
                        line3: {
                            type: 'line',
                            yMin: 50,
                            yMax: 50,
                            borderWidth: 1,
                            borderDash: [1, 2],
                            borderColor: '#424242'
                        }
                    }
                },
                legend: {
                    display: false
                },
                tooltip: {
                    mode: 'index',
                    intersect: false,
                    displayColors: false,
                    caretSize: 0,
                    cornerRadius: 0,
                    backgroundColor: 'rgba(0, 0, 0, 0)',
                    animation: {
                        duration: 0
                    },
                    titleColor: '#9E9E9E',
                    footerFont: 'normal',
                    footerColor: '#E0E0E0',
                    position: 'setTop',
                    titleAlign: 'left',
                    bodyAlign: 'left',
                    callbacks: {
                        title: function(context) {
                            pointerToThis.setState(
                                {
                                    mainProbability: context[0]["parsed"]["y"],
                                    followingProbability: context[1]["parsed"]["y"]
                                }
                            );

                            if(pointerToThis.props.predictionPlotData["predictionPlotData"]["index"] === 0) {
                                const clientTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
                                const utcDate = new Date(fromUnixTime(context[0]["parsed"]["x"] / 1000));
                                const localDate = new Date(utcDate.toLocaleString('en-US', {timeZone: clientTimeZone}));

                                const formattedTime = format(localDate, 'h:mm a');
                                return `${formattedTime}`;
                            } else {
                                return `${months[getMonth(fromUnixTime(context[0]["parsed"]["x"] / 1000))]}, ${getDate(fromUnixTime(context[0]["parsed"]["x"] / 1000))}`;
                            }
                        },
                        label: function() {return ""},
                        footer: function() {return ""}
                    }
                }
            },
            hover: {
                mode: 'index',
                intersect: false,
                animation: {
                    duration: 0
                }
            },
            elements: {
                point: {
                    radius: 0.05
                }
            },
            scales: {
                x: {
                    type: 'time',
                    time: {
                        unit: `${periodTimeUnits[this.props.predictionPlotData["predictionPlotData"]["index"]]}`
                    },
                    max: () => {
                        const labels = [...this.props.predictionPlotData["predictionPlotData"]["data"]["labels"][this.props.predictionPlotData["predictionPlotData"]["index"]]];

                        const labelsMin = labels[0];
                        const labelsMax = labels.at(-1);

                        return labelsMax + ((labelsMax - labelsMin) * 0.1);
                    },
                    ticks: {
                        display: false
                    },
                    grid: {
                        display: false,
                        offset: false
                    }
                },
                y: {
                    min: () => {
                        const plotOneArray = [...this.props.predictionPlotData["predictionPlotData"]["data"]["plotOne"][this.props.predictionPlotData["predictionPlotData"]["index"]]];
                        const plotTwoArray = [...this.props.predictionPlotData["predictionPlotData"]["data"]["plotTwo"][this.props.predictionPlotData["predictionPlotData"]["index"]]];

                        const plotOneMin = Math.min(...plotOneArray.slice(0, -15));
                        const plotTwoMin = Math.min(...plotTwoArray.slice(0, -15));

                        return Math.min(plotOneMin, plotTwoMin) - 10;
                    },
                    max: () => {
                        const plotOneArray = [...this.props.predictionPlotData["predictionPlotData"]["data"]["plotOne"][this.props.predictionPlotData["predictionPlotData"]["index"]]];
                        const plotTwoArray = [...this.props.predictionPlotData["predictionPlotData"]["data"]["plotTwo"][this.props.predictionPlotData["predictionPlotData"]["index"]]];

                        const plotOneMax = Math.max(...plotOneArray.slice(0, -15));
                        const plotTwoMax = Math.max(...plotTwoArray.slice(0, -15));

                        return Math.max(plotOneMax, plotTwoMax) + 10;
                    },
                    afterBuildTicks: this.props.type === "max" ? 
                        axis => axis.ticks = [0, 25, 50, 75].map(v => ({ value: v })) : axis => axis.ticks = [50].map(v => ({ value: v })),
                    ticks: {
                        display: true
                    },
                    grid: {
                        display: false,
                        offset: false
                    }
                }
            }
        }

        const adjustMouseHoveringOnChart = (type) => {
            type === "enter" ? this.setState(
                {
                    mouseHoveringOnChart: true
                }
            ) : this.setState(
                {
                    mouseHoveringOnChart: false
                }
            );
        }

        const addPredictionPlotDataState = async (selection) => {
            if(this.props.predictionPlotData["predictionPlotData"]["data"]["labels"][selection].length === 0) {
                const now = new Date();
                const nowUnix = getUnixTime(now);

                let from, fromUnix, countBack, resolution;
                if(selection === 1) {
                    from = add(now, {"weeks": -1});
                    fromUnix = getUnixTime(from);

                    resolution = "35";
                    countBack = (nowUnix - fromUnix) / (35 * 60);
                } else if(selection === 2) {
                    from = add(now, {"months": -1});
                    fromUnix = getUnixTime(from);

                    resolution = "150";
                    countBack = (nowUnix - fromUnix) / (150 * 60);
                } else if(selection === 3) {
                    fromUnix = this.props.marketDesc[0]["createdTimestamp"];

                    const resolutionCalc = (nowUnix - fromUnix) / (288 * 60);
                    resolution = `${Math.floor(resolutionCalc)}`;
                    countBack = 288;
                }
                
                if(this.props.outcomeType === "yes-or-no") {
                    const probabilityData = await generalOpx.axiosInstance.put(`/market/probability-history`, 
                        {
                            "to": nowUnix,
                            "from": fromUnix,
                            "countBack": Math.floor(countBack),
                            "marketId": this.props.marketDesc[0]["_id"],
                            "resolution": resolution
                        }
                    );

                    let labels = [], plotOne = [], plotTwo = [];
                    if(probabilityData.data["status"] === "success") {
                        if(probabilityData.data["data"].length > 0) {
                            for(let i = 0; i < probabilityData.data["data"].length; i++) {
                                labels.push(probabilityData.data["data"][i]["t"] * 1000);
                                plotOne.push(probabilityData.data["data"][i]["p_y"] * 100);
                                plotTwo.push((1 - probabilityData.data["data"][i]["p_y"]) * 100);
                            }
                        }
                    }
                    labels = labels.concat(Array(15).fill().map((_, index) => {
                        const k = index + 1;
                        const lastElement = labels.at(-1);
                
                        return lastElement + (k * 5 * 60 * 1000);
                    }));
                    plotOne = plotOne.concat(Array(15).fill(null));
                    plotTwo = plotTwo.concat(Array(15).fill(null));

                    this.props.addPredictionPlotData(
                        {
                            "index": selection,
                            "labels": labels,
                            "plotOne": plotOne,
                            "plotTwo": plotTwo
                        }
                    );
                } else {
                    const probabilityDataOne = await generalOpx.axiosInstance.put(`/market/probability-history`, 
                        {
                            "to": nowUnix,
                            "from": fromUnix,
                            "countBack": Math.floor(countBack),
                            "marketId": this.props.marketDesc[0]["_id"],
                            "resolution": resolution
                        }
                    );
                    const probabilityDataTwo = await generalOpx.axiosInstance.put(`/market/probability-history`, 
                        {
                            "to": nowUnix,
                            "from": fromUnix,
                            "countBack": Math.floor(countBack),
                            "marketId": this.props.marketDesc[1]["_id"],
                            "resolution": resolution
                        }
                    );

                    let labels = [], plotOne = [], plotTwo = [];
                    if(probabilityDataOne.data["status"] === "success") {
                        if(probabilityDataOne.data["data"].length > 0) {
                            for(let i = 0; i < probabilityDataOne.data["data"].length; i++) {
                                labels.push(probabilityDataOne.data["data"][i]["t"] * 1000);
                                plotOne.push(probabilityDataOne.data["data"][i]["p_y"] * 100);
                            }
                        }
                    }
                    if(probabilityDataTwo.data["status"] === "success") {
                        if(probabilityDataTwo.data["data"].length > 0) {
                            for(let j = 0; j < probabilityDataTwo.data["data"].length; j++) {
                                plotTwo.push(probabilityDataTwo.data["data"][j]["p_y"] * 100);
                            }
                        }
                    }
                    labels = labels.concat(Array(15).fill().map((_, index) => {
                        const k = index + 1;
                        const lastElement = labels.at(-1);
                
                        return lastElement + (k * 5 * 60 * 1000);
                    }));
                    plotOne = plotOne.concat(Array(15).fill(null));
                    plotTwo = plotTwo.concat(Array(15).fill(null));

                    this.props.addPredictionPlotData(
                        {
                            "index": selection,
                            "labels": labels,
                            "plotOne": plotOne,
                            "plotTwo": plotTwo
                        }
                    );
                }

                this.props.updatePredictionPlotDataIndex(selection);
            } else {
                this.props.updatePredictionPlotDataIndex(selection);
            }
        }
        
        return(
            <div className="prediction-marketDescProbabilitiesContainer">
                <div className="prediction-marketDescChancesDescContainer">
                    <div className="prediction-marketDescChancesContainer">
                        {this.props.marketDesc.length === 0 ?
                            null : 
                            <>
                                {this.props.predictionPlotData["predictionPlotData"]["data"]["dataLoading"] ?
                                    <div className="prediction-outcomeImgLoading"/> :
                                    <>
                                        {this.props.outcomeType === undefined || this.props.outcomeType === null ?
                                            <div className="prediction-outcomeImgLoading"/> :
                                            <>
                                                {this.props.outcomeType === "yes-or-no" ?
                                                    <TaskAlt className="prediction-outcomeImgYN"/> : 
                                                    <img src={this.props.marketDesc[0]["outcomeImage"]} alt="" className="prediction-outcomeImg" />
                                                }
                                            </>
                                        }
                                    </>
                                }
                                {this.props.predictionPlotData["predictionPlotData"]["data"]["dataLoading"] ?
                                    <div
                                        className="prediction-outcomeOvrlHighProbabilityLoading"  
                                    >
                                        <div className="prediction-outcomeOvrlHighProbabilityInnerLoading"/>
                                    </div>:
                                    <span style={{"color": "var(--primary-bg-01)", "marginLeft": "7.5px", "fontSize": "35px"}}>
                                        {this.state.mouseHoveringOnChart ?
                                            `${generalOpx.formatPercentage.format(this.state.mainProbability)}%` :
                                            `${generalOpx.formatPercentage.format(this.props.marketDesc[0]["probabilityYes"] * 100)}%`
                                        }
                                    </span>
                                }
                            </>
                        }
                    </div>
                </div>
                {this.props.predictionPlotData["predictionPlotData"]["data"]["dataLoading"] || this.props.marketDesc.length === 0 
                    || this.props.outcomeType === undefined || this.props.outcomeType === null ?
                    <div className="prediction-marketDescChancesDescContainerLoading"/> :
                    <>
                        {this.props.outcomeType === "yes-or-no" || this.props.marketDesc.length === 1 ?
                            <div className="prediction-marketDescChancesDescContainer" style={{"marginTop": "3px"}}>
                                <span style={{"marginRight": "7.5px"}}>Odds:</span>
                                <div className="prediction-marketDescChancesContainer">
                                    <div className="prediction-marketDescChancesIndividualElementDescColor"/>
                                    <span>Yes</span>
                                    <span style={{"marginLeft": "7.5px"}}>
                                        {this.state.mouseHoveringOnChart ?
                                            `${generalOpx.formatPercentage.format(this.state.mainProbability)}%` : 
                                            `${generalOpx.formatPercentage.format(this.props.marketDesc[0]["probabilityYes"] * 100)}%`
                                        }
                                    </span>
                                </div>
                                
                                <div className="prediction-marketDescChancesContainer"
                                        style={{"marginLeft": "20px"}}
                                    >
                                    <div className="prediction-marketDescChancesIndividualElementDescColor" 
                                        style={{"backgroundColor": "var(--primary-red-09)"}}
                                    />
                                    <span>No</span>
                                    <span style={{"marginLeft": "7.5px"}}>
                                        {this.state.mouseHoveringOnChart ?
                                            `${generalOpx.formatPercentage.format(this.state.followingProbability)}%` : 
                                            `${generalOpx.formatPercentage.format(this.props.marketDesc[0]["probabilityNo"] * 100)}%`
                                        }
                                    </span>
                                </div>
                            </div> :
                            <div className="prediction-marketDescChancesDescContainer" style={{"marginTop": "3px"}}>
                                <span style={{"marginRight": "7.5px"}}>Leading:</span>
                                <div className="prediction-marketDescChancesContainer">
                                    <div className="prediction-marketDescChancesIndividualElementDescColor"/>
                                    <span>{this.props.marketDesc[0]["outcome"]}</span>
                                    <span style={{"marginLeft": "7.5px"}}>
                                        {this.state.mouseHoveringOnChart ?
                                            `${generalOpx.formatPercentage.format(this.state.mainProbability)}%` : 
                                            `${generalOpx.formatPercentage.format(this.props.marketDesc[0]["probabilityYes"] * 100)}%`
                                        }
                                    </span>
                                </div>
                                
                                <div className="prediction-marketDescChancesContainer"
                                        style={{"marginLeft": "20px"}}
                                    >
                                    <div className="prediction-marketDescChancesIndividualElementDescColor" 
                                        style={{"backgroundColor": "var(--primary-red-09)"}}
                                    />
                                    <span>{this.props.marketDesc[1]["outcome"]}</span>
                                    <span style={{"marginLeft": "7.5px"}}>
                                        {this.state.mouseHoveringOnChart ?
                                            `${generalOpx.formatPercentage.format(this.state.followingProbability)}%` : 
                                            `${generalOpx.formatPercentage.format(this.props.marketDesc[1]["probabilityYes"] * 100)}%`
                                        }
                                    </span>
                                </div>
                            </div>
                        }
                    </>
                }
                {this.props.status === "in-review" || this.props.status === "denied" ? 
                    <div className="prediction-noTradingStatusInfoContainer">
                        {this.props.status === "in-review" ? 
                            <>
                                <div className="prediction-noTradingStatusInfoGraphicContainer">
                                    <Troubleshoot className="prediction-noTradingStatusInfoGraphicIcon"/>
                                </div>
                                <div className="prediction-noTradingStatusInfoTopLine">Trading not yet available.</div>
                                <div className="prediction-noTradingStatusInfoSecondLine">Prediction and Markets are under review.</div>
                            </> : 
                            <>
                                <div className="prediction-noTradingStatusInfoGraphicContainer">
                                    <DoDisturbAlt className="prediction-noTradingStatusInfoGraphicIcon"/>
                                </div>
                                <div className="prediction-noTradingStatusInfoTopLine">Trading Unavailable.</div>
                                <div className="prediction-noTradingStatusInfoSecondLine">Prediction and Markets have been denied.</div>
                            </>
                        }
                    </div> : 
                    <>
                        {this.props.predictionPlotData["predictionPlotData"]["data"]["dataLoading"] ?
                            <div className="prediction-marketDescProbabilityChartContainerLoading"/> :
                            <div className="prediction-marketDescProbabilityChartContainer"
                                    onMouseEnter={() => adjustMouseHoveringOnChart("enter")}
                                    onMouseLeave={() => adjustMouseHoveringOnChart("exit")}
                                >
                                <Line data={data} options={options} plugins={plugins}/>
                            </div>
                        }
                        <div className="balanceChart-OptionsContainer" style={{"border": "none"}}>
                            {this.props.predictionPlotData["predictionPlotData"]["data"]["dataLoading"] ?
                                null : 
                                <div className="prediction-titleUnderlineContainer" 
                                        style={{"margin": "0", "width": "fit-content", "minWidth": "fit-content", "maxWidth": "fit-content"}}
                                    >
                                    <div className="prediction-highFiguresContainer">
                                        <div className="prediction-highFigureDesc">
                                            <Group className="prediction-highFigureDescIcon"/>
                                            <span className="prediction-highFigureDescText">{generalOpx.formatLargeFigures(this.props.activityGeneralDesc["participants"], 2)}</span>
                                        </div>
                                        <div className="prediction-highFigureDesc">
                                            <BarChart className="prediction-highFigureDescIcon"/>
                                            <span className="prediction-highFigureDescText">{generalOpx.formatLargeFigures(this.props.activityGeneralDesc["volume"], 2)}</span>
                                        </div>
                                        <div className="prediction-highFigureDesc" style={{"marginRight": "0"}}>
                                            <Water className="prediction-highFigureDescIcon"/>
                                            <span className="prediction-highFigureDescText">{generalOpx.formatLargeFigures(this.props.activityGeneralDesc["liquidity"], 2)}</span>
                                            <img src="/assets/Finux_Token_Icon.png" alt="" className="prediction-highFigureDescImg" />
                                        </div>
                                    </div>
                                </div>
                            }
                            {this.props.predictionPlotData["predictionPlotData"]["data"]["dataLoading"] ?
                                <div className="predictionChart-OptionsInnerContainerLoading"/> :
                                <div className="balanceChart-OptionsInnerContainer" style={{"marginRight": "0px"}}>
                                    <button className="probabilityChart-OptionBtn"
                                            onClick={() => addPredictionPlotDataState(0)}
                                            disabled={this.props.predictionPlotData["predictionPlotData"]["index"] === 0}
                                            style={this.props.predictionPlotData["predictionPlotData"]["index"] === 0 ?
                                                {} : {"color": "var(--primary-bg-01)", "backgroundColor": "inherit"}
                                            }
                                        >
                                        1d
                                    </button>
                                    <button className="probabilityChart-OptionBtn" 
                                            onClick={() => addPredictionPlotDataState(1)}
                                            disabled={this.props.predictionPlotData["predictionPlotData"]["index"] === 1}
                                            style={this.props.predictionPlotData["predictionPlotData"]["index"] === 1 ?
                                                {} : {"color": "var(--primary-bg-01)", "backgroundColor": "inherit"}
                                            }
                                        >
                                        1w
                                    </button>
                                    <button className="probabilityChart-OptionBtn"
                                            onClick={() => addPredictionPlotDataState(2)}
                                            disabled={this.props.predictionPlotData["predictionPlotData"]["index"] === 2}
                                            style={this.props.predictionPlotData["predictionPlotData"]["index"] === 2 ?
                                                {} : {"color": "var(--primary-bg-01)", "backgroundColor": "inherit"}
                                            }
                                        >
                                        1m
                                    </button>
                                    <button className="probabilityChart-OptionBtn"
                                            onClick={() => addPredictionPlotDataState(3)}
                                            disabled={this.props.predictionPlotData["predictionPlotData"]["index"] === 3}
                                            style={this.props.predictionPlotData["predictionPlotData"]["index"] === 3 ?
                                                {} : {"color": "var(--primary-bg-01)", "backgroundColor": "inherit"}
                                            }
                                        >
                                        all
                                    </button>
                                </div>
                            }
                        </div>
                    </>
                }
            </div>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(ProbabilityHistoryChart);