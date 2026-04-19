import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, ErrorResponse } from '../../types';
import api from '../../api';
import { jwtDecode } from 'jwt-decode';
import { setAccessToken, getAccessToken } from '../../utils/authToken';
import { ROLES } from '../../utils/constants'; // Import ROLES for enum usage

interface DecodedToken {
  _id: string;
  fullName: string;
  email: string;
  companyName: string;
  activeRole: 'buyer' | 'vendor' | 'admin';
  roles: ('buyer' | 'vendor' | 'admin')[];
  roleRequest?: {
    requestedRole: 'buyer' | 'vendor';
    status: 'none' | 'pending' | 'approved' | 'rejected';
  };
  status: 'pending' | 'approved' | 'rejected';
  iat: number;
  exp: number;
}

interface UserState {
  isAuthenticated: boolean;
  user: User | null; // User object now includes roles, activeRole, roleRequest
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
      return data;
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

// New thunk for switching active role
export const switchActiveRole = createAsyncThunk(
  'user/switchRole',
  async (role: 'buyer' | 'vendor' | 'admin', { rejectWithValue, dispatch }) => {
    try {
      const { data } = await api.put('/auth/switch-role', { role });
      setAccessToken(data.token); // Update token with new active role
      dispatch(loadUserFromToken()); // Re-sync user state with new token
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to switch role');
    }
  }
);

// New thunk for requesting a new role
export const requestNewRole = createAsyncThunk(
  'user/requestRole',
  async (role: 'buyer' | 'vendor', { rejectWithValue }) => {
    try {
      const response = await api.post('/auth/request-role', { role });
      return response.data; // Contains success message
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to request role');
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
        const token = state.token || getAccessToken(); // Use current token or get from storage
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
                        // Assign roles and activeRole from token
                        roles: decodedToken.roles,
                        activeRole: decodedToken.activeRole,
                        // roleRequest is not directly in JWT for security, fetch from profile if needed
                        password: '', // Password is never stored in token
                    };
                    state.token = token;
                } else {
                    setAccessToken(null);
                    state.token = null;
                    state.isAuthenticated = false;
                }
            } catch (error) {
                setAccessToken(null);
                state.token = null;
                state.isAuthenticated = false;
            }
        } else {
            state.isAuthenticated = false;
            state.user = null;
            state.token = null;
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
        state.user = userData as User; // Cast to User type
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
      .addCase(fetchUserProfile.fulfilled, (state, action: PayloadAction<User>) => {
        state.user = action.payload; // Full user object from API
        state.loading = false;
        state.isAuthenticated = true; 
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
        state.user = action.payload.user as User; // Cast to User type
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
      })
      // Handle role switching
      .addCase(switchActiveRole.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(switchActiveRole.fulfilled, (state, action) => {
        state.user!.activeRole = action.payload.activeRole;
        state.user!.roles = action.payload.roles;
        state.token = action.payload.token;
        setAccessToken(action.payload.token);
        state.loading = false;
      })
      .addCase(switchActiveRole.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Handle role requesting
      .addCase(requestNewRole.pending, (state) => {
        state.error = null;
      })
      .addCase(requestNewRole.fulfilled, (state, action) => {
        if (state.user) {
          state.user.roleRequest = {
            requestedRole: action.meta.arg,
            status: 'pending',
            requestDate: new Date().toISOString(),
          };
        }
      })
      .addCase(requestNewRole.rejected, (state, action) => {
        state.error = action.payload as string;
      });
  },
});

export const { logout, loadUserFromToken } = userSlice.actions;

export default userSlice.reducer;
