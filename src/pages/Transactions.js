import { useEffect, useState } from "react";
import "./Transactions.css";
import { useNavigate } from "react-router-dom";
import { authFetch } from "../utils/authFetch";

const API_BASE =
  process.env.REACT_APP_API_BASE_URL ||
  "https://finsense-fastapi.onrender.com";

function Transactions() {
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState([]);
  const [filter, setFilter] = useState("all");
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportRange, setExportRange] = useState({
    from: "2025-01",
    to: "2025-12",
  });

  const fetchTransactions = async () => {
    let url = `${API_BASE}/transactions`;

    if (filter !== "all") {
      url += `?type=${filter}`;
    }

    const res = await authFetch(url);
    if (!res) return;

    const data = await res.json();
    setTransactions(data);
  };

  useEffect(() => {
    fetchTransactions();
  }, [filter]);

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
    <div className="transactions-container">
      <h1>Transactions</h1>
      <br />

      <div className="filter-export-container">
        <div className="filter-container">
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

        <button className="export-btn" onClick={handleExportClick}>
          ⬇ Export CSV
        </button>
      </div>

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
                    onChange={(e) =>
                      setExportRange({ ...exportRange, from: e.target.value })
                    }
                    className="month-select"
                  >
                    {monthOptions.map((month) => (
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
                    onChange={(e) =>
                      setExportRange({ ...exportRange, to: e.target.value })
                    }
                    className="month-select"
                  >
                    {monthOptions.map((month) => (
                      <option key={`to-${month}`} value={month}>
                        {month}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="date-range-preview">
                <p>
                  Exporting data from <strong>{exportRange.from}</strong> to{" "}
                  <strong>{exportRange.to}</strong>
                </p>
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
          {transactions.length === 0 ? (
            <tr>
              <td colSpan="6" className="no-transactions">
                No transactions found
              </td>
            </tr>
          ) : (
            transactions.map((txn) => (
              <tr
                key={txn.id}
                className={
                  txn.type?.toLowerCase() === "income"
                    ? "income-row"
                    : "expense-row"
                }
              >
                <td>{formatDate(txn.date)}</td>
                <td>
                  <span
                    className={
                      txn.type?.toLowerCase() === "income"
                        ? "income-type"
                        : "expense-type"
                    }
                  >
                    {formatType(txn.type)}
                  </span>
                </td>
                <td>{txn.category}</td>
                <td>{txn.description || "-"}</td>
                <td
                  className={
                    txn.type?.toLowerCase() === "income"
                      ? "income-amount"
                      : "expense-amount"
                  }
                >
                  ₹{Number(txn.amount).toLocaleString()}
                </td>
                <td className="action-cell">
                  <i
                    className="fa fa-pencil edit-icon"
                    title="Edit"
                    onClick={() => navigate("/add", { state: txn })}
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

      <div className="transaction-cards">
        {transactions.length === 0 ? (
          <div className="no-transactions">
            <i className="fa fa-receipt"></i>
            <p>No transactions found</p>
          </div>
        ) : (
          transactions.map((txn) => (
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
                    {txn.type?.toLowerCase() === "income" ? "+" : "-"}₹
                    {Number(txn.amount).toLocaleString()}
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
                    onClick={() => navigate("/add", { state: txn })}
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
    </div>
  );
}

export default Transactions;
