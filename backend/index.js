const express = require("express")
const app = express();
const authRoute = require("./routes/authRoute");
const adminRoute = require("./routes/adminRoute");

const chatRoute = require("./routes/chatRoute");
const fileRoute = require("./routes/fileRoute");
const fileRouteV2 = require("./routes/fileRouteV2");
const profileRoute = require("./routes/profileRoute");
// require("./helper/connectionDB");
const llmRoute = require("./routes/llmRoute");
const notificationRoute = require("./routes/notficationRoute");
const schdeduleRoute = require("./routes/scheduleRoute");

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/api/v1/auth', authRoute);
app.use('/api/v1/admin', adminRoute);
app.use('/api/v1/chat', chatRoute);
app.use('/api/v1/file', fileRoute);
app.use('/api/v2/file', fileRouteV2);
app.use('/api/v1/profile', profileRoute);
app.use('/api/v1/llm', llmRoute);
app.use('/api/v1/notification', notificationRoute);
app.use('/api/v1/schedule', schdeduleRoute);
module.exports = app;

