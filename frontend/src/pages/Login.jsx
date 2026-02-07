import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
import { authService } from "../utils/auth";
import "./Login.css";
import heroImg from "/image.png";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLeaf } from "@fortawesome/free-solid-svg-icons";
import { faCircleCheck } from "@fortawesome/free-solid-svg-icons";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const response = await apiService.login(email, password);
      const { token, ...userData } = response.data.data;

      // Save auth data
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
        err.response?.data?.message || "Login failed. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  };

  // Quick login buttons for demo
  const quickLogin = (role) => {
    const credentials = {
      BMC_ADMIN: { email: "admin@bmc.gov.in", password: "admin123" },
      SECRETARY: {
        email: "secretary1@greenvalley.com",
        password: "secretary123",
      },
      RESIDENT: { email: "resident1@greenvalley.com", password: "resident123" },
    };
    setEmail(credentials[role].email);
    setPassword(credentials[role].password);
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
            Compliance & Rebate System for a <br></br>sustainable future.
          </p>
          <br></br>
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

      {/* RIGHT SECTION – LOGIN */}
      <div className="flex items-center justify-center bg-[#E8FFD7] ">
        <div className="w-full max-w-md bg-white p-8 rounded-xl shadow-lg">
          {/* HEADER */}
          <div className="mb-6 text-left">
            <h1 className="text-3xl font-bold text-green-900">
              Log In to your account
            </h1>
            <p className="text-gray-500 mt-1">
              Welcome back! Please enter your details
            </p>
          </div>

          {/* FORM */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="text-red-600 text-sm bg-red-50 p-2 rounded">
                {error}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-green-900">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                required
                className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-green-900">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter your password"
                required
                className="mt-1 w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-900 text-white py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-60"
            >
              {loading ? "Logging in..." : "Login"}
            </button>
            <div className="mt-4 text-center">
              <p className="text-sm text-gray-600">
                Don't have an account?{" "}
                <span
                  onClick={() => navigate("/register")}
                  className="text-green-700 font-medium cursor-pointer hover:underline"
                >
                  Register
                </span>
              </p>
            </div>
          </form>

          {/* QUICK LOGIN */}
          <div className="mt-6 text-center">
            <br></br>
            <p className="text-sm text-gray-500 mb-3">
              ---Quick Login (Demo)---
            </p>

            <div className="flex justify-between gap-2">
              <button
                onClick={() => quickLogin("BMC_ADMIN")}
                className="flex-1 border border-green-600 text-green-700 py-1.5 rounded hover:bg-green-50"
              >
                BMC Admin
              </button>

              <button
                onClick={() => quickLogin("SECRETARY")}
                className="flex-1 border border-green-600 text-green-700 py-1.5 rounded hover:bg-green-50"
              >
                Secretary
              </button>

              <button
                onClick={() => quickLogin("RESIDENT")}
                className="flex-1 border border-green-600 text-green-700 py-1.5 rounded hover:bg-green-50"
              >
                Resident
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
