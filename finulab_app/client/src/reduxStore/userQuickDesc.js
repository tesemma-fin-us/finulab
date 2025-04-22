import {createSlice} from '@reduxjs/toolkit';

export const userQuickDescSlice = createSlice(
    {
        name: "userQuickDesc",
        initialState: {
            userQuickDesc: {
                "desc": {
                    "data": {},
                    "dataLoading": true
                }
            }
        },
        reducers: {
            setUserQuickDesc: (state, action) => {
                state.userQuickDesc = {...action.payload}
            }
        }
    }
);

export const {setUserQuickDesc} = userQuickDescSlice.actions;
export const selectUserQuickDesc = (state) => state.userQuickDesc.userQuickDesc;
export default userQuickDescSlice.reducer;