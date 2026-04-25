const express = require("express");
const { executeQuery } = require("../db/databricks");

const router = express.Router();

router.get("/mosfet-history", async (req, res) => {
  try {
    const serialNo = (req.query.serialNo || "").trim();

    if (!serialNo) {
      return res.status(400).json({ error: "serialNo is required" });
    }

    const sql = `
  SELECT 
    CASE 
      WHEN command LIKE '%ON%' THEN 'ON' 
      ELSE 'OFF' 
    END AS status_type,
    initiatedBy AS doneBy,
    createdAt AS done_at
  FROM iceberg.bronze.battery_immob_remob_requests
  WHERE serialNo = '${serialNo}'
    AND LOWER(status) LIKE '%success%'
  ORDER BY id DESC
  LIMIT 10
`;

    const rows = await executeQuery(sql);

    res.json({ data: rows });
  } catch (error) {
    console.error("mosfet-history error:", error.message);
    res.status(500).json({
      error: "Failed to fetch MOSFET history",
      details: error.message,
    });
  }
});

module.exports = router;