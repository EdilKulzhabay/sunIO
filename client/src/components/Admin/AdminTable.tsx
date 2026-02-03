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
}

export const AdminTable = ({ columns, data, onEdit, onDelete }: AdminTableProps) => {
    // Защита от undefined
    const safeData = data || [];
    
    return (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
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
                                colSpan={columns.length + 1}
                                className="px-6 py-4 text-center text-gray-500"
                            >
                                Нет данных
                            </td>
                        </tr>
                    ) : (
                        safeData.map((row, index) => (
                            <tr key={row._id || index} className="hover:bg-gray-50">
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

