const HelpRequest = require("../models/HelpRequest");
const KnowledgeBase = require("../models/KnowledgeBase");

class DashboardService {
  /**
   * Get dashboard statistics
   */
  async getStats() {
    const startOfToday = new Date().setHours(0, 0, 0, 0);

    const [
      pendingCount,
      resolvedCount,
      unresolvedCount,
      todayCount,
      kbTotal,
      kbLearned,
      mostUsedKB,
      avgResolutionTime,
    ] = await Promise.all([
      HelpRequest.countDocuments({ status: "pending" }),
      HelpRequest.countDocuments({ status: "resolved" }),
      HelpRequest.countDocuments({ status: "unresolved" }),
      HelpRequest.countDocuments({
        createdAt: { $gte: startOfToday },
      }),
      KnowledgeBase.countDocuments({ isActive: true }),
      KnowledgeBase.countDocuments({
        isActive: true,
        source: "learned",
      }),
      KnowledgeBase.findOne({ isActive: true })
        .sort({ usageCount: -1 })
        .select("question usageCount"),
      this.calculateAvgResolutionTime(),
    ]);

    return {
      helpRequests: {
        pending: pendingCount,
        resolved: resolvedCount,
        unresolved: unresolvedCount,
        totalToday: todayCount,
      },
      knowledgeBase: {
        total: kbTotal,
        learned: kbLearned,
        mostUsed: mostUsedKB ? mostUsedKB.question : "N/A",
        mostUsedCount: mostUsedKB ? mostUsedKB.usageCount : 0,
      },
      responseTime: avgResolutionTime,
    };
  }

  /**
   * Calculate average resolution time
   */
  async calculateAvgResolutionTime() {
    const resolvedRequests = await HelpRequest.find({
      status: "resolved",
      resolvedAt: { $exists: true },
    }).select("createdAt resolvedAt");

    if (resolvedRequests.length === 0) {
      return { average: "N/A", median: "N/A" };
    }

    const durations = resolvedRequests.map((r) => {
      return (r.resolvedAt - r.createdAt) / 1000 / 60; // minutes
    });

    const average = durations.reduce((a, b) => a + b, 0) / durations.length;

    durations.sort((a, b) => a - b);
    const median =
      durations.length % 2 === 0
        ? (durations[durations.length / 2 - 1] +
            durations[durations.length / 2]) /
          2
        : durations[Math.floor(durations.length / 2)];

    return {
      average: `${Math.round(average)} minutes`,
      median: `${Math.round(median)} minutes`,
    };
  }

  /**
   * Get analytics data
   */
  async getAnalytics(startDate, endDate) {
    const requests = await HelpRequest.find({
      createdAt: { $gte: startDate, $lte: endDate },
    });

    const total = requests.length;
    const resolved = requests.filter((r) => r.status === "resolved").length;

    const resolutionRate = total > 0 ? resolved / total : 0;
    const escalationRate = 0.15;

    const questionCounts = {};
    requests.forEach((r) => {
      questionCounts[r.question] = (questionCounts[r.question] || 0) + 1;
    });

    const topQuestions = Object.entries(questionCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([question, count]) => ({ question, count }));

    const kbEntries = await KnowledgeBase.find({
      sourceRequestId: { $in: requests.map((r) => r._id) },
    });

    const escalationsByCategory = {};
    kbEntries.forEach((kb) => {
      escalationsByCategory[kb.category] =
        (escalationsByCategory[kb.category] || 0) + 1;
    });

    return {
      escalationRate,
      resolutionRate,
      averageResolutionTime: (await this.calculateAvgResolutionTime()).average,
      topQuestions,
      escalationsByCategory,
      totalRequests: total,
      resolvedRequests: resolved,
    };
  }
}

module.exports = new DashboardService();
