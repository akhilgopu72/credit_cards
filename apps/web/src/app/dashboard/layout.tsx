"use client";

import {
  Box,
  Flex,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
} from "@chakra-ui/react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { ClerkUserButton } from "@/components/layout/clerk-user-button";

const navItems = [
  { label: "Dashboard", href: "/dashboard", icon: "\u25A0" },
  { label: "My Cards", href: "/dashboard/wallet", icon: "\u2660" },
  { label: "Offers", href: "/dashboard/offers", icon: "\u2605" },
  { label: "Merchants", href: "/dashboard/merchants", icon: "\u2302" },
  { label: "Scenarios", href: "/dashboard/scenarios", icon: "\u2261" },
  { label: "Recommend", href: "/dashboard/recommendations", icon: "\u2727" },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard";
    return pathname.startsWith(href);
  };

  const sidebarContent = (
    <Flex direction="column" h="full">
      {/* Logo */}
      <Box px={5} pt={6} pb={4}>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <HStack gap={2}>
            <Box
              w={8}
              h={8}
              bg="accent.500"
              borderRadius="lg"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontWeight="900" fontSize="sm" color="white">
                C
              </Text>
            </Box>
            <Heading size="md" color="white" fontWeight="700" letterSpacing="-0.02em">
              CardMax
            </Heading>
          </HStack>
        </Link>
      </Box>

      {/* Navigation */}
      <VStack gap={1} px={3} flex={1} align="stretch" mt={2}>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <Box
                onClick={() => setSidebarOpen(false)}
                px={3}
                py={2.5}
                borderRadius="md"
                bg={active ? "whiteAlpha.200" : "transparent"}
                _hover={{ bg: active ? "whiteAlpha.200" : "whiteAlpha.100" }}
                transition="all 0.15s"
                cursor="pointer"
              >
                <HStack gap={3}>
                  <Text fontSize="sm" color={active ? "accent.400" : "whiteAlpha.700"}>
                    {item.icon}
                  </Text>
                  <Text
                    fontSize="sm"
                    fontWeight={active ? "600" : "400"}
                    color={active ? "white" : "whiteAlpha.800"}
                  >
                    {item.label}
                  </Text>
                </HStack>
              </Box>
            </Link>
          );
        })}
      </VStack>

      {/* User section */}
      <Box
        px={4}
        py={4}
        borderTopWidth="1px"
        borderTopColor="whiteAlpha.200"
      >
        <HStack gap={3}>
          <ClerkUserButton />
          <Text fontSize="xs" color="whiteAlpha.700">
            Account
          </Text>
        </HStack>
      </Box>
    </Flex>
  );

  return (
    <Flex minH="100vh">
      {/* Desktop Sidebar */}
      <Box
        display={{ base: "none", lg: "flex" }}
        w="240px"
        bg="bg.sidebar"
        position="fixed"
        top={0}
        left={0}
        h="100vh"
        flexDirection="column"
        shadow="sidebar"
        zIndex={20}
      >
        {sidebarContent}
      </Box>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <Box
          display={{ base: "block", lg: "none" }}
          position="fixed"
          inset={0}
          bg="blackAlpha.600"
          zIndex={29}
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <Box
        display={{ base: "flex", lg: "none" }}
        w="260px"
        bg="bg.sidebar"
        position="fixed"
        top={0}
        left={0}
        h="100vh"
        flexDirection="column"
        zIndex={30}
        transform={sidebarOpen ? "translateX(0)" : "translateX(-100%)"}
        transition="transform 0.2s ease-in-out"
      >
        {sidebarContent}
      </Box>

      {/* Main Content Area */}
      <Box
        flex={1}
        ml={{ base: 0, lg: "240px" }}
        bg="bg.page"
        minH="100vh"
      >
        {/* Mobile Top Bar */}
        <Box
          display={{ base: "flex", lg: "none" }}
          bg="bg.surface"
          borderBottomWidth="1px"
          borderColor="border.default"
          px={4}
          h={14}
          alignItems="center"
          justifyContent="space-between"
          position="sticky"
          top={0}
          zIndex={10}
        >
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle navigation"
            p={1}
          >
            <Text fontSize="lg">{sidebarOpen ? "\u2715" : "\u2630"}</Text>
          </Button>
          <Link href="/dashboard" style={{ textDecoration: "none" }}>
            <HStack gap={2}>
              <Box
                w={6}
                h={6}
                bg="accent.500"
                borderRadius="md"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontWeight="900" fontSize="xs" color="white">
                  C
                </Text>
              </Box>
              <Heading size="sm" fontWeight="700">
                CardMax
              </Heading>
            </HStack>
          </Link>
          <ClerkUserButton />
        </Box>

        {/* Page Content */}
        <Box px={{ base: 4, md: 8 }} py={{ base: 6, md: 8 }} maxW="1200px" mx="auto">
          {children}
        </Box>
      </Box>
    </Flex>
  );
}
