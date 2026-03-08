
import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { NotificationSubscription } from '../../types';
import api from '../../api';

interface NotificationState {
  subscriptions: NotificationSubscription[];
  loading: boolean;
  error: string | null;
}

const initialState: NotificationState = {
  subscriptions: [],
  loading: false,
  error: null,
};

export const fetchUserSubscriptions = createAsyncThunk(
  'notifications/fetchUserSubscriptions',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/notifications');
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response.data.message || 'Failed to fetch subscriptions');
    }
  }
);

export const toggleSubscription = createAsyncThunk(
    'notifications/toggleSubscription',
    async (payload: { productId: string; type: 'price' | 'stock'; productTitle: string }, { rejectWithValue }) => {
        try {
            const { data } = await api.post('/notifications/toggle', payload);
            return data;
        } catch (error: any) {
            return rejectWithValue(error.response.data.message || 'Failed to toggle subscription');
        }
    }
);

const notificationSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
      builder
        .addCase(fetchUserSubscriptions.pending, (state) => {
          state.loading = true;
          state.error = null;
        })
        .addCase(fetchUserSubscriptions.fulfilled, (state, action: PayloadAction<NotificationSubscription[]>) => {
          state.loading = false;
          state.subscriptions = action.payload;
        })
        .addCase(fetchUserSubscriptions.rejected, (state, action) => {
          state.loading = false;
          state.error = (action.payload as string) || 'Failed to fetch subscriptions';
        })
        .addCase(toggleSubscription.fulfilled, (state, action: PayloadAction<{ wasAdded: boolean; subscription: NotificationSubscription }>) => {
            const { wasAdded, subscription } = action.payload;
            if (wasAdded) {
                // Ensure a new array is created to trigger re-renders
                state.subscriptions = [...state.subscriptions, subscription];
            } else {
                state.subscriptions = state.subscriptions.filter(s => s._id !== subscription._id);
            }
        })
  }
});

export default notificationSlice.reducer;
