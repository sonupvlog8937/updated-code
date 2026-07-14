import { formatDistanceKm } from './geoCoords.js';

export const calculateDistanceDeliveryFee = ({
  distanceKm,
  perKmFee = 5,
  startingFee = 0,
}) => {
  const safeDistance = Number(distanceKm);
  const safePerKmFee = Number(perKmFee || 0);
  const safeStartingFee = Number(startingFee || 0);

  if (!Number.isFinite(safeDistance) || safeDistance <= 0) {
    return Number(safeStartingFee.toFixed(2));
  }

  const distanceFee = safeDistance * safePerKmFee;
  const totalFee = safeStartingFee + distanceFee;
  return Number(totalFee.toFixed(2));
};

export const calculateDistanceFeeBreakdown = ({
  distanceKm,
  perKmFee = 5,
  startingFee = 0,
}) => {
  const safeDistance = Number(distanceKm);
  const safePerKmFee = Number(perKmFee || 0);
  const safeStartingFee = Number(startingFee || 0);

  if (!Number.isFinite(safeDistance) || safeDistance <= 0) {
    return {
      distanceFee: 0,
      startingFee: Number(safeStartingFee.toFixed(2)),
      totalFee: Number(safeStartingFee.toFixed(2)),
      distanceDisplay: null,
      distanceKm: null,
    };
  }

  const distanceFee = Number((safeDistance * safePerKmFee).toFixed(2));
  const totalFee = Number((safeStartingFee + distanceFee).toFixed(2));

  return {
    distanceFee,
    startingFee: Number(safeStartingFee.toFixed(2)),
    totalFee,
    distanceDisplay: formatDistanceKm(safeDistance),
    distanceKm: Number(safeDistance.toFixed(2)),
  };
};
