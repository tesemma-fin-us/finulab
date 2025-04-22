import {createSlice} from '@reduxjs/toolkit';

export const stockPostsSlice = createSlice(
    {
        name: "stockPosts",
        initialState: {
            stockPosts: {
                "symbol": "",
                "posts": {
                    "data": [],
                    "dataCount": 0,
                    "dataLoading": true
                },
                "position": {
                    "scrollTop": 0,
                    "visible": true
                },
                "processedHeights": {
                    "postHeights": [],
                    "processedRefs": {}
                }
            }
        },
        reducers: {
            updateStockPostsSymbol: (state, action) => {
                state.stockPosts = {
                    ...state.stockPosts,
                    "symbol": action.payload
                }
            },
            updateStockPosts: (state, action) => {
                state.stockPosts = {
                    ...state.stockPosts,
                    "posts": {...action.payload}
                }
            },
            updateStockPostsPosition: (state, action) => {
                state.stockPosts = {
                    ...state.stockPosts,
                    "position": {...action.payload}
                }
            },
            updateStockPostsProcessedHeights: (state, action) => {
                state.stockPosts = {
                    ...state.stockPosts,
                    "processedHeights": {...action.payload}
                }
            },
            processStockPostsHeights: (state, action) => {
                const { index, height } = action.payload;

                state.stockPosts = {
                    ...state.stockPosts, 
                    "processedHeights": {
                        "postHeights": [
                            ...state.stockPosts.processedHeights.postHeights.slice(0, index),
                            height,
                            ...state.stockPosts.processedHeights.postHeights.slice(index + 1)
                        ],
                        "processedRefs": {
                            ...state.stockPosts.processedHeights.processedRefs,
                            [index]: true
                        }
                    }
                }
            },
            clearStockPostsHeights: (state, action) => {
                state.stockPosts = {
                    ...state.stockPosts,
                    "processedHeights": {
                        "postHeights": [],
                        "processedRefs": {}
                    }
                }
            }
        }
    }
);

export const {
    updateStockPostsSymbol,
    updateStockPosts,
    updateStockPostsPosition,
    updateStockPostsProcessedHeights,
    processStockPostsHeights,
    clearStockPostsHeights
} = stockPostsSlice.actions;
export const selectStockPosts = (state) => state.stockPosts.stockPosts;
export default stockPostsSlice.reducer;