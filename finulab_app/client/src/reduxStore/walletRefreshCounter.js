import {createSlice} from '@reduxjs/toolkit';

export const walletRefreshCounterSlice = createSlice(
    {
        name: "walletRefreshCounter",
        initialState: {
            walletRefreshCounter: {
                "state": 0
            }
        },
        reducers: {
            setWalletRefreshCounter: (state, action) => {
                state.walletRefreshCounter = {
                    "state": action.payload
                }
            }
        }
    }
);

export const {
    setWalletRefreshCounter
} = walletRefreshCounterSlice.actions;
export const selectWalletRefreshCounter = (state) => state.walletRefreshCounter.walletRefreshCounter;
export default walletRefreshCounterSlice.reducer;