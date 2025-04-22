import {createSlice} from '@reduxjs/toolkit';

export const marketConfigSlice = createSlice(
    {
        name: "marketConfig",
        initialState: {
            marketConfig: {
                "data": {},
                "dataLoading": true
            }
        },
        reducers: {
            setMarketConfig: (state, action) => {
                state.marketConfig = {...action.payload};
            }
        }
    }
);

export const {setMarketConfig} = marketConfigSlice.actions;
export const selectMarketConfig = (state) => state.marketConfig.marketConfig;
export default marketConfigSlice.reducer;