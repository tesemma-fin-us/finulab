import React from 'react';
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

export default class PortfolioChart extends React.PureComponent {
    constructor(props) {
        super(props);
        this.state = {}
    }

    componentWillUnmount() {
        clearInterval(this.blinkInterval);
        clearInterval(this.animationInterval);
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

        const data = {
            labels: this.props.loading ? null : this.props.labels,
            datasets: [{
                lable: ``,
                data: this.props.loading ? null : this.props.plot,
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
                borderWidth: 1.25,
                tension: 0.1,
                showLine: true
            }]
        }

        const pointerToThis = this;
        let width, height, gradient;
        const generalPointerToThis = this;
        function getGradient(ctx, chartArea, scales) {
            if(pointerToThis.props.loading) return null;

            const chartWidth = chartArea.right - chartArea.left;
            const chartHeight = chartArea.bottom - chartArea.top;

            if(gradient === null || width !== chartWidth || height !== chartHeight) {
                const pointPositive = scales.y.getPixelForValue(pointerToThis.props.plot[0]);
                const pointPositiveHeight = pointPositive - chartArea.top + 4;
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
                            yMin: this.props.loading ? null : this.props.plot[0],
                            yMax: this.props.loading ? null : this.props.plot[0],
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
                    enabled: false
                }
            },
            hover: {
                enabled: false
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
                        unit: `minute`
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

        return(
            <div 
                    style={
                        {"display": "flex", "width": "100%", "minWidth": "100%", "maxWidth": "100%", "height": "75px", "minHeight": "75px", "maxHeight": "75px"}
                    }  
                >
                <Line data={data} options={options} />
            </div>
        )
    }
}