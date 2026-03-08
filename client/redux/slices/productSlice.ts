import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../../types';
import api from '../../api';

interface ProductState {
  products: Product[];
  loading: boolean;
  error: string | null;
  selectedProduct: Product | null;
  page: number;
  pages: number;
  total: number;
}

const initialState: ProductState = {
  products: [],
  loading: false,
  error: null,
  selectedProduct: null,
  page: 1,
  pages: 1,
  total: 0,
};

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (filters: { page?: number; limit?: number; search?: string; brand?: string; location?: string; category?: string; minPrice?: number; maxPrice?: number } = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/products', { params: filters });
      console.log(data);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response.data.message || 'Failed to fetch products');
    }
  }
);

export const addProduct = createAsyncThunk(
  'products/addProduct',
  async (productData: Omit<Product, 'id' | 'features'>, { rejectWithValue }) => {
    try {
      const { data } = await api.post('/products', productData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response.data.message || 'Failed to add product');
    }
  }
);

export const updateProduct = createAsyncThunk(
  'products/updateProduct',
  async (productData: Product, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/products/${productData._id}`, productData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response.data.message || 'Failed to update product');
    }
  }
);

export const updateProductByVendor = createAsyncThunk(
  'products/updateProductByVendor',
  async (productData: Pick<Product, '_id' | 'price' | 'stockQty' | 'isStockEnabled'>, { rejectWithValue }) => {
    try {
      const { data } = await api.put(`/products/${productData._id}/vendor-update`, productData);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response.data.message || 'Failed to update product');
    }
  }
);

export const deleteProduct = createAsyncThunk(
  'products/deleteProduct',
  async (id: string, { rejectWithValue }) => {
    try {
      await api.delete(`/products/${id}`);
      return id; // Return the ID of the deleted product
    } catch (error: any) {
      return rejectWithValue(error.response.data.message || 'Failed to delete product');
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action: PayloadAction<{ products: Product[]; page: number; pages: number; total: number }>) => {
        state.products = action.payload.products;
        state.page = action.payload.page;
        state.pages = action.payload.pages;
        state.total = action.payload.total;
        state.loading = false;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Add Product
      .addCase(addProduct.fulfilled, (state, action: PayloadAction<Product>) => {
        state.products.unshift(action.payload);
      })
      // Update Product (covers both admin and vendor updates)
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action: PayloadAction<Product>) => {
        const index = state.products.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
            state.products[index] = action.payload;
        }
        if (state.selectedProduct?._id === action.payload._id) {
            state.selectedProduct = action.payload;
        }
        state.loading = false; // Reset loading on fulfillment
        state.error = null; // Clear any previous errors
      })
      .addCase(updateProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateProductByVendor.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProductByVendor.fulfilled, (state, action: PayloadAction<Product>) => {
        const index = state.products.findIndex(p => p._id === action.payload._id);
        if (index !== -1) {
            state.products[index] = action.payload;
        }
        if (state.selectedProduct?._id === action.payload._id) {
            state.selectedProduct = action.payload;
        }
        state.loading = false; // Reset loading on fulfillment
        state.error = null; // Clear any previous errors
      })
      .addCase(updateProductByVendor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Delete Product
      .addCase(deleteProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteProduct.fulfilled, (state, action: PayloadAction<string>) => {
        state.products = state.products.filter(product => product._id !== action.payload);
        if (state.selectedProduct?._id === action.payload) {
          state.selectedProduct = null;
        }
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default productSlice.reducer;