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
  // Protect API routes from unauthenticated direct invocation
  const isAuthenticated = await convexAuth.isAuthenticated();
  if (request.nextUrl.pathname.startsWith("/api/")) {
    if (!isAuthenticated) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    return NextResponse.next();
  }
  const isSignIn = isSignInPage(request);
  if (isSignIn && isAuthenticated) {
    console.log("redirecting to /ai-content-analyzer", {
      isSignIn,
      isAuthenticated,
    });
    return nextjsMiddlewareRedirect(request, "/ai-content-analyzer");
  }
  if (!isSignIn && !isAuthenticated) {
    console.log("redirecting to /login", {
      isSignIn,
      isAuthenticated,
    });
    return nextjsMiddlewareRedirect(request, "/login");
  }
  if (isAuthenticated && request.nextUrl.pathname === "/") {
    return nextjsMiddlewareRedirect(request, "/ai-content-analyzer");
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
