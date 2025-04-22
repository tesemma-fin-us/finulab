import {createSlice} from '@reduxjs/toolkit';

export const marketDataSlice = createSlice(
    {
        name: "marketData",
        initialState: {
            marketData: {
                "query": "",
                "categories": {
                    "data": [],
                    "dataLoading": true
                },
                "selectedView": "For You",
                "displayData": {
                    "category": "",
                    "predictions": [],
                    "data": [],
                    "liveCount": 0,
                    "dataLoading": true
                },
                "dataBank": [],
                "selected": {
                    "type": "",
                    "selectedDesc": {}
                }
            }
        },
        reducers: {
            updateQuery: (state, action) => {
                state.marketData = {
                    ...state.marketData,
                    "query": action.payload
                }
            },
            setCategories: (state, action) => {
                state.marketData = {
                    ...state.marketData,
                    "categories": {...action.payload}
                }
            },
            setSelectedView: (state, action) => {
                state.marketData = {
                    ...state.marketData,
                    "selectedView": action.payload
                }
            },
            setDisplayData: (state, action) => {
                state.marketData = {
                    ...state.marketData,
                    "displayData": {...action.payload}
                }
            },
            setDataBank: (state, action) => {
                state.marketData = {
                    ...state.marketData,
                    "dataBank": [...action.payload]
                }
            },
            setSelected: (state, action) => {
                state.marketData = {
                    ...state.marketData,
                    "selected": {...action.payload}
                }
            }
        }
    }
);

export const {
    updateQuery,
    setCategories,
    setSelectedView,
    setDisplayData,
    setDataBank,
    setSelected
} = marketDataSlice.actions;
export const selectMarketData = (state) => state.marketData.marketData;
export default marketDataSlice.reducer;