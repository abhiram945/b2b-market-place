
import React, { useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import { RootState, AppDispatch } from '../../redux/store';
import DashboardCard from '../../components/dashboard/DashboardCard';
import { Truck, Package } from '../../components/icons';
import { fetchOrders } from '../../redux/slices/orderSlice';

const BRANDS = [
  { name: 'Apple', logo: 'https://upload.wikimedia.org/wikipedia/commons/f/fa/Apple_logo_black.svg', width: 'w-12' },
  { name: 'Samsung', logo: 'https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Samsung_Galaxy_logo.svg/1280px-Samsung_Galaxy_logo.svg.png?20221019181539', width: 'w-24' },
  { name: 'Sony', logo: 'https://upload.wikimedia.org/wikipedia/commons/c/ca/Sony_logo.svg', width: 'w-20' },
  { name: 'Dell', logo: 'https://upload.wikimedia.org/wikipedia/commons/1/18/Dell_logo_2016.svg', width: 'w-16' },
  { name: 'HP', logo: 'https://upload.wikimedia.org/wikipedia/commons/a/ad/HP_logo_2012.svg', width: 'w-14' },
  { name: 'Lenovo', logo: 'https://upload.wikimedia.org/wikipedia/commons/b/b8/Lenovo_logo_2015.svg', width: 'w-24' },
];

const BuyerDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { orders } = useSelector((state: RootState) => state.orders);

  useEffect(() => {
    dispatch(fetchOrders());
  }, [dispatch]);

  const pendingOrders = orders.filter(o => o.status.toLowerCase() === 'pending').length;
  
  return (
    <div className="max-w-[90%] mx-auto py-8">
      <div className="border-b border-gray-200 dark:border-zinc-800 pb-6">
        <h1 className="text-4xl font-black text-black uppercase tracking-tighter italic">
            Dashboard <span className="text-red-600">Overview</span>
        </h1>
        <p className="mt-2 text-gray-500 dark:text-zinc-400 font-medium">WELCOME BACK, {user?.fullName?.toUpperCase()}</p>

        <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <DashboardCard 
              title="PENDING ORDERS" 
              value={pendingOrders} 
              icon={<Truck className="h-6 w-6 text-white" />}
              colorClass="bg-red-600"
          />
          <DashboardCard 
              title="TOTAL ORDERS" 
              value={orders.length} 
              icon={<Package className="h-6 w-6 text-white" />}
              colorClass="bg-zinc-900 dark:bg-zinc-800"
          />
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 mb-8 rounded-xl shadow-2xl shadow-red-600/5 overflow-hidden border border-gray-100 dark:border-zinc-800">
        <div className="relative h-64 sm:h-80 md:h-96 w-full">
            <img 
                src="https://images.unsplash.com/photo-1550751827-4bd374c3f58b?auto=format&fit=crop&q=80&w=1200" 
                alt="Featured Offer" 
                className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                <div className="text-center px-4">
                    <h2 className="text-3xl md:text-5xl font-black text-white mb-4 uppercase italic tracking-tighter">Exclusive B2B <span className="text-red-600">Deals</span></h2>
                    <p className="text-sm md:text-base text-gray-300 mb-8 uppercase font-bold tracking-widest">Bulk purchase discounts on top brands this week!</p>
                    <button 
                        onClick={() => navigate('/products')}
                        className="btn-primary py-4 px-10 rounded-none font-black uppercase italic tracking-tighter transition-all hover:px-12 bg-brand-red text-white cursor-pointer"
                    >
                        Browse All Products
                    </button>
                </div>
            </div>
        </div>
      </div>

      <div className="bg-white dark:bg-zinc-900 p-10 rounded-xl shadow-xl border border-gray-100 dark:border-zinc-800">
        <h2 className="text-xl font-black text-gray-900 dark:text-white mb-10 text-center uppercase tracking-widest">
            Shop by <span className="text-red-600 underline underline-offset-8 decoration-2">Top Brands</span>
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 items-center justify-center gap-12">
          {BRANDS.map((brand) => (
            <button
              key={brand.name}
              onClick={() => navigate(`/products?brand=${brand.name}`)}
              className="flex justify-center transform hover:scale-110 grayscale hover:grayscale-0 opacity-50 hover:opacity-100 transition-all duration-500"
              title={brand.name}
            >
              <img
                src={brand.logo}
                alt={brand.name}
                className={`${brand.width} h-auto dark:invert`}
              />
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default BuyerDashboard;
