import { MapPin, Plus, Trash2 } from "lucide-react";

function formatAddress(address) {
  const lineTwo = address.addressLine2 ? `, ${address.addressLine2}` : "";
  return `${address.addressLine1}${lineTwo}, ${address.city}, ${address.state} ${address.postalCode}`;
}

export default function AddressBook({
  addresses,
  loading,
  selectedShippingAddressId,
  onSelect,
  onAddNew,
  onSetDefault,
  onDelete,
}) {
  return (
    <section className="panel address-book">
      <div className="panel-head">
        <div>
          <h1>Address Book</h1>
          <p>Choose your default shipping destination for quick checkout.</p>
        </div>
        <button className="secondary" type="button" onClick={onAddNew}>
          <Plus size={16} /> Add Address
        </button>
      </div>

      {loading && <div className="state">Loading saved addresses...</div>}
      {!loading && !addresses.length && (
        <div className="state">No saved addresses yet. Add one to enable 1-click checkout.</div>
      )}

      <div className="address-grid">
        {addresses.map((address) => {
          const isSelected = selectedShippingAddressId === address.id;
          return (
            <article className={`address-card ${isSelected ? "selected" : ""}`} key={address.id}>
              <div className="address-card-head">
                <div>
                  <strong>{address.fullName}</strong>
                  <span>{address.phoneNumber}</span>
                </div>
                <span className="address-chip">
                  <MapPin size={14} />
                  {address.isDefaultShipping ? "Default" : "Saved"}
                </span>
              </div>
              <p>{formatAddress(address)}</p>
              <div className="address-actions">
                <button className="secondary" type="button" onClick={() => onSelect(address.id)}>
                  {isSelected ? "Selected" : "Use for Checkout"}
                </button>
                {!address.isDefaultShipping && (
                  <button className="text-button" type="button" onClick={() => onSetDefault(address)}>
                    Make Default
                  </button>
                )}
                <button className="text-button danger" type="button" onClick={() => onDelete(address.id)}>
                  <Trash2 size={15} /> Remove
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </section>
  );
}
