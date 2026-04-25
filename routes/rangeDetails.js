const express = require("express");
const { executeQuery } = require("../db/databricks");

const router = express.Router();

router.get("/range-details", async (req, res) => {
  try {
    const deviceId = (req.query.deviceId || "").trim();
    const days = parseInt(req.query.days || "7");

    if (!deviceId) {
      return res.status(400).json({ error: "deviceId is required" });
    }

    const sql = `
  SELECT
    date,
    deviceId,
    start_ts,
    end_ts,
    timeDriven_min,
    kmDriven * 1.1 as kmDriven ,
    socCohort
  FROM iceberg.silver.baas_daily_range_log
  WHERE deviceId = '${deviceId}'
    AND kmDriven > 0
    AND date >= date_add('day', -${days}, current_date)
  ORDER BY date DESC
`;

    const rows = await executeQuery(sql);

    res.json({ data: rows });

  } catch (error) {
    console.error("range-details error:", error.message);

    res.status(500).json({
      error: "Failed to fetch range details",
      details: error.message
    });
  }
});

module.exports = router;