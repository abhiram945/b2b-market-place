import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { deleteProduct, restoreProductsCache } from '../../redux/slices/productSlice';
import { FileText, PlusCircle } from '../../components/icons';
import AddProductModal from '../../components/products/AddProductModal';
import EditProductModal from '../../components/products/EditProductModal';
import BulkUploadModal from '../../components/products/BulkUploadModal';
import ProductDetailsModal from '../../components/products/ProductDetailsModal';
import { Product } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import SearchBar from '../../components/common/SearchBar';
import { useAlert } from '../../contexts/AlertContext';
import { useProducts } from '../../hooks/useProducts';
import ProductTableRow from '../../components/products/ProductTableRow';
import ProductSkeleton from '../../components/products/ProductSkeleton';

const ADMIN_PRODUCT_SEARCH_CACHE_KEY = 'admin-product-search-cache';

type AdminProductSearchCache = {
  productsByPage: Record<number, Product[]>;
  page: number;
  pages: number;
  total: number;
};

const AdminProductList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { activeRole } = useAuth();
  const { showAlert } = useAlert();
  const { productsByPage } = useSelector((state: RootState) => state.products);

  const { 
    products, 
    loading, 
    pageNum, 
    pages, 
    total,
    currentFilters,
    setPage, 
    updateFilters, 
    primeFiltersKey,
    suppressNextFetch,
    refresh 
  } = useProducts({ autoVendorFilter: false });

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearchId, setActiveSearchId] = useState<string>((currentFilters.searchId as string) || '');

  const cacheCurrentResults = () => {
    const payload: AdminProductSearchCache = {
      productsByPage,
      page: pageNum,
      pages,
      total,
    };
    localStorage.setItem(ADMIN_PRODUCT_SEARCH_CACHE_KEY, JSON.stringify(payload));
  };

  const restoreCachedResults = (): number | null => {
    const cachedValue = localStorage.getItem(ADMIN_PRODUCT_SEARCH_CACHE_KEY);
    if (!cachedValue) return null;

    try {
      const cachedPayload = JSON.parse(cachedValue) as AdminProductSearchCache;
      dispatch(restoreProductsCache({
        productsByPage: cachedPayload.productsByPage,
        page: cachedPayload.page,
        pages: cachedPayload.pages,
        total: cachedPayload.total,
      }));
      localStorage.removeItem(ADMIN_PRODUCT_SEARCH_CACHE_KEY);
      return cachedPayload.page;
    } catch (_error) {
      localStorage.removeItem(ADMIN_PRODUCT_SEARCH_CACHE_KEY);
      return null;
    }
  };

  const handleSearchSubmit = () => {
    const normalizedSearch = searchInput.trim();
    if (!normalizedSearch || normalizedSearch === activeSearchId) return;

    if (!activeSearchId) {
      cacheCurrentResults();
    }

    setActiveSearchId(normalizedSearch);
    updateFilters({ searchId: normalizedSearch });
  };

  const handleClearSearch = () => {
    setSearchInput('');

    if (!activeSearchId) {
      return;
    }

    const restoredPage = restoreCachedResults();
    setActiveSearchId('');
    if (restoredPage) {
      primeFiltersKey({ ...currentFilters, searchId: undefined, page: restoredPage });
      suppressNextFetch();
      updateFilters({ searchId: undefined, page: restoredPage });
      return;
    }
    updateFilters({ searchId: undefined });
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailsModalOpen(true);
  };

  const handleDeleteClick = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await dispatch(deleteProduct(productId)).unwrap();
      showAlert({
        variant: 'success',
        title: 'product deleted',
        message: 'Product deleted successfully!',
      });
    } catch (err: any) {
      showAlert({
        variant: 'error',
        title: 'delete failed',
        message: err || 'Failed to delete product.',
      });
    }
  };

  return (
    <div className="max-w-[90%] mx-auto py-8">
      <div className="flex justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">PRODUCT <span className="text-brand-red">MANAGEMENT</span></h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest mt-1">Global Inventory Control</p>
        </div>
        <div className="flex items-center gap-4">
          <button
            onClick={() => setIsBulkUploadModalOpen(true)}
            className="flex items-center px-6 py-3 bg-indigo-600 text-white font-bold rounded shadow-md hover:bg-indigo-700 transition-all uppercase tracking-widest cursor-pointer"
          >
            <FileText className="w-5 h-5 mr-2" />
            Bulk Upload
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center px-6 py-3 bg-brand-red text-white font-bold rounded shadow-md hover:bg-brand-red-hover transition-all uppercase tracking-widest cursor-pointer"
          >
            <PlusCircle className="w-5 h-5 mr-2" />
            Add New Product
          </button>
          <SearchBar
            value={searchInput}
            onChange={setSearchInput}
            onSubmit={handleSearchSubmit}
            onClear={handleClearSearch}
            placeholder="search product id"
            className="w-90"
            showClear={Boolean(searchInput || activeSearchId)}
          />
        </div>
      </div>

      {products.length === 0 && !loading ? (
        <div className="bg-white p-8 rounded-lg border border-gray-200 text-center shadow-sm">
          <p className="text-gray-500 font-bold uppercase tracking-widest">No products found in the inventory.</p>
        </div>
      ) : (
        <div className="w-full">
          <div className="min-w-full inline-block align-middle">
            <table className="w-full border-collapse min-w-300">
            <thead className="sticky top-0 z-10 bg-zinc-900 shadow-xl">
              <tr>
                <th className="px-6 py-3 text-left">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 italic">Product</span>
                </th>
                {['Brand', 'Category', 'Location', 'Condition', 'Price', 'MOQ', 'MXQ', 'Stock'].map((label) => (
                  <th key={label} className="px-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 italic text-center">{label}</th>
                ))}
                <th className="px-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 italic text-center hidden lg:table-cell">ETA</th>
                <th className="px-6 py-3 text-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 italic">Actions</span>
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-zinc-100">
              {loading ? (
                [...Array(products.length || 10)].map((_, i) => <ProductSkeleton key={i} />)
              ) : (
                products.map((product) => (
                  <ProductTableRow
                    key={product._id}
                    product={product}
                    onProductClick={handleProductClick}
                    onEditClick={(p) => {
                      setSelectedProductForEdit(p);
                      setIsEditModalOpen(true);
                    }}
                    onDeleteClick={handleDeleteClick}
                  />
                ))
              )}
            </tbody>
          </table>
          </div>
        </div>
      )}

      {pages > 1 && (
        <div className="flex justify-center mt-10 space-x-2">
          {[...Array(pages)].map((_, index) => (
            <button
              key={index + 1}
              onClick={() => setPage(index + 1)}
              className={`w-10 h-10 rounded font-bold text-sm transition-all cursor-pointer ${pageNum === index + 1 ? 'bg-zinc-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-red'}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}

      <AddProductModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onProductAdded={refresh} />
      {selectedProductForEdit && (
        <EditProductModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedProductForEdit(null);
          }}
          product={selectedProductForEdit}
          activeRole={activeRole}
          onProductUpdated={() => undefined}
        />
      )}
      <BulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onUploadSuccess={refresh}
      />
      <ProductDetailsModal
        isOpen={isDetailsModalOpen}
        onClose={() => setIsDetailsModalOpen(false)}
        product={selectedProduct}
      />
    </div>
  );
};

export default AdminProductList;
