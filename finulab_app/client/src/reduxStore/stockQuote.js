import {createSlice} from '@reduxjs/toolkit';

export const stockQuoteSlice = createSlice(
    {
        name: "stockQuote",
        initialState: {
            stockQuote: {
                "price": null,
                "quote": {
                    "data": {},
                    "dataLoading": true
                }
            }
        },
        reducers: {
            updateStockQuote: (state, action) => {
                state.stockQuote = {
                    ...state.stockQuote,
                    "quote": {...action.payload}
                }
            },
            updateStockPrice: (state, action) => {
                state.stockQuote = {
                    ...state.stockQuote,
                    "price": action.payload
                }
            }
        }
    }
);

export const {
    updateStockQuote,
    updateStockPrice
} = stockQuoteSlice.actions;
export const selectStockQuote = (state) => state.stockQuote.stockQuote;
export default stockQuoteSlice.reducer;