const axios = require("axios");

class NotificationService {
  constructor() {
    this.webhookUrl = process.env.WEBHOOK_URL;
  }

  async sendWebhook(eventType, payload) {
    if (!this.webhookUrl) {
      return;
    }

    try {
      await axios.post(
        this.webhookUrl,
        {
          event: eventType,
          timestamp: new Date().toISOString(),
          data: payload,
        },
        {
          headers: {
            "Content-Type": "application/json",
          },
          timeout: 5000,
        }
      );
      console.log(`Webhook sent: ${eventType}`);
    } catch (error) {
      console.error(`Webhook error (${eventType}):`, error.message);
    }
  }

  /**
   * Notify supervisor of new help request
   */
  async notifySupervisor(request) {
    console.log("\n=== SUPERVISOR NOTIFICATION ===");
    console.log(`New Help Request: ${request._id}`);
    console.log(`Question: ${request.question}`);
    console.log(`Customer: ${request.customerPhone}`);
    console.log(`Time: ${request.createdAt}`);
    console.log("================================\n");

    await this.sendWebhook("supervisor_notification", {
      requestId: request._id,
      question: request.question,
      customerPhone: request.customerPhone,
      createdAt: request.createdAt,
    });
  }

  /**
   * Notify customer with answer
   */
  async notifyCustomer(phone, message) {
    console.log("\n=== CUSTOMER NOTIFICATION ===");
    console.log(`To: ${phone}`);
    console.log(`Message: ${message}`);
    console.log("================================\n");

    await this.sendWebhook("customer_notification", {
      phone,
      message,
    });
  }

  /**
   * Notify agent of knowledge base update
   */
  async notifyAgent(kbEntry) {
    console.log("\n=== AGENT NOTIFICATION ===");
    console.log("Knowledge base updated");
    console.log(`New entry: ${kbEntry.question}`);
    console.log("Agent should refresh KB");
    console.log("============================\n");

    await this.sendWebhook("agent_notification", {
      kbEntryId: kbEntry._id,
      question: kbEntry.question,
      answer: kbEntry.answer,
      category: kbEntry.category,
    });
  }

  /**
   * Send timeout warning
   */
  async sendTimeoutWarning(request, minutesRemaining) {
    console.log("\n=== TIMEOUT WARNING ===");
    console.log(
      `Request ${request._id} will timeout in ${minutesRemaining} minutes`
    );
    console.log(`Question: ${request.question}`);
    console.log("==========================\n");

    if (global.io) {
      global.io.emit("request_timeout_warning", {
        requestId: request._id,
        question: request.question,
        timeRemaining: `${minutesRemaining} minutes`,
      });
    }

    await this.sendWebhook("timeout_warning", {
      requestId: request._id,
      question: request.question,
      minutesRemaining,
      timeoutAt: request.timeoutAt,
    });
  }
}

module.exports = new NotificationService();
