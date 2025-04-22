import {createSlice} from '@reduxjs/toolkit';

export const signUpSupportSlice = createSlice(
    {
        name: "signUpSupport",
        initialState: {
            signUpSupport: {
                "data": {},
                "dataLoading": true
            }
        },
        reducers: {
            setSignUpSupport: (state, action) => {
                state.signUpSupport = {...action.payload};
            }
        }
    }
);

export const {setSignUpSupport} = signUpSupportSlice.actions;
export const selectSignUpSupport = (state) => state.signUpSupport.signUpSupport;
export default signUpSupportSlice.reducer;