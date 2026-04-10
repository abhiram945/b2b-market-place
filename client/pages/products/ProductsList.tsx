
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { RootState, AppDispatch } from '../../redux/store';
import { fetchProducts, clearProductsCache } from '../../redux/slices/productSlice';
import ProductTableRow from '../../components/products/ProductTableRow';
import ProductFilters from '../../components/products/ProductFilters';
import ProductDetailsModal from '../../components/products/ProductDetailsModal';
import EditProductModal from '../../components/products/EditProductModal';
import { Product } from '../../types';
import { useAuth } from '../../hooks/useAuth';

const ProductsList: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { role, user } = useAuth();

  const { products, loading, error, pages } = useSelector((state: RootState) => state.products);
  const pageNum = Number(searchParams.get('page') || '1');
  const pageSize = 10; // fixed UI page size: display 10 items per page
  const displayedProducts = products.slice((pageNum - 1) * pageSize, pageNum * pageSize) || [];
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedProductForEdit, setSelectedProductForEdit] = useState<Product | null>(null);
  const skipNextFetchRef = useRef(false);
  const lastFiltersKeyRef = useRef('');

  const filters = useMemo(() => ({
    search: searchParams.get('search') || '',
    brand: searchParams.get('brand') || '',
    category: searchParams.get('category') || '',
    location: searchParams.get('location') || '',
    sort: searchParams.get('sort') || '',
    page: searchParams.get('page') || '',
  }), [searchParams]);

  const handleSetFilters = (newFilters: any) => {
    const params: Record<string, string> = {};
    if (newFilters.search) params.search = newFilters.search;
    if (newFilters.brand) params.brand = newFilters.brand;
    if (newFilters.category) params.category = newFilters.category;
    if (newFilters.location) params.location = newFilters.location;
    if (newFilters.sort) params.sort = newFilters.sort;
    if (newFilters.page) params.page = newFilters.page;
    setSearchParams(params);
  };

  type ProductFetchFilters = {
    page?: number;
    limit?: number;
    search?: string;
    searchId?: string;
    vendorId?: string;
    brand?: string;
    location?: string;
    category?: string;
    minPrice?: number;
    maxPrice?: number;
    sort?: string;
  };

  const buildFiltersFromEntries = (entries: Iterable<[string, string]>): ProductFetchFilters => {
    const out: ProductFetchFilters = {};
    for (const [k, v] of entries) {
      if (!v) continue;
      if (k === 'page') out.page = Number(v) || undefined;
      else if (k === 'limit') out.limit = Number(v) || undefined;
      else if (k === 'minPrice') out.minPrice = Number(v) || undefined;
      else if (k === 'maxPrice') out.maxPrice = Number(v) || undefined;
      else if (k === 'vendorId') out.vendorId = v;
      else if (k === 'searchId') out.searchId = v;
      else if (k === 'search') out.search = v;
      else if (k === 'brand') out.brand = v;
      else if (k === 'location') out.location = v;
      else if (k === 'category') out.category = v;
      else if (k === 'sort') out.sort = v;
    }
    return out;
  };

  useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      // return;
    }

    const allParams = Object.fromEntries(searchParams.entries());
    const pageRequested = Number(allParams.page || '1');

    // Build a filter key excluding the `page` param so we can detect filter changes
    const paramsWithoutPage = { ...allParams };
    delete paramsWithoutPage.page;
    // Ensure vendorId is included for vendor users
    if (role === 'vendor' && user && user._id) {
      paramsWithoutPage.vendorId = user._id;
      allParams.vendorId = user._id; // also include for request
    }

    const filtersKey = JSON.stringify(paramsWithoutPage);

    // If filters changed, clear cache and fetch page
    if (filtersKey !== lastFiltersKeyRef.current) {
      lastFiltersKeyRef.current = filtersKey;
      // Prevent the cache-clear update from triggering an immediate duplicate fetch
      skipNextFetchRef.current = true;
      dispatch(clearProductsCache());
      // build typed filters and fetch
      const paramsForRequest = new URLSearchParams(Object.entries(allParams));
      paramsForRequest.set('page', String(pageRequested));
      paramsForRequest.set('limit', String(pageSize));
      const typed = buildFiltersFromEntries(paramsForRequest.entries());
      dispatch(fetchProducts(typed));
      return;
    }

    // If there are no pages (no results) or we already have enough products for this page, skip fetch
    if (pages === 0 || products.length >= pageRequested * pageSize) {
      return;
    }

    // Otherwise fetch the requested page
    const paramsForRequest = new URLSearchParams(Object.entries(allParams));
    paramsForRequest.set('page', String(pageRequested));
    paramsForRequest.set('limit', String(pageSize));
    const typed = buildFiltersFromEntries(paramsForRequest.entries());
    dispatch(fetchProducts(typed));
  }, [searchParams, pageSize]);

  const handleRestoreFilters = (newFilters: any) => {
    skipNextFetchRef.current = true;
    handleSetFilters(newFilters);
  };

  const handleProductClick = (product: Product) => {
    setSelectedProduct(product);
    setIsDetailsModalOpen(true);
  };

  const handleEditClick = (product: Product) => {
    setSelectedProductForEdit(product);
    setIsEditModalOpen(true);
  };

  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setSelectedProductForEdit(null);
  };

  const handleEditSuccess = () => {
    const typed = buildFiltersFromEntries(searchParams.entries());
    dispatch(fetchProducts(typed));
  };

  const Th = ({ label, className = "" }: { label: string, className?: string }) => (
    <th className={`px-2 py-3 text-[10px] font-black uppercase tracking-widest text-zinc-400 italic text-center ${className}`}>
        {label}
    </th>
  );

  return (
    <div className="bg-zinc-50 min-h-[calc(100vh-64px)]">
      {/* Sticky Filter Section */}
      <div className="bg-white border-b border-zinc-200 z-20">
        <ProductFilters filters={filters} setFilters={handleSetFilters} restoreFilters={handleRestoreFilters} />
      </div>

      <div className="w-full">
        <div className="min-w-full inline-block align-middle">
          <table className="w-full border-collapse min-w-[1200px]">
          <thead className="sticky top-0 z-10 bg-zinc-900 shadow-xl">
            <tr>
              <th className="px-6 py-3 text-left">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 italic">Product</span>
              </th>
              <Th label="Brand" />
              <Th label="Category" />
              <Th label="Location" />
              <Th label="Condition" />
              <Th label="Price" />
              <Th label="MOQ"/>
              <Th label="MXQ"/>
              <Th label="Stock" />
              <Th label="ETA" className="hidden lg:table-cell" />
              <th className="px-6 py-3 text-center">
                  <span className="text-[10px] font-black uppercase tracking-[0.3em] text-red-600 italic">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-zinc-100">
            {loading ? (
                <tr>
                    <td colSpan={11} className="py-40">
                        <div className="flex flex-col items-center justify-center gap-4">
                            <div className="w-10 h-10 border-4 border-zinc-100 border-t-red-600 rounded-full animate-spin"></div>
                            <span className="text-[9px] font-black text-zinc-400 uppercase tracking-widest animate-pulse italic">Connecting Inventory Vector...</span>
                        </div>
                    </td>
                </tr>
            ) : error ? (
                <tr>
                    <td colSpan={11} className="py-20 px-6">
                        <div className="bg-red-50 border-l-4 border-red-600 p-6 text-center max-w-2xl mx-auto">
                            <p className="text-red-600 font-black uppercase tracking-widest italic">{error}</p>
                        </div>
                    </td>
                </tr>
            ) : displayedProducts.length > 0 ? (
              displayedProducts.map((product) => (
              <ProductTableRow 
                key={product._id} 
                product={product} 
                onProductClick={handleProductClick} 
                onEditClick={handleEditClick}
              />
              ))
            ) : (
                <tr>
                    <td colSpan={11} className="px-6 py-12">
                        <div className="w-full py-32 text-center bg-white border border-zinc-200 rounded-2xl shadow-sm">
                            <p className="text-zinc-400 font-black uppercase tracking-widest text-sm italic">NO COMPATIBLE STOCK DETECTED</p>
                            <p className="text-zinc-300 text-[10px] font-bold uppercase tracking-[0.2em] mt-2">Check filters or contact support for manual sourcing</p>
                        </div>
                    </td>
                </tr>
            )}
          </tbody>
        </table>
        </div>
      </div>

      {pages > 1 && (
        <div className="flex justify-center py-6 bg-white border-t border-zinc-200">
          <div className="flex justify-center space-x-2">
            {[...Array(pages)].map((_, index) => (
              <button
                key={index + 1}
                onClick={() => {
                  const newParams = new URLSearchParams(searchParams);
                  newParams.set('page', (index + 1).toString());
                  setSearchParams(newParams);
                }}
                className={`w-10 h-10 rounded font-bold text-sm transition-all cursor-pointer ${pageNum === index + 1 ? 'bg-zinc-900 text-white shadow-md' : 'bg-white text-gray-600 border border-gray-200 hover:border-brand-red'}`}
              >
                {index + 1}
              </button>
            ))}
          </div>
        </div>
      )}

      <ProductDetailsModal isOpen={isDetailsModalOpen} onClose={() => setIsDetailsModalOpen(false)} product={selectedProduct} />
      {isEditModalOpen && selectedProductForEdit && (
        <EditProductModal
          isOpen={isEditModalOpen}
          onClose={handleCloseEditModal}
          product={selectedProductForEdit}
          role={role}
          onProductUpdated={handleEditSuccess}
        />
      )}
    </div>
  );
};

export default ProductsList;
