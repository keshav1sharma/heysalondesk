const express = require("express");
const router = express.Router();
const KnowledgeBaseService = require("../services/KnowledgeBaseService");
const HelpRequestService = require("../services/HelpRequestService");

router.post("/check-knowledge", async (req, res) => {
  try {
    const { question } = req.body;

    if (!question) {
      return res.status(400).json({ error: "Question is required" });
    }

    const results = await KnowledgeBaseService.searchKnowledge(question);
    console.log("results", results)

    if (results.length > 0) {
      // Track usage only if we have a valid MongoDB ObjectId
      // Mem0 results have UUID-style IDs, so we need to find the MongoDB entry
      try {
        const mongoEntry = await KnowledgeBaseService.findByMemoryId(results[0].memoryId);
        if (mongoEntry) {
          await KnowledgeBaseService.trackUsage(mongoEntry._id);
        }
      } catch (error) {
        console.log("Could not track usage (Mem0-only result):", error.message);
      }

      res.json({
        found: true,
        answer: results[0].answer,
        confidence: results[0].relevanceScore || 0.8,
        kbEntryId: results[0]._id,
        alternatives: results.slice(1, 3).map((r) => ({
          answer: r.answer,
          confidence: r.relevanceScore || 0.7,
        })),
      });
    } else {
      res.json({
        found: false,
        message: "No relevant knowledge found",
        suggestEscalation: true,
      });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/escalate", async (req, res) => {
  try {
    const { question, customerPhone, customerContext } = req.body;

    if (!question || !customerPhone) {
      return res.status(400).json({
        error: "Question and customerPhone are required",
      });
    }

    const request = await HelpRequestService.createRequest({
      question,
      customerPhone,
      customerContext,
    });

    res.status(201).json({
      success: true,
      requestId: request._id,
      message: "Request escalated to supervisor",
      estimatedResponseTime: "30 minutes",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/kb-sync", async (req, res) => {
  try {
    const knowledge = await KnowledgeBaseService.getAllKnowledge();

    res.json({
      success: true,
      count: knowledge.length,
      lastUpdated: new Date().toISOString(),
      knowledge: knowledge.map((k) => ({
        id: k._id,
        question: k.question,
        answer: k.answer,
        category: k.category,
      })),
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/track-usage", async (req, res) => {
  try {
    const { kbEntryId } = req.body;

    if (!kbEntryId) {
      return res.status(400).json({ error: "kbEntryId is required" });
    }

    await KnowledgeBaseService.trackUsage(kbEntryId);

    res.json({
      success: true,
      message: "Usage tracked",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
