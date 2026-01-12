import React, { useState, useEffect } from "react";
import ExpenseForm from "./ExpenseForm";
import ExpenseList from "./ExpenseList";
import ExpenseChart from "./ExpenseChart";
import Logo from "./Logo";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";

function Dashboard({ user, onLogout }) {
  const [expenses, setExpenses] = useState([]);
  const [total, setTotal] = useState(0);
  const [categoryTotals, setCategoryTotals] = useState({});
  const [selectedCategory, setSelectedCategory] = useState("");
  const [dateFilter, setDateFilter] = useState("all"); // "all", "week", "month"
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState("");

  const apiUrl = import.meta.env.VITE_API_URL;

  useEffect(() => {
    fetchExpenses();
  }, [selectedCategory, dateFilter]);

  const getAuthToken = () => {
    return localStorage.getItem("authToken");
  };

  const getDateRange = (filter) => {
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    switch (filter) {
      case "week": {
        const weekAgo = new Date(today);
        weekAgo.setDate(weekAgo.getDate() - 7);
        weekAgo.setHours(0, 0, 0, 0);
        return {
          startDate: weekAgo.toISOString().split("T")[0],
          endDate: today.toISOString().split("T")[0],
        };
      }
      case "month": {
        const monthAgo = new Date(today);
        monthAgo.setMonth(monthAgo.getMonth() - 1);
        monthAgo.setHours(0, 0, 0, 0);
        return {
          startDate: monthAgo.toISOString().split("T")[0],
          endDate: today.toISOString().split("T")[0],
        };
      }
      default:
        return { startDate: null, endDate: null };
    }
  };

  const fetchExpenses = async () => {
    try {
      setIsLoading(true);
      const token = getAuthToken();

      if (!token) {
        throw new Error("No authentication token found");
      }

      // Build query parameters
      const params = new URLSearchParams();
      if (selectedCategory) {
        params.append("category", selectedCategory);
      }

      const dateRange = getDateRange(dateFilter);
      if (dateRange.startDate) {
        params.append("startDate", dateRange.startDate);
      }
      if (dateRange.endDate) {
        params.append("endDate", dateRange.endDate);
      }

      const queryString = params.toString();
      const url = queryString
        ? `${apiUrl}/expenses?${queryString}`
        : `${apiUrl}/expenses`;

      const response = await fetch(url, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to fetch expenses");
      }

      const data = await response.json();
      setExpenses(data.expenses || []);
      setTotal(data.total || 0);
      setCategoryTotals(data.categoryTotals || {});
      setError("");
    } catch (error) {
      console.error("Error fetching expenses:", error);
      setError("Failed to load expenses. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddExpense = async (expenseData) => {
    try {
      const token = getAuthToken();

      if (!token) {
        return { success: false, error: "No authentication token found" };
      }

      const response = await fetch(`${apiUrl}/expenses`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(expenseData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to add expense");
      }

      await fetchExpenses();
      return { success: true };
    } catch (error) {
      console.error("Error adding expense:", error);
      return { success: false, error: error.message };
    }
  };

  const handleDeleteExpense = async (expenseId) => {
    try {
      const token = getAuthToken();

      if (!token) {
        alert("No authentication token found");
        return;
      }

      const response = await fetch(`${apiUrl}/expenses/${expenseId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error("Failed to delete expense");
      }

      await fetchExpenses();
    } catch (error) {
      console.error("Error deleting expense:", error);
      alert("Failed to delete expense. Please try again.");
    }
  };

  const handleExportCSV = () => {
    const headers = ["Date", "Category", "Amount", "Notes"];
    const rows = expenses.map((expense) => [
      expense.date,
      expense.category,
      expense.amount.toFixed(2),
      expense.notes || "",
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute(
      "download",
      `expenses_${new Date().toISOString().split("T")[0]}.csv`
    );
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const categories = Object.keys(categoryTotals);
  const sydneyTime = new Date().toLocaleString("en-AU", {
    timeZone: "Australia/Sydney",
    dateStyle: "full",
    timeStyle: "short",
  });

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <Logo size={28} />
              <div>
                <h1 className="text-lg font-semibold text-gray-900">
                  Expense Tracker
                </h1>
                <p className="text-xs text-gray-500">{sydneyTime}</p>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-gray-900 text-white flex items-center justify-center text-sm font-medium">
                  {user?.email?.charAt(0).toUpperCase() || "U"}
                </div>
                <span className="text-sm text-gray-600 hidden sm:inline">
                  {user?.email || "User"}
                </span>
              </div>
              <Button onClick={onLogout} variant="outline" size="default">
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-8">
          <div className="bg-gray-900 rounded-lg p-6 text-white">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center">
                <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                  <path
                    d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                    fill="currentColor"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm text-gray-300 mb-1">Total Expenses</p>
                <p className="text-4xl font-bold">${total.toFixed(2)}</p>
                <p className="text-sm text-gray-400 mt-1">
                  {expenses.length}{" "}
                  {expenses.length !== 1 ? "expenses" : "expense"}
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">
                Expenses by Category
              </h2>
            </div>
            <div className="p-6">
              {categories.length > 0 ? (
                <ExpenseChart categoryTotals={categoryTotals} />
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-gray-400">
                  <svg
                    width="48"
                    height="48"
                    viewBox="0 0 24 24"
                    fill="none"
                    className="mb-3 opacity-30"
                  >
                    <path
                      d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"
                      fill="currentColor"
                    />
                  </svg>
                  <p className="text-sm">No expenses yet</p>
                </div>
              )}
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-base font-semibold text-gray-900">
                Add New Expense
              </h2>
            </div>
            <div className="p-6">
              <ExpenseForm onSubmit={handleAddExpense} />
            </div>
          </div>
        </div>

        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-200">
            <div className="flex items-center justify-between flex-wrap gap-4 mb-5">
              <div>
                <h2 className="text-base font-semibold text-gray-900">
                  Expense History
                </h2>
                <p className="text-xs text-gray-500 mt-1">
                  {expenses.length}{" "}
                  {expenses.length !== 1 ? "expenses" : "expense"} total
                </p>
              </div>
              <Button
                onClick={handleExportCSV}
                disabled={expenses.length === 0}
                variant="outline"
                size="default"
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  className="mr-2"
                >
                  <path
                    d="M19 9h-4V3H9v6H5l7 7 7-7zM5 18v2h14v-2H5z"
                    fill="currentColor"
                  />
                </svg>
                Export CSV
              </Button>
            </div>
            <div className="flex items-center gap-4 flex-wrap">
              <div className="flex items-center gap-2.5">
                <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
                  Time:
                </label>
                <Select value={dateFilter} onValueChange={setDateFilter}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue placeholder="Select time" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Time</SelectItem>
                    <SelectItem value="week">This Week</SelectItem>
                    <SelectItem value="month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2.5">
                <label className="text-xs font-medium text-gray-700 whitespace-nowrap">
                  Category:
                </label>
                <Select
                  value={selectedCategory || "all"}
                  onValueChange={(value) =>
                    setSelectedCategory(value === "all" ? "" : value)
                  }
                >
                  <SelectTrigger className="w-[160px]">
                    <SelectValue placeholder="All Categories" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Categories</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-16">
                <div className="w-8 h-8 border-2 border-gray-300 border-t-gray-900 rounded-full animate-spin mb-3"></div>
                <p className="text-sm text-gray-500">Loading expenses...</p>
              </div>
            ) : (
              <ExpenseList expenses={expenses} onDelete={handleDeleteExpense} />
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default Dashboard;
