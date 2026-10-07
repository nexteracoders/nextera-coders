import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { authService } from '../../services/auth.service';
import {
  AuthState,
  User,
  LoginCredentials,
  RegisterData,
  UpdateProfileData,
  ChangePasswordData,
  ApiResponse,
} from '../../types';

const initialState: AuthState = {
  user: null,
  isAuthenticated: false,
  isLoading: false,
  isInitialized: false,
  error: null,
};

// Async Thunks
export const checkAuth = createAsyncThunk('auth/checkAuth', async (_, { rejectWithValue }) => {
  try {
    const data = await authService.getMe();
    return data.user;
  } catch (err) {
    const error = err as ApiResponse;
    return rejectWithValue(error.message || 'Session expired or unauthenticated');
  }
});

export const loginUser = createAsyncThunk(
  'auth/login',
  async (credentials: LoginCredentials, { rejectWithValue }) => {
    try {
      const data = await authService.login(credentials);
      return data.user;
    } catch (err) {
      const error = err as ApiResponse;
      return rejectWithValue(error.message || 'Failed to sign in');
    }
  }
);

export const socialLoginUser = createAsyncThunk(
  'auth/socialLogin',
  async (
    socialData: { provider: 'google' | 'github'; email?: string; name?: string; avatar?: string; code?: string; credential?: string },
    { rejectWithValue }
  ) => {
    try {
      const data = await authService.socialLogin(socialData);
      return data.user;
    } catch (err) {
      const error = err as ApiResponse;
      return rejectWithValue(error.message || 'Failed to sign in with social provider');
    }
  }
);

export const verifyOtpLoginUser = createAsyncThunk(
  'auth/verifyOtpLogin',
  async (otpData: { email: string; otp: string }, { rejectWithValue }) => {
    try {
      const data = await authService.verifyOtpAndLogin(otpData);
      return data.user;
    } catch (err) {
      const error = err as ApiResponse;
      return rejectWithValue(error.message || 'OTP verification failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'auth/register',
  async (userData: RegisterData, { rejectWithValue }) => {
    try {
      const data = await authService.register(userData);
      return data.user;
    } catch (err) {
      const error = err as ApiResponse;
      return rejectWithValue(error.message || 'Failed to create account');
    }
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    await authService.logout();
    return null;
  } catch (err) {
    const error = err as ApiResponse;
    return rejectWithValue(error.message || 'Logout failed');
  }
});

export const updateUserProfile = createAsyncThunk(
  'auth/updateProfile',
  async (data: UpdateProfileData, { rejectWithValue }) => {
    try {
      const result = await authService.updateProfile(data);
      return result.user;
    } catch (err) {
      const error = err as ApiResponse;
      return rejectWithValue(error.message || 'Failed to update profile');
    }
  }
);

export const changeUserPassword = createAsyncThunk(
  'auth/changePassword',
  async (data: ChangePasswordData, { rejectWithValue }) => {
    try {
      await authService.changePassword(data);
      return true;
    } catch (err) {
      const error = err as ApiResponse;
      return rejectWithValue(error.message || 'Failed to change password');
    }
  }
);

export const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError: (state) => {
      state.error = null;
    },
    setUser: (state, action: PayloadAction<User | null>) => {
      state.user = action.payload;
      state.isAuthenticated = !!action.payload;
    },
    updateUserCoins: (state, action: PayloadAction<{ points: number }>) => {
      if (state.user) {
        state.user.points = action.payload.points;
      }
    },
  },
  extraReducers: (builder) => {
    // Check Auth (Session check on startup)
    builder
      .addCase(checkAuth.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(checkAuth.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(checkAuth.rejected, (state) => {
        state.isLoading = false;
        state.isInitialized = true;
        state.isAuthenticated = false;
        state.user = null;
      });

    // Login
    builder
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload as string;
      });

    // Social Login
    builder
      .addCase(socialLoginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(socialLoginUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(socialLoginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload as string;
      });

    // Verify OTP Login
    builder
      .addCase(verifyOtpLoginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(verifyOtpLoginUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(verifyOtpLoginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload as string;
      });

    // Register
    builder
      .addCase(registerUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.isAuthenticated = true;
        state.user = action.payload;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = action.payload as string;
      });

    // Logout
    builder
      .addCase(logoutUser.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(logoutUser.fulfilled, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
        state.error = null;
      })
      .addCase(logoutUser.rejected, (state) => {
        state.isLoading = false;
        state.isAuthenticated = false;
        state.user = null;
      });

    // Update Profile
    builder
      .addCase(updateUserProfile.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUserProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.isLoading = false;
        state.user = action.payload;
      })
      .addCase(updateUserProfile.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearAuthError, setUser, updateUserCoins } = authSlice.actions;
export default authSlice.reducer;
