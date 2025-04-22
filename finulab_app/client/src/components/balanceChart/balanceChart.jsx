import './balanceChart.css';

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
import annotationPlugin from 'chartjs-plugin-annotation';
import {add, format, fromUnixTime, getDate, getMonth, getUnixTime, parseISO} from 'date-fns';
import {ArrowDropUp, CalendarMonth, CheckCircleOutlineSharp, ContentCopy, ExpandMoreSharp, Send, Verified} from '@mui/icons-material';

import generalOpx from '../../functions/generalFunctions';

import {setBalance} from '../../reduxStore/walletDesc';
import {setPending, setTransactions, updateTransactions, setActivity, setBalancePlot, updateBalancePlot, setBalancePlotIndex, setPortfolioPlots} from '../../reduxStore/walletData';

const mapStateToProps = state => (
    {
        walletData: state.walletData,
        walletDesc: state.walletDesc,
        marketHoldings: state.marketHoldings
    }
);

const mapDispatchToProps = (dispatch) => {
    return {
        setBalance: (data) => dispatch(setBalance(data)),

        setPending: (data) => dispatch(setPending(data)),
        setTransactions: (data) => dispatch(setTransactions(data)),
        updateTransactions: (data) => dispatch(updateTransactions(data)),
        setActivity: (data) => dispatch(setActivity(data)),
        setBalancePlot: (data) => dispatch(setBalancePlot(data)),
        updateBalancePlot: (data) => dispatch(updateBalancePlot(data)),
        setBalancePlotIndex: (data) => dispatch(setBalancePlotIndex(data)),
        setPortfolioPlots: (data) => dispatch(setPortfolioPlots(data))
    }
}

const periodTimeUnits = ["hour", "hour", "day", "day"];
const months = ["Jan", "Feb", "Mar","Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

class BalanceChart extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            loading: true,
            accountId: "",

            copyRefreshStat: -1,
            copyAccountId: false,
            secondaryLoading: false,

            balance: 0,
            invested: 0,
            available: 0,
            followingBalance: 0,
            followingAvailable: 0,
            followingInvested: 0,
            followingReturn: [],
            contextIndex: 0,
            return: [[], [], [], [], []],
            animationStep: 0,
            blinkState: false,
            mouseHoveringOnChart: false
        }
    }
    componentDidMount() {
        this.blinkInterval = setInterval(() => {
            this.setState({ 
                blinkState: !this.state.blinkState,
                animationStep: 0
            });
        }, 1000);
        
        this.animationInterval = setInterval(() => {
            if (this.state.blinkState) {
                this.setState(prevState => ({
                    animationStep: Math.min(prevState.animationStep + 0.05, 1)
                }));
            }
        }, 50);

        if(this.props.walletData["walletData"]["balancePlot"]["dataLoading"]) this.setBalancePlotDataState();
    }

    componentDidUpdate() {
        if(this.state.copyRefreshStat !== -1 && this.state.copyRefreshStat !== this.props.refreshStat) {
            this.setState(
                {
                    copyRefreshStat: this.props.refreshStat
                }
            );
            this.props.setBalancePlot(
                {
                    "labels": [],
                    "invested": [],
                    "available": [],
                    "summation": [],
                    "dataLoading": true
                }
            );
            this.setBalancePlotDataState();
        } else if(!this.props.walletData["walletData"]["balancePlot"]["dataLoading"]) {
            const d_return = (this.props.walletData["walletData"]["balancePlot"]["summation"][this.props.walletData["walletData"]["balancePlotIndex"]].at(-17) - 
            this.props.walletData["walletData"]["balancePlot"]["summation"][this.props.walletData["walletData"]["balancePlotIndex"]][0]);
            const d_return_perc = d_return / this.props.walletData["walletData"]["balancePlot"]["summation"][this.props.walletData["walletData"]["balancePlotIndex"]][0];

            let returnFunction = [[], [], [], [], []];
            if(isNaN(d_return_perc) || !isFinite(d_return_perc)) {
                returnFunction[this.props.walletData["walletData"]["balancePlotIndex"]] = [d_return, 0];
            } else {
                returnFunction[this.props.walletData["walletData"]["balancePlotIndex"]] = [d_return, d_return_perc]
            }

            if(this.state.loading) {
                this.setState(
                    {
                        loading: false,
                        accountId: this.props.accountId,
                        balance: this.props.walletData["walletData"]["balancePlot"]["summation"][this.props.walletData["walletData"]["balancePlotIndex"]].at(-17),
                        invested: this.props.walletData["walletData"]["balancePlot"]["invested"][this.props.walletData["walletData"]["balancePlotIndex"]].at(-17),
                        available: this.props.walletData["walletData"]["balancePlot"]["available"][this.props.walletData["walletData"]["balancePlotIndex"]].at(-17),
                        followingBalance: this.props.walletData["walletData"]["balancePlot"]["summation"][this.props.walletData["walletData"]["balancePlotIndex"]].at(-17),
                        followingAvailable: this.props.walletData["walletData"]["balancePlot"]["available"][this.props.walletData["walletData"]["balancePlotIndex"]].at(-17),
                        followingInvested: this.props.walletData["walletData"]["balancePlot"]["invested"][this.props.walletData["walletData"]["balancePlotIndex"]].at(-17),
                        followingReturn: isNaN(d_return_perc) || !isFinite(d_return_perc) ? [d_return, 0] : [d_return, d_return_perc],
                        return: returnFunction
                    }
                );
            }
        }
    }

    componentWillUnmount() {
        clearInterval(this.blinkInterval);
        clearInterval(this.animationInterval);
    }

    closestEntry = (trgt, arr) => {
        let closest = arr.reduce((prev, curr)  => 
            {
                return (Math.abs(curr - trgt) < Math.abs(prev - trgt) ? curr : prev);
            }
        );

        return closest;
    }

    setBalancePlotDataState = async () => {
        let accountBalance = 0;
        if(this.state.copyRefreshStat === this.props.refreshStat) {
            for(let i = 0; i < this.props.walletDesc["walletDesc"]["balance"]["data"].length; i++) {
                accountBalance = accountBalance + this.props.walletDesc["walletDesc"]["balance"]["data"][i][1];
            }
        } else {
            const balanceDesc = await generalOpx.axiosInstance.put(`/wallet/refresh-balance`, {"accountId": this.props.accountId});
            if(balanceDesc.data["status"] === "success") {
                let bal_data = [];
                const balanceDescKeys = Object.keys(balanceDesc.data["data"]);
                if(balanceDescKeys.length > 0) {
                    for(let i = 0; i < balanceDescKeys.length; i++) {
                        if(balanceDescKeys[i]=== "initialized") continue;
                        if(balanceDescKeys[i]=== "lastTxTimestamp") continue;

                        const bal = Number(balanceDesc.data["data"][balanceDescKeys[i]]);
						if(isNaN(bal)) continue;

                        accountBalance = accountBalance + bal;
                        bal_data.push([balanceDescKeys[i], bal]);
                    }
                }

                this.props.setBalance(
                    {
                        "data": bal_data,
                        "dataLoading": false
                    }
                );

                this.props.setPending(
                    {
                        "data": balanceDesc.data["pendingBalance"],
						"dataLoading": false
                    }
                );
            }
        }

        const now = new Date();
        const nowUnix = getUnixTime(now);
        const intervalInSeconds = 5 * 60;
        const yesterday = add(now, {"days": -1});
        const yesterdayUnix = getUnixTime(yesterday);
        const countBack = (nowUnix - yesterdayUnix) / intervalInSeconds;

        let labelsFunction = new Array(countBack).fill(null).map((_, index) => 
            {
                const n = index + 1;
                return yesterdayUnix + (n * intervalInSeconds);
            }
        );

        let activity_updates = [];
        let activityPromises = [], portfolioPromises = [];
        let activityPlotsFunction = [], portfolioPlotsFunction = [];
        let holdings_marketIds = this.props.marketHoldings["marketHoldings"].filter(hld_desc => hld_desc["_id"] !== "finulab_alreadySet").map(hld_desc => hld_desc["marketId"]);

        const activityHistory = await generalOpx.axiosInstance.put(`/market/pull-activity`, 
            {
                "to": nowUnix, 
                "from": yesterdayUnix
            }
        );
        if(activityHistory.data["status"] === "success") {
            this.props.setActivity(
                {
                    "data": activityHistory.data["data"],
                    "period": {"from": yesterdayUnix, "to": nowUnix},
                    "dataLoading": false
                }
            );

            for(let j = 0; j < activityHistory.data["data"].length; j++) {
                let closestTimeStamp = this.closestEntry(activityHistory.data["data"][j]["openedTimestamp"], labelsFunction);
                activity_updates.push(
                    {
                        "target": closestTimeStamp,
                        "marketId": activityHistory.data["data"][j]["marketId"],
                        "selection": activityHistory.data["data"][j]["selection"],
                        "quantity": activityHistory.data["data"][j]["action"] === "buy" ? (0 - activityHistory.data["data"][j]["quantity"]) : activityHistory.data["data"][j]["quantity"],
                        "available": activityHistory.data["data"][j]["action"] === "sell" ? (0 - (activityHistory.data["data"][j]["quantity"] * activityHistory.data["data"][j]["averagePrice"])) : (activityHistory.data["data"][j]["quantity"] * activityHistory.data["data"][j]["averagePrice"]),
                        "invested": activityHistory.data["data"][j]["action"] === "sell" ? (activityHistory.data["data"][j]["quantity"] * activityHistory.data["data"][j]["averagePrice"]) : (0 - (activityHistory.data["data"][j]["quantity"] * activityHistory.data["data"][j]["averagePrice"]))
                    }
                );

                if(!holdings_marketIds.includes(activityHistory.data["data"][j]["marketId"])) {
                    activityPromises.push(
                        await generalOpx.axiosInstance.put(`/market/price-history`, 
                            {
                                "to": nowUnix,
                                "from": yesterdayUnix,
                                "countBack": Math.floor(countBack),
                                "selection": activityHistory.data["data"][j]["selection"] === "yes" ? "priceYes" : "priceNo",
                                "marketId": activityHistory.data["data"][j]["marketId"],
                                "resolution": "5"
                            }
                        )
                    );
                }
            }
        } else {
            this.props.setActivity(
                {
                    "data": [],
                    "period": {"from": yesterdayUnix, "to": nowUnix},
                    "dataLoading": false
                }
            );
        }

        if(this.props.marketHoldings["marketHoldings"].length > 0) {
            for(let k = 0; k < this.props.marketHoldings["marketHoldings"].length; k++) {
                if(this.props.marketHoldings["marketHoldings"][k]["_id"] === "finulab_alreadySet") continue;

                if(this.props.marketHoldings["marketHoldings"][k]["yesQuantity"] > 0) {
                    portfolioPromises.push(
                        await generalOpx.axiosInstance.put(`/market/price-history`, 
                            {
                                "to": nowUnix,
                                "from": yesterdayUnix,
                                "countBack": Math.floor(countBack),
                                "selection": "priceYes",
                                "marketId": this.props.marketHoldings["marketHoldings"][k]["marketId"],
                                "resolution": "5"
                            }
                        )
                    );
                }

                if(this.props.marketHoldings["marketHoldings"][k]["noQuantity"] > 0) {
                    portfolioPromises.push(
                        await generalOpx.axiosInstance.put(`/market/price-history`, 
                            {
                                "to": nowUnix,
                                "from": yesterdayUnix,
                                "countBack": Math.floor(countBack),
                                "selection": "priceNo",
                                "marketId": this.props.marketHoldings["marketHoldings"][k]["marketId"],
                                "resolution": "5"
                            }
                        )
                    );
                }
            }

            try {
                const portfolioResponses = await Promise.all(portfolioPromises);
                portfolioResponses.forEach((response, index) => 
                    {
                        if(response.data["status"] === "success") {
                            if(response.data["selection"] === "priceYes") {
                                portfolioPlotsFunction.push(
                                    {
                                        "marketId": response.data["marketId"],
                                        "selection": "priceYes",
                                        "data": response.data["data"]
                                    }
                                );
                            }
                            
                            if(response.data["selection"] === "priceNo") {
                                portfolioPlotsFunction.push(
                                    {
                                        "marketId": response.data["marketId"],
                                        "selection": "priceNo",
                                        "data": response.data["data"]
                                    }
                                );
                            }
                        }
                    }
                );
                
                this.props.setPortfolioPlots(
                    {
                        "data": portfolioPlotsFunction,
                        "dataLoading": false
                    }
                );
            } catch(error) {
                this.props.setPortfolioPlots(
                    {
                        "data": portfolioPlotsFunction,
                        "dataLoading": false
                    }
                );
            }
        } else {
            this.props.setPortfolioPlots(
                {
                    "data": [],
                    "dataLoading": false
                }
            );
        }
        
        try {
            const activityResponses = await Promise.all(activityPromises);
            activityResponses.forEach((response, index) => 
                {
                    if(response.data["status"] === "success") {
                        if(response.data["selection"] === "priceYes") {
                            activityPlotsFunction.push(
                                {
                                    "marketId": response.data["marketId"],
                                    "selection": "priceYes",
                                    "data": response.data["data"]
                                }
                            );
                        }
                        
                        if(response.data["selection"] === "priceNo") {
                            activityPlotsFunction.push(
                                {
                                    "marketId": response.data["marketId"],
                                    "selection": "priceNo",
                                    "data": response.data["data"]
                                }
                            );
                        }
                    }
                }
            );
        } catch(error) {}

        let investedFunction = [], availableFunction = [], summationFunction = [];
        if(portfolioPlotsFunction.length === 0 && activityPlotsFunction.length === 0) {
            for(let l = 0; l < labelsFunction.length; l++) {
                investedFunction.push(0);
                availableFunction.push(accountBalance);
                summationFunction.push(accountBalance);
            }
        } else {
            let availableFunctionSupport = accountBalance;
            let investedQuantities = [];
            for(let hld_i = 0; hld_i < this.props.marketHoldings["marketHoldings"].length; hld_i++) {
                if(this.props.marketHoldings["marketHoldings"][hld_i]["_id"] === "finulab_alreadySet") continue;
                
                investedQuantities.push(
                    {
                        "marketId": this.props.marketHoldings["marketHoldings"][hld_i]["marketId"], 
                        "noQuantity": this.props.marketHoldings["marketHoldings"][hld_i]["noQuantity"], 
                        "yesQuantity": this.props.marketHoldings["marketHoldings"][hld_i]["yesQuantity"]
                    }
                )
            }

            for(let l = 0; l < labelsFunction.length; l++) {
                let investedFunctionSupport = 0;
                let summationFunctionSupport = 0;
                let target = labelsFunction[(labelsFunction.length - 1) - l];

                const activity_check = activity_updates.filter(act_desc => act_desc["target"] === target);
                if(activity_check.length > 0) {
                    for(let n = 0; n < activity_check.length; n++) {
                        availableFunctionSupport = availableFunctionSupport + activity_check[n]["available"];// - activity_check[n]["fee"]; //- activity_check[n]["fee"]
                        investedFunctionSupport = investedFunctionSupport + activity_check[n]["invested"];

                        const investedQuantities_index = investedQuantities.findIndex(invstd_quant => invstd_quant["marketId"] === activity_check[n]["marketId"]);
                        if(investedQuantities_index === -1) {

                        } else {
                            if(activity_check[n]["selection"] === "yes") {
                                investedQuantities[investedQuantities_index] = {
                                    ...investedQuantities[investedQuantities_index],
                                    "yesQuantity": investedQuantities[investedQuantities_index]["yesQuantity"] + activity_check[n]["quantity"]
                                }
                            } else if(activity_check[n]["selection"] === "no") {
                                investedQuantities[investedQuantities_index] = {
                                    ...investedQuantities[investedQuantities_index],
                                    "noQuantity": investedQuantities[investedQuantities_index]["noQuantity"] + activity_check[n]["quantity"]
                                }
                            }
                        }
                    }
                }

                for(let m = 0; m < investedQuantities.length; m++) {
                    if(investedQuantities[m]["noQuantity"] > 0) {
                        const assetPrice = portfolioPlotsFunction.filter(
                            portPlot_desc => portPlot_desc["marketId"] === investedQuantities[m]["marketId"] && portPlot_desc["selection"] === "priceNo"
                        )[0]["data"][(labelsFunction.length - 1) - l]["c"];

                        investedFunctionSupport = investedFunctionSupport + (assetPrice * investedQuantities[m]["noQuantity"]);
                    }
                    
                    if(investedQuantities[m]["yesQuantity"] > 0) {
                        const assetPrice = portfolioPlotsFunction.filter(
                            portPlot_desc => portPlot_desc["marketId"] === investedQuantities[m]["marketId"] && portPlot_desc["selection"] === "priceYes"
                        )[0]["data"][(labelsFunction.length - 1) - l]["c"];
                        
                        investedFunctionSupport = investedFunctionSupport + (assetPrice * investedQuantities[m]["yesQuantity"]);
                    }
                }

                investedFunction.push(investedFunctionSupport);
                availableFunction.push(availableFunctionSupport);
                summationFunction.push(investedFunctionSupport + availableFunctionSupport);
            }
        }

        investedFunction = investedFunction.reverse();
        availableFunction = availableFunction.reverse();
        summationFunction = summationFunction.reverse();

        const d_return = (summationFunction.at(-1) - summationFunction[0]) / summationFunction[0];
        this.setState(
            {
                loading: false,
                accountId: this.props.accountId,
                copyRefreshStat: this.props.refreshStat,
                balance: summationFunction.at(-1),
                invested: investedFunction.at(-1),
                available: availableFunction.at(-1),
                followingBalance: summationFunction.at(-1),
                followingAvailable: investedFunction.at(-1),
                followingInvested: availableFunction.at(-1),
                followingReturn: isNaN(d_return) || !isFinite(d_return) ? [summationFunction.at(-1) - summationFunction[0], 0] : [summationFunction.at(-1) - summationFunction[0], d_return],
                return: isNaN(d_return) || !isFinite(d_return) ? [[summationFunction.at(-1) - summationFunction[0], 0], [], [], [], []] : [[summationFunction.at(-1) - summationFunction[0], d_return], [], [], [], []]
            }
        );

        labelsFunction = labelsFunction.map(lbl => lbl * 1000);
        const lastTimeForPlot = labelsFunction.at(-1);
        for(let p = 0; p < 16; p++) {
            labelsFunction.push(lastTimeForPlot + ((p + 1) * intervalInSeconds * 1000));

            investedFunction.push(null);
            availableFunction.push(null);
            summationFunction.push(null);
        }

        this.props.setBalancePlot(
            {
                "labels": [labelsFunction, [], [], [], []],
                "invested": [investedFunction, [], [], [], []],
                "available": [availableFunction, [], [], [], []],
                "summation": [summationFunction, [], [], [], []],
                "dataLoading": false
            }
        );
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
            TimeScale,
            annotationPlugin
        );

        Tooltip.positioners.setTop = (elements, eventPosition) => {
            return {
                x: eventPosition.x,
                y: 0
            };
        }

        const data = {
            labels: this.props.walletData["walletData"]["balancePlot"]["dataLoading"] ? 
                null : this.props.walletData["walletData"]["balancePlot"]["labels"][this.props.walletData["walletData"]["balancePlotIndex"]],
            datasets: [{
                lable: ``,
                data: this.props.walletData["walletData"]["balancePlot"]["dataLoading"] ? null : this.props.walletData["walletData"]["balancePlot"]["summation"][this.props.walletData["walletData"]["balancePlotIndex"]],
                pointBorderColor: function(context) {
                    const chart = context.chart;
                    const { ctx, chartArea, scales } = chart;

                    if(!chartArea) {
                        return null;
                    }
                    
                    return getGradient(ctx, chartArea, scales);                     
                },
                pointBackgroundColor: function(context) {
                    const chart = context.chart;
                    const { ctx, chartArea, scales } = chart;

                    if(!chartArea) {
                        return null;
                    }
                    
                    return getGradient(ctx, chartArea, scales);
                },
                borderColor: function(context) {
                    const chart = context.chart;
                    const { ctx, chartArea, scales } = chart;

                    if(!chartArea) {
                        return null;
                    }
                    
                    return getGradient(ctx, chartArea, scales);
                },
                pointRadius: (context) => {
                    const index = context.dataIndex;
                    const datasetLength = context.dataset.data.length;
                    return index === datasetLength - 17 ? 3 : 0;
                },
                fill: {
                    target: {
                        value: this.props.walletData["walletData"]["balancePlot"]["dataLoading"] ? null : this.props.walletData["walletData"]["balancePlot"]["summation"][this.props.walletData["walletData"]["balancePlotIndex"]][0],
                    }, 
                    below: 'rgba(255, 90, 90, 0.1)',
                    above: 'rgba(83, 165, 103, 0.1)'
                },
                borderWidth: 1.25,
                tension: 0.1,
                showLine: true
            }]
        }

        let width, height, gradient;
        const generalPointerToThis = this;
        function getGradient(ctx, chartArea, scales) {
            if(generalPointerToThis.props.walletData["walletData"]["balancePlot"]["dataLoading"]) return;

            const chartWidth = chartArea.right - chartArea.left;
            const chartHeight = chartArea.bottom - chartArea.top;

            if (gradient === null || width !== chartWidth || height !== chartHeight) {
                const pointPositive = scales.y.getPixelForValue(generalPointerToThis.props.walletData["walletData"]["balancePlot"]["summation"][generalPointerToThis.props.walletData["walletData"]["balancePlotIndex"]][0]);
                const pointPositiveHeight = pointPositive - chartArea.top + 5;
                const pointPositivePercent = pointPositiveHeight / chartHeight;

                width = chartWidth;
                height = chartHeight;
                gradient = ctx.createLinearGradient(0, chartArea.top, 0, chartHeight + chartArea.top);
                
                if(Math.abs(pointPositivePercent) < 1){
                    gradient.addColorStop(pointPositivePercent, '#2ecc71');
                    gradient.addColorStop(pointPositivePercent, '#E74C3C');
                }
            }
            
            return gradient;
        }

        const plugins = [
            {
                id: 'blinkingPoint',
                beforeDraw: (chart, args, options) => {
                    if(chart.data && chart.data.datasets && chart.data.datasets.length > 0) {
                        const ctx = chart.ctx;

                        const lastDataPointIndex = chart.data.datasets[0].data.length - 17;
                        const lastLabelPoint = chart.data.labels[lastDataPointIndex];
                        const lastDataPoint = chart.data.datasets[0].data[lastDataPointIndex];

                        const x = chart.scales['x'].getPixelForValue(lastLabelPoint);
                        const y = chart.scales['y'].getPixelForValue(lastDataPoint);
                        
                        const currentRadius = 3 + (10 * this.state.animationStep);
                        const alpha = 0.5 - (0.5 * this.state.animationStep);
                        
                        if(this.state.blinkState) {
                            if(lastDataPoint >= chart.data.datasets[0].data[0]) {
                                ctx.fillStyle = `rgba(46, 204, 113, ${alpha})`;
                            } else {
                                ctx.fillStyle = `rgba(223, 83, 68, ${alpha})`;
                            }
                            
                            ctx.beginPath();
                            ctx.arc(x, y, currentRadius, 0, 2 * Math.PI);
                            ctx.fill();
                        } else {
                            ctx.clearRect(x - 11, y - 11, 22, 22);
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
                    ctx.moveTo(x, top + 25);
                    ctx.lineTo(x, bottom);
                    ctx.lineWidth = 1.5;
                    ctx.strokeStyle = '#424242';
                    ctx.stroke();
                    ctx.restore();
                  }
                }
            }
        ];

        const options = {
            responsive: true,
            maintainAspectRatio: false,
            bezierCurve : false,
            animation: {
                duration: 0
            },
            plugins: {
                annotation: {
                    annotations: {
                        line1: {
                            type: 'line',
                            yMin: this.props.walletData["walletData"]["balancePlot"]["dataLoading"] ? null : this.props.walletData["walletData"]["balancePlot"]["summation"][this.props.walletData["walletData"]["balancePlotIndex"]][0],
                            yMax: this.props.walletData["walletData"]["balancePlot"]["dataLoading"] ? null : this.props.walletData["walletData"]["balancePlot"]["summation"][this.props.walletData["walletData"]["balancePlotIndex"]][0],
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
                            if(generalPointerToThis.state.contextIndex === null ||
                                generalPointerToThis.state.contextIndex === undefined || Math.abs(context[0]["dataIndex"] - generalPointerToThis.state.contextIndex) > 20
                            ) {
                                generalPointerToThis.setState(
                                    {
                                        contextIndex: context[0]["dataIndex"]
                                    }
                                );
                            }

                            if(generalPointerToThis.props.walletData["walletData"]["balancePlotIndex"] === 0) {
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
                        unit: `${periodTimeUnits[0]}`
                    },
                    max: () => {
                        const labels = [...this.props.walletData["walletData"]["balancePlot"]["labels"][this.props.walletData["walletData"]["balancePlotIndex"]]];

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
                    ticks: {
                        display: false
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

        const unsecuredCopyToClipboard = (text) => {
            let textArea = document.createElement("textarea");
            textArea.value = text;
            
            textArea.style.top = "0";
            textArea.style.left = "0";
            textArea.style.position = "fixed";
    
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();
    
            try {
                document.execCommand('copy');
            } catch (err) {}
    
            document.body.removeChild(textArea);
        }

        const copyToClipboard = (content) => {
            if(window.isSecureContext && navigator.clipboard) {
              navigator.clipboard.writeText(this.props.accountId);
            } else {
                unsecuredCopyToClipboard(this.props.accountId);
            }
    
            this.setState(
                {
                    copyAccountId: true
                }
            );
            setTimeout(() => {
                this.setState(
                    {
                        copyAccountId: false
                    }
                );
            }, 2000);
        };

        const updateBalancePlotIndex = async (bpi) => {
            /* 
            for all (return to in the future, w/startDateUnix = user.createdAt && intervalInSeconds adjusted to timeperiod)
            else if(bpi === 4) {
                intervalInSeconds = 288 * 60;
                startDate = add(now, {"years": -5});
            }
            */
            if(this.props.walletData["walletData"]["balancePlot"]["labels"][bpi].length === 0) {
                this.setState(
                    {
                        secondaryLoading: true
                    }
                );

                let accountBalance = 0;
                for(let i = 0; i < this.props.walletDesc["walletDesc"]["balance"]["data"].length; i++) {
                    accountBalance = accountBalance + this.props.walletDesc["walletDesc"]["balance"]["data"][i][1];
                }

                const now = new Date();
                const nowUnix = getUnixTime(now);

                let api_resolution;
                let intervalInSeconds, startDate, startDateUnix, countBack;
                if(bpi === 1) {
                    api_resolution = "35";
                    intervalInSeconds = 35 * 60;
                    startDate = add(now, {"weeks": -1});
                } else if(bpi === 2) {
                    api_resolution = "150";
                    intervalInSeconds = 150 * 60;
                    startDate = add(now, {"months": -1});
                } else if(bpi === 3) {
                    api_resolution = "219";
                    intervalInSeconds = 219 * 60;
                    startDate = add(now, {"years": -1});
                }
                startDateUnix = getUnixTime(startDate);
                countBack = Math.floor((nowUnix - startDateUnix) / intervalInSeconds);
                
                let labelsFunction = new Array(countBack).fill(null).map((_, index) => 
                    {
                        const n = index + 1;
                        return startDateUnix + (n * intervalInSeconds);
                    }
                );

                let activity_updates = [];
                let activityPromises = [], portfolioPromises = [];
                let activityPlotsFunction = [], portfolioPlotsFunction = [];
                let holdings_marketIds = this.props.marketHoldings["marketHoldings"].filter(hld_desc => hld_desc["_id"] !== "finulab_alreadySet").map(hld_desc => hld_desc["marketId"]);

                const activityHistory = await generalOpx.axiosInstance.put(`/market/pull-activity`, 
                    {
                        "to": nowUnix, 
                        "from": startDateUnix
                    }
                );
                if(activityHistory.data["status"] === "success") {
                    for(let j = 0; j < activityHistory.data["data"].length; j++) {
                        let closestTimeStamp = this.closestEntry(activityHistory.data["data"][j]["openedTimestamp"], labelsFunction);
                        activity_updates.push(
                            {
                                "target": closestTimeStamp,
                                "marketId": activityHistory.data["data"][j]["marketId"],
                                "selection": activityHistory.data["data"][j]["selection"],
                                "quantity": activityHistory.data["data"][j]["action"] === "buy" ? (0 - activityHistory.data["data"][j]["quantity"]) : activityHistory.data["data"][j]["quantity"],
                                "available": activityHistory.data["data"][j]["action"] === "sell" ? (0 - (activityHistory.data["data"][j]["quantity"] * activityHistory.data["data"][j]["averagePrice"])) : (activityHistory.data["data"][j]["quantity"] * activityHistory.data["data"][j]["averagePrice"]),
                                "invested": activityHistory.data["data"][j]["action"] === "sell" ? (activityHistory.data["data"][j]["quantity"] * activityHistory.data["data"][j]["averagePrice"]) : (0 - (activityHistory.data["data"][j]["quantity"] * activityHistory.data["data"][j]["averagePrice"]))
                            }
                        );

                        if(!holdings_marketIds.includes(activityHistory.data["data"][j]["marketId"])) {
                            activityPromises.push(
                                await generalOpx.axiosInstance.put(`/market/price-history`, 
                                    {
                                        "to": nowUnix,
                                        "from": startDateUnix,
                                        "countBack": Math.floor(countBack),
                                        "selection": activityHistory.data["data"][j]["selection"] === "yes" ? "priceYes" : "priceNo",
                                        "marketId": activityHistory.data["data"][j]["marketId"],
                                        "resolution": api_resolution
                                    }
                                )
                            );
                        }
                    }
                }

                if(this.props.marketHoldings["marketHoldings"].length > 0) {
                    for(let k = 0; k < this.props.marketHoldings["marketHoldings"].length; k++) {
                        if(this.props.marketHoldings["marketHoldings"][k]["_id"] === "finulab_alreadySet") continue;

                        if(this.props.marketHoldings["marketHoldings"][k]["yesQuantity"] > 0) {
                            portfolioPromises.push(
                                await generalOpx.axiosInstance.put(`/market/price-history`, 
                                    {
                                        "to": nowUnix,
                                        "from": startDateUnix,
                                        "countBack": Math.floor(countBack),
                                        "selection": "priceYes",
                                        "marketId": this.props.marketHoldings["marketHoldings"][k]["marketId"],
                                        "resolution": api_resolution
                                    }
                                )
                            );
                        }

                        if(this.props.marketHoldings["marketHoldings"][k]["noQuantity"] > 0) {
                            portfolioPromises.push(
                                await generalOpx.axiosInstance.put(`/market/price-history`, 
                                    {
                                        "to": nowUnix,
                                        "from": startDateUnix,
                                        "countBack": Math.floor(countBack),
                                        "selection": "priceNo",
                                        "marketId": this.props.marketHoldings["marketHoldings"][k]["marketId"],
                                        "resolution": api_resolution
                                    }
                                )
                            );
                        }
                    }

                    try {
                        const portfolioResponses = await Promise.all(portfolioPromises);
                        portfolioResponses.forEach((response, index) => 
                            {
                                if(response.data["status"] === "success") {
                                    if(response.data["selection"] === "priceYes") {
                                        portfolioPlotsFunction.push(
                                            {
                                                "marketId": response.data["marketId"],
                                                "selection": "priceYes",
                                                "data": response.data["data"]
                                            }
                                        );
                                    }
                                    
                                    if(response.data["selection"] === "priceNo") {
                                        portfolioPlotsFunction.push(
                                            {
                                                "marketId": response.data["marketId"],
                                                "selection": "priceNo",
                                                "data": response.data["data"]
                                            }
                                        );
                                    }
                                }
                            }
                        );
                    } catch(err) {}
                }

                try {
                    const activityResponses = await Promise.all(activityPromises);
                    activityResponses.forEach((response, index) => 
                        {
                            if(response.data["status"] === "success") {
                                if(response.data["selection"] === "priceYes") {
                                    activityPlotsFunction.push(
                                        {
                                            "marketId": response.data["marketId"],
                                            "selection": "priceYes",
                                            "data": response.data["data"]
                                        }
                                    );
                                }
                                
                                if(response.data["selection"] === "priceNo") {
                                    activityPlotsFunction.push(
                                        {
                                            "marketId": response.data["marketId"],
                                            "selection": "priceNo",
                                            "data": response.data["data"]
                                        }
                                    );
                                }
                            }
                        }
                    );
                } catch(err) {}

                let investedFunction = [], availableFunction = [], summationFunction = [];
                if(portfolioPlotsFunction.length === 0 && activityPlotsFunction.length === 0) {
                    for(let l = 0; l < labelsFunction.length; l++) {
                        investedFunction.push(0);
                        availableFunction.push(accountBalance);
                        summationFunction.push(accountBalance);
                    }
                } else {
                    let availableFunctionSupport = accountBalance;
                    let investedQuantities = [];

                    for(let hld_i = 0; hld_i < this.props.marketHoldings["marketHoldings"].length; hld_i++) {
                        if(this.props.marketHoldings["marketHoldings"][hld_i]["_id"] === "finulab_alreadySet") continue;
                        
                        investedQuantities.push(
                            {
                                "marketId": this.props.marketHoldings["marketHoldings"][hld_i]["marketId"], 
                                "noQuantity": this.props.marketHoldings["marketHoldings"][hld_i]["noQuantity"], 
                                "yesQuantity": this.props.marketHoldings["marketHoldings"][hld_i]["yesQuantity"]
                            }
                        );
                    }

                    for(let l = 0; l < labelsFunction.length; l++) {
                        let investedFunctionSupport = 0;
                        let summationFunctionSupport = 0;
                        let target = labelsFunction[(labelsFunction.length - 1) - l];

                        const activity_check = activity_updates.filter(act_desc => act_desc["target"] === target);
                        if(activity_check.length > 0) {
                            for(let n = 0; n < activity_check.length; n++) {
                                availableFunctionSupport = availableFunctionSupport + activity_check[n]["available"];// - activity_check[n]["fee"]; //- activity_check[n]["fee"]
                                investedFunctionSupport = investedFunctionSupport + activity_check[n]["invested"];
                                
                                const investedQuantities_index = investedQuantities.findIndex(invstd_quant => invstd_quant["marketId"] === activity_check[n]["marketId"]);
                                /* critical change */
                                if(investedQuantities_index === -1) {
                                    /*
                                    if(activity_check[n]["selection"] === "yes") {
                                        investedQuantities.push(
                                            {
                                                "marketId": activity_check[n]["marketId"], 
                                                "noQuantity": 0, 
                                                "yesQuantity": activity_check[n]["quantity"]
                                            }
                                        )
                                    } else if(activity_check[n]["selection"] === "no") {
                                        investedQuantities.push(
                                            {
                                                "marketId": activity_check[n]["marketId"], 
                                                "noQuantity": activity_check[n]["quantity"], 
                                                "yesQuantity": 0
                                            }
                                        )
                                    }
                                    */
                                } else {
                                    if(activity_check[n]["selection"] === "yes") {
                                        investedQuantities[investedQuantities_index] = {
                                            ...investedQuantities[investedQuantities_index],
                                            "yesQuantity": investedQuantities[investedQuantities_index]["yesQuantity"] + activity_check[n]["quantity"]
                                        }
                                    } else if(activity_check[n]["selection"] === "no") {
                                        investedQuantities[investedQuantities_index] = {
                                            ...investedQuantities[investedQuantities_index],
                                            "noQuantity": investedQuantities[investedQuantities_index]["noQuantity"] + activity_check[n]["quantity"]
                                        }
                                    }
                                }
                            }
                        }

                        for(let m = 0; m < investedQuantities.length; m++) {
                            if(investedQuantities[m]["noQuantity"] > 0) {
                                const assetPrice = portfolioPlotsFunction.filter(
                                    portPlot_desc => portPlot_desc["marketId"] === investedQuantities[m]["marketId"] && portPlot_desc["selection"] === "priceNo"
                                )[0]["data"][(labelsFunction.length - 1) - l]["c"];

                                investedFunctionSupport = investedFunctionSupport + (assetPrice * investedQuantities[m]["noQuantity"]);
                            }
                            
                            if(investedQuantities[m]["yesQuantity"] > 0) {
                                const assetPrice = portfolioPlotsFunction.filter(
                                    portPlot_desc => portPlot_desc["marketId"] === investedQuantities[m]["marketId"] && portPlot_desc["selection"] === "priceYes"
                                )[0]["data"][(labelsFunction.length - 1) - l]["c"];
                                
                                investedFunctionSupport = investedFunctionSupport + (assetPrice * investedQuantities[m]["yesQuantity"]);
                            }
                        }

                        investedFunction.push(investedFunctionSupport);
                        availableFunction.push(availableFunctionSupport);
                        summationFunction.push(investedFunctionSupport + availableFunctionSupport);
                    }
                }

                investedFunction = investedFunction.reverse();
                availableFunction = availableFunction.reverse();
                summationFunction = summationFunction.reverse();

                let returnFunction = [...this.state.return];
                const d_return = (summationFunction.at(-1) - summationFunction[0]) / summationFunction[0];
                if(isNaN(d_return) || !isFinite(d_return)) {
                    returnFunction[bpi] = [summationFunction.at(-1) - summationFunction[0], 0];
                } else {
                    returnFunction[bpi] = [summationFunction.at(-1) - summationFunction[0], d_return];
                }

                this.setState(
                    {
                        balance: summationFunction.at(-1),
                        invested: investedFunction.at(-1),
                        available: availableFunction.at(-1),
                        followingBalance: summationFunction.at(-1),
                        followingAvailable: investedFunction.at(-1),
                        followingInvested: availableFunction.at(-1),
                        followingReturn: returnFunction[bpi],
                        return: returnFunction
                    }
                );

                labelsFunction = labelsFunction.map(lbl => lbl * 1000);
                const lastTimeForPlot = labelsFunction.at(-1);
                for(let p = 0; p < 16; p++) {
                    labelsFunction.push(lastTimeForPlot + ((p + 1) * intervalInSeconds * 1000));

                    investedFunction.push(null);
                    availableFunction.push(null);
                    summationFunction.push(null);
                }

                this.props.setBalancePlotIndex(bpi);
                this.props.updateBalancePlot(
                    {
                        "index": bpi,
                        "labels": labelsFunction,
                        "invested": investedFunction,
                        "available": availableFunction,
                        "summation": summationFunction
                    }
                );

                this.setState(
                    {
                        secondaryLoading: false
                    }
                );
            } else {
                
                const d_return = (this.props.walletData["walletData"]["balancePlot"]["summation"][bpi].at(-17) - 
                this.props.walletData["walletData"]["balancePlot"]["summation"][bpi][0]);
                const d_return_perc = d_return / this.props.walletData["walletData"]["balancePlot"]["summation"][bpi][0];

                let returnFunction = [[], [], [], [], []];
                if(isNaN(d_return_perc) || !isFinite(d_return_perc)) {
                    returnFunction[bpi] = [d_return, 0];
                } else {
                    returnFunction[bpi] = [d_return, d_return_perc]
                }

                this.setState(
                    {
                        followingReturn: isNaN(d_return_perc) || !isFinite(d_return_perc) ? [d_return, 0] : [d_return, d_return_perc],
                        return: returnFunction
                    }
                )
                this.props.setBalancePlotIndex(bpi);
            }
        }

        return(
            <>
                <div className="large-walletAccountOvrlHeaderContainer">
                    <img src={this.props.profilePicture} alt="" className="large-walletAccountOvrlHeaderImg" />
                    <div className="large-walletAccountOvrlHeaderDescContainer">
                        <div className="large-walletAccountOvrlHeaderDescTopWalletType">Wallet</div>
                        <div className="large-walletAccountOvrlHeaderDesc" style={{"marginTop": "5px", "marginLeft": "5px"}}>
                            {this.props.user}
                            {this.props.userVerification ? 
                                <Verified className="large-walletAccountOvrlAccountGetVerifiedBtnIcon" style={{"marginLeft": "5px"}}/> : 
                                <button className="large-walletAccountOvrlAccountGetVerifiedBtn"
                                        onClick={() => this.props.navigateToSend(`/get-verified`)}
                                    >
                                    <Verified className="large-walletAccountOvrlAccountGetVerifiedBtnIcon"/>
                                    Get Verified
                                </button>
                            }
                            {/*
                            <button className="large-walletAccountOvrlAccountGetVerifiedBtn" style={{"marginLeft": "auto"}}>
                                <ExpandMoreSharp className="large-walletAccountOvrlAccountChangeCurrencyBtnIcon"/>
                                FINUX
                            </button>
                            */}
                        </div>
                        <div className="large-walletAddressLineForViewnCopy" 
                                style={{
                                    "position": "relative",
                                    "marginTop": "7.5px", "marginLeft": "5px",
                                    "width": "calc(100% - 5px)", "minWidth": "calc(100% - 5px)", "maxWidth": "calc(100% - 5px)",
                                }}
                            >
                            <button className="large-walletAddressLineForCopyBtn" onClick={() => copyToClipboard()}>
                                <ContentCopy className="large-walletAddressLineForCopyBtnIcon"/>
                            </button>
                            <span className="large-walletAddressLineForViewnCopyBlock" style={{"marginLeft": "7.5px"}}>
                                {`${this.props.accountId}`.slice(0, 7)}...{`${this.props.accountId}`.slice(-5)}
                            </span>
                            {this.state.copyAccountId ?
                                <div className="large-walletAddressLineForViewCopiedNotice">
                                    <CheckCircleOutlineSharp className="large-walletAddressLineForCopyBtnIcon" 
                                        style={{
                                            "marginRight": "5px",
                                            "color": "var(--primary-green-09)"
                                        }}
                                    />
                                    Copied
                                </div> : null
                            }
                            <button className="large-walletSendFinuxBtn"
                                    onClick={() => this.props.navigateToSend(`/send`)}
                                >
                                <Send 
                                    className="large-walletAddressLineForCopyBtnIcon"
                                    style={{
                                        "marginTop": "-2px",
                                        "marginLeft": "2px",
                                        "rotate": "-45deg",
                                        "color": "var(--primary-bg-01)",
                                        "transform": "scale(0.9)"
                                    }}
                                />
                            </button>
                            <div className="large-walletSendFinuxDesc">Send</div>
                        </div>
                    </div>
                </div>
                <div className="large-walletAccountBalanceHeader">
                    {this.state.loading ? 
                        <span className="large-walletAccountBalanceHeaderLoading"/> : 
                        <>
                            {this.state.mouseHoveringOnChart ?
                                `${generalOpx.formatFiguresCrypto.format(
                                    this.props.walletData["walletData"]["balancePlot"]["summation"][this.props.walletData["walletData"]["balancePlotIndex"]][this.state.contextIndex]
                                )} FINUX` : 
                                `${generalOpx.formatFiguresCrypto.format(this.state.balance)} FINUX`
                            }
                        </>
                    }
                    {this.state.loading || this.props.walletData["walletData"]["balancePlot"]["dataLoading"] ?
                        null :
                        <span className="finulab-listDescHeaderPriceShiftDesc" 
                                style={this.state.mouseHoveringOnChart ?
                                    {
                                        "display": "flex", "alignItems": "center", "marginLeft": "5px", "fontSize": "0.8rem", 
                                        "color": this.props.walletData["walletData"]["balancePlot"]["summation"][this.props.walletData["walletData"]["balancePlotIndex"]][this.state.contextIndex] - 
                                        this.props.walletData["walletData"]["balancePlot"]["summation"][this.props.walletData["walletData"]["balancePlotIndex"]][0] >= 0 ? "var(--primary-green-09)" : "var(--primary-red-09)"
                                    } :
                                    {
                                        "display": "flex", "alignItems": "center", "marginLeft": "5px", "fontSize": "0.8rem", 
                                        "color": this.state.return[this.props.walletData["walletData"]["balancePlotIndex"]][0] >= 0 ? "var(--primary-green-09)" : "var(--primary-red-09)"
                                    }
                                }
                            >
                            <ArrowDropUp className="finulab-listDescHeaderPriceShiftDescIconGreen" 
                                style={this.state.mouseHoveringOnChart ?
                                    {
                                        "marginTop": "5px",
                                        "rotate": this.props.walletData["walletData"]["balancePlot"]["summation"][this.props.walletData["walletData"]["balancePlotIndex"]][this.state.contextIndex] - 
                                        this.props.walletData["walletData"]["balancePlot"]["summation"][this.props.walletData["walletData"]["balancePlotIndex"]][0] >= 0 ? "0deg" : "180deg",
                                        "color": this.props.walletData["walletData"]["balancePlot"]["summation"][this.props.walletData["walletData"]["balancePlotIndex"]][this.state.contextIndex] - 
                                        this.props.walletData["walletData"]["balancePlot"]["summation"][this.props.walletData["walletData"]["balancePlotIndex"]][0] >= 0 ? "var(--primary-green-09)" : "var(--primary-red-09)"
                                    } :
                                    {
                                        "marginTop": "5px",
                                        "rotate": this.state.return[this.props.walletData["walletData"]["balancePlotIndex"]][0] >= 0 ? "0deg" : "180deg",
                                        "color": this.state.return[this.props.walletData["walletData"]["balancePlotIndex"]][0] >= 0 ? "var(--primary-green-09)" : "var(--primary-red-09)"
                                    }
                                }
                            />
                            {this.state.mouseHoveringOnChart ?
                                `${generalOpx.formatFigures.format(Math.abs(
                                    this.props.walletData["walletData"]["balancePlot"]["summation"][this.props.walletData["walletData"]["balancePlotIndex"]][this.state.contextIndex] - 
                                    this.props.walletData["walletData"]["balancePlot"]["summation"][this.props.walletData["walletData"]["balancePlotIndex"]][0]
                                ))} (${this.props.walletData["walletData"]["balancePlot"]["summation"][this.props.walletData["walletData"]["balancePlotIndex"]][0] <= 0 ?
                                    generalOpx.formatFigures.format(Math.abs(0 * 100)) : generalOpx.formatFigures.format(Math.abs(((this.props.walletData["walletData"]["balancePlot"]["summation"][this.props.walletData["walletData"]["balancePlotIndex"]][this.state.contextIndex] - 
                                    this.props.walletData["walletData"]["balancePlot"]["summation"][this.props.walletData["walletData"]["balancePlotIndex"]][0]) / this.props.walletData["walletData"]["balancePlot"]["summation"][this.props.walletData["walletData"]["balancePlotIndex"]][0]) * 100))
                                }%)` : 
                                `${generalOpx.formatFigures.format(Math.abs(this.state.return[this.props.walletData["walletData"]["balancePlotIndex"]][0]))} (${generalOpx.formatFigures.format(Math.abs(this.state.return[this.props.walletData["walletData"]["balancePlotIndex"]][1] * 100))}%)`
                            }
                        </span>
                    }
                </div>
                <div className="large-walletAccountBalanceChangeContainer">
                    <div className="large-walletAccountBalanceBreakDownContainer">
                        <div className="large-profilePageNetworkDesc"
                                style={{"marginRight": "0px", "fontSize": "13px"}}
                            >
                            {this.state.loading || this.props.walletData["walletData"]["balancePlot"]["dataLoading"]  ? 
                                <span className="large-walletPageNetworkDescLoading"/> : 
                                <>
                                    {this.state.mouseHoveringOnChart ?
                                        `${generalOpx.formatFigures.format(
                                            this.props.walletData["walletData"]["balancePlot"]["available"][this.props.walletData["walletData"]["balancePlotIndex"]][this.state.contextIndex]
                                        )}` :
                                        `${generalOpx.formatFigures.format(this.state.available)}`
                                    }
                                </>
                            } 
                            <span className="large-profilePageNetworkDescSpecifier" style={{"fontSize": "13px"}}>Available</span>
                        </div>
                        <div className="large-profilePageNetworkDesc"
                                style={{"marginLeft": "25px", "marginRight": "0px", "fontSize": "13px"}}
                            >
                            {this.state.loading || this.props.walletData["walletData"]["balancePlot"]["dataLoading"] ? 
                                <span className="large-walletPageNetworkDescLoading"/> : 
                                <>
                                    {this.state.mouseHoveringOnChart ?
                                        `${generalOpx.formatFigures.format(
                                            this.props.walletData["walletData"]["balancePlot"]["invested"][this.props.walletData["walletData"]["balancePlotIndex"]][this.state.contextIndex]
                                        )}` :
                                        `${generalOpx.formatFigures.format(this.state.invested)}`
                                    }
                                </>
                            }
                            <span className="large-profilePageNetworkDescSpecifier" style={{"fontSize": "13px"}}>Invested</span>
                        </div>
                        <div className="large-profilePageNetworkDesc"
                                style={{"marginLeft": "25px", "marginRight": "0px", "fontSize": "13px"}}
                            >
                            {this.state.loading || this.props.walletData["walletData"]["balancePlot"]["dataLoading"] ?
                                <span className="large-walletPageNetworkDescLoading"/> : 
                                `${generalOpx.formatFigures.format(this.props.walletData["walletData"]["pending"]["data"])}`
                            } 
                            <span className="large-profilePageNetworkDescSpecifier" style={{"fontSize": "13px"}}>Pending</span>
                        </div>
                    </div>
                </div>
                <div className="large-walletBalanceChartContainer">
                    <div className="balanceChart-Container"
                            style={
                                {"display": "flex", "width": "100%", "minWidth": "100%", "maxWidth": "100%", "height": "100%", "minHeight": "100%", "maxHeight": "100%"}
                            }
                        >
                        {this.state.secondaryLoading || this.props.walletData["walletData"]["balancePlot"]["dataLoading"] ? 
                            <div className="wallet-portfolioCharLoadingContainer">
                                <div className="finulab-chartLoading">
                                    <div className="finulab-chartLoadingSpinner"/>
                                    <img src="/assets/Finulab_Icon.png" alt="" className="finulab-chartLoadingImg" />
                                </div>
                                <span className="large-profilePageNetworkDescSpecifier" style={{"marginTop": "10px", "fontSize": "17px"}}>Querying blockchain, please give us about 10 sec.</span>
                            </div> : 
                            <div className="balanceChart-GraphContainer"
                                    onMouseEnter={() => adjustMouseHoveringOnChart("enter")}
                                    onMouseLeave={() => adjustMouseHoveringOnChart("exit")}
                                >
                                <Line data={data} options={options} plugins={plugins}/>
                            </div>
                        }
                        <div className="balanceChart-OptionsContainer">
                            <CalendarMonth className='balanceChart-OptionsContainerIcon'/>
                            {/*
                                <span className="balanceChart-OptionsNextPayDesc">Next Reward Distribution: 14:00</span>
                            */}
                            <div className="balanceChart-OptionsInnerContainer">
                                <button className="balanceChart-OptionBtn"
                                        onClick={() => updateBalancePlotIndex(0)}
                                        disabled={this.state.secondaryLoading || this.props.walletData["walletData"]["balancePlot"]["dataLoading"]}
                                        style={this.props.walletData["walletData"]["balancePlotIndex"] === 0 ? 
                                            {} : {"color": "var(--primary-bg-01)", "backgroundColor": "inherit"}
                                        }
                                    >
                                    1d
                                </button>
                                <button className="balanceChart-OptionBtn" 
                                        onClick={() => updateBalancePlotIndex(1)}
                                        disabled={this.state.secondaryLoading || this.props.walletData["walletData"]["balancePlot"]["dataLoading"]}
                                        style={this.props.walletData["walletData"]["balancePlotIndex"] === 1 ? 
                                            {} : {"color": "var(--primary-bg-01)", "backgroundColor": "inherit"}
                                        }
                                    >
                                    1w
                                </button>
                                <button className="balanceChart-OptionBtn"
                                        onClick={() => updateBalancePlotIndex(2)}
                                        disabled={this.state.secondaryLoading || this.props.walletData["walletData"]["balancePlot"]["dataLoading"]}
                                        style={this.props.walletData["walletData"]["balancePlotIndex"] === 2 ? 
                                            {} : {"color": "var(--primary-bg-01)", "backgroundColor": "inherit"}
                                        }
                                    >
                                    1m
                                </button>
                                <button className="balanceChart-OptionBtn"
                                        onClick={() => updateBalancePlotIndex(3)}
                                        disabled={this.state.secondaryLoading || this.props.walletData["walletData"]["balancePlot"]["dataLoading"]}
                                        style={this.props.walletData["walletData"]["balancePlotIndex"] === 3 ? 
                                            {} : {"color": "var(--primary-bg-01)", "backgroundColor": "inherit"}
                                        }
                                    >
                                    1y
                                </button>
                                {/*<button className="balanceChart-OptionBtn" style={{"color": "var(--primary-bg-01)", "backgroundColor": "inherit"}}>all</button>*/}
                            </div>
                        </div>
                    </div>
                </div>
            </>
        )
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(BalanceChart);