
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, ErrorResponse } from '../../types';
import api from '../../api';
import { jwtDecode } from 'jwt-decode';

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
  token: localStorage.getItem('token'),
  loading: false,
  isRehydrating: true,
  error: null,
};

export const loginUser = createAsyncThunk(
  'user/login',
  async (loginData: Pick<User, 'email' | 'password'>, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/auth/login', loginData);
      localStorage.setItem('token', data.token); // Store token immediately
      return data; // Return the user and token
    } catch (error: any) {
      localStorage.removeItem('token'); // Clear token if login fails
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
      const token = localStorage.getItem('token');
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
    const token = localStorage.getItem('token');
    
    // 1. Check if token exists and is valid
    if (token) {
      try {
        const decoded = jwtDecode<DecodedToken>(token);
        if (decoded.exp * 1000 > Date.now()) {
          // Token still valid, return user info
          return {
            token,
            user: {
              _id: decoded._id,
              fullName: decoded.fullName,
              email: decoded.email,
              companyName: decoded.companyName,
              role: decoded.role,
              password: ''
            }
          };
        }
      } catch (e) {
        // Invalid token format
      }
    }

    // 2. If token missing or expired, try background refresh using HTTP-only cookie
    try {
      const { data } = await api.post('/auth/refresh');
      const newToken = data.token;
      localStorage.setItem('token', newToken);
      const decoded = jwtDecode<DecodedToken>(newToken);
      return {
        token: newToken,
        user: {
          _id: decoded._id,
          fullName: decoded.fullName,
          email: decoded.email,
          companyName: decoded.companyName,
          role: decoded.role,
          password: ''
        }
      };
    } catch (error: any) {
      localStorage.removeItem('token');
      return rejectWithValue('Session expired');
    }
  }
);


const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    logout(state) {
      localStorage.removeItem('token');
      localStorage.removeItem('cart');
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
                    // Token expired
                    localStorage.removeItem('token');
                    state.token = null;
                }
            } catch (error) {
                // Invalid token
                localStorage.removeItem('token');
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
        localStorage.removeItem('token');
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
        localStorage.removeItem('token'); // Clear token if profile fetch fails
      })
      .addCase(rehydrateAuth.pending, (state) => {
        state.isRehydrating = true;
      })
      .addCase(rehydrateAuth.fulfilled, (state, action) => {
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isRehydrating = false;
      })
      .addCase(rehydrateAuth.rejected, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.isRehydrating = false;
      });
  },
});

export const { logout, loadUserFromToken } = userSlice.actions;

export default userSlice.reducer;
