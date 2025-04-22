import {createSlice} from '@reduxjs/toolkit';

export const homeFinancialScrollSlice = createSlice(
    {
        name: "homeFinancialScroll",
        initialState: {
            homeFinancialScroll: {
                "fixed": false,
                "scrollTop": 0,
                "priceDisplay": false
            }
        },
        reducers: {
            updateHomeFinancialScroll: (state, action) => {
                state.homeFinancialScroll = {
                    ...state.homeFinancialScroll,
                    ...{...action.payload}
                }
            }
        }
    }
);

export const {
    updateHomeFinancialScroll
} = homeFinancialScrollSlice.actions;
export const selectHomeFinancialScrollState = (state) => state.homeFinancialScroll.homeFinancialScroll;
export default homeFinancialScrollSlice.reducer;