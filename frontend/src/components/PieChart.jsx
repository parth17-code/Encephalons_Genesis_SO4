import React from "react";
import { Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend
);

export default function PieChart({ dashboardData }) {
  const data = {
        labels: ["GREEN", "YELLOW", "RED"],
      datasets: [
        {
          data: [
            dashboardData.complianceBreakdown.GREEN,
            dashboardData.complianceBreakdown.YELLOW,
            dashboardData.complianceBreakdown.RED,
          ],
          backgroundColor: [
            "#3e6045", // GREEN
            "#FFC107", // YELLOW
            "#F44336", // RED
          ],
        },
      ],
    };
  };
  return <Pie data={data} />;