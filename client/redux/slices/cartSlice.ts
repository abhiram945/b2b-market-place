import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CartItem, Product } from '../../types';
import api from '../../api';
import { RootState } from '../store';

interface CartState {
  items: CartItem[];
  loading: boolean;
  syncing: boolean;
  isDirty: boolean;
  optimisticBackup: CartItem[] | null;
  error: string | null;
}

const normalizeCartItems = (rawItems: any[]): CartItem[] => {
  if (!Array.isArray(rawItems)) return [];

  return rawItems
    .map((item: any) => {
      const product = item?.product ?? item;
      if (!product || typeof product !== 'object') return null;

      const price = Number(product.price);
      const minOrderQty = Number(product.minOrderQty);
      const maxOrderQty = Number(product.maxOrderQty);
      const stockQty = Number(product.stockQty);
      const quantity = Number(item?.quantity ?? product?.quantity ?? 1);

      if (!product._id || Number.isNaN(price)) return null;

      return {
        ...product,
        price,
        minOrderQty: Number.isNaN(minOrderQty) ? 1 : minOrderQty,
        maxOrderQty: Number.isNaN(maxOrderQty) ? 1 : maxOrderQty,
        stockQty: Number.isNaN(stockQty) ? 0 : stockQty,
        quantity: Number.isNaN(quantity) ? 1 : quantity,
      } as CartItem;
    })
    .filter((item): item is CartItem => item !== null);
};

const loadCartFromStorage = (): CartItem[] => {
  try {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? normalizeCartItems(JSON.parse(savedCart)) : [];
  } catch (error) {
    return [];
  }
};

const initialState: CartState = {
  items: loadCartFromStorage(),
  loading: false,
  syncing: false,
  isDirty: false,
  optimisticBackup: null,
  error: null,
};

const buildCartPayload = (items: CartItem[]) => ({
  items: items.map(item => ({
    product: item._id,
    quantity: item.quantity,
  })),
});

const persistCartAndNormalize = async (items: CartItem[]) => {
  const { data } = await api.put('/cart', buildCartPayload(items));
  const syncedItems = normalizeCartItems(data.items);
  return syncedItems.length > 0 || items.length === 0 ? syncedItems : items;
};

export const fetchCart = createAsyncThunk(
  'cart/fetchCart',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/cart');
      return normalizeCartItems(data.items);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch cart');
    }
  }
);

export const syncCart = createAsyncThunk(
  'cart/syncCart',
  async (items: CartItem[], { rejectWithValue }) => {
    try {
      return await persistCartAndNormalize(items);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to sync cart');
    }
  }
);

export const addToCart = createAsyncThunk(
  'cart/addToCart',
  async (_arg: { product: Product; quantity: number }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      return await persistCartAndNormalize(state.cart.items);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to add to cart');
    }
  }
);

export const removeFromCart = createAsyncThunk(
  'cart/removeFromCart',
  async (_id: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      return await persistCartAndNormalize(state.cart.items);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to remove from cart');
    }
  }
);

export const updateQuantity = createAsyncThunk(
  'cart/updateQuantity',
  async (_arg: { id: string; quantity: number }, { getState, rejectWithValue }) => {
    try {
      const state = getState() as RootState;
      return await persistCartAndNormalize(state.cart.items);
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update cart quantity');
    }
  }
);

const cartSlice = createSlice({
  name: 'cart',
  initialState,
  reducers: {
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
      .addCase(addToCart.pending, (state, action) => {
        state.syncing = true;
        state.error = null;
        state.optimisticBackup = [...state.items];
        const { product, quantity } = action.meta.arg;
        const exists = state.items.some(item => item._id === product._id);
        if (!exists) {
          state.items.push({ ...product, quantity });
        }
        localStorage.setItem('cart', JSON.stringify(state.items));
      })
      .addCase(addToCart.fulfilled, (state, action: PayloadAction<CartItem[]>) => {
        state.items = action.payload;
        state.syncing = false;
        state.isDirty = false;
        state.optimisticBackup = null;
        localStorage.setItem('cart', JSON.stringify(state.items));
      })
      .addCase(addToCart.rejected, (state, action) => {
        if (state.optimisticBackup) {
          state.items = state.optimisticBackup;
          localStorage.setItem('cart', JSON.stringify(state.items));
        }
        state.optimisticBackup = null;
        state.syncing = false;
        state.error = action.payload as string;
      })
      .addCase(removeFromCart.pending, (state, action) => {
        state.syncing = true;
        state.error = null;
        state.optimisticBackup = [...state.items];
        state.items = state.items.filter(item => item._id !== action.meta.arg);
        localStorage.setItem('cart', JSON.stringify(state.items));
      })
      .addCase(removeFromCart.fulfilled, (state, action: PayloadAction<CartItem[]>) => {
        state.items = action.payload;
        state.syncing = false;
        state.isDirty = false;
        state.optimisticBackup = null;
        localStorage.setItem('cart', JSON.stringify(state.items));
      })
      .addCase(removeFromCart.rejected, (state, action) => {
        if (state.optimisticBackup) {
          state.items = state.optimisticBackup;
          localStorage.setItem('cart', JSON.stringify(state.items));
        }
        state.optimisticBackup = null;
        state.syncing = false;
        state.error = action.payload as string;
      })
      .addCase(updateQuantity.pending, (state, action) => {
        state.syncing = true;
        state.error = null;
        state.optimisticBackup = [...state.items];
        const { id, quantity } = action.meta.arg;
        state.items = state.items.map(item => item._id === id ? { ...item, quantity } : item);
        localStorage.setItem('cart', JSON.stringify(state.items));
      })
      .addCase(updateQuantity.fulfilled, (state, action: PayloadAction<CartItem[]>) => {
        state.items = action.payload;
        state.syncing = false;
        state.isDirty = false;
        state.optimisticBackup = null;
        localStorage.setItem('cart', JSON.stringify(state.items));
      })
      .addCase(updateQuantity.rejected, (state, action) => {
        if (state.optimisticBackup) {
          state.items = state.optimisticBackup;
          localStorage.setItem('cart', JSON.stringify(state.items));
        }
        state.optimisticBackup = null;
        state.syncing = false;
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

export const { clearCart } = cartSlice.actions;

export default cartSlice.reducer;
