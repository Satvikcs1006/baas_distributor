const express = require("express");
const { executeQuery } = require("../db/databricks");

const router = express.Router();

router.get("/driver-details", async (req, res) => {
  try {
    const driverId = (req.query.driverId || "").trim();

    if (!driverId) {
      return res.status(400).json({ error: "driverId is required" });
    }

    if (!/^[a-zA-Z0-9_-]+$/.test(driverId)) {
      return res.status(400).json({ error: "Invalid driverId format" });
    }

    const sql = `
      select 
        b.occupant as driverId,
        b.id as batteryId, 
        b.iotDeviceNo as deviceID, 
        b.serialNo
      from iceberg.bronze.batteries b 
      where b.occupant = '${driverId}' and deletedAt is null
    `;

    const rows = await executeQuery(sql);

    res.json({
      data: rows || null
    });
  } catch (error) {
    console.error("driver-details error:", error.message);
    res.status(500).json({
      error: "Failed to fetch driver details",
      details: error.message
    });
  }
});

module.exports = router;