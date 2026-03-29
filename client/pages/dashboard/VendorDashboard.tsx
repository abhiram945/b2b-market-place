import React, { useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useAuth } from '../../hooks/useAuth';
import DashboardCard from '../../components/dashboard/DashboardCard';
import { Package, Tag, ShoppingCart, AlertCircle, PlusCircle } from '../../components/icons';
import { fetchProducts } from '../../redux/slices/productSlice';
import { fetchOrders } from '../../redux/slices/orderSlice';
import { AppDispatch, RootState } from '../../redux/store';

const VendorDashboard: React.FC = () => {
    const dispatch = useDispatch<AppDispatch>();
    const { user } = useAuth();
    const { products } = useSelector((state: RootState) => state.products);
    const { orders } = useSelector((state: RootState) => state.orders);

    useEffect(() => {
        dispatch(fetchProducts(undefined));
        dispatch(fetchOrders());
    }, [dispatch]);

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

    const lowStockItems = products.filter(p => p.stockQty < 100).length;
    
    // Revenue should be the sum of items belonging to this vendor across all non-cancelled orders
    const totalSales = orders
        .filter(o => o.status.toLowerCase() !== 'cancelled')
        .reduce((sum, order) => {
            const vendorItemsTotal = order.items
                .filter(item => {
                    const vendorId = typeof item.vendor === 'object' ? item.vendor._id : item.vendor;
                    return vendorId === user?._id;
                })
                .reduce((itemSum, item) => itemSum + (item.price * item.quantity), 0);
            return sum + vendorItemsTotal;
        }, 0);

    return (
        <div className="max-w-[90%] mx-auto py-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-6">
                <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight italic">
                    Vendor <span className="text-brand-red font-black">Portal</span>
                </h1>
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Managing Store: {user?.companyName}</p>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
                <DashboardCard title="Active Listings" value={products.length} icon={<Package className="h-6 w-6 text-white" />} colorClass="bg-black" />
                <DashboardCard title="Total Revenue" value={`$${totalSales.toFixed(2)}`} icon={<Tag className="h-6 w-6 text-white" />} colorClass="bg-brand-red" />
                <DashboardCard title="New Orders" value={orders.filter(o => o.status.toLowerCase() === 'pending').length} icon={<ShoppingCart className="h-6 w-6 text-white" />} colorClass="bg-brand-red" />
                <DashboardCard title="Low Stock Items" value={lowStockItems} icon={<AlertCircle className="h-6 w-6 text-white" />} colorClass="bg-black" />
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight italic">
                        Recent <span className="text-brand-red">Orders</span>
                    </h2>
                </div>
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Order ID</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Product</th>
                                <th className="px-6 py-4 text-left text-[10px] font-black text-gray-400 uppercase tracking-widest">Order date</th>
                                <th className="px-6 py-4 text-center text-[10px] font-black text-gray-400 uppercase tracking-widest">Status</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 bg-white">
                            {orders.slice(0, 10).map(order => (
                                <tr key={order._id} className="hover:bg-gray-50 transition-colors">
                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-gray-900 font-mono">{order._id}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                                        <ul className="space-y-1">
                                            {order.items.map((item, idx) => (
                                                <li key={idx} className="uppercase tracking-tight text-gray-900 font-bold">{item.productTitle} <span className="text-gray-400 text-xs">(x{item.quantity})</span></li>
                                            ))}
                                        </ul>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-bold uppercase">{new Date(order.orderDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4 whitespace-nowrap text-center">
                                        <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getStatusColor(order.status)} shadow-sm`}>
                                            {order.status}
                                        </span>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VendorDashboard;
