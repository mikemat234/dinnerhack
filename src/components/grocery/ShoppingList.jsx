// ─── ShoppingList.jsx ─────────────────────────────────────────────────────────
// Shows deal items grouped by store, custom add-your-own items,
// and a Copy Shopping List button.
// ──────────────────────────────────────────────────────────────────────────────

export default function ShoppingList({
  visibleItems,
  totalPrice,
  removeItem,
  customItems,
  customInput,
  setCustomInput,
  addCustomItem,
  toggleCustomItem,
  removeCustomItem,
  copyShoppingList,
  copied,
  pantryStaples = [],
  pantryChecked,
}) {
  // Group deal items by store
  const stores = [...new Set(visibleItems.map(i => i.store))];

  // Pantry items the user doesn't have — need to buy
  const pantryNeeds = pantryStaples.filter(s => !pantryChecked?.has(s));

  return (
    <div>

      {/* Info note */}
      <div style={{
        background: "#fffbeb", border: "1px solid #fde68a",
        borderRadius: 10, padding: "11px 16px", marginBottom: 20,
        fontSize: 13, color: "#92400e", display: "flex", gap: 8, alignItems: "flex-start",
      }}>
        <span>💡</span>
        <span>Deal ingredients shown — check your recipe for the full ingredient list.</span>
      </div>

      {/* Deal items grouped by store */}
      {visibleItems.length === 0 ? (
        <div style={{
          background: "white", border: "1px solid #e5e7eb", borderRadius: 14,
          padding: "32px 20px", textAlign: "center", color: "#9ca3af", marginBottom: 20,
        }}>
          <div style={{ fontSize: 32, marginBottom: 8 }}>🛒</div>
          <div style={{ fontWeight: 600 }}>No deal items this week</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Add your own items below</div>
        </div>
      ) : (
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
          {stores.map(store => {
            const items = visibleItems.filter(i => i.store === store);
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
                      <div style={{ fontSize: 14, fontWeight: 600, color: "#111827", marginBottom: 1 }}>
                        {item.item}
                      </div>
                      <div style={{ fontSize: 12, color: "#9ca3af" }}>
                        {item.day} · {item.store}
                      </div>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: "#111827" }}>
                      ${item.price.toFixed(2)}<span style={{ fontSize: 11, color: "#9ca3af", fontWeight: 400 }}>{item.unit}</span>
                    </span>
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
            <span style={{ fontWeight: 700, color: "#166534", fontSize: 14 }}>Deal items total</span>
            <span style={{ fontWeight: 800, color: "#16a34a", fontSize: 22 }}>${totalPrice.toFixed(2)}</span>
          </div>
        </div>
      )}

      {/* Pantry needs — items not checked off in pantry check */}
      {pantryNeeds.length > 0 && (
        <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
          <div style={{ background: "#f9fafb", padding: "10px 20px", borderBottom: "1px solid #f3f4f6" }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>🧂 Pantry Staples Needed</span>
          </div>
          {pantryNeeds.map((item, idx) => (
            <div key={item} style={{
              padding: "11px 20px", display: "flex", alignItems: "center", gap: 12,
              borderBottom: idx < pantryNeeds.length - 1 ? "1px solid #f9fafb" : "none",
              fontSize: 14, color: "#374151",
            }}>
              <span style={{ fontSize: 16 }}>🧂</span>
              <span style={{ flex: 1 }}>{item}</span>
            </div>
          ))}
        </div>
      )}

      {/* Add your own items */}
      <div style={{ background: "white", border: "1px solid #e5e7eb", borderRadius: 14, overflow: "hidden", marginBottom: 20 }}>
        <div style={{ background: "#f9fafb", padding: "10px 20px", borderBottom: "1px solid #f3f4f6" }}>
          <span style={{ fontSize: 13, fontWeight: 700, color: "#374151" }}>➕ Add Your Own Items</span>
        </div>

        {/* Input row */}
        <div style={{ padding: "14px 16px", display: "flex", gap: 10, borderBottom: customItems.length ? "1px solid #f3f4f6" : "none" }}>
          <input
            type="text"
            value={customInput}
            onChange={e => setCustomInput(e.target.value)}
            onKeyDown={e => e.key === "Enter" && addCustomItem()}
            placeholder="e.g. Open Pit BBQ Sauce"
            style={{
              flex: 1, border: "1px solid #e5e7eb", borderRadius: 8,
              padding: "9px 13px", fontSize: 14, outline: "none",
              color: "#111827",
            }}
          />
          <button onClick={addCustomItem} style={{
            background: "#16a34a", color: "white", border: "none",
            borderRadius: 8, padding: "9px 18px", fontWeight: 700,
            fontSize: 14, cursor: "pointer",
          }}>
            Add
          </button>
        </div>

        {/* Custom item list */}
        {customItems.map((item, idx) => (
          <div key={item.id} style={{
            padding: "11px 20px", display: "flex", alignItems: "center", gap: 12,
            borderBottom: idx < customItems.length - 1 ? "1px solid #f9fafb" : "none",
            opacity: item.checked ? 0.45 : 1,
          }}>
            <input
              type="checkbox"
              checked={item.checked}
              onChange={() => toggleCustomItem(item.id)}
              style={{ width: 17, height: 17, cursor: "pointer", accentColor: "#16a34a" }}
            />
            <span style={{
              flex: 1, fontSize: 14, color: "#111827",
              textDecoration: item.checked ? "line-through" : "none",
            }}>
              {item.text}
            </span>
            <button onClick={() => removeCustomItem(item.id)} style={{
              border: "none", background: "none", cursor: "pointer",
              color: "#d1d5db", fontSize: 15, padding: 4, lineHeight: 1,
            }}>✕</button>
          </div>
        ))}
      </div>

      {/* Copy shopping list button */}
      <button onClick={copyShoppingList} style={{
        width: "100%",
        background: copied ? "#f0fdf4" : "#111827",
        color: copied ? "#16a34a" : "white",
        border: copied ? "2px solid #16a34a" : "2px solid transparent",
        borderRadius: 12, padding: "15px 18px",
        fontWeight: 700, fontSize: 15,
        cursor: "pointer", display: "flex",
        alignItems: "center", justifyContent: "center", gap: 10,
        transition: "all 0.15s",
      }}>
        {copied ? "✅ Copied to clipboard!" : "📋 Copy Shopping List"}
      </button>

    </div>
  );
}
