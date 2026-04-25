const express = require("express");
const { executeQuery } = require("../db/databricks");

const router = express.Router();

router.get("/csat", async (req, res) => {
  try {
    const driverId = (req.query.driverId || "").trim();

    if (!driverId) {
      return res.status(400).json({ error: "driverId is required" });
    }

    const sql = `
      SELECT rating
      FROM iceberg.sandbox.csatdriver
      WHERE driverId = '${driverId}'
      LIMIT 1
    `;

    const rows = await executeQuery(sql);

    res.json({
      data: rows[0] || null
    });

  } catch (error) {
    console.error("csat error:", error.message);
    res.status(500).json({
      error: "Failed to fetch CSAT",
      details: error.message
    });
  }
});

module.exports = router;