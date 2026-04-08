import React, { useEffect, useRef, useState } from 'react';
import { X } from '../../components/icons';
import api from '../../api';
import { fetchUserSubscriptions } from '../../redux/slices/notificationSlice'; // Assuming this is an async thunk
import { useDispatch } from 'react-redux'; // Import useDispatch
import { AppDispatch } from '../../redux/store';
import { toLowerTrim } from '../../utils/normalize';

interface User {
  _id: string;
  fullName: string;
  email: string;
  companyName: string;
  website?: string;
  role: string;
  status: 'pending' | 'approved' | 'rejected';
  tradeLicense?: string;
  idDocument?: string;
  vatRegistration?: string;
}

const AdminDashboard: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>(); // Initialize useDispatch
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);
  const [updateType, setUpdateType] = useState<'approving' | 'rejecting' | null>(null);
  const [userIdSearch, setUserIdSearch] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isMaintenanceLoading, setIsMaintenanceLoading] = useState(false);
  const effectRan = useRef(false);
  const brandLogoInputRef = useRef<HTMLInputElement | null>(null);
  const bannerInputRef = useRef<HTMLInputElement | null>(null);

  // State for uploads and previews
  const [brandName, setBrandName] = useState('');
  const [brandLogo, setBrandLogo] = useState<File | null>(null);
  const [brandLogoPreviewUrl, setBrandLogoPreviewUrl] = useState<string | null>(null); // State for brand logo preview
  const [banner, setBanner] = useState<File | null>(null);
  const [currentBannerUrl, setCurrentBannerUrl] = useState<string | null>(null); // State for current banner URL
  const [heroHeading, setHeroHeading] = useState('');
  const [heroSubheading, setHeroSubheading] = useState('');
  const [isBrandLogoUploading, setIsBrandLogoUploading] = useState(false); // Specific state for brand logo upload
  const [isBannerUploading, setIsBannerUploading] = useState(false); // Specific state for banner upload
  const [message, setMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const resetBrandUploadForm = () => {
    setBrandName('');
    setBrandLogo(null);
    setBrandLogoPreviewUrl(null);
    if (brandLogoInputRef.current) {
      brandLogoInputRef.current.value = '';
    }
  };

  const resetBannerUploadForm = () => {
    setBanner(null);
    if (bannerInputRef.current) {
      bannerInputRef.current.value = '';
    }
  };

  useEffect(() => {
    if (message?.type === 'success') {
      const t = setTimeout(() => setMessage(null), 2000);
      return () => clearTimeout(t);
    }
  }, [message]);

  // --- Functions to fetch data ---
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const { data } = await api.get('/admin/users');
      setUsers(data);
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || 'Failed to fetch users' });
    } finally {
      setLoading(false);
    }
  };

  const fetchMaintenanceStatus = async () => {
    try {
      const { data } = await api.get('/admin/maintenance');
      setMaintenanceMode(data.maintenanceMode);
    } catch (err) {
      console.error('Failed to fetch maintenance status:', err);
      setMessage({ type: 'error', text: 'Failed to load maintenance status.' });
    }
  };

  const fetchConfig = async () => {
    try {
      // Fetch configuration including banner path
      const { data } = await api.get('/admin/config');
      setCurrentBannerUrl(data.banner || null);
      setHeroHeading(data.heroHeading || '');
      setHeroSubheading(data.heroSubheading || '');
    } catch (err) {
      console.error('Failed to fetch configuration:', err);
      setMessage({ type: 'error', text: 'Failed to load banner configuration.' });
    }
  };

  // --- Effect hook to fetch initial data ---
  useEffect(() => {
    if (!effectRan.current) {
      dispatch(fetchUserSubscriptions() as any); // Dispatch the Redux action
      fetchMaintenanceStatus();
      fetchConfig(); // Fetch config to get current banner URL
      fetchUsers(); // Fetch users on initial load
      effectRan.current = true;
    }
  }, [dispatch]); // Add dispatch to dependency array

  // --- Handlers for maintenance mode ---
  const handleMaintenanceToggle = async () => {
    try {
      setIsMaintenanceLoading(true);
      const newStatus = !maintenanceMode;
      await api.post('/admin/maintenance', { maintenanceMode: newStatus });
      setMaintenanceMode(newStatus);
    } catch (err) {
      setMessage({ type: 'error', text: 'FAILED TO TOGGLE MAINTENANCE MODE' });
    } finally {
      setIsMaintenanceLoading(false);
    }
  };

  // --- Handlers for user status updates ---
  const handleStatusUpdate = async (userId: string, status: 'approved' | 'rejected') => {
    try {
      setUpdatingUserId(userId);
      setUpdateType(status === 'approved' ? 'approving' : 'rejecting');
      await api.put(`/admin/users/${userId}/status`, { status });
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user._id === userId ? { ...user, status } : user
        )
      );
      setMessage({ type: 'success', text: `User ${status} successfully!` });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.response?.data?.message || `Failed to ${status} user` });
    } finally {
      setUpdatingUserId(null);
      setUpdateType(null);
    }
  };

  // --- Handlers for viewing documents ---
  const handleViewDocument = async (docPath: string | undefined) => {
    if (!docPath) return;
    try {
      const filename = docPath.split('/').pop(); // Extract filename from path
      if (!filename) {
        setMessage({ type: 'error', text: 'Invalid document path.' });
        return;
      }
      const response = await api.get(`/admin/documents/${filename}`, {
        responseType: 'blob',
      });
      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      window.open(fileURL, '_blank');
    } catch (err) {
      console.error('Failed to view document:', err);
      setMessage({ type: 'error', text: 'FAILED TO VIEW DOCUMENT' });
    }
  };

  // --- Handlers for brand logo upload ---
  const handleBrandLogoUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!brandLogo) {
      setMessage({ type: 'error', text: 'Please select a logo image.' });
      return;
    }
    if (!brandName) {
      setMessage({ type: 'error', text: 'Please enter a brand name.' });
      return;
    }
    if (brandLogo.type !== 'image/png') {
      setMessage({ type: 'error', text: 'Only PNG files are allowed. Please select a PNG image.' });
      resetBrandUploadForm();
      return;
    }

    setIsBrandLogoUploading(true);
    const formData = new FormData();
    formData.append('name', toLowerTrim(brandName)); // Send brand name
    formData.append('image', brandLogo);

    try {
      const { data } = await api.post('/admin/upload/brand-logo', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage({ type: 'success', text: data.message || 'Brand logo uploaded successfully!' });
      // Optionally update currentBannerUrl if the backend returns it, or refetch config
      fetchConfig(); // Refetch config to update current banner URL if needed
      resetBrandUploadForm();
    } catch (err: any) {
      console.error('Brand logo upload failed:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Brand logo upload failed.' });
      resetBrandUploadForm();
    } finally {
      setIsBrandLogoUploading(false);
    }
  };

  // --- Handlers for banner upload ---
  const handleBannerUpload = async (e: React.FormEvent) => {
    e.preventDefault();

    if (banner && banner.type !== 'image/png') {
      setMessage({ type: 'error', text: 'Only PNG files are allowed. Please select a PNG image.' });
      resetBannerUploadForm();
      return;
    }
    if (!banner && !heroHeading.trim() && !heroSubheading.trim()) {
      setMessage({ type: 'error', text: 'Please provide a banner image, main heading, or sub heading.' });
      return;
    }

    setIsBannerUploading(true);
    const formData = new FormData();
    formData.append('heroHeading', heroHeading.trim());
    formData.append('heroSubheading', heroSubheading.trim());
    if (banner) {
      formData.append('banner', banner); // Use 'banner' as the field name expected by backend
    }
    try {
      const { data } = await api.post('/admin/upload/banner', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setMessage({ type: 'success', text: data.message || 'Banner settings updated successfully!' });
      setCurrentBannerUrl(data.bannerPath); // Update the current banner URL from response
      setHeroHeading(data.heroHeading || '');
      setHeroSubheading(data.heroSubheading || '');
      resetBannerUploadForm();
    } catch (err: any) {
      console.error('Banner upload failed:', err);
      setMessage({ type: 'error', text: err.response?.data?.message || 'Banner settings update failed.' });
      resetBannerUploadForm();
    } finally {
      setIsBannerUploading(false);
    }
  };

  const filteredUsers = users.filter((user) =>
    user._id.toLowerCase().includes(userIdSearch.trim().toLowerCase())
  );

  // --- Effect for handling file inputs and previews ---
  useEffect(() => {
    if (brandLogo) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setBrandLogoPreviewUrl(reader.result as string);
      };
      reader.readAsDataURL(brandLogo);
    } else {
      setBrandLogoPreviewUrl(null);
    }
  }, [brandLogo]);

  useEffect(() => {
    if (banner) {
      const reader = new FileReader();
      reader.onloadend = () => {
        // Note: currentBannerUrl is for the *existing* banner, bannerPreviewUrl for the *selected* one.
        // For simplicity, we can show the selected banner as preview.
        // If you need a separate preview state for banner, add one.
        // For now, we'll just update the selected banner state.
      };
      reader.readAsDataURL(banner);
    } else {
      // If banner is cleared, reset preview if needed.
    }
  }, [banner]);


  if (loading) return (
    <div className="flex justify-center items-center py-32">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-red"></div>
    </div>
  );

  return (
    <div className="max-w-[90%] mx-auto py-8">
      <div className="mb-8 flex justify-between items-end">
        <div>
          <h1 className="text-4xl font-black text-gray-900 uppercase tracking-tight">ADMIN <span className="text-brand-red">DASHBOARD</span></h1>
          <p className="text-gray-500 font-bold uppercase tracking-widest mt-1">User Management & Authorization</p>
        </div>

        <div className="flex flex-col items-end gap-2">
          <span className="text-[9px] font-black text-zinc-400 uppercase tracking-[0.2em] italic">Critical Systems Control</span>
          <button
            onClick={handleMaintenanceToggle}
            disabled={isMaintenanceLoading}
            className={`px-6 py-3 rounded-none font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl flex items-center gap-3 cursor-pointer ${maintenanceMode
              ? 'bg-red-600 text-white hover:bg-zinc-900 ring-4 ring-red-600/20'
              : 'bg-zinc-900 text-white hover:bg-red-600'
              }`}
          >
            <div className={`w-2 h-2 rounded-full ${maintenanceMode ? 'bg-white animate-pulse' : 'bg-red-600'}`}></div>
            {isMaintenanceLoading ? 'Syncing...' : maintenanceMode ? 'Disable Maintenance' : 'Enable Maintenance'}
          </button>
        </div>
      </div>
      {message && (
        <div className={`${message.type === 'error' ? 'bg-red-50 border-red-200 text-red-700' : 'bg-green-50 border-green-200 text-green-700'} border px-4 py-3 rounded-md mb-4 flex justify-between items-center`} role="alert">
          <div className="text-sm font-bold">{message.text}</div>
          {message.type === 'error' ? (
            <button type="button" onClick={() => setMessage(null)} className="ml-4 text-xs font-black uppercase tracking-widest cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          ) : null}
        </div>
      )}

      <div className="mb-8 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Brand Logo Upload */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 italic">Brand Asset Management</h3>
          <form onSubmit={handleBrandLogoUpload} className="space-y-4">
            <div className='w-full flex items-center'>
              <div className={`space-y-4 ${brandLogoPreviewUrl ? "w-3/4 pr-4" : "w-full"}`}>
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Brand Name</label>
                  <input
                    type="text"
                    value={brandName}
                    onChange={(e) => setBrandName(e.target.value)}
                    placeholder="e.g. Apple, Dell"
                    className="w-full px-3 py-2 border border-zinc-200 rounded text-xs font-bold focus:outline-none focus:border-brand-red"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Logo Image (PNG Only)</label>
                  <input
                    ref={brandLogoInputRef}
                    type="file"
                    onChange={(e) => {
                      setBrandLogo(e.target.files?.[0] || null);
                    }}
                    accept=".png,image/png"
                    className="w-full text-xs file:bg-zinc-100 file:border-0 file:rounded file:px-3 file:py-1 file:text-[10px] file:font-black file:uppercase file:tracking-widest cursor-pointer"
                  />
                </div>
              </div>
              {brandLogoPreviewUrl && (
                <div className="flex flex-col items-center w-1/4"> {/* Container for preview label and image */}
                  <img src={brandLogoPreviewUrl} alt="Brand Logo Preview" className="max-h-24 w-auto rounded border border-zinc-200" />
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isBrandLogoUploading} // Use specific upload state
              className="w-full bg-zinc-900 text-white font-black text-[10px] uppercase tracking-widest py-2 hover:bg-brand-red transition-all disabled:opacity-50 cursor-pointer"
            >
              {isBrandLogoUploading ? 'Uploading...' : 'Upload Brand Assets'}
            </button>
          </form>
        </div>

        {/* Banner Upload */}
        <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest mb-4 italic">Core Banner System</h3>
          <form onSubmit={handleBannerUpload} className="space-y-4">
            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Main Heading</label>
              <input
                type="text"
                value={heroHeading}
                onChange={(e) => setHeroHeading(e.target.value)}
                placeholder="e.g. Exclusive B2B Deals"
                className="w-full px-3 py-2 border border-zinc-200 rounded text-xs font-bold focus:outline-none focus:border-brand-red"
              />
            </div>
            <div>
              <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Sub Heading</label>
              <input
                type="text"
                value={heroSubheading}
                onChange={(e) => setHeroSubheading(e.target.value)}
                placeholder="e.g. Bulk purchase discounts on top brands this week!"
                className="w-full px-3 py-2 border border-zinc-200 rounded text-xs font-bold focus:outline-none focus:border-brand-red"
              />
            </div>
            <div className='flex w-full'>
              <div className='w-2/3'>
                <label className="block text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Global Banner Image (PNG Only)</label>
                <div className="flex items-center gap-4 mt-2"> {/* Flex container for input and display section */}
                  <input
                    ref={bannerInputRef}
                    type="file"
                    onChange={(e) => setBanner(e.target.files?.[0] || null)}
                    accept=".png,image/png"
                    className="w-full text-xs file:bg-zinc-100 file:border-0 file:rounded file:px-3 file:py-1 file:text-[10px] file:font-black file:uppercase file:tracking-widest cursor-pointer"
                  />
                </div>
              </div>
              {banner && (
                <div className="flex flex-col items-center w-1/3">
                  <img src={banner ? URL.createObjectURL(banner) : ''} alt="Banner Preview" className="w-full rounded border border-zinc-200" />
                </div>
              )}
            </div>
            <button
              type="submit"
              disabled={isBannerUploading} // Use specific upload state
              className="w-full bg-zinc-900 text-white font-black text-[10px] uppercase tracking-widest py-2 hover:bg-brand-red transition-all disabled:opacity-50 cursor-pointer"
            >
              {isBannerUploading ? 'Updating...' : 'Update Banner Content'}
            </button>
          </form>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
        <div className="border-b border-gray-200 px-6 py-4">
          <input
            type="text"
            value={userIdSearch}
            onChange={(e) => setUserIdSearch(e.target.value)}
            placeholder="Search users by ID"
            className="w-full max-w-md px-3 py-2 border border-zinc-200 rounded text-sm font-bold focus:outline-none focus:border-brand-red"
          />
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">User</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Organization</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Documents</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Role</th>
                <th className="px-6 py-4 text-left font-bold text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-4 text-center font-bold text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredUsers.map((user) => (
                <tr key={user._id} className="hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-bold text-gray-900 capitalize">{user.fullName}</div>
                    <div className="text-xs text-gray-500 font-mono">{user.email}</div>
                    <div className="text-[10px] text-zinc-400 font-mono mt-1">{user._id}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600 font-medium">
                    <div className="font-bold capitalize">{user.companyName}</div>
                    {user.website && (
                      <a
                        href={user.website.startsWith('http') ? user.website : `https://${user.website}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-brand-red hover:underline font-black italic block mt-0.5 w-max"
                      >
                        {user.website.replace(/^https?:\/\//, '')}
                      </a>
                    )}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 font-medium">
                    <div className="flex flex-col items-start gap-2">
                      {user.tradeLicense && (
                        <button onClick={() => handleViewDocument(user.tradeLicense)} className="text-[9px] bg-zinc-100 px-2 py-1 rounded border border-zinc-200 hover:bg-zinc-200 transition-colors font-black uppercase tracking-widest text-zinc-600 cursor-pointer w-[80%] text-center">
                          Trade License
                        </button>
                      )}
                      {user.idDocument && (
                        <button onClick={() => handleViewDocument(user.idDocument)} className="text-[9px] bg-zinc-100 px-2 py-1 rounded border border-zinc-200 hover:bg-zinc-200 transition-colors font-black uppercase tracking-widest text-zinc-600 cursor-pointer w-[80%] text-center">
                          ID Document
                        </button>
                      )}
                      {user.vatRegistration && (
                        <button onClick={() => handleViewDocument(user.vatRegistration)} className="text-[9px] bg-zinc-100 px-2 py-1 rounded border border-zinc-200 hover:bg-zinc-200 transition-colors font-black uppercase tracking-widest text-zinc-600 cursor-pointer w-[80%] text-center">
                          VAT/Tax
                        </button>
                      )}
                      {!user.tradeLicense && !user.idDocument && !user.vatRegistration && (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400">
                          No Documents
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-black text-brand-red italic">{user.role}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${user.status === 'approved' ? 'bg-green-100 text-green-800' :
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
              {filteredUsers.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-6 py-10 text-center text-sm font-bold text-zinc-400 uppercase tracking-widest">
                    No users found
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

export default AdminDashboard;
