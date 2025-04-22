import {createSlice} from '@reduxjs/toolkit';

export const homePageWatchlistSlice = createSlice(
    {
        name: "homePageWatchlist",
        initialState: {
            homePageWatchlist: {
                "watchlist": {
                    "stocks": [],
                    "stockMarket": [],

                    "cryptos": [],
                    "cryptoMarket": [],

                    "watching": [],
                    
                    "loading": true
                }
            }
        },
        reducers: {
            updateHomePageWatchlist: (state, action) => {
                state.homePageWatchlist = {
                    ...state.homePageWatchlist,
                    "watchlist": {...action.payload}
                }
            }
        }
    }
);

export const {
    updateHomePageWatchlist
} = homePageWatchlistSlice.actions;
export const selectHomePageWatchlist = (state) => state.homePageWatchlist.homePageWatchlist;
export default homePageWatchlistSlice.reducer;