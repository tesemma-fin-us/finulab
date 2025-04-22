import {createSlice} from '@reduxjs/toolkit';

export const homePageCommunitiesSlice = createSlice(
    {
        name: "homePageCommunities",
        initialState: {
            homePageCommunities: {
                "communities": {
                    "data": [],
                    "your": [],
                    "dataLoading": true
                }
            }
        },
        reducers: {
            updateHomePageCommunities: (state, action) => {
                state.homePageCommunities = {
                    ...state.homePageCommunities,
                    "communities": {...action.payload}
                }
            }
        }
    }
);

export const {
    updateHomePageCommunities
} = homePageCommunitiesSlice.actions;
export const selectHomePageCommunities = (state) => state.homePageCommunities.homePageCommunities;
export default homePageCommunitiesSlice.reducer;