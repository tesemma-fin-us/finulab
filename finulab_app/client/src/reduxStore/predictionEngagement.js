import {createSlice} from '@reduxjs/toolkit';

export const predictionEngagementSlice = createSlice(
    {
        name: "predictionEngagement",
        initialState: {
            predictionEngagement: []
        },
        reducers: {
            setPredictionEngagement: (state, action) => {
                state.predictionEngagement = [...action.payload];
            },
            addToPredictionEngagement: (state, action) => {
                state.predictionEngagement = [
                    ...state.predictionEngagement, ...action.payload
                ];
            },
            removeFromPredictionEngagement: (state, action) => {
                state.predictionEngagement = state.predictionEngagement.filter(eng => eng.predictionId !== action.payload);
            }
        }
    }
);

export const {setPredictionEngagement, addToPredictionEngagement, removeFromPredictionEngagement} = predictionEngagementSlice.actions;
export const selectPredictionEngagement = (state) => state.predictionEngagement.predictionEngagement;
export default predictionEngagementSlice.reducer;