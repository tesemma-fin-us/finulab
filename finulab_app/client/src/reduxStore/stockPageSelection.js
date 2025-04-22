import {createSlice} from '@reduxjs/toolkit';

export const stockPageSelectionSlice = createSlice(
    {
        name: "stockPageSelection",
        initialState: {
            stockPageSelection: {
                "symbol": "",
                "selection": {
                    "type": "",
                    "selectedDesc": {}
                },
                "scrollTop": 0
            }
        },
        reducers: {
            setStockPageSelectionSymbol: (state, action) => {
                state.stockPageSelection = {
                    ...state.stockPageSelection,
                    "symbol": action.payload
                }
            },
            setStockPageSelection: (state, action) => {
                state.stockPageSelection = {
                    ...state.stockPageSelection, 
                    "selection": {...action.payload}
                }
            },
            updateStockPageSelectionScrollTop: (state, action) => {
                state.stockPageSelection = {
                    ...state.stockPageSelection,
                    "scrollTop": action.payload
                }
            }
        }
    }
);

export const {
    setStockPageSelectionSymbol,
    setStockPageSelection,
    updateStockPageSelectionScrollTop
} = stockPageSelectionSlice.actions;
export const selectStockPageSelection = (state) => state.stockPageSelection.stockPageSelection;
export default stockPageSelectionSlice.reducer;