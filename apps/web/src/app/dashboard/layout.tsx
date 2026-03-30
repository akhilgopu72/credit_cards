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
      <Box px={5} pt={6} pb={2}>
        <Link href="/dashboard" style={{ textDecoration: "none" }}>
          <HStack gap={3}>
            <Box
              w={8}
              h={8}
              bg="success.300"
              borderRadius="md"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontWeight="800" fontSize="sm" color="bg.page">
                C
              </Text>
            </Box>
            <VStack gap={0} align="start">
              <Heading size="sm" color="white" fontWeight="700" letterSpacing="-0.02em">
                CardMax
              </Heading>
              <Text fontSize="2xs" color="fg.subtle" letterSpacing="0.05em" textTransform="uppercase">
                Premium Rewards
              </Text>
            </VStack>
          </HStack>
        </Link>
      </Box>

      {/* Navigation — Substrate Shift: active item brightens, others dim */}
      <VStack gap={0.5} px={3} flex={1} align="stretch" mt={4}>
        {navItems.map((item) => {
          const active = isActive(item.href);
          return (
            <Link key={item.href} href={item.href} style={{ textDecoration: "none" }}>
              <Box
                onClick={() => setSidebarOpen(false)}
                px={3}
                py={2.5}
                borderRadius="card"
                bg={active ? "bg.active" : "transparent"}
                opacity={active ? 1 : 0.6}
                _hover={{ bg: "bg.active", opacity: 1 }}
                transition="all 0.15s"
                cursor="pointer"
                position="relative"
              >
                {/* Green active indicator bar */}
                {active && (
                  <Box
                    position="absolute"
                    left={0}
                    top="50%"
                    transform="translateY(-50%)"
                    w="3px"
                    h="60%"
                    bg="success.300"
                    borderRadius="full"
                  />
                )}
                <HStack gap={3}>
                  <Text fontSize="sm" color={active ? "success.300" : "fg.muted"}>
                    {item.icon}
                  </Text>
                  <Text
                    fontSize="sm"
                    fontWeight={active ? "600" : "400"}
                    color={active ? "white" : "fg.muted"}
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
      <VStack px={4} py={4} gap={3} align="stretch">
        <Box
          px={3}
          py={2.5}
          borderRadius="card"
          opacity={0.6}
          _hover={{ opacity: 1, bg: "bg.active" }}
          transition="all 0.15s"
          cursor="pointer"
        >
          <HStack gap={3}>
            <Text fontSize="sm" color="fg.muted">?</Text>
            <Text fontSize="sm" color="fg.muted">Support</Text>
          </HStack>
        </Box>
        <HStack gap={3} px={3}>
          <ClerkUserButton />
          <Text fontSize="xs" color="fg.subtle">
            Account
          </Text>
        </HStack>
      </VStack>
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
                bg="success.300"
                borderRadius="md"
                display="flex"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontWeight="800" fontSize="xs" color="bg.page">
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
