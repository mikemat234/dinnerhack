import Tag from "../shared/Tag";

const STORES = ["Aldi", "Giant Eagle"];

export default function ShoppingList({ visibleItems, totalPrice, cartSentTo, sendToCart, removeItem }) {
  return (
    <div>
      {/* Cart push buttons */}
      <div style={{ display: "flex", gap: 12, marginBottom: 20 }}>
        <button onClick={() => sendToCart("instacart")} style={{
          flex: 1,
          background: cartSentTo === "instacart" ? "#f0fdf4" : "#ff6b35",
          color: cartSentTo === "instacart" ? "#16a34a" : "white",
          border: cartSentTo === "instacart" ? "2px solid #16a34a" : "2px solid transparent",
          borderRadius: 12, padding: "14px 18px", fontWeight: 700, fontSize: 14,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "all 0.15s",
        }}>
          {cartSentTo === "instacart" ? "✅ Sent to Instacart!" : "🛒 Send to Instacart"}
        </button>
        <button onClick={() => sendToCart("walmart")} style={{
          flex: 1,
          background: cartSentTo === "walmart" ? "#f0fdf4" : "#0071dc",
          color: cartSentTo === "walmart" ? "#16a34a" : "white",
          border: cartSentTo === "walmart" ? "2px solid #16a34a" : "2px solid transparent",
          borderRadius: 12, padding: "14px 18px", fontWeight: 700, fontSize: 14,
          cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 8,
          transition: "all 0.15s",
        }}>
          {cartSentTo === "walmart" ? "✅ Sent to Walmart!" : "🔵 Send to Walmart Pickup"}
        </button>
      </div>

      {/* Confirmation banner */}
      {cartSentTo && (
        <div style={{
          background: "#f0fdf4", border: "1px solid #bbf7d0", borderRadius: 12,
          padding: "14px 18px", marginBottom: 18, display: "flex", alignItems: "center", gap: 12,
        }}>
          <span style={{ fontSize: 26 }}>✅</span>
          <div>
            <div style={{ fontWeight: 700, color: "#166534", fontSize: 14 }}>
              {visibleItems.length} items added to your {cartSentTo === "instacart" ? "Instacart" : "Walmart"} cart!
            </div>
            <div style={{ color: "#16a34a", fontSize: 12, marginTop: 2 }}>
              Open your {cartSentTo === "instacart" ? "Instacart" : "Walmart"} app to review and schedule free curbside pickup.
            </div>
          </div>
        </div>
      )}

      {/* Items grouped by store */}
      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden" }}>
        {STORES.map(store => {
          const items = visibleItems.filter(i => i.store === store);
          if (!items.length) return null;
          const storeTotal = items.reduce((s, i) => s + i.price, 0);
          return (
            <div key={store}>
              <div style={{
                background: "#f9fafb", padding: "10px 20px",
                borderBottom: "1px solid #f3f4f6",
                display: "flex", justifyContent: "space-between", alignItems: "center",
              }}>
                <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>📍 {store}</span>
                <span style={{ fontSize: 13, fontWeight: 600, color: "#6b7280" }}>${storeTotal.toFixed(2)}</span>
              </div>
              {items.map((item, idx) => (
                <div key={item.id} style={{
                  padding: "12px 20px", display: "flex", alignItems: "center", gap: 13,
                  borderBottom: idx < items.length - 1 ? "1px solid #f9fafb" : "none",
                }}>
                  <span style={{ fontSize: 21 }}>{item.emoji}</span>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 1 }}>
                      <span style={{ fontSize: 14, fontWeight: 600, color: "#111827" }}>{item.item}</span>
                      {item.deal && <Tag color="amber">DEAL</Tag>}
                    </div>
                    <span style={{ fontSize: 12, color: "#9ca3af" }}>{item.qty}</span>
                  </div>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>${item.price.toFixed(2)}</span>
                  <button onClick={() => removeItem(item.id)} style={{
                    border: "none", background: "none", cursor: "pointer",
                    color: "#d1d5db", fontSize: 15, padding: 4, lineHeight: 1,
                  }}>✕</button>
                </div>
              ))}
            </div>
          );
        })}

        {/* Total footer */}
        <div style={{
          padding: "14px 20px", background: "#f0fdf4",
          display: "flex", justifyContent: "space-between", alignItems: "center",
        }}>
          <span style={{ fontWeight: 700, color: "#166534", fontSize: 14 }}>Total for the week</span>
          <span style={{ fontWeight: 800, color: "#16a34a", fontSize: 22 }}>${totalPrice.toFixed(2)}</span>
        </div>
      </div>
    </div>
  );
}
