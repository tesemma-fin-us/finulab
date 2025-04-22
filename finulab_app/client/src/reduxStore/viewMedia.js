import {createSlice} from '@reduxjs/toolkit';

export const viewMediaSlice = createSlice(
    {
        name: "viewMedia",
        initialState: {
            viewMedia: {
                "index": 0,
                "media": []
            }
        },
        reducers: {
            setViewMedia: (state, action) => {
                state.viewMedia = {...action.payload}
            },
            updateViewMediaIndex: (state, action) => {
                state.viewMedia = {
                    ...state.viewMedia,
                    "index": action.payload
                }
            },
            clearViewMedia: (state, action) => {
                state.viewMedia = {
                    "index": 0,
                    "media": []
                }
            }
        }
    }
);

export const {setViewMedia, updateViewMediaIndex, clearViewMedia} = viewMediaSlice.actions;
export const selectViewMedia = (state) => state.viewMedia.viewMedia;
export default viewMediaSlice.reducer;