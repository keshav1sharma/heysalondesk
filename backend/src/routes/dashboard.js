const express = require("express");
const router = express.Router();
const DashboardService = require("../services/DashboardService");

router.get("/stats", async (req, res) => {
  try {
    const stats = await DashboardService.getStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/analytics", async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const start = startDate ? new Date(startDate) : new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const end = endDate ? new Date(endDate) : new Date();

    const analytics = await DashboardService.getAnalytics(start, end);

    res.json({
      success: true,
      analytics,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
