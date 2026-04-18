import React from 'react';

const AdminProductSkeleton: React.FC = () => {
    return (
        <tr className="animate-pulse border-b border-gray-200">
            <td className="px-6 py-4">
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-50 rounded w-1/2"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 bg-gray-100 rounded w-20"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 bg-gray-100 rounded w-24"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 bg-gray-100 rounded w-16"></div>
            </td>
            <td className="px-6 py-4">
                <div className="h-4 bg-gray-100 rounded w-14"></div>
            </td>
            <td className="px-6 py-4">
                <div className="flex justify-center gap-4">
                    <div className="h-8 bg-gray-100 rounded w-16"></div>
                    <div className="h-8 bg-gray-100 rounded w-20"></div>
                </div>
            </td>
        </tr>
    );
};

export default AdminProductSkeleton;
