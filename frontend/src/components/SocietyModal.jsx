import { useState, useEffect } from "react";
import { apiService } from "../services/api";


const SocietyModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: "",
    ward: "",
    lat: "",
    lng: "",
    propertyTaxNumber: "",
    address: "",
    totalUnits: "",
    contactEmail: "",
    contactPhone: ""
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      await apiService.registerSociety({
        name: form.name,
        ward: form.ward,
        geoLocation: {
          lat: Number(form.lat),
          lng: Number(form.lng)
        },
        propertyTaxNumber: form.propertyTaxNumber,
        address: form.address,
        totalUnits: Number(form.totalUnits),
        contactEmail: form.contactEmail,
        contactPhone: form.contactPhone
      });

      onSuccess();
      onClose();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to register society");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg">
        <h2 className="mb-4 text-xl font-semibold">Register New Society</h2>

        {error && (
          <div className="mb-3 rounded bg-red-100 p-2 text-sm text-red-700">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="grid gap-3">
          <input name="name" placeholder="Society Name" onChange={handleChange} required className="input" />
          <input name="ward" placeholder="Ward" onChange={handleChange} required className="input" />
          <div className="grid grid-cols-2 gap-2">
            <input name="lat" placeholder="Latitude" onChange={handleChange} required className="input" />
            <input name="lng" placeholder="Longitude" onChange={handleChange} required className="input" />
          </div>
          <input name="propertyTaxNumber" placeholder="Property Tax Number" onChange={handleChange} required className="input" />
          <input name="address" placeholder="Address" onChange={handleChange} className="input" />
          <input name="totalUnits" placeholder="Total Units" onChange={handleChange} className="input" />
          <input name="contactEmail" placeholder="Contact Email" onChange={handleChange} className="input" />
          <input name="contactPhone" placeholder="Contact Phone" onChange={handleChange} className="input" />

          <div className="mt-4 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="rounded border px-4 py-2"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-green-700 px-4 py-2 text-white hover:bg-green-600"
            >
              {loading ? "Saving..." : "Register"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SocietyModal;