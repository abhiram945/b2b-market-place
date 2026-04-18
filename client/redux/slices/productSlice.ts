import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Product } from '../../types';
import api from '../../api';

interface ProductState {
  productsByPage: Record<number, Product[]>;
  loading: boolean;
  error: string | null;
  selectedProduct: Product | null;
  page: number;
  pages: number;
  total: number;
  config: {
    brands: string[];
    categories: string[];
    locations: string[];
    conditions: string[];
    banner?: string;
  };
  filterOptions: {
    categories: string[];
    locations: string[];
    brands: string[];
  };
}

type ProductListPayload = {
  products: Product[];
  page: number;
  pages: number;
  total: number;
};

const initialState: ProductState = {
  productsByPage: {},
  loading: false,
  error: null,
  selectedProduct: null,
  page: 1,
  pages: 1,
  total: 0,
  config: {
    brands: [],
    categories: [],
    locations: [],
    conditions: [],
  },
  filterOptions: {
    categories: [],
    locations: [],
    brands: [],
  },
};

export const fetchProducts = createAsyncThunk(
  'products/fetchProducts',
  async (filters: { page?: number; limit?: number; search?: string; searchId?: string; vendorId?: string; brand?: string; location?: string; category?: string; minPrice?: number; maxPrice?: number } = {}, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/products', { params: filters });
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch products');
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

export const bulkUploadProducts = createAsyncThunk(
  'products/bulkUploadProducts',
  async (products: Product[], { rejectWithValue }) => {
    try {
      const { data } = await api.post('/admin/products/bulk', products);
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response.data.message || 'Failed to bulk upload products');
    }
  }
);

export const fetchFilterOptions = createAsyncThunk(
  'products/fetchFilterOptions',
  async (_, { rejectWithValue }) => {
    try {
      const { data } = await api.get('/products/filter-options');
      return data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch filter options');
    }
  }
);

const productSlice = createSlice({
  name: 'products',
  initialState,
  reducers: {
    restoreProductList(state, action: PayloadAction<ProductListPayload>) {
      // Restore the provided product list into page 1 for search restore compatibility
      state.productsByPage = { [action.payload.page || 1]: action.payload.products || [] };
      state.page = action.payload.page;
      state.pages = action.payload.pages;
      state.total = action.payload.total;
      state.loading = false;
      state.error = null;
    },
    clearProductsCache(state) {
      state.productsByPage = {};
    },
  },
  extraReducers: (builder) => {
    builder
      // Fetch Products
      .addCase(fetchProducts.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        const incoming = action.payload.products || [];
        const requestedPage = Number((action.meta?.arg as any)?.page || action.payload.page || 1);

        state.productsByPage[requestedPage] = incoming;
        state.page = requestedPage;
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
        // Since adding a product shifts everything, easiest is to clear cache
        state.productsByPage = {};
        state.total = state.total + 1;
      })
      // Update Product (covers both admin and vendor updates)
      .addCase(updateProduct.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateProduct.fulfilled, (state, action: PayloadAction<Product>) => {
        // Replace product in any cached page
        Object.keys(state.productsByPage).forEach(pageNum => {
          const page = Number(pageNum);
          const idx = state.productsByPage[page].findIndex(p => p._id === action.payload._id);
          if (idx !== -1) state.productsByPage[page][idx] = action.payload;
        });
        
        if (state.selectedProduct?._id === action.payload._id) state.selectedProduct = action.payload;
        state.loading = false;
        state.error = null;
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
        Object.keys(state.productsByPage).forEach(pageNum => {
          const page = Number(pageNum);
          const idx = state.productsByPage[page].findIndex(p => p._id === action.payload._id);
          if (idx !== -1) state.productsByPage[page][idx] = action.payload;
        });
        
        if (state.selectedProduct?._id === action.payload._id) state.selectedProduct = action.payload;
        state.loading = false;
        state.error = null;
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
        const id = action.payload;
        // Clearing cache on delete is safer as it shifts indices across pages
        state.productsByPage = {};
        if (state.selectedProduct?._id === action.payload) state.selectedProduct = null;
        state.total = Math.max(0, state.total - 1);
        state.loading = false;
        state.error = null;
      })
      .addCase(deleteProduct.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Bulk Upload Products
      .addCase(bulkUploadProducts.pending, (state) => {
        state.error = null;
      })
      .addCase(bulkUploadProducts.fulfilled, (state) => {
        state.error = null;
      })
      .addCase(bulkUploadProducts.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Fetch Filter Options
      .addCase(fetchFilterOptions.fulfilled, (state, action: PayloadAction<{ categories: string[]; locations: string[]; brands: string[]; conditions: string[] }>) => {
        state.filterOptions = action.payload;
        state.config = {
          ...state.config,
          categories: action.payload.categories,
          locations: action.payload.locations,
          brands: action.payload.brands,
          conditions: action.payload.conditions || [],
        };
      });
  },
});

export const { restoreProductList, clearProductsCache } = productSlice.actions;
export default productSlice.reducer;
