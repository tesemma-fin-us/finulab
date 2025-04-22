import {createSlice} from '@reduxjs/toolkit';

export const stockDashboardMarketsSlice = createSlice(
    {
        name: "stockDashboardMarkets",
        initialState: {
            stockDashboardMarkets: {
                "markets": {
                    "predictions": [],
                    "data": [],
                    "liveCount": 0,
                    "dataLoading": true
                },
                "scrollTop": 0,
                "selected": {
                    "type": "",
                    "scrollTop": 0,
                    "selectedDesc": {}
                },
                "processedHeight": {
                    "postHeight": 0,
                    "processedRef": false
                }
            }
        },
        reducers: {
            updateStockDashboardMarkets: (state, action) => {
                state.stockDashboardMarkets = {
                    ...state.stockDashboardMarkets,
                    "markets": {...action.payload}
                }
            },
            updateStockDashboardMarketsScrollTop: (state, action) => {
                state.stockDashboardMarkets = {
                    ...state.stockDashboardMarkets,
                    "scrollTop": action.payload
                }
            },
            setStockDashboardMarketsSelected: (state, action) => {
                state.stockDashboardMarkets = {
                    ...state.stockDashboardMarkets,
                    "selected": {...action.payload}
                }
            },
            updateStockDashboardMarketsSelectedScrollTop: (state, action) => {
                state.stockDashboardMarkets = {
                    ...state.stockDashboardMarkets,
                    "selected": {...state.stockDashboardMarkets.selected, "scrollTop": action.payload}
                }
            },
            updateStockDashboardMarketsProcessedHeight: (state, action) => {
                state.stockDashboardMarkets = {
                    ...state.stockDashboardMarkets, 
                    "processedHeight": {...action.payload}
                }
            },
            clearStockDashboardMarketsProcessedHeight: (state, action) => {
                state.stockDashboardMarkets = {
                    ...state.stockDashboardMarkets, 
                    "processedHeight": {
                        "postHeight": 0,
                        "processedRef": false
                    }
                }
            }
        }
    }
);

export const {
    updateStockDashboardMarkets,
    updateStockDashboardMarketsScrollTop,
    setStockDashboardMarketsSelected,
    updateStockDashboardMarketsSelectedScrollTop,
    updateStockDashboardMarketsProcessedHeight,
    clearStockDashboardMarketsProcessedHeight
} = stockDashboardMarketsSlice.actions;
export const selectStockDashboardMarkets = (state) => state.stockDashboardMarkets.stockDashboardMarkets;
export default stockDashboardMarketsSlice.reducer;