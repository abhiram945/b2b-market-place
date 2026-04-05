
import React, { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { AppDispatch, RootState } from '../../redux/store';
import { fetchOrders, updateOrderStatus } from '../../redux/slices/orderSlice';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api';
import { toast } from 'react-toastify';
import { FileText, Search, X } from '../../components/icons';
import { User as UserType } from '../../types';


const MyOrders: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { orders, loading, error } = useSelector((state: RootState) => state.orders);
  const { role } = useAuth();
  const isAdmin = role === 'admin';
  const isBuyer = role === 'buyer';
  const [viewingInvoiceId, setViewingInvoiceId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const handleViewInvoice = async (orderId: string) => {
    try {
      setViewingInvoiceId(orderId);
      const response = await api.get(`/orders/${orderId}/invoice`, {
        responseType: 'blob',
      });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (err: any) {
      toast.error('Failed to view invoice');
    } finally {
      setViewingInvoiceId(null);
    }
  };

  const handleStatusUpdate = async (orderId: string, newStatus: string) => {
    try {
      await dispatch(updateOrderStatus({ orderId, status: newStatus })).unwrap();
      toast.success('Order status updated successfully!');
    } catch (err: any) {
      toast.error(err || 'Failed to update order status');
    }
  };

  const filteredOrders = orders.filter(order => {
    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    const buyerName = (order.user as UserType)?.fullName?.toLowerCase() || '';
    const companyName = (order.user as UserType)?.companyName?.toLowerCase() || '';
    const orderId = order._id.toLowerCase();
    
    return buyerName.includes(term) || companyName.includes(term) || orderId.includes(term);
  });

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

  if (loading) return (
    <div className="flex justify-center items-center py-32">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
    </div>
  );

  return (
    <div className="max-w-[90%] mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">ORDER <span className="text-brand-red">MANAGEMENT</span></h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest text-xs mt-1">Transaction History & Fulfilment</p>
      </div>

      {isAdmin && (
        <div className="mb-8 relative max-w-2xl">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-gray-400">
            <Search className="h-5 w-5" />
          </div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by order ID, buyer name..."
            className="block w-full h-14 pl-12 pr-12 bg-white border-2 border-gray-100 rounded-2xl text-sm font-bold text-gray-900 outline-none focus:border-brand-red focus:ring-4 focus:ring-red-500/5 transition-all shadow-sm"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-brand-red transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      )}
      
      {filteredOrders.length === 0 ? (
         <div className="bg-white p-12 rounded-lg border border-gray-200 text-center shadow-sm">
            <p className="text-gray-500 font-bold uppercase tracking-widest text-lg italic">
              {searchTerm ? 'No orders match your search criteria.' : 'No transaction records detected.'}
            </p>
         </div>
      ) : (
        <div className="space-y-10">
          {filteredOrders.map(order => (
            <div key={order._id} className="bg-white border border-gray-200 rounded-2xl shadow-sm overflow-hidden transition-all hover:shadow-md">
              <div className="p-6 bg-gray-50/50 border-b border-gray-200 flex flex-wrap justify-between items-center gap-6">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Order Reference</p>
                  <p className="text-lg font-black text-gray-900 font-mono">{order._id.toUpperCase()}</p>
                  <p className="text-xs font-bold text-gray-500 uppercase italic mt-1">{new Date(order.orderDate).toLocaleDateString()}</p>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="text-right">
                    <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Grand Total</p>
                    <p className="text-3xl font-black text-gray-900 tracking-tighter">${order.totalPrice.toFixed(2)}</p>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    {isAdmin ? (
                        <select
                        value={order.status}
                        onChange={(e) => handleStatusUpdate(order._id, e.target.value)}
                        className={`text-[10px] font-black uppercase tracking-widest rounded-lg px-4 py-2 border shadow-sm cursor-pointer outline-none transition-all focus:ring-2 focus:ring-brand-red ${getStatusColor(order.status)}`}
                        >
                        {['pending', 'shipped', 'ready', 'delivered', 'completed', 'cancelled'].map(s => (
                            <option key={s} value={s}>{s}</option>
                        ))}
                        </select>
                    ) : (
                        <span className={`px-4 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg border ${getStatusColor(order.status)}`}>
                        {order.status}
                        </span>
                    )}
                    
                    {(isAdmin || isBuyer) && order.invoiceUrl && (
                        <button
                        onClick={() => handleViewInvoice(order._id)}
                        disabled={viewingInvoiceId === order._id}
                        className="bg-brand-red hover:bg-brand-red-hover p-2.5 rounded-lg text-white shadow-md disabled:opacity-50 transition-colors"
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
                      <th className="px-8 py-4 text-left text-xs font-bold text-gray-400 uppercase tracking-wider">Provider</th>
                      <th className="px-8 py-4 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">Vol.</th>
                      <th className="px-8 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Unit Value</th>
                      <th className="px-8 py-4 text-right text-xs font-bold text-gray-400 uppercase tracking-wider">Subtotal</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 bg-white">
                    {order.items.map((item, idx) => (
                      <tr key={idx} className="hover:bg-gray-50/50">
                        <td className="px-8 py-5 text-sm font-bold text-gray-900 tracking-tight capitalize">{item.productTitle}</td>
                        <td className="px-8 py-5 text-xs font-bold text-gray-500 capitalize">{(item.vendor as UserType)?.companyName || 'Verified Vendor'}</td>
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
    </div>
  );
};

export default MyOrders;
