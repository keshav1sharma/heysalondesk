const express = require("express");
const router = express.Router();
const KnowledgeBaseService = require("../services/KnowledgeBaseService");
const KnowledgeBase = require("../models/KnowledgeBase");

router.get("/", async (req, res) => {
  try {
    const { category, source, limit } = req.query;

    const filters = {};
    if (category) filters.category = category;
    if (source) filters.source = source;

    const knowledge = await KnowledgeBaseService.getAllKnowledge(filters);

    const limitedKnowledge = limit
      ? knowledge.slice(0, parseInt(limit))
      : knowledge;

    res.json({
      success: true,
      data: limitedKnowledge,
      count: limitedKnowledge.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/search", async (req, res) => {
  try {
    const { q } = req.query;

    if (!q) {
      return res.status(400).json({ error: "Query parameter 'q' is required" });
    }

    const results = await KnowledgeBaseService.searchKnowledge(q);

    res.json({
      success: true,
      results,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/stats", async (req, res) => {
  try {
    const stats = await KnowledgeBaseService.getStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
  try {
    const { question, answer, category, tags } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        error: "Question and answer are required",
      });
    }

    const kbEntry = await KnowledgeBaseService.addKnowledge({
      question,
      answer,
      category,
      tags,
      source: "initial",
    });

    res.status(201).json({
      success: true,
      data: kbEntry,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/:id", async (req, res) => {
  try {
    const updates = req.body;

    const kbEntry = await KnowledgeBaseService.updateKnowledge(
      req.params.id,
      updates
    );

    res.json({
      success: true,
      data: kbEntry,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await KnowledgeBaseService.deleteKnowledge(req.params.id);

    res.json({
      success: true,
      message: "Knowledge base entry deactivated",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
