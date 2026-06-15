import { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useSearchParams } from 'react-router-dom';
import { RootState, AppDispatch } from '../redux/store';
import { fetchProducts, clearProductsCache, fetchFilterOptions } from '../redux/slices/productSlice';
import { useAuth } from './useAuth';

export type ProductFetchFilters = {
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

export const useProducts = (options: { pageSize?: number; syncWithUrl?: boolean; autoVendorFilter?: boolean } = {}) => {
    const { pageSize = 10, syncWithUrl = true, autoVendorFilter = true } = options;
    const dispatch = useDispatch<AppDispatch>();
    const [searchParams, setSearchParams] = useSearchParams();
    const { activeRole, user } = useAuth();

    const { productsByPage, loading, error, pages, total, filterOptions, config } = useSelector((state: RootState) => state.products);

    const [pageNum, setInternalPage] = useState(1);

    const lastFiltersKeyRef = useRef('');
    const skipNextFetchRef = useRef(false);

    const currentFilters = useMemo(() => {
        const out: ProductFetchFilters = {};
        if (syncWithUrl) {
            for (const [k, v] of searchParams.entries()) {
                if (!v) continue;
                if (k === 'page') continue; // Ignore page from URL
                else if (k === 'search') out.search = v;
                else if (k === 'brand') out.brand = v;
                else if (k === 'category') out.category = v;
                else if (k === 'location') out.location = v;
                else if (k === 'sort') out.sort = v;
                else if (k === 'vendorId') out.vendorId = v;
                else if (k === 'searchId') out.searchId = v;
            }
        }
        return out;
    }, [searchParams, syncWithUrl]);

    // Reset page to 1 whenever filters change
    const filtersKey = useMemo(() => JSON.stringify(currentFilters), [currentFilters]);
    useEffect(() => {
        setInternalPage(1);
    }, [filtersKey]);

    const fetchItems = (requestedPage: number, forceRefresh = false) => {
        const params: ProductFetchFilters = { ...currentFilters, page: requestedPage, limit: pageSize };
        
        if (autoVendorFilter && activeRole === 'vendor' && user?._id) {
            params.vendorId = user._id;
        }

        const filterKeyObj = { ...params };
        delete filterKeyObj.page;
        const currentFiltersKey = JSON.stringify(filterKeyObj);

        if (currentFiltersKey !== lastFiltersKeyRef.current || forceRefresh) {
            lastFiltersKeyRef.current = currentFiltersKey;
            dispatch(clearProductsCache());
            dispatch(fetchProducts(params));
            return;
        }

        if (!productsByPage[requestedPage]) {
            dispatch(fetchProducts(params));
        }
    };

    const primeFiltersKey = (overrides: Partial<ProductFetchFilters> = {}) => {
        const params: ProductFetchFilters = { ...currentFilters, ...overrides, limit: pageSize };

        if (autoVendorFilter && activeRole === 'vendor' && user?._id) {
            params.vendorId = user._id;
        }

        const filterKeyObj = { ...params };
        delete filterKeyObj.page;
        lastFiltersKeyRef.current = JSON.stringify(filterKeyObj);
    };

    useEffect(() => {
        dispatch(fetchFilterOptions());
    }, [dispatch]);

    useEffect(() => {
        if (skipNextFetchRef.current) {
            skipNextFetchRef.current = false;
            return;
        }
        fetchItems(pageNum);
    }, [pageNum, currentFilters, activeRole, user?._id]);

    const setPage = (page: number) => {
        setInternalPage(page);
    };

    const updateFilters = (newFilters: Partial<ProductFetchFilters>) => {
        if (syncWithUrl) {
            const params = new URLSearchParams();
            
            // Start with current filters and apply updates
            const merged = { ...currentFilters, ...newFilters };
            
            Object.entries(merged).forEach(([k, v]) => {
                // Skip page and any empty/null/undefined values
                if (k === 'page' || v === '' || v === null || v === undefined) return;
                params.set(k, String(v));
            });

            setSearchParams(params);
        }
        
        // Always reset to page 1 for ANY filter change
        setInternalPage(1);
    };

    return {
        products: productsByPage[pageNum] || [],
        productsByPage,
        loading,
        error,
        pageNum,
        pages,
        total,
        currentFilters,
        filterOptions,
        config,
        setPage,
        updateFilters,
        primeFiltersKey,
        suppressNextFetch: () => {
            skipNextFetchRef.current = true;
        },
        refresh: () => fetchItems(pageNum, true)
    };
};
