import {createSlice} from '@reduxjs/toolkit';

export const marketHoldingsSlice = createSlice(
    {
        name: "marketHoldings",
        initialState: {
            marketHoldings: []
        },
        reducers: {
            setMarketHoldings: (state, action) => {
                state.marketHoldings = [...action.payload];
            },
            addToMarketHoldings: (state, action) => {
                state.marketHoldings = [
                    ...state.marketHoldings, ...action.payload
                ];
            },
            removeFromMarketHoldings: (state, action) => {
                state.marketHoldings = state.marketHoldings.filter(holding => holding.predictionId !== action.payload);
            }
        }
    }
);

export const {setMarketHoldings, addToMarketHoldings, removeFromMarketHoldings} = marketHoldingsSlice.actions;
export const selectMarketHoldings = (state) => state.marketHoldings.marketHoldings;
export default marketHoldingsSlice.reducer;