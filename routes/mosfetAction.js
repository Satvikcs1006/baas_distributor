const express = require("express");
const axios = require("axios");

const router = express.Router();

router.post("/mosfet-on", async (req, res) => {
  try {
    const { serialNo } = req.body;

    if (!serialNo) {
      return res.status(400).json({ error: "serialNo is required" });
    }

    const payload = {
      serialNo: serialNo,
      command: "CHGDISCHGON",
      username: "BAAS-Distributor",
      accessToken: "abc"
    };

    const headers = {
      "Content-Type": "application/json",
      accessToken: process.env.ACCESS_TOKEN
    };

    const response = await axios.post(
      "https://api.upgrid.in/api/batteryImmobilize/createLimeRequest",
      payload,
      { headers }
    );

    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error("MOSFET ON error:", error.message);

    res.status(500).json({
      error: "Failed to trigger MOSFET ON",
      details: error.response?.data || error.message
    });
  }
});

router.post("/mosfet-off", async (req, res) => {
  try {
    const { serialNo } = req.body;

    if (!serialNo) {
      return res.status(400).json({ error: "serialNo is required" });
    }

    const payload = {
      serialNo: serialNo,
      command: "DISCHGOFF",   // ✅ change here
      username: "BAAS-Distributor",
      accessToken: process.env.ACCESS_TOKEN
    };

    const headers = {
      "Content-Type": "application/json",
      "accessToken": "abc"
    };

    const response = await axios.post(
      "https://api.upgrid.in/api/batteryImmobilize/createLimeRequest",
      payload,
      { headers }
    );

    res.json({
      success: true,
      data: response.data
    });

  } catch (error) {
    console.error("MOSFET OFF error:", error.message);

    res.status(500).json({
      error: "Failed to trigger MOSFET OFF",
      details: error.response?.data || error.message
    });
  }
});


module.exports = router;

