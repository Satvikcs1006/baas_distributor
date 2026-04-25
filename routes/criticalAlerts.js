const express = require("express");
const { executeQuery } = require("../db/databricks");

const router = express.Router();

router.get("/critical-alerts", async (req, res) => {
  try {
    const serialNo = (req.query.serialNo || "").trim();

    if (!serialNo) {
      return res.status(400).json({ error: "serialNo is required" });
    }

    const sql = `
  SELECT 
    CASE 
      WHEN CAST(isAlertTriggered AS VARCHAR) = 'false' THEN 'No Alert'
      ELSE 'Alert Battery'
    END AS criticalAlert
  FROM iceberg.bronze.batteries
  WHERE deletedAt IS NULL
    AND serialNo = '${serialNo}'
`;

    const rows = await executeQuery(sql);

    res.json({
      data: rows[0] || null
    });
  } catch (error) {
    console.error("critical-alerts error:", error.message);
    res.status(500).json({
      error: "Failed to fetch critical alerts",
      details: error.message
    });
  }
});

module.exports = router;