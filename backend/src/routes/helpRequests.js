const express = require("express");
const router = express.Router();
const HelpRequestService = require("../services/HelpRequestService");
const HelpRequest = require("../models/HelpRequest");

router.get("/", async (req, res) => {
  try {
    const { status, page, limit, sortBy, sortOrder } = req.query;

    const result = await HelpRequestService.getAllRequests({
      status,
      page: parseInt(page) || 1,
      limit: parseInt(limit) || 20,
      sortBy,
      sortOrder,
    });

    res.json({
      success: true,
      data: result.requests,
      pagination: result.pagination,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const request = await HelpRequest.findById(req.params.id);

    if (!request) {
      return res.status(404).json({ error: "Request not found" });
    }

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.post("/", async (req, res) => {
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
      data: request,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/:id/resolve", async (req, res) => {
  try {
    const { answer, supervisorNotes, category } = req.body;

    if (!answer) {
      return res.status(400).json({ error: "Answer is required" });
    }

    const result = await HelpRequestService.resolveRequest(req.params.id, {
      answer,
      supervisorNotes,
      category,
    });

    res.json({
      success: true,
      data: result.request,
      kbEntry: result.kbEntry,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.patch("/:id/unresolved", async (req, res) => {
  try {
    const { reason } = req.body;

    const request = await HelpRequestService.markUnresolved(
      req.params.id,
      reason || "Marked as unresolved"
    );

    res.json({
      success: true,
      data: request,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    await HelpRequest.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Help request deleted successfully",
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
