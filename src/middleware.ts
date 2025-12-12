import { authMiddleware } from "@clerk/nextjs";

export default authMiddleware({
  publicRoutes: ["/", "/pricing", "/manifest.json"],
  ignoredRoutes: ["/api/webhooks/stripe"],
});

export const config = {
  matcher: ["/((?!_next|.*\\..*).*)"],
};

