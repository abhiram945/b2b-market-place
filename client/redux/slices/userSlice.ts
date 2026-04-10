
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, ErrorResponse } from '../../types';
import api from '../../api';
import { jwtDecode } from 'jwt-decode';
import { setAccessToken } from '../../utils/authToken';
import { getAccessToken } from '../../utils/authToken';

interface DecodedToken {
  _id: string;
  fullName: string;
  email: string;
  companyName: string;
  role: 'buyer' | 'vendor' | 'admin';
  iat: number;
  exp: number;
}


interface UserState {
  isAuthenticated: boolean;
  user: User | null;
  token: string | null;
  loading: boolean;
  isRehydrating: boolean;
  error: string | null;
}

const initialState: UserState = {
  isAuthenticated: false,
  user: null,
  token: null,
  loading: false,
  isRehydrating: true,
  error: null,
};

export const loginUser = createAsyncThunk(
  'user/login',
  async (loginData: Pick<User, 'email' | 'password'>, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', loginData);
      setAccessToken(data.token);
      return data; // Return the user and token
    } catch (error: any) {
      setAccessToken(null);
      return rejectWithValue(error.response.data.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
    'user/register',
    async (registerData: FormData, { rejectWithValue }) => {
        try {
            const response = await api.post('/auth/register', registerData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data;
        } catch (error: any) {
            return rejectWithValue(error.response?.data?.message || 'Registration failed');
        }
    }
);

export const fetchUserProfile = createAsyncThunk(
  'user/fetchUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const token = getAccessToken();
      if (!token) {
        return rejectWithValue('No token found');
      }
      const response = await api.get('/auth/profile');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response.data.message || 'Failed to fetch user profile');
    }
  }
);

export const rehydrateAuth = createAsyncThunk(
  'user/rehydrate',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/refresh');
      const newToken = data.token;
      setAccessToken(newToken);
      return {
        token: newToken,
        user: data.user,
      };
    } catch (error: any) {
      setAccessToken(null);
      return rejectWithValue('Session expired');
    }
  }
);


const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logout(state) {
      localStorage.removeItem('cart');
      setAccessToken(null);
      state.isAuthenticated = false;
      state.user = null;
      state.token = null;
      state.error = null;
      state.isRehydrating = false;
    },
    loadUserFromToken(state) {
        const token = state.token;
        if (token) {
            try {
                const decodedToken = jwtDecode<DecodedToken>(token);
                if (decodedToken.exp * 1000 > Date.now()) {
                    state.isAuthenticated = true;
                    state.user = {
                        _id: decodedToken._id,
                        fullName: decodedToken.fullName,
                        email: decodedToken.email,
                        companyName: decodedToken.companyName,
                        role: decodedToken.role,
                        password:''
                    };
                    state.token = token;
                } else {
                    setAccessToken(null);
                    state.token = null;
                }
            } catch (error) {
                setAccessToken(null);
                state.token = null;
            }
        }
        state.isRehydrating = false;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action: PayloadAction<User & { token: string }>) => {
        const { token, ...userData } = action.payload;
        state.isAuthenticated = true;
        state.user = userData;
        state.token = token;
        state.loading = false;
        state.error = null;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.user = null;
        state.loading = false;
        state.error = action.payload as string;
        setAccessToken(null);
      })
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state) => {
        state.loading = false;
        state.error = null;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchUserProfile.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchUserProfile.fulfilled, (state, action) => {
        state.user = action.payload; // Full user object from API
        state.loading = false;
        state.isAuthenticated = true; // Ensure authenticated if profile fetched successfully
      })
      .addCase(fetchUserProfile.rejected, (state, action) => {
        state.isAuthenticated = false;
        state.user = null;
        state.loading = false;
        state.error = action.payload as string;
        setAccessToken(null);
      })
      .addCase(rehydrateAuth.pending, (state) => {
        state.isRehydrating = true;
      })
      .addCase(rehydrateAuth.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        setAccessToken(action.payload.token);
        state.isRehydrating = false;
      })
      .addCase(rehydrateAuth.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        setAccessToken(null);
        state.isRehydrating = false;
      });
  },
});

export const { logout, loadUserFromToken } = userSlice.actions;

export default userSlice.reducer;
