import {createSlice} from '@reduxjs/toolkit';

export const commentsSlice = createSlice(
    {
        name: "comments",
        initialState: {
            comments: {
                "_id": "",
                "type": "",
                "data": [],
                "viewCount": 0,
                "dataCount": 0,
                "dataLoading": true,
                "commentExpandLoading": []
            }
        },
        reducers: {
            setComments: (state, action) => {
                state.comments = {...action.payload};
            },
            clearComments: (state, action) => {
                state.comments = {
                    "_id": "",
                    "type": "",
                    "data": [],
                    "viewCount": 0,
                    "dataCount": 0,
                    "dataLoading": true,
                    "commentExpandLoading": []
                };
            },
            updateComments: (state, action) => {
                const {data, viewCount, commentExpandLoading} = action.payload
                state.comments = {
                    ...state.comments,
                    data: data,
                    viewCount: viewCount,
                    commentExpandLoading: commentExpandLoading
                }
            }
        }
    }
);

export const {setComments, clearComments, updateComments} = commentsSlice.actions;
export const selectComments = (state) => state.comments.comments;
export default commentsSlice.reducer;