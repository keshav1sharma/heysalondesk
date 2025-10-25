const cron = require("node-cron");
const HelpRequestService = require("../services/HelpRequestService");
const NotificationService = require("../services/NotificationService");
const HelpRequest = require("../models/HelpRequest");

class TimeoutChecker {
  constructor() {
    this.isRunning = false;
  }

  /**
   * Start the timeout checker
   * Runs every 5 minutes
   */
  start() {
    console.log("Starting timeout checker job...");

    cron.schedule("*/5 * * * *", async () => {
      if (this.isRunning) {
        console.log("Timeout check already running, skipping...");
        return;
      }

      this.isRunning = true;

      try {
        await this.checkTimeouts();
        await this.sendWarnings();
      } catch (error) {
        console.error("Timeout checker error:", error);
      } finally {
        this.isRunning = false;
      }
    });

    console.log("Timeout checker job started");
  }

  /**
   * Check for timed out requests
   */
  async checkTimeouts() {
    const timedOut = await HelpRequestService.checkTimeouts();

    if (timedOut > 0) {
      console.log(`Marked ${timedOut} requests as timed out`);
    }
  }

  /**
   * Send warnings for requests about to timeout
   */
  async sendWarnings() {
    const fiveMinutesFromNow = new Date(Date.now() + 5 * 60 * 1000);
    const oneMinuteFromNow = new Date(Date.now() + 1 * 60 * 1000);

    const soonToTimeout = await HelpRequest.find({
      status: "pending",
      timeoutAt: {
        $gte: oneMinuteFromNow,
        $lte: fiveMinutesFromNow,
      },
    });

    for (const request of soonToTimeout) {
      const minutesRemaining = Math.round(
        (request.timeoutAt - Date.now()) / 1000 / 60
      );

      await NotificationService.sendTimeoutWarning(request, minutesRemaining);
    }
  }
}

module.exports = new TimeoutChecker();
