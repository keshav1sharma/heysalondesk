const KnowledgeBase = require("../models/KnowledgeBase");
const mem0Service = require("./Mem0Service");

class KnowledgeBaseService {
  /**
   * Search knowledge using Mem0 semantic search
   */
  async searchKnowledge(query, limit = 5) {
    try {
      const mem0Results = await mem0Service.searchMemory(query, limit);
      console.log("mem0Results", mem0Results);

      if (mem0Results.length > 0) {
        const kbEntries = mem0Results.map((result) => ({
          _id: result.id,
          question: result.metadata?.question || "N/A",
          answer: result.content,
          category: result.metadata?.category || "general",
          source: result.metadata?.source || "learned",
          memoryId: result.id,
          relevanceScore: result.score,
          usageCount: 0,
          isActive: true,
          createdAt: result.metadata?.createdAt || new Date(),
        }));

        console.log(`Found ${kbEntries.length} knowledge entries from Mem0`);
        return kbEntries;
      }

      console.log("No Mem0 results found");
      return [];
    } catch (error) {
      console.error("Search error:", error);
      throw error;
    }
  }

  /**
   * Add new knowledge entry (legacy - synchronous with Mem0)
   */
  async addKnowledge(data) {
    const {
      question,
      answer,
      category,
      tags,
      sourceRequestId,
      source = "learned",
    } = data;

    const memoryId = await mem0Service.addMemory(question, answer, {
      category,
      source,
      tags,
    });

    const kbEntry = new KnowledgeBase({
      question,
      answer,
      category: category || "other",
      tags: tags || [],
      source,
      sourceRequestId,
      memoryId,
      usageCount: 0,
      isActive: true,
    });

    await kbEntry.save();

    if (global.io) {
      global.io.emit("kb_updated", {
        action: "added",
        kbEntryId: kbEntry._id,
        question: kbEntry.question,
      });
    }

    return kbEntry;
  }

  /**
   * Add knowledge to MongoDB only (fast, non-blocking)
   */
  async addKnowledgeToMongo(data) {
    const {
      question,
      answer,
      category,
      tags,
      sourceRequestId,
      source = "learned",
    } = data;

    const kbEntry = new KnowledgeBase({
      question,
      answer,
      category: category || "other",
      tags: tags || [],
      source,
      sourceRequestId,
      memoryId: null, // Will be updated later in background
      usageCount: 0,
      isActive: true,
    });

    await kbEntry.save();

    if (global.io) {
      global.io.emit("kb_updated", {
        action: "added",
        kbEntryId: kbEntry._id,
        question: kbEntry.question,
      });
    }

    return kbEntry;
  }

  /**
   * Add knowledge to Mem0 only (can be called in background)
   */
  async addToMem0(question, answer, metadata = {}) {
    return await mem0Service.addMemory(question, answer, metadata);
  }

  /**
   * Update knowledge entry
   */
  async updateKnowledge(id, updates) {
    const entry = await KnowledgeBase.findById(id);

    if (!entry) {
      throw new Error("Knowledge entry not found");
    }

    if (updates.answer && entry.memoryId) {
      await mem0Service.updateMemory(
        entry.memoryId,
        `Question: ${updates.question || entry.question}\nAnswer: ${
          updates.answer
        }`,
        { category: updates.category || entry.category }
      );
    }

    Object.assign(entry, updates);
    await entry.save();

    if (global.io) {
      global.io.emit("kb_updated", {
        action: "updated",
        kbEntryId: entry._id,
      });
    }

    return entry;
  }

  /**
   * Soft delete knowledge entry
   */
  async deleteKnowledge(id) {
    const entry = await KnowledgeBase.findByIdAndUpdate(
      id,
      { isActive: false },
      { new: true }
    );

    if (!entry) {
      throw new Error("Knowledge entry not found");
    }

    if (entry.memoryId) {
      await mem0Service.deleteMemory(entry.memoryId);
    }

    if (global.io) {
      global.io.emit("kb_updated", {
        action: "deleted",
        kbEntryId: entry._id,
      });
    }

    return true;
  }

  /**
   * Find knowledge entry by Mem0 memory ID
   */
  async findByMemoryId(memoryId) {
    return await KnowledgeBase.findOne({ memoryId, isActive: true });
  }

  /**
   * Track usage of knowledge entry
   */
  async trackUsage(id) {
    await KnowledgeBase.findByIdAndUpdate(id, {
      $inc: { usageCount: 1 },
    });
  }

  /**
   * Get all knowledge entries
   */
  async getAllKnowledge(filters = {}) {
    const query = { isActive: true, ...filters };

    return await KnowledgeBase.find(query)
      .sort({ createdAt: -1 })
      .populate("sourceRequestId", "customerPhone createdAt");
  }

  /**
   * Get knowledge base statistics
   */
  async getStats() {
    const [totalEntries, byCategory, bySource, mostUsed] = await Promise.all([
      KnowledgeBase.countDocuments({ isActive: true }),

      KnowledgeBase.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$category", count: { $sum: 1 } } },
      ]),

      KnowledgeBase.aggregate([
        { $match: { isActive: true } },
        { $group: { _id: "$source", count: { $sum: 1 } } },
      ]),

      KnowledgeBase.find({ isActive: true })
        .sort({ usageCount: -1 })
        .limit(5)
        .select("question usageCount"),
    ]);

    return {
      totalEntries,
      byCategory: byCategory.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      bySource: bySource.reduce((acc, item) => {
        acc[item._id] = item.count;
        return acc;
      }, {}),
      mostUsed: mostUsed.map((kb) => ({
        question: kb.question,
        usageCount: kb.usageCount,
      })),
    };
  }

  /**
   * Seed initial knowledge base
   */
  async seedInitialKnowledge() {
    const initialData = [
      {
        question: "What are your business hours?",
        answer:
          "We're open Monday through Saturday from 9 AM to 7 PM. We're closed on Sundays.",
        category: "hours",
        tags: ["hours", "schedule", "open"],
      },
      {
        question: "What services do you offer?",
        answer:
          "We offer haircuts ($50), hair coloring ($120), manicures ($35), and pedicures ($45).",
        category: "services",
        tags: ["services", "menu", "offerings"],
      },
      {
        question: "Where are you located?",
        answer:
          "We're located at 123 Beauty Lane, San Francisco, CA. Our phone number is (555) 123-4567.",
        category: "location",
        tags: ["location", "address", "directions"],
      },
      {
        question: "How much does a haircut cost?",
        answer: "A haircut costs $50.",
        category: "pricing",
        tags: ["pricing", "haircut", "cost"],
      },
      {
        question: "Do you accept walk-ins?",
        answer:
          "Yes, we accept walk-ins, but appointments are recommended to avoid wait times.",
        category: "booking",
        tags: ["booking", "walk-in", "appointment"],
      },
    ];

    for (const data of initialData) {
      const exists = await KnowledgeBase.findOne({
        question: data.question,
        source: "initial",
      });

      if (!exists) {
        await this.addKnowledge({
          ...data,
          source: "initial",
        });
      }
    }

    console.log("✅ Initial knowledge base seeded");
  }
}

module.exports = new KnowledgeBaseService();
