import {createSlice} from '@reduxjs/toolkit';

export const postEngagementSlice = createSlice(
    {
        name: "postEngagement",
        initialState: {
            postEngagement: []
        },
        reducers: {
            setPostEngagement: (state, action) => {
                state.postEngagement = [...action.payload];
            },
            addToPostEngagement: (state, action) => {
                state.postEngagement = [
                    ...state.postEngagement, ...action.payload
                ];
            },
            removeFromPostEngagement: (state, action) => {
                state.postEngagement = state.postEngagement.filter(eng => eng.postId !== action.payload);
            }
        }
    }
);

export const {setPostEngagement, addToPostEngagement, removeFromPostEngagement} = postEngagementSlice.actions;
export const selectPostEngagement = (state) => state.postEngagement.postEngagement;
export default postEngagementSlice.reducer;