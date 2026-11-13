import { useState, useEffect, useCallback } from "react";
import {
  Car,
  Zap,
  Utensils,
  ShoppingBag,
  Trash2,
  Edit3,
  Plus,
  Search,
  Recycle,
  RefreshCw,
  Sliders,
  X,
  CheckCircle2,
} from "lucide-react";
import { apiRequest } from "../api";
import EditActivityModal from "../components/EditActivityModal";

const CATEGORY_TABS = [
  { id: 1, key: "transport", label: "Transport", icon: Car },
  { id: 2, key: "electricity", label: "Electricity", icon: Zap },
  { id: 3, key: "food", label: "Food", icon: Utensils },
  { id: 4, key: "shopping", label: "Shopping", icon: ShoppingBag },
  { id: 5, key: "waste", label: "Waste", icon: Recycle },
];

const DEFAULT_ACTIVITY_OPTIONS = {
  1: [
    { id: 1, name: "car", label: "Car Commute", defaultUnit: "km" },
    { id: 2, name: "bus", label: "Public Bus", defaultUnit: "km" },
    { id: 3, name: "train", label: "Train / Rail", defaultUnit: "km" },
    { id: 4, name: "flight", label: "Flight", defaultUnit: "km" },
    { id: 5, name: "motorcycle", label: "Motorcycle", defaultUnit: "km" },
    { id: 6, name: "bicycle", label: "Bicycle Commute", defaultUnit: "km" },
    { id: 7, name: "walking", label: "Walking", defaultUnit: "km" },
  ],
  2: [
    { id: 8, name: "home_electricity", label: "Home Electricity", defaultUnit: "kWh" },
    { id: 9, name: "office_electricity", label: "Office Electricity", defaultUnit: "kWh" },
    { id: 10, name: "renewable_electricity", label: "Renewable Energy", defaultUnit: "kWh" },
  ],
  3: [
    { id: 11, name: "beef", label: "Beef", defaultUnit: "kg" },
    { id: 12, name: "chicken", label: "Chicken", defaultUnit: "kg" },
    { id: 13, name: "pork", label: "Pork", defaultUnit: "kg" },
    { id: 14, name: "fish", label: "Fish", defaultUnit: "kg" },
    { id: 15, name: "dairy", label: "Dairy", defaultUnit: "kg" },
    { id: 16, name: "vegetarian_meal", label: "Vegetarian Meal", defaultUnit: "item" },
    { id: 17, name: "vegan_meal", label: "Vegan Meal", defaultUnit: "item" },
  ],
  4: [
    { id: 18, name: "clothing", label: "Clothing Item", defaultUnit: "item" },
    { id: 19, name: "electronics", label: "Electronics", defaultUnit: "item" },
    { id: 20, name: "furniture", label: "Furniture", defaultUnit: "item" },
    { id: 21, name: "household_goods", label: "Household Goods", defaultUnit: "kg" },
  ],
  5: [
    { id: 22, name: "landfill_waste", label: "Landfill Waste", defaultUnit: "kg" },
    { id: 23, name: "recycling", label: "Recycling", defaultUnit: "kg" },
    { id: 24, name: "composting", label: "Composting", defaultUnit: "kg" },
  ],
};

function formatName(name) {
  return String(name || "")
    .split("_")
    .filter(Boolean)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .join(" ");
}

function unitFromType(unitType, name) {
  const n = String(name || "").toLowerCase();
  if (n.includes("meal")) return "item";
  return switchUnitType(unitType);
}

function switchUnitType(unitType) {
  switch ((unitType || "").toLowerCase()) {
    case "distance":
      return "km";
    case "kwh":
      return "kWh";
    case "kg":
      return "kg";
    case "items":
    case "quantity":
      return "item";
    default:
      return "unit";
  }
}

export default function Activities({
  token,
  userRole,
  activities = [],
  onAddActivity,
  onCreateActivity,
  onUpdateActivity,
  onDeleteActivity,
}) {
  const [selectedCatId, setSelectedCatId] = useState(1);
  const [activityOptionsByCat, setActivityOptionsByCat] = useState(DEFAULT_ACTIVITY_OPTIONS);
  const [selectedTypeId, setSelectedTypeId] = useState(1);
  const [quantity, setQuantity] = useState("");
  const [unit, setUnit] = useState("km");
  const [logDate, setLogDate] = useState(() => new Date().toISOString().split("T")[0]);
  const [notes, setNotes] = useState("");
  const [previewCo2, setPreviewCo2] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const [frequentActivities, setFrequentActivities] = useState([]);
  const [emissionFactors, setEmissionFactors] = useState([]);
  const [showFactorsPanel, setShowFactorsPanel] = useState(false);
  const [editingFactor, setEditingFactor] = useState(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [filterCat, setFilterCat] = useState("ALL");
  const [editingActivity, setEditingActivity] = useState(null);

  const isAdmin = userRole === "ADMIN" || userRole === "ORG_ADMIN";

  const loadMetadata = useCallback(async () => {
    if (!token) return;
    try {
      const [typesRes, freqRes, factorsRes] = await Promise.all([
        apiRequest("/api/activities/types", { token }),
        apiRequest("/api/activities/frequent", { token }).catch(() => []),
        apiRequest("/api/emission-factors", { token }).catch(() => []),
      ]);

      if (Array.isArray(typesRes) && typesRes.length > 0) {
        const grouped = {};
        for (const t of typesRes) {
          const cid = Number(t.categoryId);
          if (!grouped[cid]) grouped[cid] = [];
          grouped[cid].push({
            id: Number(t.id),
            name: t.name,
            label: formatName(t.name),
            defaultUnit: unitFromType(t.unitType, t.name),
          });
        }
        setActivityOptionsByCat((prev) => ({ ...prev, ...grouped }));
      }
      if (Array.isArray(freqRes)) {
        setFrequentActivities(freqRes);
      }
      if (Array.isArray(factorsRes)) {
        setEmissionFactors(factorsRes);
      }
    } catch {
      // Fall back cleanly to DEFAULT_ACTIVITY_OPTIONS
    }
  }, [token]);

  useEffect(() => {
    const timer = setTimeout(() => {
      loadMetadata();
    }, 0);
    return () => clearTimeout(timer);
  }, [loadMetadata]);

  const currentOptions = activityOptionsByCat[selectedCatId] || [];

  const handleSelectCategory = (catId) => {
    setSelectedCatId(catId);
    const opts = activityOptionsByCat[catId] || [];
    if (opts.length > 0) {
      setSelectedTypeId(opts[0].id);
      setUnit(opts[0].defaultUnit);
    }
    setPreviewCo2(null);
  };

  const handleSelectType = (typeIdNum) => {
    setSelectedTypeId(typeIdNum);
    const match = currentOptions.find((o) => o.id === Number(typeIdNum));
    if (match) {
      setUnit(match.defaultUnit);
    }
    setPreviewCo2(null);
  };

  useEffect(() => {
    if (!quantity || Number(quantity) <= 0 || !selectedTypeId || !token) {
      const clearTimer = setTimeout(() => setPreviewCo2(null), 0);
      return () => clearTimeout(clearTimer);
    }
    const timer = setTimeout(async () => {
      try {
        const res = await apiRequest("/api/activities/calculate-preview", {
          method: "POST",
          token,
          body: {
            activityTypeId: Number(selectedTypeId),
            quantity: Number(quantity),
            unit,
            logDate,
          },
        });
        if (res?.co2eKg != null) {
          setPreviewCo2(Number(res.co2eKg));
        }
      } catch {
        // Ignore transient preview errors while typing
      }
    }, 280);
    return () => clearTimeout(timer);
  }, [quantity, selectedTypeId, unit, logDate, token]);

  const handleQuickPrefill = (freq) => {
    const cid = Number(freq.categoryId);
    setSelectedCatId(cid);
    setSelectedTypeId(Number(freq.activityTypeId));
    setUnit(freq.unit || "km");
    setQuantity(String(freq.defaultQuantity || 1));
    setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quantity || Number(quantity) <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }
    setSubmitting(true);
    setError("");
    setSuccessMsg("");
    try {
      const submitHandler = onAddActivity || onCreateActivity;
      await submitHandler({
        categoryId: Number(selectedCatId),
        activityTypeId: Number(selectedTypeId),
        quantity: Number(quantity),
        unit,
        logDate,
        notes: notes.trim() || null,
      });
      setQuantity("");
      setNotes("");
      setPreviewCo2(null);
      setSuccessMsg("Activity logged and emissions calculated.");
      setTimeout(() => setSuccessMsg(""), 3000);
      loadMetadata();
    } catch (err) {
      setError(err.message || "Failed to log activity.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleSaveFactor = async (e) => {
    e.preventDefault();
    if (!editingFactor) return;
    try {
      await apiRequest(`/api/emission-factors/${editingFactor.id}`, {
        method: "PUT",
        token,
        body: {
          factorValue: Number(editingFactor.factorValue),
          sourceName: editingFactor.sourceName,
          notes: editingFactor.notes,
        },
      });
      setEditingFactor(null);
      loadMetadata();
    } catch (err) {
      setError(err.message || "Unable to update emission factor.");
    }
  };

  const filteredActivities = activities.filter((act) => {
    const matchesSearch =
      !searchTerm ||
      String(act.activity || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(act.category || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      String(act.notes || "").toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCat =
      filterCat === "ALL" ||
      String(act.category || "").toLowerCase() === filterCat.toLowerCase();
    return matchesSearch && matchesCat;
  });

  return (
    <div className="activities-page">
      <div className="page-header-row" style={{ flexWrap: "wrap", gap: "12px" }}>
        <div>
          <h2 className="page-title">Log Sustainability Activity</h2>
          <p className="page-subtitle">
            Record transport, electricity, food, shopping, or waste actions using verified database emission factors.
          </p>
        </div>

        <button
          type="button"
          className="btn-outline"
          onClick={() => setShowFactorsPanel(!showFactorsPanel)}
        >
          <Sliders size={15} />
          <span>{showFactorsPanel ? "Hide Emission Factors" : "View Emission Factors"}</span>
        </button>
      </div>

      {/* Quick-Log Frequent Activities Carousel */}
      {frequentActivities.length > 0 && (
        <div className="card-panel" style={{ padding: "14px 18px", marginBottom: "20px" }}>
          <div style={{ fontSize: "0.8rem", fontWeight: 700, color: "var(--text-muted)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.5px" }}>
            Quick-Log Frequent Activities
          </div>
          <div
            className="quick-log-carousel"
            style={{
              display: "flex",
              gap: "10px",
              overflowX: "auto",
              paddingBottom: "4px",
            }}
          >
            {frequentActivities.map((f) => (
              <button
                key={`${f.activityTypeId}-${f.unit}`}
                type="button"
                className="btn-outline"
                onClick={() => handleQuickPrefill(f)}
                style={{
                  flexShrink: 0,
                  padding: "8px 14px",
                  fontSize: "0.84rem",
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                }}
              >
                <Plus size={14} />
                <span>
                  {formatName(f.activityName)} ({f.defaultQuantity} {f.unit})
                </span>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Expandable Emission Factors Table */}
      {showFactorsPanel && (
        <div className="card-panel" style={{ padding: "18px", marginBottom: "20px", overflowX: "auto" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
            <h3 style={{ margin: 0, fontSize: "1rem" }}>Active Database Emission Factors</h3>
            {isAdmin && <span className="badge-pill-green">Admin Edit Enabled</span>}
          </div>
          <table className="data-table" style={{ width: "100%", borderCollapse: "collapse", fontSize: "0.86rem" }}>
            <thead>
              <tr>
                <th style={{ textAlign: "left", padding: "8px" }}>Activity</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Category</th>
                <th style={{ textAlign: "right", padding: "8px" }}>Factor (kg CO₂e / unit)</th>
                <th style={{ textAlign: "left", padding: "8px" }}>Source</th>
                {isAdmin && <th style={{ textAlign: "right", padding: "8px" }}>Action</th>}
              </tr>
            </thead>
            <tbody>
              {emissionFactors.map((ef) => (
                <tr key={ef.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                  <td style={{ padding: "8px", fontWeight: 600 }}>{formatName(ef.activityName)}</td>
                  <td style={{ padding: "8px" }}>{formatName(ef.categoryName)}</td>
                  <td style={{ padding: "8px", textAlign: "right", fontWeight: 700 }}>
                    {ef.factorValue} / {ef.unit}
                  </td>
                  <td style={{ padding: "8px", color: "var(--text-muted)" }}>
                    {ef.sourceName} ({ef.sourceVersion})
                  </td>
                  {isAdmin && (
                    <td style={{ padding: "8px", textAlign: "right" }}>
                      <button
                        type="button"
                        className="icon-btn-subtle"
                        onClick={() => setEditingFactor({ ...ef })}
                        title="Edit factor"
                      >
                        <Edit3 size={14} />
                      </button>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Main Split Layout: Logger Form + Activity History */}
      <div className="activities-grid-layout">
        <div className="card-panel" style={{ padding: "22px", alignSelf: "start" }}>
          <h3 style={{ margin: "0 0 14px" }}>New Activity Entry</h3>

          {/* Category Selector Tabs */}
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginBottom: "16px" }}>
            {CATEGORY_TABS.map((cat) => {
              const Icon = cat.icon;
              const active = selectedCatId === cat.id;
              return (
                <button
                  key={cat.id}
                  type="button"
                  className={active ? "btn-primary-gradient" : "btn-outline"}
                  style={{ padding: "7px 12px", fontSize: "0.82rem", display: "inline-flex", alignItems: "center", gap: "6px" }}
                  onClick={() => handleSelectCategory(cat.id)}
                >
                  <Icon size={14} />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
            <div className="form-group">
              <label htmlFor="activity-type">Activity Type</label>
              <select
                id="activity-type"
                className="form-input"
                value={selectedTypeId}
                onChange={(e) => handleSelectType(Number(e.target.value))}
              >
                {currentOptions.map((opt) => (
                  <option key={opt.id} value={opt.id}>
                    {opt.label} ({opt.defaultUnit})
                  </option>
                ))}
              </select>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div className="form-group">
                <label htmlFor="activity-qty">Quantity ({unit})</label>
                <input
                  id="activity-qty"
                  className="form-input"
                  type="number"
                  step="any"
                  min="0.01"
                  placeholder="Enter amount"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label htmlFor="activity-date">Date</label>
                <input
                  id="activity-date"
                  className="form-input"
                  type="date"
                  value={logDate}
                  onChange={(e) => setLogDate(e.target.value)}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="activity-notes">Notes (optional)</label>
              <input
                id="activity-notes"
                className="form-input"
                type="text"
                placeholder="e.g., Office commute or dinner swap"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
              />
            </div>

            {previewCo2 !== null && (
              <div
                style={{
                  padding: "10px 14px",
                  borderRadius: "10px",
                  background: "var(--emerald-light)",
                  color: "var(--text-main)",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  fontSize: "0.88rem",
                }}
              >
                <span>Estimated CO₂e Impact</span>
                <strong style={{ color: "var(--emerald)" }}>{previewCo2.toFixed(3)} kg CO₂e</strong>
              </div>
            )}

            {error && <div className="alert-error">{error}</div>}
            {successMsg && (
              <div className="badge-pill-green" style={{ padding: "8px 12px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                <CheckCircle2 size={15} />
                <span>{successMsg}</span>
              </div>
            )}

            <button type="submit" className="btn-primary-gradient" disabled={submitting}>
              {submitting ? <RefreshCw size={16} className="spin-slow" /> : <Plus size={16} />}
              <span>{submitting ? "Logging Activity..." : "Log Activity"}</span>
            </button>
          </form>
        </div>

        {/* Logged Activities History */}
        <div className="card-panel" style={{ padding: "22px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px", marginBottom: "14px" }}>
            <h3 style={{ margin: 0 }}>Activity Log ({filteredActivities.length})</h3>
            <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
              <div style={{ position: "relative" }}>
                <Search size={14} style={{ position: "absolute", left: 10, top: 11, color: "var(--text-muted)" }} />
                <input
                  className="form-input"
                  type="text"
                  placeholder="Search activities..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ paddingLeft: "30px", width: "170px" }}
                />
              </div>
              <select
                className="form-input"
                value={filterCat}
                onChange={(e) => setFilterCat(e.target.value)}
                style={{ width: "auto" }}
              >
                <option value="ALL">All Categories</option>
                {CATEGORY_TABS.map((c) => (
                  <option key={c.id} value={c.label}>{c.label}</option>
                ))}
              </select>
            </div>
          </div>

          {filteredActivities.length === 0 ? (
            <p style={{ color: "var(--text-muted)", padding: "24px 0", textAlign: "center" }}>
              No activities match your current filter. Log your first entry on the left!
            </p>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="data-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr>
                    <th style={{ textAlign: "left", padding: "10px 8px" }}>Activity</th>
                    <th style={{ textAlign: "left", padding: "10px 8px" }}>Quantity</th>
                    <th style={{ textAlign: "left", padding: "10px 8px" }}>Date</th>
                    <th style={{ textAlign: "right", padding: "10px 8px" }}>CO₂e</th>
                    <th style={{ textAlign: "right", padding: "10px 8px" }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredActivities.slice(0, 30).map((act) => (
                    <tr key={act.id} style={{ borderTop: "1px solid var(--border-subtle)" }}>
                      <td style={{ padding: "10px 8px" }}>
                        <div style={{ fontWeight: 600 }}>{act.activity}</div>
                        <div style={{ fontSize: "0.75rem", color: "var(--text-muted)" }}>
                          {act.category}{act.notes ? ` • ${act.notes}` : ""}
                        </div>
                      </td>
                      <td style={{ padding: "10px 8px" }}>{act.quantity} {act.unit}</td>
                      <td style={{ padding: "10px 8px", color: "var(--text-muted)" }}>{act.date}</td>
                      <td style={{ padding: "10px 8px", textAlign: "right", fontWeight: 700 }}>
                        {Number(act.co2e || 0).toFixed(2)} kg
                      </td>
                      <td style={{ padding: "10px 8px", textAlign: "right", whiteSpace: "nowrap" }}>
                        <button
                          type="button"
                          className="icon-btn-subtle"
                          onClick={() => setEditingActivity(act)}
                          aria-label="Edit activity"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          type="button"
                          className="icon-btn-subtle"
                          onClick={() => onDeleteActivity(act.id)}
                          aria-label="Delete activity"
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

      {editingActivity && (
        <EditActivityModal
          activity={editingActivity}
          onClose={() => setEditingActivity(null)}
          onSave={onUpdateActivity}
        />
      )}

      {editingFactor && (
        <div className="modal-backdrop" onClick={() => setEditingFactor(null)}>
          <div className="modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Update Emission Factor: {formatName(editingFactor.activityName)}</h3>
              <button type="button" className="modal-close" onClick={() => setEditingFactor(null)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleSaveFactor}>
              <div className="modal-body" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="form-group">
                  <label>Factor Value (kg CO₂e per {editingFactor.unit})</label>
                  <input
                    className="form-input"
                    type="number"
                    step="0.000001"
                    min="0"
                    value={editingFactor.factorValue}
                    onChange={(e) => setEditingFactor({ ...editingFactor, factorValue: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Reference Source</label>
                  <input
                    className="form-input"
                    value={editingFactor.sourceName || ""}
                    onChange={(e) => setEditingFactor({ ...editingFactor, sourceName: e.target.value })}
                  />
                </div>
                <div className="form-group">
                  <label>Methodology Notes</label>
                  <input
                    className="form-input"
                    value={editingFactor.notes || ""}
                    onChange={(e) => setEditingFactor({ ...editingFactor, notes: e.target.value })}
                  />
                </div>
              </div>
              <div className="modal-footer" style={{ padding: "14px 20px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                <button type="button" className="btn-outline" onClick={() => setEditingFactor(null)}>Cancel</button>
                <button type="submit" className="btn-primary-gradient">Save Factor</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
