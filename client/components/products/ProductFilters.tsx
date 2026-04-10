import React, { useMemo, useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../../redux/store';
import { fetchFilterOptions, restoreProductList } from '../../redux/slices/productSlice';
import { ChevronDown } from '../icons';
import { toLowerTrim } from '../../utils/normalize';
import { toAssetUrl } from '../../utils/runtimeConfig';
import SearchBar from '../common/SearchBar';
import { Product } from '../../types';

interface ProductFiltersProps {
  filters: any;
  setFilters: (filters: any) => void;
  restoreFilters: (filters: any) => void;
}

type ProductSearchCache = {
  filters: any;
  products: Product[];
  page: number;
  pages: number;
  total: number;
};

const PRODUCT_SEARCH_CACHE_KEY = 'products-page-search-cache';

const BrandLogo: React.FC<{ brand: string }> = ({ brand }) => {
  const [hasLogo, setHasLogo] = useState(true);
  const logoUrl = toAssetUrl(`/uploads/brands/${brand.toLowerCase()}.png`);

  if (!hasLogo) {
    return (
      <span className="text-[10px] font-black uppercase tracking-widest px-2 py-1 text-zinc-400">
        {brand}
      </span>
    );
  }

  return (
    <img
      src={logoUrl}
      alt={brand}
      onError={() => setHasLogo(false)}
      className="h-4 w-auto object-contain grayscale opacity-60 hover:opacity-100 transition-all max-w-[60px]"
    />
  );
};

const ProductFilters: React.FC<ProductFiltersProps> = ({ filters, setFilters, restoreFilters }) => {
  const dispatch = useDispatch<AppDispatch>();
  const { products, filterOptions, page, pages, total } = useSelector((state: RootState) => state.products);
  const [localSearch, setLocalSearch] = useState(filters.search || '');
  const hasActiveFilters = Boolean(filters.search || filters.brand || filters.category || filters.location || filters.sort);

  useEffect(() => {
    setLocalSearch(filters.search || '');
  }, [filters.search]);

  // Fetch filter options on component mount
  useEffect(() => {
    dispatch(fetchFilterOptions());
  }, [dispatch]);

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFilters({ ...filters, [name]: name === 'sort' ? value : toLowerTrim(value), page: '' });
  };

  const handleBrandClick = (brand: string) => {
    setFilters({ ...filters, brand: toLowerTrim(brand), page: '' });
  };

  const cacheCurrentResults = () => {
    const payload: ProductSearchCache = {
      filters,
      products,
      page,
      pages,
      total,
    };
    localStorage.setItem(PRODUCT_SEARCH_CACHE_KEY, JSON.stringify(payload));
  };

  const restoreCachedResults = () => {
    const cachedValue = localStorage.getItem(PRODUCT_SEARCH_CACHE_KEY);
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
      restoreFilters(cachedPayload.filters);
      localStorage.removeItem(PRODUCT_SEARCH_CACHE_KEY);
      return true;
    } catch (_error) {
      localStorage.removeItem(PRODUCT_SEARCH_CACHE_KEY);
      return false;
    }
  };

  const handleSearchSubmit = () => {
    const normalizedSearch = toLowerTrim(localSearch);
    if (!normalizedSearch || normalizedSearch === filters.search) {
      return;
    }

    if (!filters.search) {
      cacheCurrentResults();
    }

    setFilters({ ...filters, search: normalizedSearch, page: '' });
  };

  const handleClearSearch = () => {
    setLocalSearch('');
    if (filters.search) {
      const restored = restoreCachedResults();
      if (restored) {
        return;
      }
    }
    setFilters({ ...filters, search: '', page: '' });
  };

  const handleClearFilters = () => {
    setLocalSearch('');
    setFilters({
      search: '',
      brand: '',
      category: '',
      location: '',
      sort: '',
      page: '',
    });
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-[64px] z-30">
      <div className="w-full mx-auto flex flex-wrap items-center gap-6">

        {/* Search */}
        <SearchBar
          value={localSearch}
          onChange={setLocalSearch}
          onSubmit={handleSearchSubmit}
          onClear={handleClearSearch}
          placeholder="Search inventory..."
          showClear={Boolean(localSearch || filters.search)}
        />

        {/* Brands */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar max-w-[400px]">
          <button onClick={() => handleBrandClick('')} className={`text-[9px] font-black uppercase tracking-widest px-2 transition-colors ${filters.brand === '' ? 'text-brand-red underline' : 'text-gray-400 hover:text-gray-900'}`}>
            ALL
          </button>
          <div className="flex gap-1 flex-nowrap items-center">
            {filterOptions.brands.map(b => (
              <button
                key={b}
                onClick={() => handleBrandClick(b)}
                className={`p-1.5 rounded-lg border transition-all bg-white flex items-center justify-center min-w-[40px] h-8 ${filters.brand === b.toLowerCase() ? 'border-brand-red shadow-sm bg-red-50/10' : 'border-gray-100 hover:border-gray-200'}`}
                title={b}
              >
                <BrandLogo brand={b} />
              </button>
            ))}
          </div>
        </div>

        {/* Category */}
        <div className="relative">
          <select name="category" value={filters.category} onChange={handleInputChange} className="h-10 pl-3 pr-9 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-black tracking-widest text-gray-700 outline-none focus:border-brand-red cursor-pointer appearance-none min-w-[140px] capitalize">
            <option value="">All Categories</option>
            {filterOptions.categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Location */}
        <div className="relative">
          <select name="location" value={filters.location} onChange={handleInputChange} className="h-10 pl-3 pr-9 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-black tracking-widest text-gray-700 outline-none focus:border-brand-red cursor-pointer appearance-none min-w-[140px] capitalize">
            <option value="">All Locations</option>
            {filterOptions.locations.map(l => <option key={l} value={l} className="capitalize">{l}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Sort */}
        <div className="relative">
          <select name="sort" value={filters.sort} onChange={handleInputChange} className="h-10 pl-3 pr-9 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-700 outline-none focus:border-brand-red cursor-pointer appearance-none min-w-[140px]">
            <option value="">Sort By</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
            <option value="newest">Newest First</option>
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        <button
          type="button"
          onClick={handleClearFilters}
          disabled={!hasActiveFilters}
          className="h-10 px-4 border border-gray-200 rounded-lg bg-white text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-gray-900 hover:border-gray-300 disabled:opacity-40 disabled:cursor-default transition-all cursor-pointer"
        >
          Clear Filters
        </button>

      </div>
    </div>
  );
};

export default ProductFilters;
