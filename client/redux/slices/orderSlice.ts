import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Order } from '../../types';
import api from '../../api';

interface OrderState {
    orders: Order[];
    loading: boolean;
    updatingOrderId: string | null;
    error: string | null;
}

const initialState: OrderState = {
    orders: [],
    loading: false,
    updatingOrderId: null,
    error: null,
};

export const fetchOrders = createAsyncThunk(
    'orders/fetchOrders',
    async (params: { search?: string } = {}, { rejectWithValue }) => {
        try {
            const { data } = await api.get('/orders', { params });
            return data;
        } catch (error: any) {
            return rejectWithValue(error.response.data.message || 'Failed to fetch orders');
        }
    }
);

export const createOrder = createAsyncThunk(
    'orders/createOrder',
    async (orderData: { items: { productId: string, quantity: number }[] }, { rejectWithValue }) => {
        try {
            const { data } = await api.post('/orders', orderData);
            return data;
        } catch (error: any) {
            return rejectWithValue(error.response.data.message || 'Failed to create order');
        }
    }
);

export const updateOrderStatus = createAsyncThunk(
    'orders/updateOrderStatus',
    async ({ orderId, status }: { orderId: string, status: string }, { rejectWithValue }) => {
        try {
            const { data } = await api.put(`/orders/${orderId}/status`, { status });
            return data;
        } catch (error: any) {
            return rejectWithValue(error.response.data.message || 'Failed to update order status');
        }
    },
    {
        getPendingMeta: ({ arg }) => ({ orderId: arg.orderId }),
    }
);

const orderSlice = createSlice({
    name: 'orders',
    initialState,
    reducers: {
        restoreOrderList(state, action: PayloadAction<Order[]>) {
            state.orders = action.payload;
            state.loading = false;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchOrders.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchOrders.fulfilled, (state, action: PayloadAction<Order[]>) => {
                state.orders = action.payload;
                state.loading = false;
                state.error = null;
            })
            .addCase(fetchOrders.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createOrder.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createOrder.fulfilled, (state, action: PayloadAction<Order>) => {
                state.orders.unshift(action.payload);
                state.loading = false;
            })
            .addCase(createOrder.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(updateOrderStatus.pending, (state, action) => {
                state.updatingOrderId = action.meta.arg.orderId;
                state.error = null;
            })
            .addCase(updateOrderStatus.fulfilled, (state, action: PayloadAction<Order>) => {
                const index = state.orders.findIndex(order => order._id === action.payload._id);
                if (index !== -1) {
                    state.orders[index] = action.payload;
                }
                state.updatingOrderId = null;
                state.error = null;
            })
            .addCase(updateOrderStatus.rejected, (state, action) => {
                state.updatingOrderId = null;
                state.error = action.payload as string;
            });
    },
});

export const { restoreOrderList } = orderSlice.actions;
export default orderSlice.reducer;
