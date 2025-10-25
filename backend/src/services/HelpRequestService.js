const HelpRequest = require("../models/HelpRequest");
const KnowledgeBaseService = require("./KnowledgeBaseService");
const NotificationService = require("./NotificationService");

class HelpRequestService {
  /**
   * Create new help request
   */
  async createRequest(data) {
    const { question, customerPhone, customerContext } = data;

    const request = new HelpRequest({
      question,
      customerPhone,
      customerContext,
      status: "pending",
      timeoutAt: new Date(Date.now() + 30 * 60 * 1000),
    });

    await request.save();

    await NotificationService.notifySupervisor(request);

    if (global.io) {
      global.io.emit("new_help_request", {
        requestId: request._id,
        question: request.question,
        customerPhone: request.customerPhone,
        timestamp: request.createdAt,
      });
    }

    return request;
  }

  /**
   * Resolve help request and update knowledge base
   */
  async resolveRequest(requestId, resolution) {
    const { answer, supervisorNotes, category } = resolution;

    const request = await HelpRequest.findByIdAndUpdate(
      requestId,
      {
        status: "resolved",
        answer,
        supervisorNotes,
        resolvedAt: new Date(),
      },
      { new: true }
    );

    if (!request) {
      throw new Error("Request not found");
    }

    const kbEntry = await KnowledgeBaseService.addKnowledgeToMongo({
      question: request.question,
      answer,
      category: category || "other",
      sourceRequestId: requestId,
    });

    setImmediate(async () => {
      try {
        const memoryId = await KnowledgeBaseService.addToMem0(
          request.question,
          answer,
          { category: category || "other", source: "learned" }
        );
        kbEntry.memoryId = memoryId;
        await kbEntry.save();
        console.log(`Background: Added to Mem0 with ID ${memoryId}`);
      } catch (error) {
        console.error("Background Mem0 add failed:", error.message);
      }
    });

    await NotificationService.notifyCustomer(request.customerPhone, answer);

    if (global.io) {
      global.io.emit("request_resolved", {
        requestId: request._id,
        status: "resolved",
        kbCreated: true,
        kbEntryId: kbEntry._id,
      });
    }

    return { request, kbEntry };
  }

  /**
   * Mark request as unresolved
   */
  async markUnresolved(requestId, reason) {
    const request = await HelpRequest.findByIdAndUpdate(
      requestId,
      {
        status: "unresolved",
        supervisorNotes: reason,
        resolvedAt: new Date(),
      },
      { new: true }
    );

    if (global.io) {
      global.io.emit("request_unresolved", {
        requestId: request._id,
        reason,
      });
    }

    return request;
  }

  /**
   * Get pending requests
   */
  async getPendingRequests(filters = {}) {
    const query = { status: "pending", ...filters };
    return await HelpRequest.find(query).sort({ createdAt: -1 }).limit(50);
  }

  /**
   * Get all requests with pagination
   */
  async getAllRequests(options = {}) {
    const {
      status,
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
    } = options;

    const query = status ? { status } : {};
    const skip = (page - 1) * limit;

    const [requests, total] = await Promise.all([
      HelpRequest.find(query)
        .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1 })
        .skip(skip)
        .limit(limit),
      HelpRequest.countDocuments(query),
    ]);

    return {
      requests,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Check and handle timeouts
   */
  async checkTimeouts() {
    const now = new Date();

    const timedOutRequests = await HelpRequest.find({
      status: "pending",
      timeoutAt: { $lte: now },
    });

    for (const request of timedOutRequests) {
      await this.markUnresolved(
        request._id,
        "Auto-timeout: No response within 30 minutes"
      );

      await NotificationService.notifyCustomer(
        request.customerPhone,
        "We're sorry, but we weren't able to get an answer to your question in time. Please call us at (555) 123-4567."
      );
    }

    return timedOutRequests.length;
  }

  /**
   * Get request statistics
   */
  async getStats() {
    const [pending, resolved, unresolved, totalToday] = await Promise.all([
      HelpRequest.countDocuments({ status: "pending" }),
      HelpRequest.countDocuments({ status: "resolved" }),
      HelpRequest.countDocuments({ status: "unresolved" }),
      HelpRequest.countDocuments({
        createdAt: { $gte: new Date().setHours(0, 0, 0, 0) },
      }),
    ]);

    return {
      pending,
      resolved,
      unresolved,
      totalToday,
    };
  }
}

module.exports = new HelpRequestService();
