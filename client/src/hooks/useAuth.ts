import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
  loginUser,
  socialLoginUser,
  verifyOtpLoginUser,
  registerUser,
  logoutUser,
  updateUserProfile,
  changeUserPassword,
  clearAuthError,
} from '../store/slices/authSlice';
import {
  LoginCredentials,
  RegisterData,
  UpdateProfileData,
  ChangePasswordData,
} from '../types';

export function useAuth() {
  const dispatch = useAppDispatch();
  const { user, isAuthenticated, isLoading, isInitialized, error } = useAppSelector(
    (state) => state.auth
  );

  const login = async (credentials: LoginCredentials) => {
    return dispatch(loginUser(credentials)).unwrap();
  };

  const socialLogin = async (data: { provider: 'google' | 'github'; email?: string; name?: string; avatar?: string; code?: string; credential?: string }) => {
    return dispatch(socialLoginUser(data)).unwrap();
  };

  const verifyOtpLogin = async (data: { email: string; otp: string }) => {
    return dispatch(verifyOtpLoginUser(data)).unwrap();
  };

  const register = async (data: RegisterData) => {
    return dispatch(registerUser(data)).unwrap();
  };

  const logout = async () => {
    return dispatch(logoutUser()).unwrap();
  };

  const updateProfile = async (data: UpdateProfileData) => {
    return dispatch(updateUserProfile(data)).unwrap();
  };

  const changePassword = async (data: ChangePasswordData) => {
    return dispatch(changeUserPassword(data)).unwrap();
  };

  const clearError = () => {
    dispatch(clearAuthError());
  };

  return {
    user,
    isAuthenticated,
    isLoading,
    isInitialized,
    error,
    login,
    socialLogin,
    verifyOtpLogin,
    register,
    logout,
    updateProfile,
    changePassword,
    clearError,
    isAdmin: user?.role === 'admin',
    isSubAdmin: user?.role === 'sub_admin',
    isStudent: user?.role === 'student',
  };
}
