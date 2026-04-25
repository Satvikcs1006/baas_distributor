const express = require("express");
const { executeQuery } = require("../db/databricks");

const router = express.Router();

router.get("/ticket-details", async (req, res) => {
  try {
    const driverId = (req.query.driverId || "").trim();

    if (!driverId) {
      return res.status(400).json({ error: "driverId is required" });
    }

    const sql = `
      SELECT *
      FROM iceberg.sandbox.ticketsdriver
      WHERE driverId = '${driverId}'
    `;

    const rows = await executeQuery(sql);

    res.json({ data: rows });

  } catch (error) {
    console.error("ticket-details error:", error.message);
    res.status(500).json({
      error: "Failed to fetch ticket details",
      details: error.message
    });
  }
});

module.exports = router;