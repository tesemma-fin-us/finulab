import {createSlice} from '@reduxjs/toolkit';

export const recommendationsSlice = createSlice(
    {
        name: "recommendations",
        initialState: {
            recommendations: []
        },
        reducers: {
            setRecommendations: (state, action) => {
                state.recommendations = [...action.payload];
            },
            addToRecommendations: (state, action) => {
                state.recommendations = [
                    ...state.recommendations, action.payload
                ];
            },
            removeFromRecommendations: (state, action) => {
                state.recommendations = state.recommendations.filter(rec => rec.symbol !== action.payload);
            }
        }
    }
);

export const {setRecommendations, addToRecommendations, removeFromRecommendations} = recommendationsSlice.actions;
export const selectRecommendations = (state) => state.recommendations.recommendations;
export default recommendationsSlice.reducer;