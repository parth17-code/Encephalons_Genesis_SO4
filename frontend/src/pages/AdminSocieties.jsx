import { useState, useEffect } from "react";
import { apiService } from "../services/api";
import Layout from "../components/Layout";
import StatusBadge from "../components/StatusBadge";

const AdminSocieties = () => {
  const [societies, setSocieties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [wardFilter, setWardFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    fetchSocieties();
  }, [wardFilter, statusFilter]);

  const fetchSocieties = async () => {
    setLoading(true);
    setError("");
    try {
      const params = {};
      if (wardFilter) params.ward = wardFilter;
      if (statusFilter) params.complianceStatus = statusFilter;

      const response = await apiService.getAdminSocieties(params);
      setSocieties(response.data.data);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to load societies");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout title="All Societies">
      <div className="rounded-xl bg-white p-6 shadow">
        {/* Filters */}
        <div className="mb-6 flex flex-wrap items-center gap-4 border-b border-slate-200 pb-6">
          <div className="flex items-center gap-2">
            <label className="font-medium text-slate-700">Ward:</label>
            <select
              value={wardFilter}
              onChange={(e) => setWardFilter(e.target.value)}
              className="min-w-37.5 cursor-pointer rounded-md border-2 border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Wards</option>
              <option value="A-Ward">A-Ward</option>
              <option value="B-Ward">B-Ward</option>
              <option value="C-Ward">C-Ward</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label className="font-medium text-slate-700">Compliance:</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="min-w-[150px] cursor-pointer rounded-md border-2 border-slate-200 px-4 py-2 text-sm focus:border-indigo-500 focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="GREEN">GREEN</option>
              <option value="YELLOW">YELLOW</option>
              <option value="RED">RED</option>
            </select>
          </div>

          <button
            onClick={fetchSocieties}
            className="ml-auto rounded-md bg-green-500 px-5 py-2 font-medium text-white transition hover:bg-green-600"
          >
            🔄 Refresh
          </button>
        </div>

        {loading && (
          <div className="text-center text-lg font-medium text-slate-600">
            Loading societies...
          </div>
        )}

        {error && (
          <div className="rounded-lg bg-red-100 p-4 text-red-700">
            {error}
          </div>
        )}

        {!loading && !error && (
          <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  {[
                    "Society Name",
                    "Ward",
                    "Property Tax #",
                    "Compliance",
                    "Rebate",
                    "Proofs",
                    "Score",
                  ].map((head) => (
                    <th
                      key={head}
                      className="border-b-2 border-slate-200 px-4 py-3 text-left text-sm font-semibold text-slate-700"
                    >
                      {head}
                    </th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {societies.map((society) => (
                  <tr
                    key={society._id}
                    className="transition hover:bg-slate-50"
                  >
                    <td className="px-4 py-4">
                      <div className="font-semibold text-slate-800">
                        {society.name}
                      </div>
                      <div className="mt-1 text-sm text-slate-500">
                        {society.societyId}
                      </div>
                    </td>

                    <td className="px-4 py-4">{society.ward}</td>

                    <td className="px-4 py-4 font-mono text-sm">
                      {society.propertyTaxNumber}
                    </td>

                    <td className="px-4 py-4">
                      <StatusBadge
                        status={society.compliance.complianceStatus}
                      />
                    </td>

                    <td className="px-4 py-4 font-semibold text-green-600">
                      {society.compliance.rebatePercent}%
                    </td>
                      
                    <td className="px-4 py-4">
                      {society.compliance.proofCount || 0}
                    </td>

                    <td className="px-4 py-4">
                      <span className="inline-block rounded-full bg-slate-200 px-3 py-1 text-sm font-semibold">
                        {society.compliance.complianceScore || 0}/100
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>

            {societies.length === 0 && (
              <div className="py-12 text-center text-lg text-slate-500">
                No societies found
              </div>
            )}
          </div>
        )}

        <div className="mt-4 border-t border-slate-200 pt-4 font-medium text-slate-500">
          Total: {societies.length} societie(s)
        </div>
      </div>
    </Layout>
  );
};

export default AdminSocieties;
