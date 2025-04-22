import {createSlice} from '@reduxjs/toolkit';

export const stockPageDataSlice = createSlice(
    {
        name: "stockPageData",
        initialState: {
            stockPageData: {
                "page": {
                    "data": {},
                    "dataLoading": true
                },
                "scrollTop": 0
            }
        },
        reducers: {
            updateStockPageData: (state, action) => {
                state.stockPageData = {
                    ...state.stockPageData,
                    "page": {...action.payload}
                }
            },
            updateStockPagePosition: (state, action) => {
                state.stockPageData = {
                    ...state.stockPageData,
                    "scrollTop": action.payload
                }
            }
        }
    }
);

export const {
    updateStockPageData, 
    updateStockPagePosition
} = stockPageDataSlice.actions;
export const selectStockPageData = (state) => state.stockPageData.stockPageData;
export default stockPageDataSlice.reducer;