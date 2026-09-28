import { Router } from "express";
import { getAppMode, isDemoMode, DEMO_ADMIN_EMAIL, DEMO_ADMIN_PASSWORD } from "../mode";
import { isImageUploadConfigured } from "../uploads";

export const systemRouter = Router();

// Public, unauthenticated: lets the frontend show a demo-mode banner and
// (only in demo mode) the fixed demo admin credentials. There is nothing
// sensitive to protect here — demo mode by definition has no real data or
// production credentials behind it. imageUploadsConfigured is just a
// boolean flag so the admin UI can explain what's missing instead of
// failing uploads with a confusing error.
systemRouter.get("/mode", (_req, res) => {
  const imageUploadsConfigured = isImageUploadConfigured();
  if (isDemoMode()) {
    res.json({
      mode: "demo",
      demoAdmin: { email: DEMO_ADMIN_EMAIL, password: DEMO_ADMIN_PASSWORD },
      imageUploadsConfigured,
    });
  } else {
    res.json({ mode: getAppMode(), imageUploadsConfigured });
  }
});
