import {createSlice} from '@reduxjs/toolkit';

export const stockDashboardNewsSlice = createSlice(
    {
        name: "stockDashboardNews",
        initialState: {
            stockDashboardNews: {
                "type": "",
                "news": {
                    "data": [],
                    "dataLoading": true
                },
                "index": 0,
            }
        },
        reducers: {
            clearStockDashboardNews: (state, action) => {
                state.stockDashboardNews = {
                    "type": action.payload,
                    "news": {
                        "data": [],
                        "dataLoading": true
                    },
                    "index": 0
                }
            },
            updateStockDashboardNews: (state, action) => {
                state.stockDashboardNews = {
                    ...state.stockDashboardNews,
                    "news": {...action.payload}
                }
            },
            updateStockDashboardNewsIndex: (state, action) => {
                state.stockDashboardNews = {
                    ...state.stockDashboardNews,
                    "index": action.payload
                }
            }
        }
    }
);

export const {
    clearStockDashboardNews,
    updateStockDashboardNews,
    updateStockDashboardNewsIndex
} = stockDashboardNewsSlice.actions;
export const selectStockDashboardNews = (state) => state.stockDashboardNews.stockDashboardNews;
export default stockDashboardNewsSlice.reducer;