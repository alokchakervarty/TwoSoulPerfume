import { useState } from "react";
import { api } from "../api";

const initialForm = {
  fullName: "",
  phoneNumber: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  postalCode: "",
  countryId: null,
  isDefaultShipping: true,
  type: 2,
};

export default function AddressForm({ onCreated, onCancel }) {
  const [form, setForm] = useState(initialForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function submit(event) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      const payload = {
        fullName: form.fullName,
        phoneNumber: form.phoneNumber,
        addressLine1: form.addressLine1,
        addressLine2: form.addressLine2,
        city: form.city,
        state: form.state,
        postalCode: form.postalCode,
        ...(form.countryId ? { countryId: form.countryId } : {}),
        isDefaultShipping: form.isDefaultShipping,
        type: form.type,
      };

      const address = await api.createAddress(payload);
      onCreated(address);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <form className="auth-card" onSubmit={submit}>
        <h1>Shipping Address</h1>
        <label>
          Full name
          <input
            value={form.fullName}
            required
            onChange={(event) => setForm((current) => ({ ...current, fullName: event.target.value }))}
          />
        </label>
        <label>
          Phone number
          <input
            value={form.phoneNumber}
            required
            onChange={(event) => setForm((current) => ({ ...current, phoneNumber: event.target.value }))}
          />
        </label>
        <label>
          Address line 1
          <input
            value={form.addressLine1}
            required
            onChange={(event) => setForm((current) => ({ ...current, addressLine1: event.target.value }))}
          />
        </label>
        <label>
          Address line 2
          <input
            value={form.addressLine2}
            onChange={(event) => setForm((current) => ({ ...current, addressLine2: event.target.value }))}
          />
        </label>
        <label>
          City
          <input
            value={form.city}
            required
            onChange={(event) => setForm((current) => ({ ...current, city: event.target.value }))}
          />
        </label>
        <label>
          State
          <input
            value={form.state}
            required
            onChange={(event) => setForm((current) => ({ ...current, state: event.target.value }))}
          />
        </label>
        <label>
          Postal code
          <input
            value={form.postalCode}
            required
            onChange={(event) => setForm((current) => ({ ...current, postalCode: event.target.value }))}
          />
        </label>
        <label className="checkbox-label">
          <input
            type="checkbox"
            checked={form.isDefaultShipping}
            onChange={(event) =>
              setForm((current) => ({ ...current, isDefaultShipping: event.target.checked }))
            }
          />
          Set as default shipping address
        </label>
        {error && <div className="form-error">{error}</div>}
        <div className="button-row">
          <button className="secondary" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="primary full" disabled={loading} type="submit">
            {loading ? "Saving..." : "Save address"}
          </button>
        </div>
      </form>
    </main>
  );
}
