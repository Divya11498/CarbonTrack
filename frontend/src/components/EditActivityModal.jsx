import { useState, useEffect } from "react";
import { X, Calculator, Save, AlertCircle } from "lucide-react";
import { apiRequest } from "../api";

export default function EditActivityModal({ activity, onClose, onSave }) {
  const [quantity, setQuantity] = useState(activity.quantity || "");
  const [date, setDate] = useState(activity.logDate || activity.date || "");
  const [notes, setNotes] = useState(activity.notes || "");
  const [previewCo2, setPreviewCo2] = useState(activity.co2eKg || activity.co2e || 0);
  const [calculating, setCalculating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Live recalculate preview when quantity or date changes
  useEffect(() => {
    if (!quantity || Number(quantity) <= 0 || !activity.activityTypeId) return;

    let cancelled = false;
    const timer = setTimeout(async () => {
      setCalculating(true);
      try {
        const res = await apiRequest("/api/activities/calculate-preview", {
          method: "POST",
          body: {
            activityTypeId: activity.activityTypeId,
            quantity: Number(quantity),
            unit: activity.unit,
            logDate: date,
          },
        });
        if (!cancelled && res?.co2eKg != null) {
          setPreviewCo2(res.co2eKg);
        }
      } catch {
        // Silently keep previous preview or show inline
      } finally {
        if (!cancelled) setCalculating(false);
      }
    }, 300);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [quantity, date, activity.activityTypeId, activity.unit]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!quantity || Number(quantity) <= 0) {
      setError("Please enter a quantity greater than zero.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await onSave(activity.id, {
        categoryId: activity.categoryId,
        activityTypeId: activity.activityTypeId,
        quantity: Number(quantity),
        unit: activity.unit,
        logDate: date,
        notes: notes.trim() || null,
      });
      onClose();
    } catch (err) {
      setError(err.message || "Failed to update activity.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Edit Logged Activity</h3>
          <button type="button" className="modal-close" onClick={onClose} aria-label="Close">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="edit-info-banner">
              <span className="badge-pill-green">
                {activity.category || "Activity"}
              </span>
              <h4>{activity.activity || "Selected Activity"}</h4>
            </div>

            <div className="form-group">
              <label htmlFor="edit-quantity">Quantity ({activity.unit})</label>
              <input
                id="edit-quantity"
                type="number"
                step="any"
                min="0.01"
                value={quantity}
                onChange={(e) => setQuantity(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-date">Activity Date</label>
              <input
                id="edit-date"
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="edit-notes">Notes</label>
              <textarea
                id="edit-notes"
                rows={3}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Optional notes..."
              />
            </div>

            {/* Recalculated preview box */}
            <div className="preview-calc-box">
              <Calculator size={18} className="text-emerald" />
              <div>
                <span className="calc-title">Recalculated Emissions:</span>
                <strong>
                  {calculating ? "Calculating..." : `${Number(previewCo2).toFixed(2)} kg CO₂e`}
                </strong>
              </div>
            </div>

            {error && (
              <div className="auth-error-banner" role="alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button type="button" className="btn-modal-secondary" onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn-modal-primary" disabled={saving}>
              <Save size={16} />
              {saving ? "Saving..." : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
