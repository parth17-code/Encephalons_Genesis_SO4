import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
import { authService } from "../utils/auth";
import "./Login.css";
import heroImg from "/image.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLeaf, faCircleCheck } from "@fortawesome/free-solid-svg-icons";

const Register = () => {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "RESIDENT",
    societyId: ""
  });

  const [societies, setSocieties] = useState([]);
  const [loadingSocieties, setLoadingSocieties] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Fetch societies on component mount
  useEffect(() => {
    fetchSocieties();
  }, []);

  const fetchSocieties = async () => {
    setLoadingSocieties(true);
    try {
      const response = await apiService.getPublicSocieties();
      setSocieties(response.data.data || []);
    } catch (err) {
      console.error('Failed to fetch societies:', err);
      setError('Unable to load societies. Please refresh the page.');
    } finally {
      setLoadingSocieties(false);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    
    // Clear societyId when role changes to BMC_ADMIN
    if (name === 'role' && value === 'BMC_ADMIN') {
      setForm({ ...form, [name]: value, societyId: '' });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    // Validate society selection for non-admin roles
    if ((form.role === 'RESIDENT' || form.role === 'SECRETARY') && !form.societyId) {
      setError('Please select a society');
      return;
    }

    setLoading(true);

    try {
      const response = await apiService.register(form);
      const { token, ...userData } = response.data.data;

      authService.saveAuthData(token, userData);

      // Redirect based on role
      switch (userData.role) {
        case "BMC_ADMIN":
          navigate("/admin/dashboard");
          break;
        case "SECRETARY":
          navigate("/secretary/dashboard");
          break;
        case "RESIDENT":
          navigate("/resident/summary");
          break;
        default:
          navigate("/");
      }
    } catch (err) {
      setError(
        err.response?.data?.message || "Registration failed. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen grid grid-cols-1 md:grid-cols-3 lg:grid-cols-3">
      {/* LEFT SECTION – IMAGE */}
      <div
        className="hidden md:flex items-center justify-center bg-cover bg-center col-span-2"
        style={{
          backgroundImage: `
            linear-gradient(
              rgba(62, 95, 68, 0.7),
              rgba(62, 95, 68, 0.7)
            ),
            url(${heroImg})
          `,
        }}
      >
        <div className="text-center text-white p-8 bg-opacity-40 rounded-lg">
          <h2 className="text-7xl font-bold mb-4">
            <FontAwesomeIcon icon={faLeaf} className="mr-2 text-green-400" />{" "}
            Green-Tax Monitor
          </h2>
          <p className="text-4xl mb-6 text-left font-medium">
            Compliance & Rebate System for a <br />sustainable future.
          </p>
          <br />
          <ul>
            <li className="mb-2 text-left">
              <FontAwesomeIcon
                icon={faCircleCheck}
                className="mr-2 text-green-500 text-3xl"
              />{" "}
              Monitor society compliance status
            </li>
            <li className="mb-2 text-left">
              <FontAwesomeIcon
                icon={faCircleCheck}
                className="mr-2 text-green-500 text-3xl"
              />{" "}
              Anomaly and fraud detection
            </li>
            <li className="mb-2 text-left">
              <FontAwesomeIcon
                icon={faCircleCheck}
                className="mr-2 text-green-500 text-3xl"
              />{" "}
              Automated rebate calculations
            </li>
          </ul>
        </div>
      </div>

      {/* RIGHT SECTION – REGISTER FORM */}
      <div className="min-h-screen flex items-center justify-center bg-[#E8FFD7]">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
          <h1 className="text-3xl font-bold text-green-900 mb-4">
            Create Account
          </h1>

          {error && (
            <div className="text-red-600 text-sm bg-red-50 p-2 rounded mb-3">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input
              name="name"
              placeholder="Full Name"
              value={form.name}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg"
            />

            <input
              name="email"
              type="email"
              placeholder="Email"
              value={form.email}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg"
            />

            <input
              name="password"
              type="password"
              placeholder="Password"
              value={form.password}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border rounded-lg"
            />

            <select
              name="role"
              value={form.role}
              onChange={handleChange}
              className="w-full px-3 py-2 border rounded-lg"
            >
              <option value="RESIDENT">Resident</option>
              <option value="SECRETARY">Secretary</option>
              <option value="BMC_ADMIN">BMC Admin</option>
            </select>

            {/* Society Selector - Only for RESIDENT and SECRETARY */}
            {(form.role === "RESIDENT" || form.role === "SECRETARY") && (
              <div>
                <select
                  name="societyId"
                  value={form.societyId}
                  onChange={handleChange}
                  required
                  disabled={loadingSocieties}
                  className="w-full px-3 py-2 border rounded-lg disabled:bg-gray-100"
                >
                  <option value="">
                    {loadingSocieties ? 'Loading societies...' : 'Select Your Society'}
                  </option>
                  {societies.map((society) => (
                    <option key={society._id} value={society._id}>
                      {society.name} {society.ward ? `(Ward ${society.ward})` : ''}
                    </option>
                  ))}
                </select>
                {societies.length === 0 && !loadingSocieties && (
                  <p className="text-xs text-gray-500 mt-1">
                    No societies available. Contact BMC admin.
                  </p>
                )}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-900 text-white py-2 rounded-lg hover:bg-green-700 disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Register"}
            </button>
          </form>

          <p className="text-sm text-center text-gray-500 mt-4">
            Already have an account?{" "}
            <span
              className="text-green-700 cursor-pointer"
              onClick={() => navigate("/")}
            >
              Login
            </span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Register;