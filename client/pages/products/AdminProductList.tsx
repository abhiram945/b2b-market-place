import React, { useEffect, useRef, useState } from 'react';
import { X } from '../../components/icons';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { deleteProduct, fetchProducts, restoreProductList } from '../../redux/slices/productSlice';
import { FileText, PlusCircle } from '../../components/icons';
import AddProductModal from '../../components/products/AddProductModal';
import EditProductModal from '../../components/products/EditProductModal';
import BulkUploadModal from '../../components/products/BulkUploadModal';
import { Product } from '../../types';
import { useAuth } from '../../hooks/useAuth';
import SearchBar from '../../components/common/SearchBar';

const ADMIN_PRODUCT_SEARCH_CACHE_KEY = 'admin-product-search-cache';

type ProductSearchCache = {
  products: Product[];
  page: number;
  pages: number;
  total: number;
  currentPage: number;
};

const AdminProductList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { products, loading, page, pages, total } = useSelector((state: RootState) => state.products);
  const { role } = useAuth();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const [isBulkUploadModalOpen, setIsBulkUploadModalOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(page);
  const productsPerPage = 10;
  const currentProducts = products.slice((currentPage - 1) * productsPerPage, currentPage * productsPerPage) || [];
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearchId, setActiveSearchId] = useState('');
  const skipNextFetchRef = useRef(false);

  useEffect(() => {
    if (message?.type === 'success') {
      const timeoutId = setTimeout(() => setMessage(null), 2002);
      return () => clearTimeout(timeoutId);
    }
  }, [message]);

  useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }

    // If we already have enough products accumulated for this page, skip fetching
    if (!activeSearchId && products.length >= currentPage * productsPerPage) {
      return;
    }

    dispatch(fetchProducts({ page: currentPage, limit: productsPerPage, searchId: activeSearchId || undefined }));
  }, [activeSearchId, currentPage]);

  const cacheCurrentResults = () => {
    const payload: ProductSearchCache = {
      products: currentProducts,
      page,
      pages,
      total,
      currentPage,
    };
    localStorage.setItem(ADMIN_PRODUCT_SEARCH_CACHE_KEY, JSON.stringify(payload));
  };

  const restoreCachedResults = () => {
    const cachedValue = localStorage.getItem(ADMIN_PRODUCT_SEARCH_CACHE_KEY);
    if (!cachedValue) {
      return false;
    }

    try {
      const cachedPayload = JSON.parse(cachedValue) as ProductSearchCache;
      dispatch(restoreProductList({
        products: cachedPayload.products,
        page: cachedPayload.page,
        pages: cachedPayload.pages,
        total: cachedPayload.total,
      }));
      setCurrentPage(cachedPayload.currentPage);
      localStorage.removeItem(ADMIN_PRODUCT_SEARCH_CACHE_KEY);
      return true;
    } catch (_error) {
      localStorage.removeItem(ADMIN_PRODUCT_SEARCH_CACHE_KEY);
      return false;
    }
  };

  const handleSearchSubmit = () => {
    const normalizedSearch = searchInput.trim();
    if (!normalizedSearch || normalizedSearch === activeSearchId) {
      return;
    }

    if (!activeSearchId) {
      cacheCurrentResults();
    }

    setCurrentPage(1);
    setActiveSearchId(normalizedSearch);
  };

  const handleClearSearch = () => {
    setSearchInput('');

    if (!activeSearchId) {
      return;
    }

    const restored = restoreCachedResults();
    if (restored) {
      skipNextFetchRef.current = true;
    }
    setActiveSearchId('');

    if (!restored) {
      setCurrentPage(1);
      dispatch(fetchProducts({ page: 1, limit: productsPerPage }));
    }
  };

  const handleDeleteClick = async (productId: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) {
      return;
    }

    try {
      await dispatch(deleteProduct(productId)).unwrap();
      setMessage({ type: 'success', text: 'Product deleted successfully!' });
      dispatch(fetchProducts({ page: currentPage, limit: productsPerPage, searchId: activeSearchId || undefined }));
    } catch (err: any) {
      setMessage({ type: 'error', text: err || 'Failed to delete product.' });
    }
  };

  const handleProductAddedOrUpdated = () => {
    dispatch(fetchProducts({ page: currentPage, limit: productsPerPage, searchId: activeSearchId || undefined }));
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
            className="w-[360px]"
            showClear={Boolean(searchInput || activeSearchId)}
          />
        </div>
      </div>

      {message && (
        <div className={`${message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'} border px-4 py-3 rounded-md mb-4 flex justify-between items-start`} role="alert">
          <div className="text-sm font-bold">{message.text}</div>
          {message.type === 'error' ? (
            <button type="button" onClick={() => setMessage(null)} className="ml-4 text-xs font-black uppercase tracking-widest">
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      )}

      {loading && currentProducts.length === 0 ? (
        <div className="flex justify-center items-center py-32">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
        </div>
      ) : currentProducts.length === 0 ? (
        <div className="bg-white p-8 rounded-lg border border-gray-200 text-center shadow-sm">
          <p className="text-gray-500 font-bold uppercase tracking-widest">{activeSearchId ? 'No products match that exact _id.' : 'No products found in the inventory.'}</p>
        </div>
      ) : (
        <div className="relative overflow-x-auto bg-white rounded-xl shadow-sm border border-gray-200">
          {loading && (
            <div className="absolute inset-0 z-10 bg-white/65 backdrop-blur-[1px] flex items-center justify-center">
              <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-brand-red"></div>
            </div>
          )}
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Product Info</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Brand</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Category</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Price</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {currentProducts.map((product) => (
                <tr key={product._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="text-sm font-bold text-gray-900 capitalize">{product.title.length > 50 ? `${product.title.slice(0, 50)}...` : product.title}</div>
                    <div className="text-[10px] text-gray-400 font-mono mt-1">{product._id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-black uppercase tracking-tight">{product.brand}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium tracking-tight capitalize">{product.category}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-gray-900 font-mono">${product.price.toFixed(2)}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`text-sm font-bold ${product.stockQty < 50 ? 'text-red-600' : 'text-gray-600'}`}>{product.stockQty} Units</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium flex justify-center items-center gap-4">
                    <button onClick={() => {
                      setSelectedProductForEdit(product);
                      setIsEditModalOpen(true);
                    }} className="text-zinc-900 hover:text-brand-red font-bold text-[10px] tracking-widest border border-zinc-200 px-3 py-1.5 rounded transition-all cursor-pointer">Edit</button>
                    <button onClick={() => handleDeleteClick(product._id)} className="text-red-600 hover:text-red-700 font-bold text-[10px] tracking-widest border border-red-100 px-3 py-1.5 rounded transition-all cursor-pointer">Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {pages > 1 && (
        <div className="flex justify-center mt-10 space-x-2">
          {[...Array(pages)].map((_, index) => (
            <button
              key={index + 1}
              onClick={() => setCurrentPage(index + 1)}
              className={`w-10 h-10 rounded font-bold text-sm transition-all cursor-pointer ${currentPage === index + 1 ? 'bg-zinc-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-red'}`}
            >
              {index + 1}
            </button>
          ))}
        </div>
      )}

      <AddProductModal isOpen={isAddModalOpen} onClose={() => setIsAddModalOpen(false)} onProductAdded={handleProductAddedOrUpdated} />
      {selectedProductForEdit && (
        <EditProductModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedProductForEdit(null);
          }}
          product={selectedProductForEdit}
          role={role}
          onProductUpdated={handleProductAddedOrUpdated}
        />
      )}
      <BulkUploadModal
        isOpen={isBulkUploadModalOpen}
        onClose={() => setIsBulkUploadModalOpen(false)}
        onUploadSuccess={handleProductAddedOrUpdated}
      />
    </div>
  );
};

export default AdminProductList;
