
import '../../recommendations/index.css';

import React from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    DoughnutController
} from "chart.js";
import {Doughnut} from 'react-chartjs-2';

import generalOpx from '../../../functions/generalFunctions';

export default class ProbabilityGuage extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {
            plotData: [],
            loading: true
        }
    }

    componentDidMount() {
        this.setProbabilityGuageState();
    }

    componentDidUpdate() {
        if(this.state.loading || this.state.plotData === undefined || this.state.plotData === null
            || this.state.plotData.length === 0) {this.setProbabilityGuageState();}
    }

    setProbabilityGuageState = async () => {
        this.setState(
            {
                plotData: this.props.probabilityDesc,
                loading: false
            }
        );
    }

    render() {
        ChartJS.register(
            CategoryScale,
            Title,
            Tooltip,
            Legend,
            ArcElement,
            DoughnutController
        );

        const data = {
            labels: ["score", "Gray Area"],
            datasets: [{
                lable: ``,
                data: this.state.loading ? null : this.state.plotData,
                backgroundColor: this.props.hoveringOn === undefined ? ["rgba(46, 204, 113, 0.25)", "rgba(223, 83, 68, 0.25)"] : 
                this.props.hoveringOn === 0 ? ["rgba(46, 204, 113, 1)", "rgba(223, 83, 68, 0.15)"] : ["rgba(46, 204, 113, 0.15)", "rgba(223, 83, 68, 1)"],
                borderWidth: 4,
                borderColor: this.props.mouseOverMarket === 0 ? '#151515' : 'rgb(0, 0, 0)', 
                cutout: "85%",
                circumference: 180,
                rotation: 270,
            }]
        }
        
        const that = this;
        const gaugeChartText = {
            id: 'gaugeChartText', 
            afterDatasetsDraw(chart, args, pluginOptions) {
                const {ctx, data, chartArea: {top, bottom, left, right, width, height}, scales: {r}} = chart;

                ctx.save();
                try {
                    const xCoor = chart.getDatasetMeta(0).data[0].x;
                    const yCoor = chart.getDatasetMeta(0).data[0].y;
                    const score = data.datasets[0].data[0];
                    const secondaryScore = data.datasets[0].data[1];
                    
                    //ctx.fillRect(xCoor, yCoor, 400, 5);
                    ctx.font = "10px sans-serif";
                    ctx.fillStyle = "#9E9E9E";
                    ctx.textBaseLine = "top";
                    ctx.textAlign = 'left';
                    ctx.fillText("0", left + 4, yCoor + 8);

                    ctx.textAlign = 'right';
                    ctx.fillText("100", right, yCoor + 8);

                    ctx.font = "30px sans-serif";
                    ctx.fillStyle = "#FAFAFA";
                    ctx.textAlign = 'center';
                    if(that.props.hoveringOn === undefined || that.props.hoveringOn === 0) {
                        ctx.fillText(`${generalOpx.formatPercentage.format(score * 100)}%`, xCoor, yCoor - 12.5);
                    } else {
                        ctx.fillText(`${generalOpx.formatPercentage.format(secondaryScore * 100)}%`, xCoor, yCoor - 12.5);
                    }

                    ctx.font = "12px sans-serif";
                    ctx.fillStyle = "#9E9E9E";
                    ctx.textAlign = 'center';
                    ctx.textBaseLine = "bottom";
                    ctx.fillText(`Chance`, xCoor - 2, yCoor + 8);
                } catch(error) {}
            }
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
            }
        }

        return(
            <div className="probabilityGuage-Wrapper"
                    style={this.state.loading || this.state.plotData === undefined || this.state.plotData === null
                            || this.state.plotData.length === 0 ?
                        {
                            "display": "flex", "alignItems": "center", "justifyContent": "center",
                            "width": "100%", "minWidth": "100%", "maxWidth": "100%", "height": "100%", "minHeight": "100%", "maxHeight": "100%"
                        } :
                        {
                            "display": "flex",
                            "width": "154px", "minWidth": "154px", "maxWidth": "154px", "height": "100px", "minHeight": "100px", "maxHeight": "100px"
                        }
                    }
                >
                {this.state.loading || this.state.plotData === undefined || this.state.plotData === null
                    || this.state.plotData.length === 0 ?
                    <div className="recommendation-GraphPieContainer">
                        <div className="finulab-chartLoading">
                            <div className="finulab-chartLoadingSpinner"/>
                            <img src="/assets/Finulab_Icon.png" alt="" className="finulab-chartLoadingImg" />
                        </div>
                    </div> : 
                    <Doughnut data={data} options={options} plugins={[gaugeChartText]}/>
                }
            </div>
        )
    }
}