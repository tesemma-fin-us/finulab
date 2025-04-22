import {createSlice} from '@reduxjs/toolkit';

export const commentsEngagementSlice = createSlice(
    {
        name: "commentsEngagement",
        initialState: {
            commentsEngagement: []
        },
        reducers: {
            setCommentsEngagement: (state, action) => {
                state.commentsEngagement = [...action.payload];
            },
            addToCommentsEngagement: (state, action) => {
                state.commentsEngagement = [
                    ...state.commentsEngagement, ...action.payload
                ];
            },
            removeFromCommentsEngagement: (state, action) => {
                state.commentsEngagement = state.commentsEngagement.filter(eng => eng.commentId !== action.payload);
            },
            clearCommentsEngagement: (state, action) => {
                state.commentsEngagement = [];
            }
        }
    }
);

export const {setCommentsEngagement, addToCommentsEngagement, removeFromCommentsEngagement, clearCommentsEngagement} = commentsEngagementSlice.actions;
export const selectCommentsEngagement = (state) => state.commentsEngagement.commentsEngagement;
export default commentsEngagementSlice.reducer;