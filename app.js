const express = require("express");
const path = require("path");
require("dotenv").config();

const driverDetailsRoute = require("./routes/driverDetails");
const rangeDetailsRoute = require("./routes/rangeDetails");
const iotDetailsRoute = require("./routes/iotDetails");
const mosfetRoute = require("./routes/mosfetAction");
const chargingDetailsRoute = require("./routes/chargingDetails");
const mosfetHistoryRoute = require("./routes/mosfetHistory");
const criticalAlertsRoute = require("./routes/criticalAlerts");
const suggestionsRoute = require("./routes/suggestions");
const csatRoute = require("./routes/csat");
const ticketsRoute = require("./routes/tickets");
const iotGraphRoute = require("./routes/iotGraph");
const ticketDetailsRoute = require("./routes/ticketDetails");
const csatDetailsRoute = require("./routes/csatDetails");
const dbTestRoute = require("./routes/test");


const app = express();
app.use(express.json()); // IMPORTANT
const PORT = process.env.PORT || 3000;


app.use(express.static(path.join(__dirname, "public")));
app.use("/api", driverDetailsRoute);
app.use("/api", rangeDetailsRoute);
app.use("/api", iotDetailsRoute);
app.use("/api", mosfetRoute);
app.use("/api", chargingDetailsRoute);
app.use("/api", mosfetHistoryRoute);
app.use("/api", criticalAlertsRoute);
app.use("/api",suggestionsRoute);
app.use("/api", csatRoute);
app.use("/api", ticketsRoute);
app.use("/api", iotGraphRoute);
app.use("/api", ticketDetailsRoute);
app.use("/api", csatDetailsRoute);
app.use("/api", dbTestRoute);

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});