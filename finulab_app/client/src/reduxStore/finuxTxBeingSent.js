import {createSlice} from '@reduxjs/toolkit';

export const finuxTxBeingSentSlice = createSlice(
    {
        name: "finuxTxBeingSent",
        initialState: {
            finuxTxBeingSent: {
                "state": false
            }
        },
        reducers: {
            setFinuxTxBeingSent: (state, action) => {
                state.finuxTxBeingSent = {
                    "state": action.payload
                }
            }
        }
    }
);

export const {
    setFinuxTxBeingSent
} = finuxTxBeingSentSlice.actions;
export const selectFinuxTxBeingSent = (state) => state.finuxTxBeingSent.finuxTxBeingSent;
export default finuxTxBeingSentSlice.reducer;