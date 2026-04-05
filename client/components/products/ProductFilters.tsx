import React, { useMemo, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { RootState } from '../../redux/store';
import { ChevronDown, Search, X } from '../icons';

interface ProductFiltersProps {
  filters: any;
  setFilters: (filters: any) => void;
}

const BrandLogo: React.FC<{ brand: string }> = ({ brand }) => {
  const [hasLogo, setHasLogo] = useState(true);
  const logoUrl = `http://localhost:5000/uploads/brands/${brand.toLowerCase()}.png`;

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

const ProductFilters: React.FC<ProductFiltersProps> = ({ filters, setFilters }) => {
  const { products, config } = useSelector((state: RootState) => state.products);
  const [localSearch, setLocalSearch] = useState(filters.search || '');

  useEffect(() => {
    setLocalSearch(filters.search || '');
  }, [filters.search]);

  const uniqueValues = useMemo(() => {
    const locations = new Set<string>();
    const categories = new Set<string>();
    products.forEach(p => {
      locations.add(p.location);
      categories.add(p.category);
    });
    return {
      locations: Array.from(locations).sort(),
      categories: Array.from(categories).sort(),
    };
  }, [products]);

  const handleInputChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleBrandClick = (brand: string) => {
    setFilters({ ...filters, brand: brand.toLowerCase() });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters({ ...filters, search: localSearch.toLowerCase() });
  };

  return (
    <div className="bg-white border-b border-gray-200 px-4 py-3 sticky top-[64px] z-30">
      <div className="max-w-7xl mx-auto flex flex-wrap items-center gap-6">

        {/* Search */}
        <form onSubmit={handleSearchSubmit} className="relative flex-1 min-w-[250px]">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
            <Search className="h-4 w-4" />
          </div>
          <input
            type="text"
            value={localSearch}
            onChange={(e) => setLocalSearch(e.target.value)}
            placeholder="Search inventory..."
            className="block w-full h-10 pl-10 pr-24 bg-gray-50 border border-gray-200 rounded-lg text-sm font-bold text-gray-900 outline-none focus:border-brand-red transition-all"
          />
          {localSearch && (
            <button
              type="button"
              onClick={() => {
                setLocalSearch('');
                setFilters({ ...filters, search: '' });
              }}
              className="absolute inset-y-0 right-20 flex items-center pr-2 text-gray-400 hover:text-brand-red transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
          <button type="submit" className="absolute inset-y-1.5 right-1.5 px-3 bg-black hover:bg-brand-red text-white text-[9px] font-black uppercase tracking-widest rounded transition-all active:scale-95">
            SEARCH
          </button>
        </form>

        {/* Brands */}
        <div className="flex items-center gap-3 overflow-x-auto no-scrollbar max-w-[400px]">
          <button onClick={() => handleBrandClick('')} className={`text-[9px] font-black uppercase tracking-widest px-2 transition-colors ${filters.brand === '' ? 'text-brand-red underline' : 'text-gray-400 hover:text-gray-900'}`}>
            ALL
          </button>
          <div className="flex gap-1 flex-nowrap items-center">
            {config.brands.map(b => (
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
          <select name="category" value={filters.category} onChange={handleInputChange} className="h-10 pl-3 pr-9 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-700 outline-none focus:border-brand-red cursor-pointer appearance-none min-w-[140px] capitalize">
            <option value="">Categories</option>
            {uniqueValues.categories.map(c => <option key={c} value={c} className="capitalize">{c}</option>)}
          </select>
          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400 pointer-events-none" />
        </div>

        {/* Location */}
        <div className="relative">
          <select name="location" value={filters.location} onChange={handleInputChange} className="h-10 pl-3 pr-9 bg-gray-50 border border-gray-200 rounded-lg text-[10px] font-black uppercase tracking-widest text-gray-700 outline-none focus:border-brand-red cursor-pointer appearance-none min-w-[140px] capitalize">
            <option value="">Locations</option>
            {uniqueValues.locations.map(l => <option key={l} value={l} className="capitalize">{l}</option>)}
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

      </div>
    </div>
  );
};

export default ProductFilters;
