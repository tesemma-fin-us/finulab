import {createSlice} from '@reduxjs/toolkit';

export const moderatorStatusSlice = createSlice(
    {
        name: "moderatorStatus",
        initialState: {
            moderatorStatus: []
        },
        reducers: {
            setModeratorStatus: (state, action) => {
                state.moderatorStatus = [...action.payload];
            },
            addToModeratorStatus: (state, action) => {
                state.moderatorStatus = [
                    ...state.moderatorStatus, action.payload
                ];
            },
            removeFromModeratorStatus: (state, action) => {
                state.moderatorStatus = state.moderatorStatus.filter(modStat => modStat.community !== action.payload);
            }
        }
    }
);

export const {setModeratorStatus, addToModeratorStatus, removeFromModeratorStatus} = moderatorStatusSlice.actions;
export const selectModeratorStatus = (state) => state.moderatorStatus.moderatorStatus;
export default moderatorStatusSlice.reducer;