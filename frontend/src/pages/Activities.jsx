
import { useState } from "react";
import { Leaf, PlusCircle, Calculator } from "lucide-react";

const activityOptions = [
  { id: 1, categoryId: 1, name: "Car", unit: "km" },
  { id: 2, categoryId: 1, name: "Bus", unit: "km" },
  { id: 3, categoryId: 1, name: "Train", unit: "km" },
  { id: 4, categoryId: 1, name: "Flight", unit: "km" },
  { id: 5, categoryId: 1, name: "Motorcycle", unit: "km" },
  { id: 6, categoryId: 1, name: "Bicycle", unit: "km" },
  { id: 7, categoryId: 1, name: "Walking", unit: "km" },
  { id: 8, categoryId: 2, name: "Home electricity", unit: "kWh" },
  { id: 9, categoryId: 2, name: "Office electricity", unit: "kWh" },
  { id: 10, categoryId: 2, name: "Renewable electricity", unit: "kWh" },
  { id: 11, categoryId: 3, name: "Beef", unit: "kg" },
  { id: 12, categoryId: 3, name: "Chicken", unit: "kg" },
  { id: 13, categoryId: 3, name: "Pork", unit: "kg" },
  { id: 14, categoryId: 3, name: "Fish", unit: "kg" },
  { id: 15, categoryId: 3, name: "Dairy", unit: "kg" },
  { id: 16, categoryId: 3, name: "Vegetarian meal", unit: "item" },
  { id: 17, categoryId: 3, name: "Vegan meal", unit: "item" },
  { id: 18, categoryId: 4, name: "Clothing", unit: "item" },
  { id: 19, categoryId: 4, name: "Electronics", unit: "item" },
  { id: 20, categoryId: 4, name: "Furniture", unit: "item" },
  { id: 21, categoryId: 4, name: "Household goods", unit: "kg" },
];

const categories = [
  { id: 1, name: "Transport" },
  { id: 2, name: "Electricity" },
  { id: 3, name: "Food" },
  { id: 4, name: "Shopping" },
];

export default function Activities({ onAddActivity }) {
  const [activityTypeId, setActivityTypeId] = useState("1");
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(
      new Date().toLocaleDateString("en-CA")
  );
  const [notes, setNotes] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const selectedActivity = activityOptions.find(
      (activity) => activity.id === Number(activityTypeId)
  );

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");
    setSuccess("");

    if (!selectedActivity) {
      setError("Please select an activity.");
      return;
    }

    if (
        quantity.trim() === "" ||
        !Number.isFinite(Number(quantity)) ||
        Number(quantity) <= 0
    ) {
      setError("Please enter a quantity greater than zero.");
      return;
    }

    if (!date) {
      setError("Please select an activity date.");
      return;
    }

    if (typeof onAddActivity !== "function") {
      setError("Activity submission is not connected. Check App.jsx.");
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

      setSuccess("Activity saved successfully!");
      setQuantity("");
      setNotes("");
    } catch (err) {
      setError(err.message || "Unable to save activity.");
    } finally {
      setLoading(false);
    }
  }

  return (
      <section className="activities-page">
        <div className="panel activity-form-panel">
          <div className="activity-heading">
            <div className="activity-icon">
              <Leaf size={26} />
            </div>
            <div>
              <h2>Log an Activity</h2>
              <p>Record your daily activities and track your carbon footprint.</p>
            </div>
          </div>

          <form className="activity-form" onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="activityType">Activity</label>
              <select
                  id="activityType"
                  value={activityTypeId}
                  onChange={(event) => setActivityTypeId(event.target.value)}
                  required
              >
                {categories.map((category) => (
                    <optgroup key={category.id} label={category.name}>
                      {activityOptions
                          .filter((activity) => activity.categoryId === category.id)
                          .map((activity) => (
                              <option key={activity.id} value={activity.id}>
                                {activity.name}
                              </option>
                          ))}
                    </optgroup>
                ))}
              </select>
            </div>

            <div className="activity-form-row">
              <div className="form-group">
                <label htmlFor="quantity">
                  Quantity ({selectedActivity?.unit})
                </label>
                <input
                    id="quantity"
                    type="number"
                    min="0.01"
                    step="any"
                    value={quantity}
                    onChange={(event) => setQuantity(event.target.value)}
                    placeholder={`Enter quantity in ${selectedActivity?.unit}`}
                    required
                />
              </div>

              <div className="form-group">
                <label htmlFor="activityDate">Activity date</label>
                <input
                    id="activityDate"
                    type="date"
                    value={date}
                    onChange={(event) => setDate(event.target.value)}
                    required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="notes">
                Notes <span className="optional-label">(optional)</span>
              </label>
              <textarea
                  id="notes"
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Add details about this activity..."
                  rows={4}
              />
            </div>

            <div className="emissions-info">
              <Calculator size={21} />
              <div>
                <strong>Automatic emissions calculation</strong>
                <p>
                  CarbonTrack calculates CO₂e using the configured emission
                  factors. No manual calculation is needed.
                </p>
              </div>
            </div>

            {error && (
                <div className="form-message form-error" role="alert">
                  {error}
                </div>
            )}

            {success && (
                <div className="form-message form-success" role="status">
                  {success}
                </div>
            )}

            <button
                className="save-activity-button"
                type="submit"
                disabled={loading}
            >
              <PlusCircle size={19} />
              {loading ? "Saving activity..." : "Save Activity"}
            </button>
          </form>
        </div>

        <style>{`
        .activities-page {
          width: 100%;
          max-width: 1000px;
          margin: 24px auto;
          display: flex;
          justify-content: center;
        }

        .activity-form-panel {
          width: 100%;
          max-width: 760px;
          box-sizing: border-box;
          padding: 32px;
          border-radius: 18px;
        }

        .activity-heading {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 30px;
        }

        .activity-icon {
          width: 52px;
          height: 52px;
          flex-shrink: 0;
          display: flex;
          align-items: center;
          justify-content: center;
          border-radius: 14px;
          background: #e5f4e9;
          color: #167443;
        }

        .activity-heading h2 {
          margin: 0 0 7px;
          font-size: 25px;
          line-height: 1.3;
        }

        .activity-heading p {
          margin: 0;
          color: #64748b;
          line-height: 1.6;
        }

        .activity-form {
          display: flex;
          flex-direction: column;
          gap: 22px;
        }

        .form-group {
          display: flex;
          flex-direction: column;
          gap: 9px;
          min-width: 0;
        }

        .form-group label {
          color: #243b30;
          font-size: 14px;
          font-weight: 600;
        }

        .optional-label {
          color: #718096;
          font-weight: 400;
        }

        .form-group input,
        .form-group select,
        .form-group textarea {
          box-sizing: border-box;
          width: 100%;
          min-width: 0;
          padding: 12px 14px;
          border: 1px solid #d5e0d8;
          border-radius: 9px;
          background: #fff;
          color: #263b30;
          font: inherit;
          font-size: 15px;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
        }

        .form-group input,
        .form-group select {
          min-height: 46px;
        }

        .form-group textarea {
          min-height: 110px;
          resize: vertical;
        }

        .form-group input:focus,
        .form-group select:focus,
        .form-group textarea:focus {
          border-color: #16804a;
          box-shadow: 0 0 0 3px rgba(22, 128, 74, 0.12);
        }

        .activity-form-row {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }

        .emissions-info {
          display: flex;
          align-items: flex-start;
          gap: 12px;
          padding: 16px;
          border: 1px solid #d9ebde;
          border-radius: 11px;
          background: #f0f8f1;
          color: #167443;
        }

        .emissions-info svg {
          flex-shrink: 0;
          margin-top: 2px;
        }

        .emissions-info strong {
          display: block;
          margin-bottom: 5px;
          font-size: 14px;
        }

        .emissions-info p {
          margin: 0;
          color: #536c5c;
          font-size: 13px;
          line-height: 1.6;
        }

        .form-message {
          padding: 12px 14px;
          border-radius: 9px;
          font-size: 14px;
        }

        .form-error {
          border: 1px solid #fecaca;
          background: #fef2f2;
          color: #b91c1c;
        }

        .form-success {
          border: 1px solid #bbf7d0;
          background: #f0fdf4;
          color: #166534;
        }

        .save-activity-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 9px;
          align-self: flex-start;
          min-height: 48px;
          padding: 0 24px;
          border: none;
          border-radius: 10px;
          background: #176b3a;
          color: #fff;
          font: inherit;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          transition: background 0.2s, transform 0.2s;
        }

        .save-activity-button:hover:not(:disabled) {
          background: #12572f;
          transform: translateY(-1px);
        }

        .save-activity-button:disabled {
          opacity: 0.65;
          cursor: wait;
        }

        @media (max-width: 640px) {
          .activity-form-panel {
            padding: 20px;
          }

          .activity-heading {
            align-items: flex-start;
          }

          .activity-heading h2 {
            font-size: 22px;
          }

          .activity-form-row {
            grid-template-columns: 1fr;
            gap: 22px;
          }

          .save-activity-button {
            width: 100%;
          }
        }
      `}</style>
      </section>
  );
}
