import {createSlice} from '@reduxjs/toolkit';

export const stockDashboardDataSlice = createSlice(
    {
        name: "stockDashboardData",
        initialState: {
            stockDashboardData: {
                "type": "",
                "page": {
                    "data": {},
                    "dataLoading": true
                },
                "index": 0,
                "selection": "marketCap"
            }
        },
        reducers: {
            clearStockDashboardData: (state, action) => {
                state.stockDashboardData = {
                    "type": action.payload,
                    "page": {
                        "data": {},
                        "dataLoading": true
                    },
                    "index": 0,
                    "selection": "marketCap"
                }
            },
            updateStockDashboardData: (state, action) => {
                state.stockDashboardData = {
                    ...state.stockDashboardData,
                    "page": {...action.payload}
                }
            },
            updateStockDashboardIndex: (state, action) => {
                state.stockDashboardData = {
                    ...state.stockDashboardData,
                    "index": action.payload
                }
            },
            updateStockDashboardSelection: (state, action) => {
                state.stockDashboardData = {
                    ...state.stockDashboardData,
                    "selection": action.payload
                }
            }
        }
    }
);

export const {
    clearStockDashboardData,
    updateStockDashboardData, 
    updateStockDashboardIndex,
    updateStockDashboardSelection
} = stockDashboardDataSlice.actions;
export const selectStockDashboardData = (state) => state.stockDashboardData.stockDashboardData;
export default stockDashboardDataSlice.reducer;