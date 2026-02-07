import { useState, useEffect } from 'react';
import { apiService } from '../services/api';
import { authService } from '../utils/auth';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';

const ResidentSummary = () => {
  const [summary, setSummary] = useState(null);
  const [rebateData, setRebateData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showProofs, setShowProofs] = useState(false);
  const [error, setError] = useState('');

  const user = authService.getUser();
  const societyId = user?.societyId?._id || user?.societyId;

  useEffect(() => {
    fetchSummary();
  }, []);

  const fetchSummary = async () => {
    try {
      setLoading(true);

      const rebateRes = await apiService.getRebate(societyId);
      console.log("📊 Rebate data:", rebateRes.data.data);
      setRebateData(rebateRes.data.data);

      const res = await apiService.getResidentSummary(societyId);
      setSummary(res.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load summary');
    } finally {
      setLoading(false);
    }
  };

  const rebatePercent = rebateData?.rebatePercent || 0;
  const societyTax = rebateData?.societyTax || 0;

  // Money saved due to rebate
  const moneySaved = Math.round((societyTax * rebatePercent) / 100);

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Never';

  if (loading) {
    return (
      <Layout title="Society Summary">
        <div className="bg-white rounded-xl p-8 text-center shadow">
          Loading summary...
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Society Summary">
        <div className="bg-red-100 text-red-700 p-6 rounded-xl text-center">
          {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Society Summary">
      <div className="max-w-6xl mx-auto">

        {/* Society Info */}
        <div className="bg-[#3e6045] text-white rounded-xl p-8 mb-8 shadow-lg">
          <h2 className="text-3xl font-semibold mb-6">
            {summary.society.name}
          </h2>

          <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-6">
            {[
              ['🏢', 'Ward', summary.society.ward],
              ['📋', 'Property Tax Number', summary.society.propertyTaxNumber],
              ['🏠', 'Total Units', summary.society.totalUnits || 'N/A'],
            ].map(([icon, label, value]) => (
              <div key={label} className="flex gap-4 items-center">
                <span className="text-3xl opacity-90">{icon}</span>
                <div>
                  <div className="text-sm opacity-90">{label}</div>
                  <div className="text-xl font-semibold">{value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Dashboard Grid */}
        <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(280px,1fr))]">

          {/* Compliance */}
          <div className="bg-white rounded-xl shadow">
            <div className="border-b px-6 py-4 font-semibold text-gray-800">
              Compliance Status
            </div>
            <div className="p-6 space-y-4">
              <div className="flex items-center gap-6">
                <StatusBadge status={summary.compliance.complianceStatus} />
                <div className="text-xl">
                  Score:{' '}
                  <strong className="text-indigo-600">
                    {summary.compliance.complianceScore}/100
                  </strong>
                </div>
              </div>

              <div className="space-y-2">
                {[
                  ['Last Proof', formatDate(summary.compliance.lastProofDate)],
                  ['Days Since', `${summary.compliance.daysSinceLastProof} day(s)`],
                  ['Total Proofs', summary.compliance.proofCount],
                ].map(([label, value]) => (
                  <div
                    key={label}
                    className="flex justify-between bg-gray-50 p-3 rounded-md"
                  >
                    <span className="text-gray-500">{label}</span>
                    <span className="font-semibold text-gray-800">{value}</span>
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

          {/* Waste Stats */}
          <div className="bg-white rounded-xl shadow">
            <div className="border-b px-6 py-4 font-semibold text-gray-800">
              Waste Collection Stats
            </div>
            <div className="p-6 space-y-4">
              {[
                ['♻️', summary.wasteStats.recyclableWaste, 'Recyclable Waste'],
                ['🌱', summary.wasteStats.organicWaste, 'Organic Waste'],
                ['💧', summary.wasteStats.wetWaste, 'Wet Waste'],
              ['🌡️', summary.wasteStats.compostPitTemperature, 'Compost Pit Temperature'],
              ].map(([icon, value, label]) => (
                <div key={label} className="flex gap-4 bg-gray-50 p-4 rounded-lg">
                  <div className="text-3xl">{icon}</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {value} kg
                    </div>
                    <div className="text-gray-500">{label}</div>
                  </div>
                </div>
              ))}

              <div className="flex gap-4 p-4 rounded-lg border-2 border-indigo-300 bg-indigo-50">
                <div className="text-3xl">📊</div>
                <div>
                  <div className="text-2xl font-bold text-gray-800">
                    {summary.wasteStats.totalWasteCollected} kg
                  </div>
                  <div className="text-gray-500">Total Collected</div>
                </div>
              </div>
            </div>
          </div>

          {/* Recent Proofs */}
<div className="bg-white rounded-xl shadow overflow-hidden">

  {/* Header (clickable) */}
  <button
    onClick={() => setShowProofs(!showProofs)}
    className="w-full flex items-center justify-between
               border-b px-6 py-4 font-semibold text-gray-800
               hover:bg-gray-50 transition"
  >
    <span>Recent Proofs</span>

    <span
      className={`text-lg transition-transform duration-300 ${
        showProofs ? "rotate-180" : ""
      }`}
    >
      ▾
    </span>
  </button>

  {/* Collapsible content */}
  <div
    className={`transition-all duration-300 ease-in-out
                ${showProofs ? "max-h-[500px] opacity-100" : "max-h-0 opacity-0"}
                overflow-y-auto`}
  >
    <div className="p-6 space-y-4">
      {summary.recentProofs.length === 0 && (
        <div className="text-center text-gray-500 py-6">
          No proofs submitted yet
        </div>
      )}

      {summary.recentProofs.map((proof) => (
        <div
          key={proof._id}
          className="flex gap-4 bg-gray-50 p-4 rounded-lg
                     hover:bg-gray-100 transition"
        >
          <img
            src={proof.imageUrl}
            alt="Proof"
            className="w-20 h-20 rounded-md object-cover"
          />
          <div className="flex flex-col justify-center gap-2">
            <div className="text-sm text-gray-500">
              {formatDate(proof.timestamp)}
            </div>
            <StatusBadge status={proof.status} />
          </div>
        </div>
      ))}
    </div>
  </div>
</div>

        </div>

        {/* Refresh */}
        <button
          onClick={fetchSummary}
          className="w-full mt-8 py-4 rounded-lg font-semibold border-2
                     hover:border-green-500 hover:text-green-600 transition"
        >
          🔄 Refresh Summary
        </button>
      </div>
    </Layout>
  );
};

export default ResidentSummary;
