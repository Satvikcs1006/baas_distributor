const express = require("express");
const { executeQuery } = require("../db/databricks");

const router = express.Router();

router.get("/suggestions", async (req, res) => {
  try {
    const driverId = (req.query.driverId || "").trim();

    if (!driverId) {
      return res.status(400).json({ error: "driverId is required" });
    }

    const sql = `
      SELECT 
        suggestions
      FROM iceberg.sandbox.dashboardsuggestions
      WHERE driverId = '${driverId}'
    `;

    const rows = await executeQuery(sql);

    res.json({ data: rows });
  } catch (error) {
    console.error("suggestions error:", error.message);
    res.status(500).json({
      error: "Failed to fetch summary",
      details: error.message
    });
  }
});

module.exports = router;