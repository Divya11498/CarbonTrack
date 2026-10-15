
import { useState } from "react";
import { Leaf, PlusCircle } from "lucide-react";

const activityOptions = {
  Transport: [
    { name: "Car travel", unit: "km", factor: 0.17 },
    { name: "Bus travel", unit: "km", factor: 0.08 },
    { name: "Train travel", unit: "km", factor: 0.04 }
  ],
  Electricity: [
    { name: "Electricity usage", unit: "kWh", factor: 0.7 }
  ],
  Food: [
    { name: "Meal servings", unit: "servings", factor: 1.5 }
  ],
  Shopping: [
    { name: "Shopping spending", unit: "currency units", factor: 0.02 }
  ]
};

export default function Activities({ onAddActivity }) {
  const [category, setCategory] = useState("Transport");
  const [activity, setActivity] = useState("Car travel");
  const [quantity, setQuantity] = useState("");
  const [date, setDate] = useState(
    new Date().toLocaleDateString("en-CA")
  );

  const options = activityOptions[category];
  const selected = options.find((item) => item.name === activity) || options[0];

  const validQuantity =
    quantity.trim() !== "" &&
    Number.isFinite(Number(quantity)) &&
    Number(quantity) > 0 &&
    Number(quantity) <= 1000000;

  const emission = validQuantity
    ? Number(quantity) * selected.factor
    : 0;

  function handleCategoryChange(event) {
    const nextCategory = event.target.value;
    setCategory(nextCategory);
    setActivity(activityOptions[nextCategory][0].name);
    setQuantity("");
  }

  function handleSubmit(event) {
    event.preventDefault();

    if (!validQuantity || !date) return;

    onAddActivity({
      id: crypto.randomUUID(),
      category,
      activity,
      quantity: Number(quantity),
      unit: selected.unit,
      co2e: Number(emission.toFixed(2)),
      date
    });

    setQuantity("");
  }

  return (
    <section className="activity-page">
      <div className="page-heading">

        <p>Record your daily activities and track your carbon footprint.</p>
      </div>

      <form className="panel activity-form" onSubmit={handleSubmit}>
        <h3>New Activity</h3>

        <label htmlFor="category">Category</label>
        <select
          id="category"
          value={category}
          onChange={handleCategoryChange}
        >
          {Object.keys(activityOptions).map((item) => (
            <option key={item}>{item}</option>
          ))}
        </select>

        <label htmlFor="activity">Activity type</label>
        <select
          id="activity"
          value={activity}
          onChange={(event) => setActivity(event.target.value)}
        >
          {options.map((item) => (
            <option key={item.name} value={item.name}>
              {item.name}
            </option>
          ))}
        </select>

        <label htmlFor="quantity">Quantity ({selected.unit})</label>
        <input
          id="quantity"
          type="number"
          min="0.01"
          max="1000000"
          step="any"
          placeholder="Enter quantity"
          value={quantity}
          onChange={(event) => setQuantity(event.target.value)}
          required
        />

        <label htmlFor="date">Activity date</label>
        <input
          id="date"
          type="date"
          value={date}
          max={new Date().toLocaleDateString("en-CA")}
          onChange={(event) => setDate(event.target.value)}
          required
        />

        <div className="emission-preview">
          <Leaf size={26} />
          <div>
            <p>Estimated carbon footprint</p>
            <h2>{validQuantity ? emission.toFixed(2) : "—"} kg CO₂e</h2>
            <small>Demonstration estimate</small>
          </div>
        </div>

        <button
          className="submit-button"
          type="submit"
          disabled={!validQuantity || !date}
        >
          <PlusCircle size={19} />
          Log Activity
        </button>
      </form>
    </section>
  );
}
