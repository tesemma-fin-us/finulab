import {createSlice} from '@reduxjs/toolkit';

export const newsEngagementSlice = createSlice(
    {
        name: "newsEngagement",
        initialState: {
            newsEngagement: []
        },
        reducers: {
            setNewsEngagement: (state, action) => {
                state.newsEngagement = [...action.payload];
            },
            addToNewsEngagement: (state, action) => {
                state.newsEngagement = [
                    ...state.newsEngagement, ...action.payload
                ];
            },
            removeFromNewsEngagement: (state, action) => {
                state.newsEngagement = state.newsEngagement.filter(eng => eng.newsId !== action.payload);
            }
        }
    }
);

export const {setNewsEngagement, addToNewsEngagement, removeFromNewsEngagement} = newsEngagementSlice.actions;
export const selectNewsEngagement = (state) => state.newsEngagement.newsEngagement;
export default newsEngagementSlice.reducer;