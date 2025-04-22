import {createSlice} from '@reduxjs/toolkit';

export const stockNewsSlice = createSlice(
    {
        name: "stockNews",
        initialState: {
            stockNews: {
                "news": {
                    "data": [],
                    "dataLoading": true
                },
                "index": 0
            }
        },
        reducers: {
            updateStockNews: (state, action) => {
                state.stockNews = {
                    ...state.stockNews,
                    "news": {...action.payload}
                }
            },
            updateStockNewsIndex: (state, action) => {
                state.stockNews = {
                    ...state.stockNews,
                    "index": action.payload
                }
            }
        }
    }
);

export const {
    updateStockNews,
    updateStockNewsIndex
} = stockNewsSlice.actions;
export const selectStockNews = (state) => state.stockNews.stockNews;
export default stockNewsSlice.reducer;