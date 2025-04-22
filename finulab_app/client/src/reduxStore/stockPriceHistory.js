import {add, format} from 'date-fns';
import {createSlice} from '@reduxjs/toolkit';

const today = new Date();
const dt_to = add(today, {"days": -1});
const dt_from = add(today, {"months": -3});

export const stockPriceHistorySlice = createSlice(
    {
        name: "stockPriceHistory",
        initialState: {
            stockPriceHistory: {
                "priceHistory": {
                    "symbol": "",
                    "data": [],
                    "dataLoading": true
                },
                "index": 0,
                "from": format(dt_from, "yyyy-MM-dd"),
                "to": format(dt_to, "yyyy-MM-dd")
            }
        },
        reducers: {
            updateStockPriceHistoryData: (state, action) => {
                state.stockPriceHistory = {
                    ...state.stockPriceHistory,
                    "priceHistory": {...action.payload}
                }
            },
            updateStockPriceHistoryIndex: (state, action) => {
                state.stockPriceHistory = {
                    ...state.stockPriceHistory,
                    "index": action.payload
                }
            },
            updateStockPriceHistoryFrom: (state, action) => {
                state.stockPriceHistory = {
                    ...state.stockPriceHistory,
                    "from": action.payload
                }
            },
            updateStockPriceHistoryTo: (state, action) => {
                state.stockPriceHistory = {
                    ...state.stockPriceHistory,
                    "to": action.payload
                }
            }
        }
    }
);

export const {
    updateStockPriceHistoryData,
    updateStockPriceHistoryIndex,
    updateStockPriceHistoryFrom,
    updateStockPriceHistoryTo
} = stockPriceHistorySlice.actions;
export const selectStockPriceHistory = (state) => state.stockPriceHistory.stockPriceHistory;
export default stockPriceHistorySlice.reducer;