"use client";

import dynamic from "next/dynamic";
import { Box, Text } from "@chakra-ui/react";

const hasClerkKeys =
  process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY.includes("placeholder");

const UserButtonInner = hasClerkKeys
  ? dynamic(() => import("@clerk/nextjs").then((mod) => mod.UserButton), {
      ssr: false,
    })
  : null;

export function ClerkUserButton() {
  if (UserButtonInner) {
    return <UserButtonInner afterSignOutUrl="/" />;
  }

  return (
    <Box
      bg="gray.200"
      borderRadius="full"
      w={8}
      h={8}
      display="flex"
      alignItems="center"
      justifyContent="center"
    >
      <Text fontSize="xs" fontWeight="bold" color="gray.600">
        U
      </Text>
    </Box>
  );
}
