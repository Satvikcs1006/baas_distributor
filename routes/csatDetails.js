const express = require("express");
const { executeQuery } = require("../db/databricks");

const router = express.Router();

router.get("/csat-details", async (req, res) => {
  try {
    const driverId = (req.query.driverId || "").trim();

    if (!driverId) {
      return res.status(400).json({ error: "driverId is required" });
    }

    const sql = `
      SELECT 
        slug as ticket,
        Issue_Name,
        Resolution,
        CSAT
      FROM iceberg.sandbox.drivercsatdump
      WHERE driverId='${driverId}'
      ORDER BY slug DESC
    `;

    const rows = await executeQuery(sql);

    res.json({ data: rows });

  } catch (error) {
    console.error("csat-details error:", error.message);
    res.status(500).json({
      error: "Failed to fetch CSAT details",
      details: error.message
    });
  }
});

module.exports = router;