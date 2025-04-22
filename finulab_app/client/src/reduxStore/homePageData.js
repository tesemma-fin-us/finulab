import {createSlice} from '@reduxjs/toolkit';

export const homePageDataSlice = createSlice(
    {
        name: "homePageData",
        initialState: {
            homePageData: {
                "pageData": {
                    "data": [],
                    "dataLoading": true
                },
                "followingData": {
                    "data": [],
                    "dataLoading": true
                },
                "followingDesc": {
                    "data": [],
                    "dataLoading": true
                },
                "selectedView": "for-you",
                "selected": {
                    "type": "",
                    "selectedDesc": {}
                },
                "position": {
                    "scrollTop": 0,
                    "visible": true
                },
                "followingPosition": {
                    "scrollTop": 0,
                    "visible": true
                },
                "processedHeights": {
                    "postHeights": [],
                    "processedRefs": {}
                },
                "followingProcessedHeights": {
                    "postHeights": [],
                    "processedRefs": {}
                }
            }
        },
        reducers: {
            updateHomePageData: (state, action) => {
                state.homePageData = {
                    ...state.homePageData,
                    "pageData": {...action.payload}
                }
            },
            updateHomePageFollowingData: (state, action) => {
                state.homePageData = {
                    ...state.homePageData,
                    "followingData": {...action.payload}
                }
            },
            setFollowingDesc: (state, action) => {
                state.homePageData = {
                    ...state.homePageData,
                    "followingDesc": {...action.payload}
                }
            },
            updateSelectedView: (state, action) => {
                state.homePageData = {
                    ...state.homePageData,
                    "selectedView": action.payload
                }
            },
            updateSelection: (state, action) => {
                state.homePageData = {
                    ...state.homePageData,
                    "selected": {...action.payload}
                }
            },
            updatePosition: (state, action) => {
                state.homePageData = {
                    ...state.homePageData,
                    "position": {...action.payload}
                }
            },
            updateFollowingPosition: (state, action) => {
                state.homePageData = {
                    ...state.homePageData,
                    "followingPosition": {...action.payload}
                }
            },
            updateProcessedHeights: (state, action) => {
                state.homePageData = {
                    ...state.homePageData,
                    "processedHeights": {...action.payload}
                }
            },
            updateFollowingProcessedHeights: (state, action) => {
                state.homePageData = {
                    ...state.homePageData,
                    "followingProcessedHeights": {...action.payload}
                }
            }
        }
    }
);

export const {
    updateHomePageData,
    updateHomePageFollowingData,
    setFollowingDesc,
    updateSelectedView,
    updateSelection,
    updatePosition,
    updateFollowingPosition,
    updateProcessedHeights,
    updateFollowingProcessedHeights
} = homePageDataSlice.actions;
export const selectHomePageData = (state) => state.homePageData.homePageData;
export default homePageDataSlice.reducer;