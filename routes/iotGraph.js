const express = require("express");
const { executeQuery } = require("../db/databricks");

const router = express.Router();

router.get("/iot-graph", async (req, res) => {
  try {
    const deviceId = (req.query.deviceId || "").trim();
    const startTime = (req.query.startTime || "").trim();
    const endTime = (req.query.endTime || "").trim();

    if (!deviceId) {
      return res.status(400).json({ error: "deviceId is required" });
    }

    if (!startTime || !endTime) {
      return res.status(400).json({ error: "startTime and endTime are required" });
    }

    const sql = `
      SELECT
        deviceId,
        ts-INTERVAL 5 HOURS - INTERVAL 30 MINUTES as ts,
        from_unixtime(pushedAt / 1000) + INTERVAL 5 HOURS + INTERVAL 30 MINUTES AS pushedAt,
        voltage,
        current,
        temperature,
        soc,
        lat,
        lon,
        alarmencoded,
        celltemp,
        cellvolt,
        chargefetstatus,
        dischargefetstatus
      FROM iceberg.bronze.iot
      WHERE 
        year BETWEEN LEAST(year(timestamp('${startTime}')), year(timestamp('${endTime}')))
                 AND GREATEST(year(timestamp('${startTime}')), year(timestamp('${endTime}')))
        AND month BETWEEN LEAST(month(timestamp('${startTime}')), month(timestamp('${endTime}')))
                  AND GREATEST(month(timestamp('${startTime}')), month(timestamp('${endTime}')))
        AND day <= GREATEST(day(timestamp('${startTime}')), day(timestamp('${endTime}')))
        AND deviceId = '${deviceId}'
        AND ts  >= timestamp('${startTime}')
        AND ts  <= timestamp('${endTime}')
        AND voltage > 0
      ORDER BY ts
    `;

    const rows = await executeQuery(sql);

    res.json({ data: rows });
  } catch (error) {
    console.error("iot-graph error:", error.message);
    res.status(500).json({
      error: "Failed to fetch IoT graph data",
      details: error.message
    });
  }
});

module.exports = router;