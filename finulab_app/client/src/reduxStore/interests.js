import {createSlice} from '@reduxjs/toolkit';

export const interestsSlice = createSlice(
    {
        name: "interests",
        initialState: {
            interests: []
        },
        reducers: {
            setInterests: (state, action) => {
                state.interests = [...action.payload];
            },
            addToInterests: (state, action) => {
                state.interests = [
                    ...state.interests, action.payload
                ];
            },
            removeFromInterests: (state) => {
                state.interests = state.interests.filter(interest => interest[0] !== action.payload);
            }
        }
    }
);

export const {setInterests, addToInterests, removeFromInterests} = interestsSlice.actions;
export const selectInterests = (state) => state.interests.interests;
export default interestsSlice.reducer;