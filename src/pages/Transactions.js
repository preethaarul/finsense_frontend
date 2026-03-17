import { useEffect, useState, useCallback } from "react";
import { FiPlusCircle, FiX, FiSearch, FiDownload } from "react-icons/fi";
import "./Transactions.css";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../utils/authFetch";

const API_BASE = process.env.REACT_APP_API_BASE_URL;

const EXPENSE_CATEGORIES = [
  "Food", "Travel", "Shopping", "Bills", "Entertainment", "Health", "Education", "Other",
];

const INCOME_CATEGORIES = [
  "Salary", "Freelance", "Allowance", "Business", "Investment", "Other",
];

const getTodayDate = () => {
  const today = new Date();
  const year = today.getFullYear();
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

function Transactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [filteredTransactions, setFilteredTransactions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filter, setFilter] = useState("all");
  const [showExportModal, setShowExportModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [activeTab, setActiveTab] = useState("manual"); // "manual" or "scan"
  const [smsText, setSmsText] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);
  const [exportRange, setExportRange] = useState({
    from: "2025-01",
    to: "2025-12",
  });

  // Add Form State
  const [type, setType] = useState("expense");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState(getTodayDate());
  const [description, setDescription] = useState("");

  /* ---------------- FETCH TRANSACTIONS ---------------- */
  const fetchTransactions = useCallback(async () => {
    let url = `${API_BASE}/transactions`;

    if (filter !== "all") {
      url += `?type=${filter}`;
    }

    const res = await authFetch(url);
    if (!res) return;

    const data = await res.json();
    setTransactions(data);
  }, [filter]);

  useEffect(() => {
    fetchTransactions();
  }, [fetchTransactions]);

  useEffect(() => {
    const filtered = transactions.filter((txn) => {
      const matchesFilter = filter === "all" || txn.type?.toLowerCase() === filter;
      const matchesSearch =
        txn.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.category?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        txn.amount?.toString().includes(searchTerm);
      return matchesFilter && matchesSearch;
    });
    setFilteredTransactions(filtered);
  }, [filter, transactions, searchTerm]);

  /* ---------------- DELETE ---------------- */
  const deleteTransaction = async (id) => {
    const confirmDelete = window.confirm(
      "Are you sure you want to delete this transaction?"
    );
    if (!confirmDelete) return;

    const res = await authFetch(
      `${API_BASE}/transactions/${id}`,
      { method: "DELETE" }
    );

    if (res) fetchTransactions();
  };

  /* ---------------- HELPERS ---------------- */
  const formatType = (type) => {
    if (!type) return "";
    return type.charAt(0).toUpperCase() + type.slice(1).toLowerCase();
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  /* ---------------- EXPORT ---------------- */
  const handleExportClick = () => {
    const currentYear = new Date().getFullYear();
    setExportRange({
      from: `${currentYear}-01`,
      to: `${currentYear}-12`,
    });
    setShowExportModal(true);
  };

  const handleExportCSV = async () => {
    if (!exportRange.from || !exportRange.to) {
      alert("Please select both date ranges");
      return;
    }

    if (exportRange.from > exportRange.to) {
      alert("'From' date cannot be after 'To' date");
      return;
    }

    try {
      const res = await authFetch(
        `${API_BASE}/export/transactions?from_month=${exportRange.from}&to_month=${exportRange.to}`
      );

      if (!res.ok) {
        alert("No data to export for selected range");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = `finsense_${exportRange.from}_to_${exportRange.to}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();

      window.URL.revokeObjectURL(url);
      setShowExportModal(false);
    } catch {
      alert("Failed to export data");
    }
  };

  const handleCancelExport = () => {
    setShowExportModal(false);
  };

  /* ---------------- ADD / EDIT FORM LOGIC ---------------- */
  const handleAddClick = () => {
    setEditingTxn(null);
    setType("expense");
    setAmount("");
    setCategory("");
    setDate(getTodayDate());
    setDescription("");
    setActiveTab("manual");
    setShowAddModal(true);
  };

  const handleEditClick = (txn) => {
    setEditingTxn(txn);
    setType(txn.type || "expense");
    setAmount(txn.amount?.toString() || "");
    setCategory(txn.category || "");
    setDate(txn.date || "");
    setDescription(txn.description || "");
    setActiveTab("manual");
    setShowAddModal(true);
  };

  const handleCloseAdd = () => {
    setShowAddModal(false);
    setEditingTxn(null);
  };

  const saveTransaction = async (payload) => {
    const url = editingTxn
      ? `${API_BASE}/transactions/${editingTxn.id}`
      : `${API_BASE}/transactions`;
    const method = editingTxn ? "PUT" : "POST";

    const res = await authFetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    if (res && res.ok) {
      handleCloseAdd();
      fetchTransactions();
      return true;
    } else {
      alert("Failed to save transaction");
      return false;
    }
  };

  const handleAddSubmit = async (e) => {
    e.preventDefault();
    const amountValue = parseFloat(amount);
    if (!amount || amountValue <= 0 || isNaN(amountValue)) {
      alert("Please enter a valid amount");
      return;
    }

    const payload = {
      type,
      amount: amountValue,
      category,
      date,
      description: description.trim(),
    };

    await saveTransaction(payload);
  };

  const handleScanSubmit = async () => {
    if (!smsText.trim()) return;
    setIsParsing(true);
    try {
      const res = await authFetch(`${API_BASE}/transactions/parse-sms`, {
        method: "POST",
        body: JSON.stringify({ text: smsText }),
      });
      const data = await res.json();

      if (!data || !data.amount || data.amount <= 0) {
        alert("No transaction detected in the message. Please review the text or enter manually.");
        setIsParsing(false);
        return;
      }

      const payload = {
        type: data.type,
        amount: data.amount,
        category: data.category,
        date: data.date,
        description: data.description || "Parsed from SMS"
      };

      const success = await saveTransaction(payload);
      if (success) {
        setSmsText("");
      }
    } catch (err) {
      alert("Failed to parse or save SMS. Please enter manually.");
    } finally {
      setIsParsing(false);
    }
  };

  const generateMonthOptions = () => {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);
    const months = Array.from({ length: 12 }, (_, i) =>
      (i + 1).toString().padStart(2, "0")
    );

    const options = [];
    years.forEach((year) => {
      months.forEach((month) => {
        options.push(`${year}-${month}`);
      });
    });
    return options;
  };

  const monthOptions = generateMonthOptions();

  return (
    <div className="page-container transactions-container">
      <header className="page-header-area">
        <div className="header-flex-row">
          <div className="header-left">
            <h1 className="page-title">Transactions</h1>
            <p className="page-subtitle">Track and manage your income and expenses</p>
          </div>
          <div className="header-actions">
            <button className="add-transaction-btn" onClick={handleAddClick}>
              <FiPlusCircle /> Add Transaction
            </button>
          </div>
        </div>
      </header>
      {/* Filter and Export Container */}
      <div className="filter-bar-glass">
        <div className="search-box">
          <FiSearch className="search-icon" />
          <input
            type="text"
            placeholder="Search transactions, categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        <div className="filter-actions-group">
          <div className="filter-container">
            <select
              className="filter-select"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All Types</option>
              <option value="income">Income Only</option>
              <option value="expense">Expense Only</option>
            </select>
          </div>

          <button className="export-btn" onClick={() => setShowExportModal(true)}>
            <FiDownload /> Export
          </button>
        </div>
      </div>

      {/* Export Modal Dialog */}
      {showExportModal && (
        <div className="export-modal-overlay">
          <div className="export-modal">
            <div className="export-modal-header">
              <h2>Export Transactions</h2>
              <button className="modal-close" onClick={handleCancelExport}>
                <i className="fa fa-times"></i>
              </button>
            </div>

            <div className="export-modal-body">
              <p>Select date range to export (YYYY-MM format):</p>

              <div className="date-range-inputs">
                <div className="date-input-group">
                  <label htmlFor="from-month">From Month</label>
                  <select
                    id="from-month"
                    value={exportRange.from}
                    onChange={(e) => setExportRange({ ...exportRange, from: e.target.value })}
                    className="month-select"
                  >
                    {monthOptions.map(month => (
                      <option key={`from-${month}`} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="date-input-group">
                  <label htmlFor="to-month">To Month</label>
                  <select
                    id="to-month"
                    value={exportRange.to}
                    onChange={(e) => setExportRange({ ...exportRange, to: e.target.value })}
                    className="month-select"
                  >
                    {monthOptions.map(month => (
                      <option key={`to-${month}`} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="date-range-preview">
                <p>Exporting data from <strong>{exportRange.from}</strong> to <strong>{exportRange.to}</strong></p>
              </div>
            </div>

            <div className="export-modal-footer">
              <button className="cancel-btn" onClick={handleCancelExport}>
                Cancel
              </button>
              <button className="export-confirm-btn" onClick={handleExportCSV}>
                Export CSV
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mobile Filter */}
      <div className="mobile-filter">
        <select
          className="filter-select"
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
        >
          <option value="all">All Transactions</option>
          <option value="income">Income Only</option>
          <option value="expense">Expense Only</option>
        </select>
      </div>

      {/* Desktop Table View */}
      <div className="table-responsive">
        <table className="expense-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Category</th>
              <th>Description</th>
              <th>Amount (₹)</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTransactions.length === 0 ? (
              <tr>
                <td colSpan="6" className="no-transactions">
                  No transactions found
                </td>
              </tr>
            ) : (
              filteredTransactions.map((txn) => (
                <tr
                  key={txn.id}
                  className={txn.type?.toLowerCase() === 'income' ? 'income-row' : 'expense-row'}
                >
                  <td>{formatDate(txn.date)}</td>
                  <td>
                    <span className={txn.type?.toLowerCase() === 'income' ? 'income-type' : 'expense-type'}>
                      {formatType(txn.type)}
                    </span>
                  </td>
                  <td>{txn.category}</td>
                  <td>{txn.description || "-"}</td>
                  <td className={txn.type?.toLowerCase() === 'income' ? 'income-amount' : 'expense-amount'}>
                    ₹{Number(txn.amount).toLocaleString()}
                  </td>
                  <td className="action-cell">
                    <i
                      className="fa fa-pencil edit-icon"
                      title="Edit"
                      onClick={() => handleEditClick(txn)}
                    ></i>
                    <i
                      className="fa fa-trash delete-icon"
                      title="Delete"
                      onClick={() => deleteTransaction(txn.id)}
                    ></i>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Mobile Card View */}
      <div className="transaction-cards">
        {filteredTransactions.length === 0 ? (
          <div className="no-transactions">
            <i className="fa fa-receipt"></i>
            <p>No transactions found</p>
          </div>
        ) : (
          filteredTransactions.map((txn) => (
            <div key={txn.id} className="transaction-card">
              <div className="card-header">
                <span className="card-date">{formatDate(txn.date)}</span>
                <span className={`card-type ${txn.type?.toLowerCase()}`}>
                  {formatType(txn.type)}
                </span>
              </div>
              <div className="card-details">
                <div className="card-category">
                  Category
                  <span>{txn.category}</span>
                </div>
                <div className="card-category">
                  Amount
                  <span className={`card-amount ${txn.type?.toLowerCase()}`}>
                    {txn.type?.toLowerCase() === 'income' ? '+' : '-'}₹{Number(txn.amount).toLocaleString()}
                  </span>
                </div>
                {txn.description && (
                  <div className="card-description">
                    <span>Description</span>
                    {txn.description}
                  </div>
                )}
              </div>
              <div className="card-footer">
                <div className="card-actions">
                  <i
                    className="fa fa-pencil edit-icon"
                    title="Edit"
                    onClick={() => handleEditClick(txn)}
                  ></i>
                  <i
                    className="fa fa-trash delete-icon"
                    title="Delete"
                    onClick={() => deleteTransaction(txn.id)}
                  ></i>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
      {/* Add / Edit Transaction Modal */}
      {showAddModal && (
        <div className="modal-overlay">
          <div className="add-transaction-modal">
            <div className="modal-header">
              <h2>{editingTxn ? "Edit Transaction" : "New Transaction"}</h2>
              <button className="close-btn" onClick={handleCloseAdd}>
                <FiX />
              </button>
            </div>

            {!editingTxn && (
              <div className="modal-tabs">
                <button
                  className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
                  onClick={() => setActiveTab('manual')}
                >
                  Manual Entry
                </button>
                <button
                  className={`tab-btn ${activeTab === 'scan' ? 'active' : ''}`}
                  onClick={() => setActiveTab('scan')}
                >
                  Paste & Scan
                </button>
              </div>
            )}

            {activeTab === 'manual' ? (
              <form onSubmit={handleAddSubmit}>
                <div className="modal-body">
                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>Type</label>
                      <select value={type} onChange={(e) => setType(e.target.value)}>
                        <option value="expense">Expense</option>
                        <option value="income">Income</option>
                      </select>
                    </div>
                    <div className="form-group flex-1">
                      <label>Amount (₹)</label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        required
                      />
                    </div>
                  </div>

                  <div className="form-row">
                    <div className="form-group flex-1">
                      <label>Category</label>
                      <select
                        value={category}
                        onChange={(e) => setCategory(e.target.value)}
                        required
                      >
                        <option value="">Select Category</option>
                        {(type === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES).map(
                          (cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          )
                        )}
                      </select>
                    </div>
                    <div className="form-group flex-1">
                      <label>Date</label>
                      <input
                        type="date"
                        value={date}
                        onChange={(e) => setDate(e.target.value)}
                        required
                        max={getTodayDate()}
                      />
                    </div>
                  </div>

                  <div className="form-group">
                    <label>Description</label>
                    <input
                      type="text"
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      placeholder="What was this for?"
                    />
                  </div>
                </div>

                <div className="modal-footer">
                  <button type="button" className="cancel-pill" onClick={handleCloseAdd}>
                    Cancel
                  </button>
                  <button type="submit" className="submit-pill">
                    {editingTxn ? "Save Changes" : "Create Transaction"}
                  </button>
                </div>
              </form>
            ) : (
              <div className="modal-body scan-body">
                <p className="modal-hint">Paste your bank/payment SMS here. Our system will extract the details for you.</p>
                <textarea
                  className="sms-textarea"
                  placeholder="Example: Your a/c x1234 is debited for Rs. 500 at Starbucks..."
                  value={smsText}
                  onChange={(e) => setSmsText(e.target.value)}
                ></textarea>
                <div className="modal-footer no-padding">
                  <button className="cancel-pill" onClick={handleCloseAdd}>
                    Cancel
                  </button>
                  <button
                    className="submit-pill"
                    onClick={handleScanSubmit}
                    disabled={!smsText.trim() || isParsing}
                  >
                    {isParsing ? "Detecting..." : "Scan & Add"}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default Transactions;