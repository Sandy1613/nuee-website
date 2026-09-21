import { Router } from "express";
import { getAppMode, isDemoMode, DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from "../mode";

export const systemRouter = Router();

// Public, unauthenticated: lets the frontend show a demo-mode banner and
// (only in demo mode) the fixed demo admin credentials. There is nothing
// sensitive to protect here — demo mode by definition has no real data or
// production credentials behind it.
systemRouter.get("/mode", (_req, res) => {
  if (isDemoMode()) {
    res.json({
      mode: "demo",
      demoAdmin: { email: DEMO_ADMIN_EMAIL, password: DEMO_ADMIN_PASSWORD },
    });
  } else {
    res.json({ mode: getAppMode() });
  }
});
