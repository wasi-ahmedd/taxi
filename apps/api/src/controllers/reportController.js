import { getMonthlyReport, getReportSummary, getTripsByDriver } from '../models/earningModel.js';

export const reportSummaryHandler = async (_req, res) => {
  try {
    const summary = await getReportSummary();
    const byDriver = await getTripsByDriver();
    const monthly = await getMonthlyReport();

    return res.json({ summary, byDriver, monthly });
  } catch (error) {
    return res.status(500).json({ message: 'Failed to fetch reports', detail: error.message });
  }
};
