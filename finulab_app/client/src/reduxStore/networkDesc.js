import {createSlice} from '@reduxjs/toolkit';

export const networkDescSlice = createSlice(
    {
        name: "networkDesc",
        initialState: {
            networkDesc: {
                "communities": {
                    "username": "",
                    "data": [],
                    "dataCount": 0,
                    "dataLoading": true
                },
                "following": {
                    "username": "",
                    "data": [],
                    "dataCount": 0,
                    "dataLoading": true
                },
                "followers": {
                    "username": "",
                    "data": [],
                    "dataCount": 0,
                    "dataLoading": true
                }
            }
        },
        reducers: {
            setNetworkCommunities: (state, action) => {
                state.networkDesc = {
                    ...state.networkDesc,
                    "communities": {...action.payload}
                }
            },
            setNetworkFollowing: (state, action) => {
                state.networkDesc = {
                    ...state.networkDesc,
                    "following": {...action.payload}
                }
            },
            setNetworkFollowers: (state, action) => {
                state.networkDesc = {
                    ...state.networkDesc,
                    "followers": {...action.payload}
                }
            }
        }
    }
);

export const {
    setNetworkCommunities,
    setNetworkFollowing,
    setNetworkFollowers
} = networkDescSlice.actions;
export const selectNetworkDesc = (state) => state.networkDesc.networkDesc;
export default networkDescSlice.reducer;