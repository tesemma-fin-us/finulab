import { createSlice } from '@reduxjs/toolkit';

export const appViewSlice = createSlice(
    {
        name: "appView",
        initialState: {
            appView: {
                "page": "", 
                "displayView": "",
                "params": {}
            }
        },
        reducers: {
            updateAppViewState: (state, action) => {
                state.appView = {...action.payload};
            }
        }
    }
);

export const {updateAppViewState} = appViewSlice.actions;
export const selectAppViewState = (state) => state.appView.appView;
export default appViewSlice.reducer;