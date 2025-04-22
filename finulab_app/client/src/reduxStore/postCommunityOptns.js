import {createSlice} from '@reduxjs/toolkit';

export const postCommunityOptnsSlice = createSlice(
    {
        name: "postCommunityOptns",
        initialState: {
            postCommunityOptns: {
                "data": [],
                "dataLoading": true
            }
        },
        reducers: {
            setPostCommunityOptns: (state, action) => {
                state.postCommunityOptns = {...action.payload};
            }
        }
    }
);

export const {setPostCommunityOptns} = postCommunityOptnsSlice.actions;
export const selectPostCommunityOptns = (state) => state.postCommunityOptns.postCommunityOptns;
export default postCommunityOptnsSlice.reducer;