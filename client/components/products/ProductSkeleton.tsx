import React from 'react';

const ProductSkeleton: React.FC = () => {
    return (
        <tr className="animate-pulse border-b border-zinc-200 bg-zinc-50 dark:bg-zinc-900 dark:border-zinc-100">
            <td className="px-6 py-4">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700/80 rounded w-3/4"></div>
            </td>
            <td className="px-2 py-4">
                <div className="h-3 bg-zinc-200 dark:bg-zinc-700/80 rounded w-12 mx-auto"></div>
            </td>
            <td className="px-2 py-4">
                <div className="h-3 bg-zinc-200 dark:bg-zinc-700/80 rounded w-16 mx-auto"></div>
            </td>
            <td className="px-2 py-4">
                <div className="h-3 bg-zinc-200 dark:bg-zinc-700/80 rounded w-16 mx-auto"></div>
            </td>
            <td className="px-2 py-4">
                <div className="h-3 bg-zinc-200 dark:bg-zinc-700/80 rounded w-12 mx-auto"></div>
            </td>
            <td className="px-2 py-4">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700/80 rounded w-16 mx-auto"></div>
            </td>
            <td className="px-2 py-4">
                <div className="h-3 bg-zinc-200 dark:bg-zinc-700/80 rounded w-8 mx-auto"></div>
            </td>
            <td className="px-2 py-4">
                <div className="h-3 bg-zinc-200 dark:bg-zinc-700/80 rounded w-8 mx-auto"></div>
            </td>
            <td className="px-2 py-4">
                <div className="h-4 bg-zinc-200 dark:bg-zinc-700/80 rounded w-10 mx-auto"></div>
            </td>
            <td className="px-2 py-4 hidden lg:table-cell">
                <div className="h-3 bg-zinc-200 dark:bg-zinc-700/80 rounded w-6 mx-auto"></div>
            </td>
            <td className="px-6 py-4">
                <div className="flex justify-center gap-3">
                    <div className="h-8 bg-zinc-200 dark:bg-zinc-700/80 rounded w-24"></div>
                </div>
            </td>
        </tr>
    );
};

export default ProductSkeleton;
