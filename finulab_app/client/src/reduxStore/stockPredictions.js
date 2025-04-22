import {createSlice} from '@reduxjs/toolkit';

export const stockPredictionsSlice = createSlice(
    {
        name: "stockPredictions",
        initialState: {
            stockPredictions: {
                "symbol": "",
                "markets": {
                    "predictions": [],
                    "data": [],
                    "liveCount": 0,
                    "dataLoading": true
                },
                "position": {
                    "scrollTop": 0,
                    "visible": true
                }
            }
        },
        reducers: {
            updateStockPredictionsSymbol: (state, action) => {
                state.stockPredictions = {
                    ...state.stockPredictions,
                    "symbol": action.payload
                }
            },
            updateStockPredictions: (state, action) => {
                state.stockPredictions = {
                    ...state.stockPredictions,
                    "markets": {...action.payload}
                }
            },
            updateStockPredictionsPosition: (state, action) => {
                state.stockPredictions = {
                    ...state.stockPredictions,
                    "position": {...action.payload}
                }
            }
        }
    }
);

export const {
    updateStockPredictionsSymbol,
    updateStockPredictions,
    updateStockPredictionsPosition
} = stockPredictionsSlice.actions;
export const selectStockPredictions = (state) => state.stockPredictions.stockPredictions;
export default stockPredictionsSlice.reducer;