import {createSlice} from '@reduxjs/toolkit';

export const marketFineDetailsSlice = createSlice(
    {
        name: "marketFineDetails",
        initialState: {
            marketFineDetails: {
                "marketId": "",
                "activity": {
                    "index": 0,
                    "data": [],
                    "dataCount": 0,
                    "activeUsers": []
                },
                "topHolders": {
                    "yes": [],
                    "no": [],
                    "holders": []
                },
                "dataLoading": true
            }
        },
        reducers: {
            setMarketFineDetails: (state, action) => {
                state.marketFineDetails = {...action.payload};
            },
            setActivityData: (state, action) => {
                const {index, data, activeUsers} = action.payload;

                state.marketFineDetails = {
                    ...state.marketFineDetails,
                    "activity": {
                        ...state.marketFineDetails.activity,
                        "index": index,
                        "data": [...state.marketFineDetails.activity.data, ...data],
                        "activeUsers": [...state.marketFineDetails.activity.activeUsers, ...activeUsers]
                    }
                }
            },
            setActivityIndex: (state, action) => {
                state.marketFineDetails = {
                    ...state.marketFineDetails,
                    "activity": {
                        ...state.marketFineDetails.activity,
                        "index": action.payload
                    }
                }
            }
        }
    }
);

export const {setMarketFineDetails, setActivityData, setActivityIndex} = marketFineDetailsSlice.actions;
export const selectMarketFineDetails = (state) => state.marketFineDetails.marketFineDetails;
export default marketFineDetailsSlice.reducer;