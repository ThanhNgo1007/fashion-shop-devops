const UserRouter = require("../routes/UserRouter");
const ProductRouter = require("../routes/ProductRouter");
const CategoryRouter = require("../routes/CategoryRouter");
const CartRouter = require("./CartRouter");
const OrderRouter = require("./OrderRoutes");
const PaymentRouter = require("./PaymentRouter");
const RoleRouter = require("../routes/RoleRouter");
const ChatRouter = require("../routes/ChatRouter");
const DashboardRouter = require("../routes/DashboardRouter");
const PolicyRouter = require("../routes/PolicyRouter");

const mongoose = require("mongoose");

const routes = (app) => {
  // Health check endpoint — used by Docker HEALTHCHECK, Kubernetes probes, and monitoring
  app.get("/health", (req, res) => {
    const mongoState = mongoose.connection.readyState;
    const mongoStatus =
      mongoState === 1
        ? "connected"
        : mongoState === 2
          ? "connecting"
          : "disconnected";

    const healthy = mongoState === 1;

    res.status(healthy ? 200 : 503).json({
      status: healthy ? "ok" : "degraded",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      mongodb: mongoStatus,
    });
  });

  app.use("/api/user", UserRouter);
  app.use("/api/product", ProductRouter);
  app.use("/api/category", CategoryRouter);
  app.use("/api/cart", CartRouter);
  app.use("/api/orders", OrderRouter);
  app.use("/api/payment", PaymentRouter);
  app.use("/api/role", RoleRouter);
  app.use("/api/chat", ChatRouter);
  app.use("/api/dashboard", DashboardRouter);
  app.use("/api/policy", PolicyRouter);
};

module.exports = routes;
