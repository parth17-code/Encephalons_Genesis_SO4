import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiService } from '../services/api';
import { authService } from '../utils/auth';
import Layout from '../components/Layout';
import StatusBadge from '../components/StatusBadge';

const SecretaryDashboard = () => {
  const [rebateData, setRebateData] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
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
      setRebateData(rebateRes.data.data);

      const summaryRes = await apiService.getResidentSummary(societyId);
      setSummary(summaryRes.data.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) =>
    date
      ? new Date(date).toLocaleDateString('en-IN', {
          year: 'numeric',
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })
      : 'Never';

  if (loading) {
    return (
      <Layout title="Secretary Dashboard">
        <div className="bg-white rounded-xl p-8 text-center shadow">
          Loading dashboard...
        </div>
      </Layout>
    );
  }

  if (error) {
    return (
      <Layout title="Secretary Dashboard">
        <div className="bg-red-100 text-red-700 p-6 rounded-xl text-center">
          {error}
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Secretary Dashboard">
      <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(300px,1fr))]">

        {/* Compliance Status */}
        <div className="bg-white rounded-xl shadow col-span-2 max-[900px]:col-span-1">
          <div className="border-b px-6 py-4 font-semibold text-gray-800">
            Compliance Status
          </div>

          <div className="p-6">
            <div className="flex items-center gap-6 mb-6">
              <StatusBadge status={rebateData.complianceStatus} />
              <div className="flex items-baseline gap-2">
                <span className="text-gray-500">Score:</span>
                <span className="text-3xl font-bold text-gray-800">
                  {rebateData.complianceScore}/100
                </span>
              </div>
            </div>

            <div className="space-y-3">
              {[
                ['Society', rebateData.societyName],
                ['Ward', rebateData.ward],
                ['Last Proof', formatDate(rebateData.lastProofDate)],
                ['Days Since', `${rebateData.daysSinceLastProof} day(s)`],
              ].map(([label, value]) => (
                <div
                  key={label}
                  className="flex justify-between border-b pb-2 text-sm"
                >
                  <span className="text-gray-500">{label}</span>
                  <span className="font-semibold text-gray-800">{value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Rebate */}
        <div className="rounded-xl shadow bg-dark-green text-white">
          <div className="border-b border-white/20 px-6 py-4 font-semibold">
            Tax Rebate
          </div>

          <div className="p-6 text-center">
            <div className="text-6xl font-bold">
              {rebateData.rebatePercent}%
            </div>
            <div className="opacity-90 mb-6">Property Tax Discount</div>

            <div className="space-y-3 text-left">
              <div className="bg-white/10 p-3 rounded-lg flex gap-3">
                📊 Based on compliance performance
              </div>
              <div className="bg-white/10 p-3 rounded-lg flex gap-3">
                📋 {rebateData.proofCount} proof(s) submitted
              </div>
            </div>
          </div>
        </div>

        {/* Waste Collection Stats */}
        <div className="bg-white rounded-xl shadow">
            <div className="border-b px-6 py-4 font-semibold text-gray-800">
              Waste Collection Stats
            </div>
            <div className="p-6 space-y-4">
              {[
                ['♻️', summary.wasteStats.recyclableWaste, 'Recyclable Waste'],
                ['🌱', summary.wasteStats.organicWaste, 'Organic Waste'],
                ['💧', summary.wasteStats.wetWaste, 'Wet Waste'],
                ['🌡️', summary.wasteStats.compostPitTemperature, 'Compost Pit Temperature']
              ].map(([icon, value, label]) => (
                <div key={label} className="flex gap-4 bg-gray-50 p-4 rounded-lg">
                  <div className="text-3xl">{icon}</div>
                  <div>
                    <div className="text-2xl font-bold text-gray-800">
                      {value} {label.includes('Temperature') ? '°C' : 'kg'}
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

        {/* Rules */}
        <div className="bg-white rounded-xl shadow">
          <div className="border-b px-6 py-4 font-semibold text-gray-800">
            Compliance Rules
          </div>

          <div className="p-6 space-y-4">
            <div className="flex gap-3 items-center bg-gray-50 p-3 border-l-4 border-green-500 rounded">
              <StatusBadge status="GREEN" /> Proof today → 10% rebate
            </div>
            <div className="flex gap-3 items-center bg-gray-50 p-3 border-l-4 border-yellow-500 rounded">
              <StatusBadge status="YELLOW" /> Proof 1-2 days ago → 5% rebate
            </div>
            <div className="flex gap-3 items-center bg-gray-50 p-3 border-l-4 border-red-500 rounded">
              <StatusBadge status="RED" /> No proof 3+ days → 0% rebate
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="bg-white rounded-xl shadow">
          <div className="border-b px-6 py-4 font-semibold text-gray-800">
            Actions
          </div>

          <div className="p-6 space-y-4">
            <button
              onClick={() => navigate('/secretary/upload-proof')}
              className="w-full py-4 rounded-lg font-semibold text-white
                         bg-gradient-to-r from-green-400 to-green-600
                         hover:-translate-y-1 transition shadow"
            >
              📸 Upload Proof
            </button>

            <button
              onClick={fetchDashboardData}
              className="w-full py-4 rounded-lg font-semibold border-2
                         hover:border-green-500 hover:text-green-600 transition"
            >
              🔄 Refresh Status
            </button>
          </div>
        </div>

        {/* Recent Proofs */}
        <div className="bg-white rounded-xl shadow">
          <div className="border-b px-6 py-4 font-semibold text-gray-800">
            Recent Proofs
          </div>

          <div className="p-6 space-y-4">
            {summary.recentProofs.length === 0 && (
              <div className="text-gray-500 text-center">
                No proofs submitted yet
              </div>
            )}

            {summary.recentProofs.map(proof => (
              <div
                key={proof._id}
                className="flex gap-4 items-center border p-3 rounded-lg"
              >
                <img
                  src={proof.imageUrl}
                  alt="proof"
                  className="w-20 h-20 rounded object-cover"
                />
                <div className="space-y-1">
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
    </Layout>
  );
};

export default SecretaryDashboard;
