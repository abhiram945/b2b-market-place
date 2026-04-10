import React, { useEffect, useState } from 'react';
import { X } from '../../components/icons';
import { useAuth } from '../../hooks/useAuth';
import DashboardCard from '../../components/dashboard/DashboardCard';
import { Package, Tag, ShoppingCart, AlertCircle, Copy, CheckCircle } from '../../components/icons';
import api from '../../api';

interface VendorSummaryOrder {
    _id: string;
    orderDate: string;
    status: string;
    items: Array<{
        productTitle: string;
        quantity: number;
    }>;
}

const VendorDashboard: React.FC = () => {
    const { user } = useAuth();
    const [copied, setCopied] = useState(false);
    const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
    const [summary, setSummary] = useState({
        activeListings: 0,
        totalSales: 0,
        newOrders: 0,
        lowStockItems: 0,
        recentOrders: [] as VendorSummaryOrder[],
    });

    useEffect(() => {
        if (message?.type === 'success') {
            const t = setTimeout(() => setMessage(null), 2000);
            return () => clearTimeout(t);
        }
    }, [message]);

    useEffect(() => {
        const fetchSummary = async () => {
            try {
                const { data } = await api.get('/dashboard/summary');
                setSummary({
                    activeListings: data.activeListings || 0,
                    totalSales: data.totalSales || 0,
                    newOrders: data.newOrders || 0,
                    lowStockItems: data.lowStockItems || 0,
                    recentOrders: data.recentOrders || [],
                });
            } catch (error) {
                setSummary({
                    activeListings: 0,
                    totalSales: 0,
                    newOrders: 0,
                    lowStockItems: 0,
                    recentOrders: [],
                });
            }
        };

        fetchSummary();
    }, []);

    const handleCopyId = () => {
        if (user?._id) {
            navigator.clipboard.writeText(user._id);
            setCopied(true);
            setTimeout(() => setCopied(false), 2000);
        }
    };

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

    return (
        <div className="max-w-[90%] mx-auto py-8">
            <div className="flex flex-col sm:flex-row justify-between sm:items-end gap-4 mb-6">
                <div>
                    <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">
                        Vendor <span className="text-brand-red font-black">Portal</span>
                    </h1>
                </div>
                <div className="flex flex-col items-end">
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-zinc-400 uppercase tracking-widest bg-zinc-100 px-2 py-1 rounded border border-zinc-200">ID: {user?._id}</span>
                        <button 
                            onClick={handleCopyId}
                            className="p-1 hover:text-brand-red transition-colors text-zinc-400 cursor-pointer"
                            title="Copy ID"
                        >
                            {copied ? (
                                <CheckCircle className="w-3.5 h-3.5 text-green-600" />
                            ) : (
                                <Copy className="w-3.5 h-3.5" />
                            )}
                        </button>
                    </div>
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest mt-1">Managing Store: {user?.companyName}</p>
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
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 mb-10">
                <DashboardCard title="Active Listings" value={summary.activeListings} icon={<Package className="h-6 w-6 text-white" />} colorClass="bg-black" />
                <DashboardCard title="Total Revenue" value={`$${summary.totalSales.toFixed(2)}`} icon={<Tag className="h-6 w-6 text-white" />} colorClass="bg-brand-red" />
                <DashboardCard title="New Orders" value={summary.newOrders} icon={<ShoppingCart className="h-6 w-6 text-white" />} colorClass="bg-brand-red" />
                <DashboardCard title="Low Stock Items" value={summary.lowStockItems} icon={<AlertCircle className="h-6 w-6 text-white" />} colorClass="bg-black" />
            </div>

            <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
                <div className="p-6 border-b border-gray-100 flex items-center justify-between bg-gray-50/50">
                    <h2 className="text-xl font-black text-gray-900 uppercase tracking-tight">
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
                            {summary.recentOrders.map(order => (
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
                            {summary.recentOrders.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="px-6 py-10 text-center text-sm font-bold text-zinc-400 uppercase tracking-widest">
                                        no recent orders found
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
};

export default VendorDashboard;
