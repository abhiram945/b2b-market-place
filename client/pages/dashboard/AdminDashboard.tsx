import React, { useEffect, useRef, useState } from 'react';
import api from '../../api';
import { toast } from 'react-toastify';

interface User {
  _id: string;
  fullName: string;
  email: string;
  companyName: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
}

const AdminDashboard: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [updateType, setUpdateType] = useState<'approving' | 'rejecting' | null>(null);
  const effectRan = useRef(false);

  useEffect(() => {
    if (!effectRan.current) {
      fetchUsers();
      effectRan.current = true;
    }
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch (err: any) {
      toast.error('Failed to fetch users');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      setUpdatingUserId(userId);
      setUpdateType(status === 'approved' ? 'approving' : 'rejecting');
      await api.put(`/admin/users/${userId}/status`, { status });
      toast.success(`User ${status} successfully!`);
      fetchUsers();
    } catch (err: any) {
      toast.error(err.response?.data?.message || `Failed to ${status} user`);
    } finally {
      setUpdatingUserId(null);
      setUpdateType(null);
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
        <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">ADMIN <span className="text-brand-red">DASHBOARD</span></h1>
        <p className="text-gray-500 font-bold uppercase tracking-widest mt-1">User Management & Authorization</p>
      </div>
      
      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Organization</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900">{user.fullName}</div>
                    <div className="text-xs text-gray-500 font-mono">{user.email}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">{user.companyName}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-brand-red italic">{user.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${
                      user.status === 'approved' ? 'bg-green-100 text-green-800' :
                      user.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center text-sm font-medium">
                      <div className="flex justify-center gap-2">
                        {user.status !== 'approved' && (
                          <button
                            onClick={() => handleStatusUpdate(user._id, 'approved')}
                            disabled={updatingUserId === user._id}
                            className="bg-green-600 hover:bg-green-700 text-white font-black text-[10px] py-2 px-4 rounded-lg shadow-sm disabled:opacity-50 min-w-[100px] cursor-pointer uppercase tracking-widest transition-all"
                          >
                            {updatingUserId === user._id && updateType === 'approving' ? 'Approving...' : 'Approve'}
                          </button>
                        )}
                        {user.status !== 'rejected' && (
                          <button
                            onClick={() => handleStatusUpdate(user._id, 'rejected')}
                            disabled={updatingUserId === user._id}
                            className="bg-red-600 hover:bg-red-700 text-white font-black text-[10px] py-2 px-4 rounded-lg shadow-sm disabled:opacity-50 min-w-[100px] cursor-pointer uppercase tracking-widest transition-all"
                          >
                            {updatingUserId === user._id && updateType === 'rejecting' ? 'Rejecting...' : 'Reject'}
                          </button>
                        )}
                      </div>
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

export default AdminDashboard;
