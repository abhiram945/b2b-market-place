import { useEffect, useMemo, useRef } from 'react';
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

    const pageNum = useMemo(() => {
        if (syncWithUrl) return Number(searchParams.get('page') || '1');
        return 1; // Fallback or managed externally if not synced
    }, [searchParams, syncWithUrl]);

    const lastFiltersKeyRef = useRef('');
    const skipNextFetchRef = useRef(false);

    const currentFilters = useMemo(() => {
        const out: ProductFetchFilters = {};
        if (syncWithUrl) {
            for (const [k, v] of searchParams.entries()) {
                if (!v) continue;
                if (k === 'page') out.page = Number(v);
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

    const fetchItems = (requestedPage: number, forceRefresh = false) => {
        const params: ProductFetchFilters = { ...currentFilters, page: requestedPage, limit: pageSize };
        
        if (autoVendorFilter && activeRole === 'vendor' && user?._id) {
            params.vendorId = user._id;
        }

        const filterKeyObj = { ...params };
        delete filterKeyObj.page;
        const filtersKey = JSON.stringify(filterKeyObj);

        if (filtersKey !== lastFiltersKeyRef.current || forceRefresh) {
            lastFiltersKeyRef.current = filtersKey;
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
        if (syncWithUrl) {
            const newParams = new URLSearchParams(searchParams);
            newParams.set('page', page.toString());
            setSearchParams(newParams);
        }
    };

    const updateFilters = (newFilters: Partial<ProductFetchFilters>) => {
        if (syncWithUrl) {
            const params = new URLSearchParams();
            const mergedFilters = { ...currentFilters, ...newFilters };
            Object.entries(mergedFilters).forEach(([k, v]) => {
                if (k === 'page') return;
                if (v) params.set(k, String(v));
            });

            // Default behavior: reset to page 1 on filter change.
            // If caller provides a valid numeric page, preserve that page.
            const requestedPageRaw = (newFilters as any)?.page;
            const requestedPage =
                typeof requestedPageRaw === 'number' && requestedPageRaw > 0
                    ? requestedPageRaw
                    : 1;
            params.set('page', String(requestedPage));
            setSearchParams(params);
        }
    };

    return {
        products: productsByPage[pageNum] || [],
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
