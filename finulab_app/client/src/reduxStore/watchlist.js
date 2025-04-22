import {createSlice} from '@reduxjs/toolkit';

export const watchlistSlice = createSlice(
    {
        name: "watchlist",
        initialState: {
            watchlist: []
        },
        reducers: {
            setWatchlist: (state, action) => {
                state.watchlist = [...action.payload];
            },
            addToWatchlist: (state, action) => {
                state.watchlist = [
                    ...state.watchlist, action.payload
                ];
            },
            removeFromWatchlist: (state, action) => {
                state.watchlist = state.watchlist.filter(watching => watching !== action.payload);
            }
        }
    }
);

export const {setWatchlist, addToWatchlist, removeFromWatchlist} = watchlistSlice.actions;
export const selectWatchlist = (state) => state.watchlist.watchlist;
export default watchlistSlice.reducer;