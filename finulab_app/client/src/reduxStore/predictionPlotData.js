import {createSlice} from '@reduxjs/toolkit';

export const predictionPlotDataSlice = createSlice(
    {
        name: "predictionPlotData",
        initialState: {
            predictionPlotData: {
                "data": {
                    "labels": [],
                    "plotOne": [],
                    "plotTwo": [],
                    "dataLoading": true
                },
                "index": 0
            }
        },
        reducers: {
            setPredictionPlotData: (state, action) => {
                state.predictionPlotData = {
                    ...state.predictionPlotData,
                    "data": {...action.payload}
                }
            },
            addPredictionPlotData: (state, action) => {
                const { index, labels, plotOne, plotTwo } = action.payload;

                state.predictionPlotData = {
                    ...state.predictionPlotData,
                    "data": {
                        ...state.predictionPlotData.data,
                        "labels": [
                            ...state.predictionPlotData.data.labels.slice(0, index),
                            labels,
                            ...state.predictionPlotData.data.labels.slice(index + 1)
                        ],
                        "plotOne": [
                            ...state.predictionPlotData.data.plotOne.slice(0, index),
                            plotOne,
                            ...state.predictionPlotData.data.plotOne.slice(index + 1)
                        ],
                        "plotTwo": [
                            ...state.predictionPlotData.data.plotTwo.slice(0, index),
                            plotTwo,
                            ...state.predictionPlotData.data.plotTwo.slice(index + 1)
                        ]
                    }
                }
            },
            updatePredictionPlotDataIndex: (state, action) => {
                state.predictionPlotData = {
                    ...state.predictionPlotData,
                    "index": action.payload
                }
            }
        }
    }
);

export const {
    setPredictionPlotData, 
    addPredictionPlotData,
    updatePredictionPlotDataIndex
} = predictionPlotDataSlice.actions;
export const selectPredictionPlotData = (state) => state.predictionPlotData.predictionPlotData;
export default predictionPlotDataSlice.reducer;