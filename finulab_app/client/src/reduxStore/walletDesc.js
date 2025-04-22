import {createSlice} from '@reduxjs/toolkit';

export const walletDescSlice = createSlice(
    {
        name: "walletDesc",
        initialState: {
            walletDesc: {
                "balance": {
                    "data": [],
                    "dataLoading": true
                }
            }
        },
        reducers: {
            setBalance: (state, action) => {
                state.walletDesc = {
                    ...state.walletDesc,
                    "balance": {...action.payload}
                }
            }
        }
    }
);

export const {
    setBalance
} = walletDescSlice.actions;
export const selectWalletDesc = (state) => state.walletDesc.walletDesc;
export default walletDescSlice.reducer;