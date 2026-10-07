import { combineReducers } from '@reduxjs/toolkit';
import themeReducer from './slices/themeSlice';
import authReducer from './slices/authSlice';

export const rootReducer = combineReducers({
  theme: themeReducer,
  auth: authReducer,
  // Future phase slices will be cleanly added here:
  // courses: coursesReducer,
  // learning: learningReducer,
  // dsa: dsaReducer,
  // quizzes: quizzesReducer,
});

export type RootState = ReturnType<typeof rootReducer>;
