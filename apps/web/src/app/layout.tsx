import type { Metadata } from "next";
import { Providers } from "./providers";

const hasClerkKeys =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder");

export const metadata: Metadata = {
  title: "CardMax - Maximize Your Credit Card Rewards",
  description:
    "Optimize your credit card spend, track offers, and never miss a statement credit.",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const content = (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
      </body>
    </html>
  );

  if (hasClerkKeys) {
    const { ClerkProvider } = await import("@clerk/nextjs");
    return <ClerkProvider>{content}</ClerkProvider>;
  }

  return content;
}
