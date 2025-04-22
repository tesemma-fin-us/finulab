import {createSlice} from '@reduxjs/toolkit';

export const pageInformationSlice = createSlice(
    {
        name: "pageInformation",
        initialState: {
            pageInformation: {
                "home": {
                    "data": {},
                    "visible": true, 
                    "scrollTop": 0
                },
                "wallet": {
                    "data": {},
                    "fixed": false,
                    "scrollTop": 0
                },
                "market": {
                    "data": {},
                    "visible": true, 
                    "scrollTop": 0
                },
                "profile": {
                    "view": "unknown",
                    "fixed": false,
                    "visible": true, 
                    "wallHeight": 0,
                    "scrollTop": 0,
                    "secondaryScrollTop": 0,
                    "tertiaryScrollTop": 0,
                    "quaterneryScrollTop": 0
                },
            }
        },
        reducers: {
            updateHomePageInformationState: (state, action) => {
                state.pageInformation = {
                    ...state.pageInformation,
                    "home": {...action.payload}
                };
            },
            updateWalletPageInformationState: (state, action) => {
                state.pageInformation = {
                    ...state.pageInformation,
                    "wallet": {...action.payload}
                }
            },
            updateMarketPageInformationState: (state, action) => {
                state.pageInformation = {
                    ...state.pageInformation,
                    "market": {...action.payload}
                }
            },
            updateProfilePageInformationState: (state, action) => {
                state.pageInformation = {
                    ...state.pageInformation,
                    "profile": {...action.payload}
                }
            },
        }
    }
);

export const {
    updateHomePageInformationState,
    updateWalletPageInformationState,
    updateMarketPageInformationState,
    updateProfilePageInformationState,
} = pageInformationSlice.actions;
export const selectPageInformationState = (state) => state.pageInformation.pageInformation;
export default pageInformationSlice.reducer;