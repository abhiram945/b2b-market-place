import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { fetchOrders, restoreOrderList, updateOrderStatus } from '../../redux/slices/orderSlice';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api';
import { FileText } from '../../components/icons';
import { Order, User as UserType } from '../../types';
import { useAlert } from '../../contexts/AlertContext';
import SearchBar from '../../components/common/SearchBar';

const ADMIN_ORDER_SEARCH_CACHE_KEY = 'admin-order-search-cache';

type OrderSearchCache = {
  orders: Order[];
  currentPage: number;
};

const MyOrders: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders, loading, updatingOrderId } = useSelector((state: RootState) => state.orders);
  const { activeRole } = useAuth();
  const isAdmin = activeRole === 'admin';
  const isBuyer = activeRole === 'buyer';
  const showProviderColumn = !isBuyer;
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [activeSearchId, setActiveSearchId] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const ordersPerPage = 10;
  const { showAlert } = useAlert();
  const skipNextFetchRef = useRef(false);

  useEffect(() => {
    if (skipNextFetchRef.current) {
      skipNextFetchRef.current = false;
      return;
    }
    dispatch(fetchOrders(isAdmin ? { search: activeSearchId || undefined } : {}));
  }, [activeSearchId, dispatch, isAdmin]);

  const cacheCurrentOrders = () => {
    // Ensure vendor display fields are preserved in the cached payload so
    // clearing search restores companyName/fullName instead of falling back.
    const normalizedOrders = orders.map(o => ({
      ...o,
      items: o.items.map((item: any) => ({
        ...item,
        vendor: typeof item.vendor === 'object' && item.vendor !== null
          ? { _id: item.vendor._id, companyName: item.vendor.companyName || item.vendor.fullName || item.vendor._id }
          : item.vendor,
      })),
    }));

    const payload: OrderSearchCache = {
      orders: normalizedOrders,
      currentPage,
    };
    localStorage.setItem(ADMIN_ORDER_SEARCH_CACHE_KEY, JSON.stringify(payload));
  };

  const restoreCachedOrders = () => {
    const cachedValue = localStorage.getItem(ADMIN_ORDER_SEARCH_CACHE_KEY);
    if (!cachedValue) {
      return false;
    }

    try {
      const cachedPayload = JSON.parse(cachedValue) as OrderSearchCache;
      dispatch(restoreOrderList(cachedPayload.orders));
      setCurrentPage(cachedPayload.currentPage);
      localStorage.removeItem(ADMIN_ORDER_SEARCH_CACHE_KEY);
      return true;
    } catch (_error) {
      localStorage.removeItem(ADMIN_ORDER_SEARCH_CACHE_KEY);
      return false;
    }
  };

  const handleSearchSubmit = () => {
    const normalizedSearch = searchInput.trim();
    if (!isAdmin || !normalizedSearch || normalizedSearch === activeSearchId) {
      return;
    }

    if (!activeSearchId) {
      cacheCurrentOrders();
    }

    setCurrentPage(1);
    setActiveSearchId(normalizedSearch);
  };

  const handleClearSearch = () => {
    setSearchInput('');

    if (!activeSearchId) {
      return;
    }

    const restored = restoreCachedOrders();
    if (restored) {
      skipNextFetchRef.current = true;
    }
    setActiveSearchId('');

    if (!restored) {
      setCurrentPage(1);
      dispatch(fetchOrders({}));
    }
  };

  const handleViewInvoice = async (orderId: string) => {
    try {
      setViewingInvoiceId(orderId);
      const response = await api.get(`/orders/${orderId}/invoice`, {
        responseType: 'blob',
      });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (_err: any) {
      showAlert({ variant: 'error', title: 'invoice unavailable', message: 'failed to view invoice.' });
    } finally {
      setViewingInvoiceId(null);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await dispatch(updateOrderStatus({ orderId, status: newStatus })).unwrap();
      showAlert({ variant: 'success', title: 'order updated', message: 'order status updated successfully.' });
    } catch (err: any) {
      showAlert({ variant: 'error', title: 'order update failed', message: err || 'failed to update order status.' });
    }
  };

  const totalPages = Math.max(1, Math.ceil(orders.length / ordersPerPage));
  const sortedOrders = [...orders].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
  const paginatedOrders = sortedOrders.slice((currentPage - 1) * ordersPerPage, currentPage * ordersPerPage);

  useEffect(() => {
    setCurrentPage(1);
  }, [activeSearchId, isAdmin, orders.length]);

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'shipped': return 'bg-blue-100 text-blue-800';
      case 'ready': return 'bg-purple-100 text-purple-800';
      case 'delivered': return 'bg-teal-100 text-teal-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getVendorId = (vendor: any) => (typeof vendor === 'object' && vendor !== null) ? vendor?._id : vendor;
  const getVendorName = (item: any) => {
    if (item.vendorName) return item.vendorName;
    const vendor = item.vendor;
    if (!vendor) return 'Verified Vendor';
    if (typeof vendor === 'object') {
      return vendor.companyName || vendor.fullName || vendor._id || 'Verified Vendor';
    }
    // vendor is a string id
    return vendor;
  };
  const getCustomerId = (user: any) => typeof user === 'object' ? user?._id : user;

  if (loading) {
    return (
      <div className="flex justify-center items-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
      </div>
    );
  }

  return (
    <div className="max-w-[90%] mx-auto py-8">
      <div className="mb-8 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">ORDER <span className="text-brand-red">MANAGEMENT</span></h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">Transaction History & Fulfilment</p>
        </div>

        {isAdmin && (
          <div className="w-full md:w-auto max-w-md">
            <SearchBar
              value={searchInput}
              onChange={setSearchInput}
              onSubmit={handleSearchSubmit}
              onClear={handleClearSearch}
              placeholder="search with order id"
              showClear={Boolean(searchInput || activeSearchId)}
            />
          </div>
        )}
      </div>

      {orders.length === 0 ? (
        <div className="bg-white p-12 rounded-lg border border-gray-200 text-center shadow-sm">
          <p className="text-gray-500 font-bold uppercase tracking-widest text-lg italic">
            {activeSearchId ? 'No orders match id.' : 'No transaction records detected.'}
          </p>
        </div>
      ) : (
        <div className="space-y-10">
          {paginatedOrders.map(order => (
            <div key={order._id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="p-6 bg-gray-50/50 border-b border-gray-200 flex flex-wrap justify-between items-center gap-6">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</p>
                  <p className="text-lg font-black text-gray-900 font-mono">{order._id.toUpperCase()}</p>
                  <p className="text-xs font-bold text-gray-500 uppercase italic mt-1">{new Date(order.createdAt).toLocaleDateString()}</p>
                </div>
                {isAdmin && (
                  <div>
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Customer ID</p>
                    <p className="text-sm font-black text-gray-900 font-mono">{getCustomerId(order.user)}</p>
                  </div>
                )}

                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Grand Total</p>
                    <p className="text-3xl font-black text-gray-900 tracking-tighter">${order.totalPrice.toFixed(2)}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    {isAdmin ? (
                      updatingOrderId === order._id ? (
                        <div className="text-[10px] font-black uppercase tracking-widest rounded-lg px-4 py-2 border shadow-sm bg-gray-100 text-gray-600 border-gray-200">
                          Updating...
                        </div>
                      ) : (
                        <select
                          value={order.status}
                          onChange={(event) => handleStatusUpdate(order._id, event.target.value)}
                          className={`text-[10px] font-black uppercase tracking-widest rounded-lg px-4 py-2 border shadow-sm cursor-pointer outline-none transition-all focus:ring-2 focus:ring-brand-red ${getStatusColor(order.status)}`}
                        >
                          {['pending', 'shipped', 'ready', 'delivered', 'completed', 'cancelled'].map(status => (
                            <option key={status} value={status}>{status}</option>
                          ))}
                        </select>
                      )
                    ) : (
                      <span className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border ${getStatusColor(order.status)}`}>
                        {order.status}
                      </span>
                    )}

                    {(isAdmin || isBuyer) && (
                      <button
                        onClick={() => handleViewInvoice(order._id)}
                        disabled={viewingInvoiceId === order._id}
                        className="bg-brand-red hover:bg-brand-red-hover p-2.5 rounded-lg text-white shadow-md disabled:opacity-50 transition-colors cursor-pointer"
                        title="View Official Invoice"
                      >
                        <FileText className={`w-5 h-5 ${viewingInvoiceId === order._id ? 'animate-pulse' : ''}`} />
                      </button>
                    )}
                  </div>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-white">
                    <tr>
                      <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Product Description</th>
                      {showProviderColumn && (
                        <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Provider</th>
                      )}
                      {isAdmin && (
                        <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Vendor ID</th>
                      )}
                      <th className="px-8 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Vol.</th>
                      <th className="px-8 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Unit Value</th>
                      <th className="px-8 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {order.items.map((item, index) => (
                      <tr key={index} className="hover:bg-gray-50/50">
                        <td className="px-8 py-5 text-sm font-bold text-gray-900 tracking-tight capitalize">{item.productTitle}</td>
                        {showProviderColumn && (
                          <td className="px-8 py-5 text-xs font-bold text-gray-500 capitalize">{getVendorName(item)}</td>
                        )}
                        {isAdmin && (
                          <td className="px-8 py-5 text-[11px] font-bold text-gray-500 font-mono">{getVendorId(item.vendor)}</td>
                        )}
                        <td className="px-8 py-5 text-sm font-bold text-gray-900 text-center italic">{item.quantity}</td>
                        <td className="px-8 py-5 text-sm font-bold text-gray-500 text-right font-mono">${item.price.toFixed(2)}</td>
                        <td className="px-8 py-5 text-sm font-black text-brand-red text-right font-mono">${(item.quantity * item.price).toFixed(2)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          ))}
        </div>
      )}
      {totalPages > 1 && (
        <div className="flex justify-center mt-10 space-x-2">
          {[...Array(totalPages)].map((_, index) => (
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
    </div>
  );
};

export default MyOrders;
