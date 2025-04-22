import {createSlice} from '@reduxjs/toolkit';

export const walletSupportDataSlice = createSlice(
    {
        name: "walletSupportData",
        initialState: {
            walletSupportData: {
                "closed": {
                    "data": [],
                    "dataLoading": true
                },
                "history": {
                    "data": [],
                    "dataCount": 0,
                    "dataLoading": true
                },
                "txs": {
                    "data": [],
                    "next": "",
                    "dataLoading": true
                }
            }
        },
        reducers: {
            setClosed: (state, action) => {
                state.walletSupportData = {
                    ...state.walletSupportData,
                    "closed": {...action.payload}
                }
            },
            setHistory: (state, action) => {
                state.walletSupportData = {
                    ...state.walletSupportData,
                    "history": {...action.payload}
                }
            },
            setTxs: (state, action) => {
                state.walletSupportData = {
                    ...state.walletSupportData,
                    "txs": {...action.payload}
                }
            }
        }
    }
);

export const {
    setClosed,
    setHistory,
    setTxs
} = walletSupportDataSlice.actions;
export const selectWalletSupportData = (state) => state.walletSupportData.walletSupportData;
export default walletSupportDataSlice.reducer;