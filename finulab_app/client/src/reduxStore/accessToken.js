import { createSlice } from '@reduxjs/toolkit';

export const accessTokenSlice = createSlice(
    {
        name: "accessToken",
        initialState: {
            accessState: ""
        },
        reducers: {
            updateAccessState: (state, action) => {
                state.accessState = action.payload;
            }
        }
    }
);

export const {updateAccessState} = accessTokenSlice.actions;
export const selectAccessState = (state) => state.accessToken.accessState;
export default accessTokenSlice.reducer;