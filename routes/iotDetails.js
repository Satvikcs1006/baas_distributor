const express = require("express");
const { executeQuery } = require("../db/databricks");

const router = express.Router();

router.get("/iot-status", async (req, res) => {
  try {
    const deviceId = (req.query.deviceId || "").trim();

    if (!deviceId) {
      return res.status(400).json({ error: "deviceId is required" });
    }

    const sql = `
  SELECT dischargeFetStatus
  FROM iceberg.silver.iot_events_latest
  WHERE deviceId = '${deviceId}'
    AND ts >= current_timestamp - INTERVAL '2' HOUR
  ORDER BY ts DESC
  LIMIT 1
`;

    const rows = await executeQuery(sql);

    res.json({
      data: rows[0] || null
    });

  } catch (error) {
    console.error("iot-status error:", error.message);

    res.status(500).json({
      error: "Failed to fetch IoT status",
      details: error.message
    });
  }
});

module.exports = router;