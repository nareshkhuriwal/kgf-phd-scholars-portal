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


  },
})

export default store
