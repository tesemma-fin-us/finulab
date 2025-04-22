import {createSlice} from '@reduxjs/toolkit';

export const ipvFourSlice = createSlice(
    {
        name: "ipvFour",
        initialState: {
            ipvFour: {
                "data": {
                    "ipv4": "", 
                    "city": null, 
                    "state": null, 
                    "country": null
                },
                "dataLoading": true
            }
        },
        reducers: {
            setIpvFour: (state, action) => {
                state.ipvFour = {...action.payload}
            }
        }
    }
);

export const {setIpvFour} = ipvFourSlice.actions;
export const selectIpvFour = (state) => state.ipvFour.ipvFour;
export default ipvFourSlice.reducer;