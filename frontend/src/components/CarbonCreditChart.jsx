// components/CarbonCreditChart.jsx
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler,
} from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Tooltip,
  Filler
);

const CarbonCreditChart = ({ labels, values }) => {
  const data = {
    labels,
    datasets: [
      {
        label: 'Carbon Credits Earned',
        data: values,
        fill: true,
        tension: 0.4,
        borderColor: '#3e6045',
        backgroundColor: 'rgba(147, 218, 151, 0.4)',
        pointRadius: 5,
        pointBackgroundColor: '#3e6045',
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      tooltip: {
        callbacks: {
          label: (ctx) => `${ctx.parsed.y} credits`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 10,
        },
        title: {
          display: true,
          text: 'Credits',
        },
      },
      x: {
        title: {
          display: true,
          text: 'Time',
        },
      },
    },
  };

  return <Line data={data} options={options} />;
};

export default CarbonCreditChart;
