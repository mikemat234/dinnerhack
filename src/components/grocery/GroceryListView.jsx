import { useState } from "react";
import { useGrocery } from "../../hooks/useGrocery";
import PantryCheck from "./PantryCheck";
import ShoppingList from "./ShoppingList";

const STEPS = [
  { id: "pantry", label: "1. Pantry Check" },
  { id: "list",   label: "2. Your List"    },
];

export default function GroceryListView() {
  const [step, setStep] = useState("pantry");
  const {
    pantryStaples, pantryChecked, togglePantry,
    visibleItems, removeItem,
    totalPrice, cartSentTo, sendToCart,
  } = useGrocery();

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <h1 style={{ fontSize: 27, fontWeight: 800, color: "#111827", margin: "0 0 5px", letterSpacing: "-0.5px" }}>
          Grocery List
        </h1>
        <p style={{ color: "#9ca3af", fontSize: 14, margin: 0 }}>
          Optimized for this week's deals · Aldi &amp; Giant Eagle
        </p>
      </div>

      {/* Step toggle */}
      <div style={{
        display: "inline-flex", background: "white", border: "1px solid #e5e7eb",
        borderRadius: 10, padding: 4, marginBottom: 26, gap: 4,
      }}>
        {STEPS.map(s => (
          <button key={s.id} onClick={() => setStep(s.id)} style={{
            padding: "8px 18px", borderRadius: 7, border: "none", cursor: "pointer",
            background: step === s.id ? "#16a34a" : "transparent",
            color: step === s.id ? "white" : "#6b7280",
            fontWeight: 600, fontSize: 13, transition: "all 0.12s",
          }}>
            {s.label}
          </button>
        ))}
      </div>

      {step === "pantry" && (
        <PantryCheck
          pantryStaples={pantryStaples}
          pantryChecked={pantryChecked}
          togglePantry={togglePantry}
          onNext={() => setStep("list")}
        />
      )}

      {step === "list" && (
        <ShoppingList
          visibleItems={visibleItems}
          totalPrice={totalPrice}
          cartSentTo={cartSentTo}
          sendToCart={sendToCart}
          removeItem={removeItem}
        />
      )}
    </div>
  );
}
