import React from "react";
import { format, parseISO } from "date-fns";

function ExpenseList({ expenses, onDelete }) {
  const handleDelete = async (expenseId) => {
    if (window.confirm("Are you sure you want to delete this expense?")) {
      await onDelete(expenseId);
    }
  };

  if (expenses.length === 0) {
    return (
      <div className="text-center py-16">
        <svg
          className="mx-auto h-12 w-12 text-gray-400 mb-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
        <p className="text-sm text-gray-500">
          No expenses found. Add your first expense to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Date
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Category
            </th>
            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Notes
            </th>
            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
              Amount
            </th>
            <th className="px-4 py-3 text-center text-xs font-semibold text-gray-600 uppercase tracking-wider w-12">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {expenses.map((expense) => (
            <tr
              key={expense.expenseId}
              className="hover:bg-gray-50 transition-colors group"
            >
              <td className="px-4 py-4 whitespace-nowrap">
                <div className="text-sm text-gray-900">
                  {format(parseISO(expense.date), "MMM dd, yyyy")}
                </div>
                <div className="text-xs text-gray-500 mt-0.5">
                  {format(parseISO(expense.date), "EEEE")}
                </div>
              </td>
              <td className="px-4 py-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                  {expense.category}
                </span>
              </td>
              <td className="px-4 py-4">
                <div className="text-sm text-gray-900 max-w-xs truncate">
                  {expense.notes || (
                    <span className="text-gray-400 italic">No notes</span>
                  )}
                </div>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-right">
                <span className="text-sm font-semibold text-gray-900">
                  ${expense.amount.toFixed(2)}
                </span>
              </td>
              <td className="px-4 py-4 whitespace-nowrap text-center">
                <button
                  onClick={() => handleDelete(expense.expenseId)}
                  className="inline-flex items-center justify-center p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-md transition-all opacity-0 group-hover:opacity-100"
                  title="Delete expense"
                  aria-label="Delete expense"
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    className="transition-transform hover:scale-110"
                  >
                    <path
                      d="M10 4L4 10M4 4l6 6"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                </button>
              </td>
            </tr>
          ))}
        </tbody>
        <tfoot className="bg-gray-50 border-t-2 border-gray-200">
          <tr>
            <td colSpan="3" className="px-4 py-3 text-sm font-semibold text-gray-700">
              Total
            </td>
            <td className="px-4 py-3 text-right">
              <span className="text-base font-bold text-gray-900">
                $
                {expenses
                  .reduce((sum, expense) => sum + expense.amount, 0)
                  .toFixed(2)}
              </span>
            </td>
            <td className="px-4 py-3"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  );
}

export default ExpenseList;
