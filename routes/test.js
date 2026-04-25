const express = require("express");
const { executeQuery } = require("../db/databricks");

const router = express.Router();

router.get("/db-test", async (req, res) => {
  try {
    const rows = await executeQuery(" show tables from  iceberg.sandbox  ");
    res.json({ ok: true, data: rows });
  } catch (error) {
    console.error("db-test error:", error.message);
    res.status(500).json({ ok: false, error: error.message });
  }
});

module.exports = router;