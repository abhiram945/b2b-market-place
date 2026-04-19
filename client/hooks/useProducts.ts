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

    useEffect(() => {
        dispatch(fetchFilterOptions());
    }, [dispatch]);

    useEffect(() => {
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
            Object.entries({ ...currentFilters, ...newFilters }).forEach(([k, v]) => {
                if (v) params.set(k, String(v));
            });
            // Reset to page 1 on filter change
            params.set('page', '1');
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
        refresh: () => fetchItems(pageNum, true)
    };
};
