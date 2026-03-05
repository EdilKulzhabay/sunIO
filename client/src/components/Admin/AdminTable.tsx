import { Edit2, Trash2 } from 'lucide-react';

interface Column {
    key: string;
    label: string;
    render?: (value: any, row: any) => React.ReactNode;
}

interface AdminTableProps {
    columns: Column[];
    data: any[];
    onEdit: (item: any) => void;
    onDelete: (item: any) => void;
    selectable?: boolean;
    selectedIds?: Set<string>;
    onSelectionChange?: (ids: Set<string>) => void;
}

export const AdminTable = ({ columns, data, onEdit, onDelete, selectable, selectedIds, onSelectionChange }: AdminTableProps) => {
    const safeData = data || [];

    const allSelected = safeData.length > 0 && selectedIds ? safeData.every((row) => selectedIds.has(row._id)) : false;

    const toggleAll = () => {
        if (!onSelectionChange) return;
        if (allSelected) {
            onSelectionChange(new Set());
        } else {
            onSelectionChange(new Set(safeData.map((row) => row._id)));
        }
    };

    const toggleOne = (id: string) => {
        if (!onSelectionChange || !selectedIds) return;
        const next = new Set(selectedIds);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        onSelectionChange(next);
    };
    
    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        {selectable && (
                            <th className="px-3 py-3 w-10">
                                <input
                                    type="checkbox"
                                    checked={allSelected}
                                    onChange={toggleAll}
                                    className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                />
                            </th>
                        )}
                        {columns.map((column) => (
                            <th
                                key={column.key}
                                className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                            >
                                {column.label}
                            </th>
                        ))}
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Действия
                        </th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {safeData.length === 0 ? (
                        <tr>
                            <td
                                colSpan={columns.length + 1 + (selectable ? 1 : 0)}
                                className="px-6 py-4 text-center text-gray-500"
                            >
                                Нет данных
                            </td>
                        </tr>
                    ) : (
                        safeData.map((row, index) => (
                            <tr key={row._id || index} className={`hover:bg-gray-50 ${selectable && selectedIds?.has(row._id) ? 'bg-blue-50' : ''}`}>
                                {selectable && (
                                    <td className="px-3 py-4 w-10">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds?.has(row._id) || false}
                                            onChange={() => toggleOne(row._id)}
                                            className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500 cursor-pointer"
                                        />
                                    </td>
                                )}
                                {columns.map((column) => (
                                    <td key={column.key} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                        {column.render
                                            ? column.render(row[column.key], row)
                                            : row[column.key]}
                                    </td>
                                ))}
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                    <div className="flex gap-2">
                                        <button
                                            onClick={() => onEdit(row)}
                                            className="text-blue-600 hover:text-blue-900"
                                        >
                                            <Edit2 size={18} />
                                        </button>
                                        <button
                                            onClick={() => onDelete(row)}
                                            className="text-red-600 hover:text-red-900"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))
                    )}
                </tbody>
            </table>
        </div>
    );
};
