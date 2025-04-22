import {createSlice} from '@reduxjs/toolkit';

export const profileDataSlice = createSlice(
    {
        name: "profileData",
        initialState: {
            profileData: {
                "profileDesc": {
                    "data": {},
                    "dataLoading": true
                },
                "posts": {
                    "username": "",
                    "data": [],
                    "dataCount": 0,
                    "dataLoading": true
                },
                "processedHeights": {
                    "postHeights": [],
                    "processedRefs": {}
                },
                "markets": {
                    "username": "",
                    "data": [],
                    "markets": [],
                    "dataCount": 0,
                    "dataLoading": true
                },
                "marketsProcessedHeights": {
                    "postHeights": [],
                    "processedRefs": {}
                },
                "engaged": {
                    "username": "",
                    "type": "posts",
                    "data": [],
                    "support": [],
                    "dataCount": 0,
                    "dataLoading": true
                },
                "engagedProcessedHeights": {
                    "postHeights": [],
                    "processedRefs": {}
                },
                "notifications": {
                    "username": "",
                    "data": [],
                    "dataCount": 0,
                    "dataLoading": true
                },
                "watchlist": {
                    "username": "",
                    "notCovered": [],
                    "stocks": {
                        "data": [],
                        "support": []
                    },
                    "cryptos": {
                        "data": [],
                        "support": []
                    },
                    "dataLoading": true
                }
            }
        },
        reducers: {
            setProfileDesc: (state, action) => {
                state.profileData = {
                    ...state.profileData,
                    "profileDesc": {...action.payload}
                }
            },
            setPosts: (state, action) => {
                state.profileData = {
                    ...state.profileData,
                    "posts": {...action.payload}
                }
            },
            updatePosts: (state, action) => {
                state.profileData = {
                    ...state.profileData,
                    "posts": {
                        ...state.profileData.posts,
                        "data": [...state.profileData.posts.data, ...action.payload]
                    }
                }
            },
            updateProcessedHeights: (state, action) => {
                state.profileData = {
                    ...state.profileData,
                    "processedHeights": {...action.payload}
                }
            },
            processPostsHeights: (state, action) => {
                const { index, height } = action.payload;

                state.profileData = {
                    ...state.profileData, 
                    "processedHeights": {
                        "postHeights": [
                            ...state.profileData.processedHeights.postHeights.slice(0, index),
                            height,
                            ...state.profileData.processedHeights.postHeights.slice(index + 1)
                        ],
                        "processedRefs": {
                            ...state.profileData.processedHeights.processedRefs,
                            [index]: true
                        }
                    }
                }
            },
            clearProcessedHeights: (state, action) => {
                state.profileData = {
                    ...state.profileData,
                    "processedHeights": {
                        "postHeights": [],
                        "processedRefs": {}
                    }
                }
            },
            setMarkets: (state, action) => {
                state.profileData = {
                    ...state.profileData,
                    "markets": {...action.payload}
                }
            },
            updateMarkets: (state, action) => {
                const {data, markets} = action.payload;

                state.profileData = {
                    ...state.profileData,
                    "markets": {
                        ...state.profileData.markets,
                        "data": [...state.profileData.markets.data, ...data],
                        "markets": [...state.profileData.markets.markets, ...markets]
                    }
                }
            },
            updateMarketsProcessedHeights: (state, action) => {
                state.profileData = {
                    ...state.profileData,
                    "marketsProcessedHeights": {...action.payload}
                }
            },
            processMarketsPostsHeights: (state, action) => {
                const { index, height } = action.payload;

                state.profileData = {
                    ...state.profileData, 
                    "marketsProcessedHeights": {
                        "postHeights": [
                            ...state.profileData.marketsProcessedHeights.postHeights.slice(0, index),
                            height,
                            ...state.profileData.marketsProcessedHeights.postHeights.slice(index + 1)
                        ],
                        "processedRefs": {
                            ...state.profileData.marketsProcessedHeights.processedRefs,
                            [index]: true
                        }
                    }
                }
            },
            clearMarketsProcessedHeights: (state, action) => {
                state.profileData = {
                    ...state.profileData,
                    "marketsProcessedHeights": {
                        "postHeights": [],
                        "processedRefs": {}
                    }
                }
            },
            setEngaged: (state, action) => {
                state.profileData = {
                    ...state.profileData,
                    "engaged": {...action.payload}
                }
            },
            updateEnagedProcessedHeights: (state, action) => {
                state.profileData = {
                    ...state.profileData,
                    "engagedProcessedHeights": {...action.payload}
                }
            },
            processEngagedPostsHeights: (state, action) => {
                const { index, height } = action.payload;

                state.profileData = {
                    ...state.profileData, 
                    "engagedProcessedHeights": {
                        "postHeights": [
                            ...state.profileData.engagedProcessedHeights.postHeights.slice(0, index),
                            height,
                            ...state.profileData.engagedProcessedHeights.postHeights.slice(index + 1)
                        ],
                        "processedRefs": {
                            ...state.profileData.engagedProcessedHeights.processedRefs,
                            [index]: true
                        }
                    }
                }
            },
            clearEngagedProcessedHeights: (state, action) => {
                state.profileData = {
                    ...state.profileData,
                    "engagedProcessedHeights": {
                        "postHeights": [],
                        "processedRefs": {}
                    }
                }
            },
            setNotifications: (state, action) => {
                state.profileData = {
                    ...state.profileData,
                    "notifications": {...action.payload}
                }
            },
            updateNotifications: (state, action) => {
                state.profileData = {
                    ...state.profileData,
                    "notifications": {
                        ...state.profileData.notifications,
                        "data": [...state.profileData.notifications.data, ...action.payload]
                    }
                }
            },
            setProfileWatchlist: (state, action) => {
                state.profileData = {
                    ...state.profileData,
                    "watchlist": {...action.payload}
                }
            }
        }
    }
);

export const {
    setProfileDesc,
    setPosts,
    updatePosts,
    updateProcessedHeights,
    processPostsHeights,
    clearProcessedHeights,
    setMarkets,
    updateMarkets,
    updateMarketsProcessedHeights,
    processMarketsPostsHeights,
    clearMarketsProcessedHeights,
    setEngaged,
    updateEnagedProcessedHeights,
    processEngagedPostsHeights,
    clearEngagedProcessedHeights,
    setNotifications,
    updateNotifications,
    setProfileWatchlist
} = profileDataSlice.actions;
export const selectProfileData = (state) => state.profileData.profileData;
export default profileDataSlice.reducer;