import { useState, useEffect } from "react";
import {
  Leaf,
  PlusCircle,
  Calculator,
  Car,
  Zap,
  Utensils,
  ShoppingBag,
  Trash2,
  Calendar,
  Edit2,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  Flame,
  Info,
  Download,
} from "lucide-react";
import { apiRequest } from "../api";
import EditActivityModal from "../components/EditActivityModal";

const CATEGORIES = [
  { id: 1, name: "Transport", icon: Car, color: "green" },
  { id: 2, name: "Electricity", icon: Zap, color: "blue" },
  { id: 3, name: "Food", icon: Utensils, color: "amber" },
  { id: 4, name: "Shopping", icon: ShoppingBag, color: "purple" },
];

const DEFAULT_ACTIVITY_OPTIONS = [
  { id: 1, categoryId: 1, name: "Car Travel", unit: "km", hint: "Average gasoline/diesel passenger vehicle" },
  { id: 2, categoryId: 1, name: "Bus Commute", unit: "km", hint: "City transit bus per passenger" },
  { id: 3, categoryId: 1, name: "Train Ride", unit: "km", hint: "Commuter or regional rail" },
  { id: 4, categoryId: 1, name: "Flight Travel", unit: "km", hint: "Commercial passenger air travel" },
  { id: 5, categoryId: 1, name: "Motorcycle", unit: "km", hint: "Gasoline motorcycle" },
  { id: 6, categoryId: 1, name: "Bicycle Ride", unit: "km", hint: "Zero direct emissions" },
  { id: 7, categoryId: 1, name: "Walking", unit: "km", hint: "Zero direct emissions" },
  { id: 8, categoryId: 2, name: "Home Electricity", unit: "kWh", hint: "Residential grid consumption" },
  { id: 9, categoryId: 2, name: "Office Electricity", unit: "kWh", hint: "Commercial workplace grid" },
  { id: 10, categoryId: 2, name: "Renewable Electricity", unit: "kWh", hint: "Solar, wind, or hydro" },
  { id: 11, categoryId: 3, name: "Beef Meal", unit: "kg", hint: "Highest carbon intensity per kg" },
  { id: 12, categoryId: 3, name: "Chicken Meal", unit: "kg", hint: "Lower emissions than red meat" },
  { id: 13, categoryId: 3, name: "Pork Meal", unit: "kg", hint: "Moderate emissions" },
  { id: 14, categoryId: 3, name: "Fish Meal", unit: "kg", hint: "Moderate seafood emissions" },
  { id: 15, categoryId: 3, name: "Dairy Products", unit: "kg", hint: "Milk, cheese, butter" },
  { id: 16, categoryId: 3, name: "Vegetarian Meal", unit: "item", hint: "Plant-forward portion" },
  { id: 17, categoryId: 3, name: "Vegan Meal", unit: "item", hint: "Lowest carbon intensity" },
  { id: 18, categoryId: 4, name: "Clothing Purchase", unit: "item", hint: "New apparel item" },
  { id: 19, categoryId: 4, name: "Electronics Gadget", unit: "item", hint: "Phone, tablet, laptop" },
  { id: 20, categoryId: 4, name: "Furniture Item", unit: "item", hint: "Home or office furniture" },
  { id: 21, categoryId: 4, name: "Household Goods", unit: "kg", hint: "General consumer supplies" },
];

export default function Activities({
  activities = [],
  onAddActivity,
  onUpdateActivity,
  onDeleteActivity,
  token,
}) {
  const [selectedCategory, setSelectedCategory] = useState(1);
  const [activityTypeId, setActivityTypeId] = useState(1);
  const [quantity, setQuantity] = useState("10");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [previewCo2, setPreviewCo2] = useState(null);
  const [previewLoading, setPreviewLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // History filtering
  const [searchTerm, setSearchTerm] = useState("");
  const [historyCategory, setHistoryCategory] = useState("all");
  const [editingActivity, setEditingActivity] = useState(null);

  const selectedActivity = DEFAULT_ACTIVITY_OPTIONS.find(
    (act) => act.id === Number(activityTypeId)
  ) || DEFAULT_ACTIVITY_OPTIONS[0];

  // Whenever category tab changes, default to first activity in that category
  const handleCategoryTabChange = (catId) => {
    setSelectedCategory(catId);
    const firstInCat = DEFAULT_ACTIVITY_OPTIONS.find((act) => act.categoryId === catId);
    if (firstInCat) {
      setActivityTypeId(firstInCat.id);
    }
  };

  // Real-Time Backend Calculation Preview
  useEffect(() => {
    if (!quantity || Number(quantity) <= 0 || !activityTypeId) {
      setPreviewCo2(null);
      return;
    }

    let cancelled = false;
    const timer = setTimeout(async () => {
      setPreviewLoading(true);
      try {
        const res = await apiRequest("/api/activities/calculate-preview", {
          method: "POST",
          body: {
            activityTypeId: Number(activityTypeId),
            quantity: Number(quantity),
            unit: selectedActivity?.unit || "km",
            logDate: date,
          },
        });
        if (!cancelled && res?.co2eKg != null) {
          setPreviewCo2(Number(res.co2eKg));
        }
      } catch (err) {
        // Fallback calculation preview if offline
        if (!cancelled) {
          setPreviewCo2(null);
        }
      } finally {
        if (!cancelled) setPreviewLoading(false);
      }
    }, 250);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [activityTypeId, quantity, date, selectedActivity?.unit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!quantity || Number(quantity) <= 0) {
      setError("Please enter a valid quantity greater than zero.");
      return;
    }

    setLoading(true);
    try {
      await onAddActivity({
        categoryId: selectedActivity.categoryId,
        activityTypeId: selectedActivity.id,
        quantity: Number(quantity),
        unit: selectedActivity.unit,
        logDate: date,
        notes: notes.trim() || null,
      });

      setSuccess("Activity logged successfully! Emissions added to your dashboard.");
      setNotes("");
    } catch (err) {
      setError(err.message || "Failed to log activity.");
    } finally {
      setLoading(false);
    }
  };

  // Filtered activity history
  const filteredActivities = activities.filter((act) => {
    const matchesSearch =
      (act.activity || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (act.notes || "").toLowerCase().includes(searchTerm.toLowerCase());

    const matchesCat =
      historyCategory === "all" ||
      String(act.categoryId) === String(historyCategory) ||
      (act.category || "").toLowerCase() === historyCategory.toLowerCase();

    return matchesSearch && matchesCat;
  });

  function handleExportCsv() {
    if (filteredActivities.length === 0) return;
    const headers = ["Date", "Category", "Activity", "Quantity", "Unit", "CO2e (kg)", "Notes"];
    const rows = filteredActivities.map((a) => [
      `"${a.date || a.logDate || ""}"`,
      `"${a.category || a.categoryName || ""}"`,
      `"${a.activity || a.activityName || ""}"`,
      a.amount || a.quantity || 0,
      `"${a.unit || ""}"`,
      a.co2e || a.co2eKg || 0,
      `"${(a.description || a.notes || "").replace(/"/g, '""')}"`,
    ]);
    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `carbontrack_activities_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  return (
    <div className="activities-page-wrapper">
      <div className="page-heading">
        <h2>Log Activities</h2>
        <p>Record your activities and track emissions in real time.</p>
      </div>

      <div className="activities-grid-layout">
        {/* Left Column: Log Activity Form */}
        <div className="panel activity-logging-card">
          <div className="card-top-title">
            <div className="icon-badge bg-green">
              <PlusCircle size={18} />
            </div>
            <div>
              <h3>New Activity</h3>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="category-pill-tabs">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const isSelected = selectedCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={`cat-pill-btn ${isSelected ? "active" : ""}`}
                  onClick={() => handleCategoryTabChange(cat.id)}
                >
                  <Icon size={16} />
                  <span>{cat.name}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} className="activity-entry-form">
            <div className="form-group">
              <label htmlFor="activity-type-select">Activity Type</label>
              <select
                id="activity-type-select"
                value={activityTypeId}
                onChange={(e) => setActivityTypeId(Number(e.target.value))}
                required
              >
                {DEFAULT_ACTIVITY_OPTIONS.filter(
                  (act) => act.categoryId === selectedCategory
                ).map((act) => (
                  <option key={act.id} value={act.id}>
                    {act.name} ({act.unit})
                  </option>
                ))}
              </select>
            </div>

            <div className="form-row-two-col">
              <div className="form-group">
                <label htmlFor="activity-qty">
                  Quantity ({selectedActivity?.unit})
                </label>
                <input
                  id="activity-qty"
                  type="number"
                  step="any"
                  min="0.01"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder={`Amount in ${selectedActivity?.unit}`}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="activity-date">Date</label>
                <input
                  id="activity-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="activity-notes">
                Notes / Details <span className="text-muted">(Optional)</span>
              </label>
              <textarea
                id="activity-notes"
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. Commute to downtown office, roundtrip"
              />
            </div>

            {/* Real-time emission preview card */}
            <div className="live-preview-box">
              <div className="preview-calc-header">
                <Calculator size={18} className="text-emerald" />
                <span>Real-Time Backend CO₂e Preview</span>
              </div>
              <div className="preview-val-row">
                <strong className="preview-kg-val">
                  {previewLoading
                    ? "Calculating..."
                    : previewCo2 !== null
                    ? `${previewCo2.toFixed(2)} kg CO₂e`
                    : "—"}
                </strong>
                <span className="factor-verified-tag">
                  ✓ Verified EPA/IPCC Factor
                </span>
              </div>
              <p className="preview-explanation">
                Derived directly from active backend emission factors for{" "}
                <strong>{selectedActivity?.name}</strong>.
              </p>
            </div>

            {error && (
              <div className="auth-error-banner" role="alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            {success && (
              <div className="auth-success-banner" role="status">
                <CheckCircle2 size={16} />
                <span>{success}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-submit-activity"
              disabled={loading}
            >
              <PlusCircle size={18} />
              {loading ? "Recording activity..." : "Save Activity"}
            </button>
          </form>
        </div>

        {/* Right Column: Activity History & Management */}
        <div className="panel activity-history-card">
          <div className="history-header">
            <h3>Activity History</h3>

            <div className="history-filter-controls">
              <div className="search-input-wrap">
                <Search size={16} />
                <input
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                value={historyCategory}
                onChange={(e) => setHistoryCategory(e.target.value)}
                className="history-category-select"
              >
                <option value="all">All Categories</option>
                <option value="1">Transport</option>
                <option value="2">Electricity</option>
                <option value="3">Food</option>
                <option value="4">Shopping</option>
              </select>

              <button
                type="button"
                className="btn-outline"
                onClick={handleExportCsv}
                disabled={filteredActivities.length === 0}
                title="Export filtered activities to CSV"
                style={{
                  padding: "6px 12px",
                  fontSize: "12px",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "6px",
                  whiteSpace: "nowrap",
                }}
              >
                <Download size={14} />
                <span>Export CSV</span>
              </button>
            </div>
          </div>

          {filteredActivities.length === 0 ? (
            <div className="empty-history-state">
              <Leaf size={36} className="text-muted" />
              <h4>No activities found</h4>
              <p>Log your first activity using the form on the left to start building your history.</p>
            </div>
          ) : (
            <div className="history-table-wrapper">
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Activity</th>
                    <th>Category</th>
                    <th>Quantity</th>
                    <th>Emissions</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.map((item) => (
                    <tr key={item.id || item.activityLogId || Math.random()}>
                      <td className="cell-date">
                        <Calendar size={14} />
                        <span>{item.date || item.logDate || "—"}</span>
                      </td>
                      <td className="cell-activity">
                        <strong>{item.activity || item.activityName || "Activity"}</strong>
                        {item.notes && <p className="table-note">{item.notes}</p>}
                      </td>
                      <td>
                        <span className={`category-tag tag-${(item.category || "other").toLowerCase()}`}>
                          {item.category || "Other"}
                        </span>
                      </td>
                      <td>
                        {item.quantity} {item.unit}
                      </td>
                      <td className="cell-emissions">
                        <strong>{Number(item.co2e || item.co2eKg || 0).toFixed(2)}</strong> kg
                      </td>
                      <td className="cell-actions">
                        <button
                          type="button"
                          className="btn-action-icon edit"
                          onClick={() => setEditingActivity(item)}
                          title="Edit activity"
                        >
                          <Edit2 size={15} />
                        </button>
                        <button
                          type="button"
                          className="btn-action-icon delete"
                          onClick={() => {
                            if (window.confirm("Are you sure you want to delete this activity?")) {
                              onDeleteActivity(item.id);
                            }
                          }}
                          title="Delete activity"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Edit Activity Modal */}
      {editingActivity && (
        <EditActivityModal
          activity={editingActivity}
          onClose={() => setEditingActivity(null)}
          onSave={onUpdateActivity}
        />
      )}
    </div>
  );
}
