import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const hasClerkKeys =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder");

let clerkMiddlewareHandler: any = null;

if (hasClerkKeys) {
  // Dynamically import Clerk only when real keys are present
  const { clerkMiddleware, createRouteMatcher } = await import(
    "@clerk/nextjs/server"
  );
  const isProtectedRoute = createRouteMatcher([
    "/dashboard(.*)",
    "/cards(.*)",
    "/merchants(.*)",
    "/scenarios(.*)",
    "/api/user(.*)",
  ]);

  clerkMiddlewareHandler = clerkMiddleware(async (auth, req) => {
    if (isProtectedRoute(req)) {
      await auth.protect();
    }
  });
}

export default function middleware(req: NextRequest) {
  if (clerkMiddlewareHandler) {
    return clerkMiddlewareHandler(req);
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)",
    "/(api|trpc)(.*)",
  ],
};
