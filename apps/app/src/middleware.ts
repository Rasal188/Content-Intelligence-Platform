import {
  convexAuthNextjsMiddleware,
  createRouteMatcher,
  isAuthenticatedNextjs,
  nextjsMiddlewareRedirect,
} from "@convex-dev/auth/nextjs/server";
import { createI18nMiddleware } from "next-international/middleware";
import { NextResponse } from "next/server";

const I18nMiddleware = createI18nMiddleware({
  locales: ["en", "fr", "es"],
  defaultLocale: "en",
  urlMappingStrategy: "rewrite",
});

const isSignInPage = createRouteMatcher(["/login"]);

export default convexAuthNextjsMiddleware(async (request, { convexAuth }) => {
  // Bypass i18n rewrites for all API routes
  if (request.nextUrl.pathname.startsWith("/api/")) {
    return NextResponse.next();
  }

  /*
  -----------------------------------
  TEMPORARY DEVELOPMENT BYPASS
  Remove after Convex deployment is configured.
  -----------------------------------
  */
  if (process.env.DEV_BYPASS_AUTH === "true") {
    return I18nMiddleware(request);
  }

  const isAuthenticated = await convexAuth.isAuthenticated();
  const isSignIn = isSignInPage(request);
  if (isSignIn && isAuthenticated) {
    console.log("redirecting to /", {
      isSignIn,
      isAuthenticated,
    });
    return nextjsMiddlewareRedirect(request, "/");
  }
  if (!isSignIn && !isAuthenticated) {
    console.log("redirecting to /login", {
      isSignIn,
      isAuthenticated,
    });
    return nextjsMiddlewareRedirect(request, "/login");
  }
  console.log("no redirect", {
    isSignIn,
    isAuthenticated,
  });

  return I18nMiddleware(request);
});

export const config = {
  matcher: [
    "/((?!_next/static|api|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",

    // all routes except static assets
    "/((?!.*\\..*|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
