import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
import Layout from "../components/Layout";
import { Pie } from "react-chartjs-2";
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from "chart.js";
import SocietyModal from "../components/SocietyModal";


ChartJS.register(ArcElement, Tooltip, Legend);



const AdminDashboard = () => {
  const [dashboardData, setDashboardData] = useState(null);
  const [showSocietyModal, setShowSocietyModal] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const response = await apiService.getAdminDashboard();
      setDashboardData(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Layout title="BMC Admin Dashboard">
        <div className="text-center text-lg font-medium">
          Loading dashboard...
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="BMC Admin Dashboard">
        <div className="rounded-lg bg-red-100 p-4 text-red-700">
          {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="BMC Admin Dashboard">
      <div className="grid gap-8">
        {/* Summary Cards */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              label: "Total Societies",
              value: dashboardData.totalSocieties,
              icon: "🏢",
              bgColor: "white",
            },
            {
              label: "GREEN Compliance",
              value: dashboardData.complianceBreakdown.GREEN,
              icon: "✅",
              bgColor: "green-100",
            },
            {
              label: "YELLOW Compliance",
              value: dashboardData.complianceBreakdown.YELLOW,
              icon: "⚠️",
              bgColor: "yellow-100",
            },
            {
              label: "RED Compliance",
              value: dashboardData.complianceBreakdown.RED,
              icon: "❌",
              bgColor: "red-100",
      
            },
          ].map((card) => (
            <div
              key={card.label}
              className={`flex items-center gap-5 rounded-xl p-6 text-black shadow-md transition hover:-translate-y-1 bg-${card.bgColor}`}
            >
              <div className="text-5xl opacity-90">{card.icon}</div>
              <div>
                <div className="text-4xl font-bold leading-none">
                  {card.value}
                </div>
                <div className="text-sm opacity-90">{card.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
          {/* Charts + Stats */}
          <div className="lg:col-span-3 grid gap-6">
            {/* Proof Statistics */}
            <div className="grid grid-cols-1 gap-6 rounded-xl bg-white p-6 shadow md:grid-cols-2">
              <div className="h-full w-full max-w-md mx-auto">
                <Pie
                  data={{
                    labels: ["GREEN", "YELLOW", "RED"],
                    datasets: [
                      {
                        data: [
                          dashboardData.proofStats.verified,
                          dashboardData.proofStats.flagged,
                          dashboardData.proofStats.rejected,
                        ],
                        backgroundColor: ["#4CAF50", "#FFC107", "#F44336"],
                      },
                    ],
                  }}
                />
              </div>

              <div className="grid gap-4">
                <p className="text-xl font-semibold">Proof Statistics</p>

                {[
                  {
                    label: "Total Proofs",
                    value: dashboardData.proofStats.total,
                  },
                  {
                    label: "Verified",
                    value: dashboardData.proofStats.verified,
                    border: "border-l-green-500",
                  },
                  {
                    label: "Flagged",
                    value: dashboardData.proofStats.flagged,
                    border: "border-l-yellow-500",
                  },
                  {
                    label: "Rejected",
                    value: dashboardData.proofStats.rejected,
                    border: "border-l-red-500",
                  },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className={`flex items-center justify-between rounded-lg border-l-4 bg-slate-50 p-4 ${
                      stat.border ?? "border-l-slate-300"
                    }`}
                  >
                    <span className="font-medium text-slate-500">
                      {stat.label}
                    </span>
                    <span className="text-2xl font-bold text-slate-800">
                      {stat.value}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Ward Breakdown */}
            <div className="rounded-xl bg-white p-6 shadow">
              <h3 className="mb-4 text-lg font-semibold">Ward Breakdown</h3>
              <div className="grid gap-3">
                {dashboardData.wardBreakdown.map((ward) => (
                  <div
                    key={ward._id}
                    className="flex justify-between rounded-lg bg-slate-50 px-4 py-3 transition hover:bg-slate-200"
                  >
                    <span className="font-semibold text-slate-800">
                      {ward._id}
                    </span>
                    <span className="text-sm text-slate-500">
                      {ward.count} societies
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="rounded-xl bg-white p-6 shadow">
            <h3 className="mb-4 text-lg font-semibold">Quick Actions</h3>

            <div className="grid gap-3">
              <ActionButton
                icon="🏢"
                label="View All Societies"
                onClick={() => navigate("/admin/societies")}
              />
              <ActionButton
                icon="📋"
                label="Review Pending Proofs"
                badge={dashboardData.proofStats.flagged}
                onClick={() => navigate("/admin/proofs")}
              />
              <ActionButton
                icon="🗺️"
                label="View Heatmap"
                onClick={() => navigate("/admin/heatmap")
                }
              />
              <ActionButton
                icon="➕"
                label="Add New Society"
                onClick={() => setShowSocietyModal(true)}
              />
              <ActionButton
                icon="🔄"
                label="Refresh Dashboard"
                accent
                onClick={fetchDashboard}
              />
            </div>
          </div>
        </div>
      </div>
      {showSocietyModal && (
        <SocietyModal
          onClose={() => setShowSocietyModal(false)}
          onSuccess={fetchDashboard}
        />
      )}
    </Layout>
  );
};

const ActionButton = ({ icon, label, onClick, badge, accent }) => (
  <button
    onClick={onClick}
    className={`relative flex items-center gap-4 rounded-lg border-2 px-5 py-4 font-medium transition hover:translate-x-1
      ${
        accent
          ? "border-green-500 text-green-600 hover:bg-green-500 hover:text-white"
          : "border-slate-200 text-slate-700 hover:border-indigo-500 hover:text-indigo-600"
      }`}
  >
    <span className="text-xl">{icon}</span>
    <span>{label}</span>

    {badge > 0 && (
      <span className="absolute right-4 rounded-full bg-red-500 px-2.5 py-1 text-xs font-bold text-white">
        {badge}
      </span>
    )}
  </button>
);

export default AdminDashboard;
