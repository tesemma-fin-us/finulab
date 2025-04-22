import {createSlice} from '@reduxjs/toolkit';

export const notificationsSlice = createSlice(
    {
        name: "notifications",
        initialState: {
            notifications: {
                "unread": {
                    "data": [],
                    "dataLoading": true
                },
                "communities": {
                    "data": {},
                    "dataLoading": true
                }
            }
        },
        reducers: {
            setQuickNotifications: (state, action) => {
                state.notifications = {...action.payload}
            }
        }
    }
);

export const {setQuickNotifications} = notificationsSlice.actions;
export const selectNotifications = (state) => state.notifications.notifications;
export default notificationsSlice.reducer;