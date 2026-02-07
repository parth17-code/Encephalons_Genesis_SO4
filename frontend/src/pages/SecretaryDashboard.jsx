import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { apiService } from "../services/api";
import { authService } from "../utils/auth";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";
import AdminSocieties from "./AdminSocieties";
import CarbonCreditChart from "../components/CarbonCreditChart";
import { generateMockCreditTrend } from "../utils/mockCarbonCredits";

const SecretaryDashboard = () => {
  const [rebateData, setRebateData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showProofs, setShowProofs] = useState(false);
  const [showLeaderboard, setShowLeaderboard] = useState(false);

  const navigate = useNavigate();

  const user = authService.getUser();
  const societyId = user?.societyId?._id || user?.societyId;

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      await apiService.evaluateCompliance(societyId);

      const rebateRes = await apiService.getRebate(societyId);
      console.log("📊 Rebate data:", rebateRes.data.data);
      setRebateData(rebateRes.data.data);

      const summaryRes = await apiService.getResidentSummary(societyId);
      setSummary(summaryRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const calculateCarbonCredits = (wasteStats) => {
    if (!wasteStats) return { co2Saved: 0, credits: 0 };

    const { organicWaste = 0, wetWaste = 0, recyclableWaste = 0 } = wasteStats;

    const co2Saved =
      organicWaste * 0.9 + wetWaste * 0.7 + recyclableWaste * 1.2;

    return {
      co2Saved: Math.round(co2Saved),
      credits: Math.floor(co2Saved),
    };
  };

  const carbonData = summary
    ? calculateCarbonCredits(summary.wasteStats)
    : { co2Saved: 0, credits: 0 };

  const creditTrend = generateMockCreditTrend(carbonData.credits);

  const rebatePercent = rebateData?.rebatePercent || 0;
  const societyTax = rebateData?.societyTax || 0;

  // Money saved due to rebate
  const moneySaved = Math.round((societyTax * rebatePercent) / 100);

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString("en-IN", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : "Never";

  if (loading) {
    return (
      <Layout title="Secretary Dashboard">
        <div className="bg-white rounded-2xl p-8 shadow animate-pulse space-y-4">
          <div className="h-6 bg-slate-200 rounded w-1/3" />
          <div className="h-24 bg-slate-200 rounded" />
          <div className="h-24 bg-slate-200 rounded" />
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Secretary Dashboard">
        <div className="bg-red-100 text-red-700 p-6 rounded-2xl text-center shadow">
          {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Secretary Dashboard">
      <div className="grid gap-8 grid-cols-[repeat(auto-fit,minmax(320px,1fr))]">
        {/* Compliance Status */}
        <div
          className="bg-white rounded-2xl shadow-lg ring-1 ring-slate-100
                        col-span-2 max-[900px]:col-span-1
                        transition-all duration-300 hover:shadow-2xl"
        >
          <div className="border-b px-6 py-4 text-lg font-semibold text-slate-800">
            Compliance Status
          </div>

          <div className="p-6">
            <div className="flex items-center gap-6 mb-6">
              <StatusBadge status={rebateData.complianceStatus} />
              <div className="flex items-baseline gap-2">
                <span className="text-slate-500">Score</span>
                <span className="text-4xl font-extrabold tracking-tight text-slate-900">
                  {rebateData.complianceScore}/100
                </span>
              </div>
            </div>

            <div className="space-y-4">
              {[
                ["Society", rebateData.societyName],
                ["Ward", rebateData.ward],
                ["Last Proof", formatDate(rebateData.lastProofDate)],
                ["Days Since", `${rebateData.daysSinceLastProof} day(s)`],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between items-center border-b pb-3 text-sm text-slate-600"
                >
                  <span>{label}</span>
                  <span className="font-semibold text-slate-900">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rebate */}
        <div
          className="rounded-2xl shadow-lg bg-dark-green text-white
             transition-all duration-300 hover:shadow-2xl hover:-translate-y-1 w-auto"
        >
          <div className="border-b border-white/20 px-6 py-4 text-lg font-semibold">
            Tax Rebate
          </div>

          <div className="p-6 text-center space-y-6 flex flex-col items-center">
            <div className="flex flex-col gap-3 justify-center">
              {/* Rebate Percentage */}
              <div className="flex flex-col items-center">
                <div className="text-7xl font-extrabold tracking-tight">
                  {rebatePercent}%
                </div>
                <div className="opacity-90 mb-6">Property Tax Discount</div>
              </div>

              {/* Money Saved */}
              <div className="flex flex-col items-center">
                <div className="text-7xl font-extrabold tracking-tight">
                  ₹{moneySaved.toLocaleString("en-IN")}
                </div>
                <div className="opacity-90 mb-6">Money Saved</div>
              </div>
            </div>

            <div className="space-y-3 text-left">
              <div className="bg-white/10 p-3 rounded-xl flex gap-3">
                📊 Based on compliance performance
              </div>
              <div className="bg-white/10 p-3 rounded-xl flex gap-3">
                📋 {rebateData.proofCount} proof(s) submitted
              </div>
            </div>
          </div>
        </div>

        {/* Carbon Credits */}
        <div
          className="rounded-2xl shadow-lg bg-gradient-to-br
             from-emerald-700 to-emerald-500 text-white
             transition-all duration-300 hover:shadow-2xl hover:-translate-y-1"
        >
          <div className="border-b border-white/20 px-6 py-4 text-lg font-semibold">
            🌍 Carbon Credits
          </div>

          <div className="p-6 text-center space-y-6">
            {/* Credits */}
            <div>
              <div className="text-7xl font-extrabold tracking-tight">
                {carbonData.credits}
              </div>
              <div className="opacity-90">Credits Earned</div>
            </div>

            {/* CO2 Saved */}
            <div className="bg-white/15 rounded-xl p-4">
              <div className="text-3xl font-bold">{carbonData.co2Saved} kg</div>
              <div className="text-sm opacity-90">CO₂ Emissions Reduced</div>
            </div>

            {/* Explanation */}
            <div className="text-sm text-left space-y-2">
              <div className="bg-white/10 p-3 rounded-lg">
                ♻️ Based on composting & recycling
              </div>
              <div className="bg-white/10 p-3 rounded-lg">
                🌱 1 credit = 1 kg CO₂ reduced
              </div>
              <div className="bg-white/10 p-3 rounded-lg">
                🔄 Credits usable in society carbon exchange
              </div>
            </div>
          </div>
        </div>

        {/* Carbon Credit Growth */}
        <div className="bg-white rounded-2xl shadow-md col-span-2 max-[900px]:col-span-1">
          <div className="border-b px-6 py-4 text-lg font-semibold text-slate-800">
            📈 Carbon Credit Growth
          </div>

          <div className="p-6">
            <div className="h-[320px]">
              <CarbonCreditChart
                labels={creditTrend.weeks}
                values={creditTrend.data}
              />
            </div>

            <div className="mt-4 text-sm text-slate-500 flex gap-4">
              <span>🌱 Credits increase with waste diversion</span>
              <span>♻️ Based on weekly segregation performance</span>
            </div>
          </div>
        </div>

        {/* Waste Collection Stats */}
        <div
          className="bg-white rounded-2xl shadow-md
                        transition-all duration-300 hover:shadow-xl"
        >
          <div className="border-b px-6 py-4 text-lg font-semibold text-slate-800">
            Waste Collection Stats
          </div>

          <div className="p-6 space-y-4">
            {[
              ["♻️", summary.wasteStats.recyclableWaste, "Recyclable Waste"],
              ["🌱", summary.wasteStats.organicWaste, "Organic Waste"],
              ["💧", summary.wasteStats.wetWaste, "Wet Waste"],
              [
                "🌡️",
                summary.wasteStats.compostPitTemperature,
                "Compost Pit Temperature",
              ],
            ].map(([icon, value, label]) => (
              <div
                key={label}
                className="flex gap-4 p-4 rounded-xl bg-slate-50
                           transition hover:bg-slate-100"
              >
                <div className="text-3xl">{icon}</div>
                <div>
                  <div className="text-2xl font-bold text-slate-900">
                    {value} {label.includes("Temperature") ? "°C" : "kg"}
                  </div>
                  <div className="text-slate-500">{label}</div>
                </div>
              </div>
            ))}

            <div className="flex gap-4 p-5 rounded-xl border border-indigo-200 bg-indigo-50 shadow-sm">
              <div className="text-3xl">📊</div>
              <div>
                <div className="text-2xl font-bold text-slate-900">
                  {summary.wasteStats.totalWasteCollected} kg
                </div>
                <div className="text-slate-500">Total Collected</div>
              </div>
            </div>
          </div>
        </div>

        {/* Compliance Rules */}
        <div className="bg-white rounded-2xl shadow-md">
          <div className="border-b px-6 py-4 text-lg font-semibold text-slate-800">
            Compliance Rules
          </div>

          <div className="p-6 space-y-4">
            <div className="flex gap-3 items-center bg-slate-50 p-3 border-l-4 border-green-500 rounded-xl">
              <StatusBadge status="GREEN" /> Proof today → 10% rebate
            </div>
            <div className="flex gap-3 items-center bg-slate-50 p-3 border-l-4 border-yellow-500 rounded-xl">
              <StatusBadge status="YELLOW" /> Proof 1–2 days ago → 5% rebate
            </div>
            <div className="flex gap-3 items-center bg-slate-50 p-3 border-l-4 border-red-500 rounded-xl">
              <StatusBadge status="RED" /> No proof 3+ days → 0% rebate
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-2xl shadow-md">
          <div className="border-b px-6 py-4 text-lg font-semibold text-slate-800">
            Actions
          </div>

          <div className="p-6 space-y-4">
            <button
              onClick={() => navigate("/secretary/upload-proof")}
              className="w-full py-4 rounded-xl font-semibold text-white
                         bg-gradient-to-r from-green-400 to-green-600
                         transition-all duration-300
                         hover:-translate-y-1 hover:shadow-xl"
            >
              📸 Upload Proof
            </button>

            <button
              onClick={fetchDashboardData}
              className="w-full py-4 rounded-xl font-semibold border-2
                         transition-all duration-300
                         hover:border-green-500 hover:text-green-600 hover:bg-green-50"
            >
              🔄 Refresh Status
            </button>
          </div>
        </div>

        {/* Recent Proofs */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {/* Header */}
          <button
            onClick={() => setShowProofs(!showProofs)}
            className="w-full flex items-center justify-between
               px-6 py-4 text-lg font-semibold text-slate-800
               hover:bg-slate-50 transition"
          >
            <span>Recent Proofs</span>

            <span
              className={`text-xl transition-transform duration-300 ${
                showProofs ? "rotate-180" : ""
              }`}
            >
              ▾
            </span>
          </button>

          {/* Collapsible content — CONTENT MUST BE INSIDE */}
          <div
            className={`transition-all duration-300 ease-in-out
                ${showProofs ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}
                overflow-hidden overflow-y-auto`}
          >
            <div className="p-6 space-y-4">
              {summary.recentProofs.length === 0 && (
                <div className="text-slate-500 text-center">
                  📭 No proofs submitted yet
                </div>
              )}

              {summary.recentProofs.map((proof) => (
                <div
                  key={proof._id}
                  className="flex gap-4 items-center p-4 rounded-xl
                     border border-slate-200
                     transition hover:bg-slate-50"
                >
                  <img
                    src={proof.imageUrl}
                    alt="proof"
                    className="w-20 h-20 rounded-lg object-cover ring-1 ring-slate-200"
                  />
                  <div className="space-y-1">
                    <div className="text-sm text-slate-500">
                      {formatDate(proof.timestamp)}
                    </div>
                    <StatusBadge status={proof.status} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          <button
            onClick={() => setShowLeaderboard(!showLeaderboard)}
            className="w-full flex items-center justify-between
               px-6 py-4 text-lg font-semibold text-slate-800
               hover:bg-slate-50 transition"
          >
            <span>View Leaderboard</span>

            <span
              className={`text-xl transition-transform duration-300 ${
                showLeaderboard ? "rotate-180" : ""
              }`}
            >
              ▾
            </span>
          </button>
          <div
            className={`transition-all duration-300 ease-in-out
                ${showLeaderboard ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}
                overflow-hidden overflow-y-auto`}
          >
            {showLeaderboard && <AdminSocieties />}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default SecretaryDashboard;
