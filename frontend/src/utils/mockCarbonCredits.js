// utils/mockCarbonCredits.js
export const generateMockCreditTrend = (currentCredits) => {
  // Simulate last 6 weeks
  const weeks = ['W-5', 'W-4', 'W-3', 'W-2', 'Last Week', 'This Week'];

  let base = Math.max(currentCredits - 40, 10);
  const data = weeks.map(() => {
    base += Math.floor(Math.random() * 8) + 5; // gradual increase
    return base;
  });

  return { weeks, data };
};
