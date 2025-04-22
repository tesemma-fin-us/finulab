import {createSlice} from '@reduxjs/toolkit';

export const stockActiveDaysSlice = createSlice(
    {
        name: "stockActiveDays",
        initialState: {
            stockActiveDays: {
                "data": {},
                "timeStamp": 0
            }
        },
        reducers: {
            updateStockActiveDays: (state, action) => {
                state.stockActiveDays = {...action.payload}
            }
        }
    }
);

export const {
    updateStockActiveDays
} = stockActiveDaysSlice.actions;
export const selectStockActiveDays = (state) => state.stockActiveDays.stockActiveDays;
export default stockActiveDaysSlice.reducer;