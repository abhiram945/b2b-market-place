import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, Product } from '../../types';
import api from '../../api';

interface CartState {
  items: CartItem[];
  loading: boolean;
  syncing: boolean;
  isDirty: boolean;
  error: string | null;
}

const loadCartFromStorage = (): CartItem[] => {
  try {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  } catch (error) {
    return [];
  }
};

const initialState: CartState = {
  items: loadCartFromStorage(),
  loading: false,
  syncing: false,
  isDirty: false,
  error: null,
};

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/cart');
      // Backend returns populated product in items.product
      const items = data.items.map((item: any) => ({
        ...item.product,
        quantity: item.quantity,
      }));
      return items;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
    }
  }
);

export const syncCart = createAsyncThunk(
  'cart/syncCart',
  async (items: CartItem[], { rejectWithValue }) => {
    try {
      const payload = {
        items: items.map(item => ({
          product: item._id,
          quantity: item.quantity,
        })),
      };
      const { data } = await api.put('/cart', payload);
      // Map back to CartItem structure with fresh product data from backend
      const syncedItems = data.items.map((item: any) => ({
        ...item.product,
        quantity: item.quantity,
      }));
      return syncedItems;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to sync cart');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
    addToCart(state, action: PayloadAction<{ product: Product; quantity: number }>) {
      const { product, quantity } = action.payload;
      const existingItem = state.items.find(item => item._id === product._id);
      if (!existingItem) {
        state.items.push({ ...product, quantity });
        state.isDirty = true;
      }
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    removeFromCart(state, action: PayloadAction<string>) {
      state.items = state.items.filter(item => item._id !== action.payload);
      state.isDirty = true;
      localStorage.setItem('cart', JSON.stringify(state.items));
    },
    updateQuantity(state, action: PayloadAction<{ id: string; quantity: number }>) {
        const { id, quantity } = action.payload;
        const itemToUpdate = state.items.find(item => item._id === id);
        if (itemToUpdate) {
            itemToUpdate.quantity = quantity;
            state.isDirty = true;
        }
        localStorage.setItem('cart', JSON.stringify(state.items));
    },
    clearCart(state) {
      state.items = [];
      state.isDirty = false;
      localStorage.removeItem('cart');
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchCart.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchCart.fulfilled, (state, action) => {
        state.items = action.payload;
        state.loading = false;
        state.isDirty = false;
        localStorage.setItem('cart', JSON.stringify(state.items));
      })
      .addCase(fetchCart.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(syncCart.pending, (state) => {
        state.syncing = true;
      })
      .addCase(syncCart.fulfilled, (state, action) => {
        state.items = action.payload;
        state.syncing = false;
        state.isDirty = false;
        localStorage.setItem('cart', JSON.stringify(state.items));
      })
      .addCase(syncCart.rejected, (state, action) => {
        state.syncing = false;
        state.error = action.payload as string;
      });
  }
});

export const { addToCart, removeFromCart, updateQuantity, clearCart } = cartSlice.actions;

export default cartSlice.reducer;
