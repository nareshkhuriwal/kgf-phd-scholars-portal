import { configureStore } from '@reduxjs/toolkit'
import authReducer from './authSlice'
import papersReducer from './papersSlice'
import collectionsReducer from './collectionsSlice';
import reviewsReducer from './reviewsSlice';
import reportsReducer from './reportsSlice';
import importReducer from './importSlice';
import commentsReducer from './commentsSlice';
import dashboardReducer from './dashboardSlice';
import chaptersReducer from './chaptersSlice';
import settingsReducer from './settingsSlice';
import profileReducer from './profileSlice';
import highlightsReducer from './highlightsSlice';
import researchersReducer from './researchersSlice';
import inviteNotificationsReducer from './inviteNotificationsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    papers: papersReducer,
    collections: collectionsReducer,
    reviews: reviewsReducer,
    reports: reportsReducer,
    importer: importReducer,
    comments: commentsReducer,
    dashboard: dashboardReducer,
    chapters: chaptersReducer,
    profile: profileReducer,
    settings: settingsReducer,
    highlights: highlightsReducer,  // to be implemented
    researchers: researchersReducer,
    inviteNotifications: inviteNotificationsReducer,
  },
})

export default store