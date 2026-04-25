const express = require("express");
const { executeQuery } = require("../db/databricks");

const router = express.Router();

let currentDriverData = null;
let allChargingRows = [];

router.get("/charging-details", async (req, res) => {
  try {
    const deviceId = (req.query.deviceId || "").trim();
    const days = parseInt(req.query.days || "7", 10);

    if (!deviceId) {
      return res.status(400).json({ error: "deviceId is required" });
    }

    if (Number.isNaN(days) || days <= 0 || days > 90) {
      return res.status(400).json({ error: "Invalid days value" });
    }

    const sql = `
  SELECT
    deviceId,
    state,
    startTs - interval '330' minute as startTs,
    endTs - interval '330' minute as endTs,
    startSoc,
    endSoc
  FROM iceberg.silver.charging_discharging_events
  WHERE deviceId = '${deviceId}'
    AND state IN ('charging', 'discharging')
    AND DATE(startTs) >= date_add('day', -${days}, current_date)
  ORDER BY startTs DESC
`;

    const rows = await executeQuery(sql);

    res.json({ data: rows });
  } catch (error) {
    console.error("charging-details error:", error.message);
    res.status(500).json({
      error: "Failed to fetch charging details",
      details: error.message,
    });
  }
});

module.exports = router;