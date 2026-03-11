export const calculateEarnings = ({ fare, ownerCommissionPercent }) => {
  const safeFare = Number(fare || 0);
  const safePercent = Number(ownerCommissionPercent || 0);
  const ownerEarning = (safeFare * safePercent) / 100;
  const driverEarning = safeFare - ownerEarning;

  return {
    totalFare: safeFare,
    ownerCommissionPercent: safePercent,
    ownerEarning: Number(ownerEarning.toFixed(2)),
    driverEarning: Number(driverEarning.toFixed(2)),
  };
};
