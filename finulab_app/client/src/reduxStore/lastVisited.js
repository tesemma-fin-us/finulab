import {createSlice} from '@reduxjs/toolkit';

export const lastVisitedSlice = createSlice(
    {
        name: "lastVisited",
        initialState: {
            lastVisited: []
        },
        reducers: {
            setLastVisited: (state, action) => {
                state.lastVisited = [...action.payload];
            },
            addToLastVisited: (state, action) => {
                if(state.lastVisited.length <= 25) {
                    state.lastVisited = [
                        action.payload,
                        ...state.lastVisited
                    ];
                } else {
                    state.lastVisited = [
                        action.payload,
                        ...state.lastVisited.slice(0, state.lastVisited.length - 1)
                    ];
                }
            }
        }
    }
);

export const {setLastVisited, addToLastVisited} = lastVisitedSlice.actions;
export const selectLastVisited = (state) => state.lastVisited.lastVisited;
export default lastVisitedSlice.reducer;