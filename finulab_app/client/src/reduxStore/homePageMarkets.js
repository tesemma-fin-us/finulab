import {createSlice} from '@reduxjs/toolkit';

export const homePageMarketsSlice = createSlice(
    {
        name: "homePageMarkets",
        initialState: {
            homePageMarkets: {
                "markets": {
                    "predictions": [],
                    "data": [],
                    "liveCount": 0,
                    "dataLoading": true
                },
                "scrollTop": 0
            }
        },
        reducers: {
            updateHomePageMarkets: (state, action) => {
                state.homePageMarkets = {
                    ...state.homePageMarkets,
                    "markets": {...action.payload}
                }
            },
            updateHomePageMarketsScrollTop: (state, action) => {
                state.homePageMarkets = {
                    ...state.homePageMarkets,
                    "scrollTop": action.payload
                }
            }
        }
    }
);

export const {
    updateHomePageMarkets,
    updateHomePageMarketsScrollTop
} = homePageMarketsSlice.actions;
export const selectHomePageMarkets = (state) => state.homePageMarkets.homePageMarkets;
export default homePageMarketsSlice.reducer;