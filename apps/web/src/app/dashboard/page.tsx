"use client";

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Flex,
  Separator,
  Button,
  Card,
} from "@chakra-ui/react";
import Link from "next/link";
import { useDashboard } from "@/generated/api-client";
import { ISSUER_COLORS, ISSUER_PALETTE } from "@/types/api";

export default function DashboardPage() {
  const { data: stats, loading } = useDashboard();

  const fmt = (val: number) => `$${val.toLocaleString()}`;
  const fmtPts = (val: number) => val.toLocaleString();

  if (loading) {
    return (
      <Box textAlign="center" py={20}>
        <VStack gap={3}>
          <Box
            w={10}
            h={10}
            borderRadius="full"
            border="3px solid"
            borderColor="brand.200"
            borderTopColor="brand.600"
            animation="spin 0.8s linear infinite"
          />
          <Text color="fg.muted" fontSize="sm">
            Loading your dashboard...
          </Text>
        </VStack>
      </Box>
    );
  }

  const hasCards = stats && stats.cardsCount > 0;
  const totalFees = stats?.upcomingFees.reduce((s, f) => s + Number(f.annualFee), 0) ?? 0;

  return (
    <VStack gap={8} align="stretch">
      {/* Welcome Header */}
      <Box>
        <Heading size="2xl" fontWeight="700" letterSpacing="-0.02em" color="fg.default">
          Welcome back
        </Heading>
        <Text color="fg.muted" mt={1} fontSize="md">
          Your credit card optimization overview
        </Text>
      </Box>

      {/* Stats Grid */}
      <Box
        display="grid"
        gridTemplateColumns={{ base: "1fr", sm: "repeat(2, 1fr)", lg: "repeat(4, 1fr)" }}
        gap={4}
      >
        <StatCard
          label="Cards in Wallet"
          value={stats?.cardsCount.toString() ?? "0"}
          description={
            hasCards
              ? `${fmt(totalFees)} in annual fees`
              : "Add your cards to get started"
          }
          accentColor="brand.600"
          icon={"\u2660"}
          href="/dashboard/wallet"
        />
        <StatCard
          label="Annual Credits"
          value={hasCards ? fmt(stats.totalCreditsAvailable) : "--"}
          description={
            hasCards
              ? `${fmt(stats.totalCreditsUsed)} used so far`
              : "Track your statement credits"
          }
          accentColor="success.600"
          icon={"\u2713"}
        />
        <StatCard
          label="Active Offers"
          value={stats?.activeOffersCount.toString() ?? "0"}
          description={
            stats?.activeOffersCount
              ? "Across all your cards"
              : "Install extension to sync"
          }
          accentColor="accent.500"
          icon={"\u2605"}
          href="/dashboard/offers"
        />
        <StatCard
          label="Net Card Value"
          value={
            hasCards
              ? fmt(stats.totalCreditsAvailable - totalFees)
              : "--"
          }
          description={
            hasCards
              ? "Credits minus annual fees"
              : "Run a scenario to estimate"
          }
          accentColor={(hasCards && (stats.totalCreditsAvailable - totalFees) >= 0) ? "success.600" : "danger.600"}
          icon={"\u2248"}
          href="/dashboard/scenarios"
        />
      </Box>

      {/* Get Started or Card Summaries */}
      {!hasCards ? (
        <Box>
          <Heading size="lg" fontWeight="600" mb={5}>
            Get Started
          </Heading>
          <Box
            display="grid"
            gridTemplateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
            gap={4}
          >
            <ActionCard
              step="1"
              title="Add Your Cards"
              description="Build your wallet to see personalized optimization recommendations."
              href="/dashboard/wallet"
              accentColor="brand.400"
            />
            <ActionCard
              step="2"
              title="Browse Merchants"
              description="Look up any merchant to see which card earns the most."
              href="/dashboard/merchants"
              accentColor="success.300"
            />
            <ActionCard
              step="3"
              title="Model Your Spend"
              description="See how different card strategies impact your rewards."
              href="/dashboard/scenarios"
              accentColor="success.300"
            />
          </Box>
        </Box>
      ) : (
        <>
          {/* Card Summaries */}
          <Box>
            <Flex justifyContent="space-between" alignItems="center" mb={5}>
              <Heading size="lg" fontWeight="600">
                Your Cards
              </Heading>
              <Link href="/dashboard/wallet">
                <Button variant="ghost" size="sm" color="brand.400">
                  Manage wallet →
                </Button>
              </Link>
            </Flex>
            <Box
              display="grid"
              gridTemplateColumns={{ base: "1fr", md: "repeat(2, 1fr)", lg: "repeat(3, 1fr)" }}
              gap={4}
            >
              {stats.cardSummaries.map((card) => {
                const issuerColor = ISSUER_COLORS[card.issuer] ?? "#868e96";
                const netValue = card.totalCreditsValue - Number(card.annualFee);
                return (
                  <Card.Root
                    key={card.userCardId}
                    bg="bg.surface"
                    borderRadius="card"
                    shadow="card"
                    overflow="hidden"
                    _hover={{ shadow: "cardHover" }}
                    transition="all 0.2s"
                  >
                    {/* Issuer color bar */}
                    <Box h="3px" bg={issuerColor} />
                    <Card.Body p={5}>
                      <Flex justifyContent="space-between" alignItems="start" mb={3}>
                        <Box>
                          <Text fontWeight="600" fontSize="sm" color="fg.default">
                            {card.cardName}
                          </Text>
                          <Badge
                            colorPalette={ISSUER_PALETTE[card.issuer] ?? "gray"}
                            size="sm"
                            mt={1}
                          >
                            {card.issuer.replace("_", " ")}
                          </Badge>
                        </Box>
                        <Text fontSize="xs" color="fg.muted" fontWeight="500">
                          {fmt(Number(card.annualFee))}/yr
                        </Text>
                      </Flex>

                      <Flex gap={4} mb={2}>
                        <Box>
                          <Text fontSize="xs" color="fg.muted">
                            Credits
                          </Text>
                          <Text fontSize="sm" fontWeight="600" color="success.fg">
                            {fmt(card.totalCreditsValue)}
                          </Text>
                        </Box>
                        <Box>
                          <Text fontSize="xs" color="fg.muted">
                            Net Value
                          </Text>
                          <Text
                            fontSize="sm"
                            fontWeight="600"
                            color={netValue >= 0 ? "success.fg" : "danger.fg"}
                          >
                            {netValue >= 0 ? "+" : ""}{fmt(netValue)}
                          </Text>
                        </Box>
                      </Flex>

                      {card.signUpBonus && (
                        <Box
                          mt={2}
                          px={3}
                          py={2}
                          bg="accent.subtle"
                          borderRadius="md"
                          borderWidth="1px"
                          borderColor="accent.muted"
                        >
                          <Text fontSize="xs" fontWeight="600" color="accent.fg">
                            Sign-Up Bonus: {fmtPts(card.signUpBonus.points)}{" "}
                            {card.signUpBonus.currency}
                          </Text>
                          <Text fontSize="xs" color="fg.muted">
                            After {fmt(card.signUpBonus.spend_requirement)} in{" "}
                            {card.signUpBonus.timeframe_months}mo
                          </Text>
                        </Box>
                      )}
                    </Card.Body>
                  </Card.Root>
                );
              })}
            </Box>
          </Box>

          {/* Annual Fees Summary */}
          {stats.upcomingFees.length > 0 && (
            <Card.Root bg="bg.surface" borderRadius="card" shadow="card">
              <Card.Header px={6} pt={5} pb={0}>
                <Heading size="md" fontWeight="600">
                  Annual Fees
                </Heading>
              </Card.Header>
              <Card.Body px={6} py={4}>
                <VStack gap={3} align="stretch">
                  {stats.upcomingFees.map((fee, i) => (
                    <Flex
                      key={i}
                      justifyContent="space-between"
                      alignItems="center"
                      py={1}
                    >
                      <Text fontSize="sm" color="fg.default">
                        {fee.cardName}
                      </Text>
                      <HStack gap={4}>
                        {fee.feeDate && (
                          <Text fontSize="sm" color="fg.muted">
                            {new Date(fee.feeDate).toLocaleDateString()}
                          </Text>
                        )}
                        <Text fontSize="sm" fontWeight="600" color="danger.fg">
                          {fmt(Number(fee.annualFee))}
                        </Text>
                      </HStack>
                    </Flex>
                  ))}
                  <Separator />
                  <Flex justifyContent="space-between" alignItems="center">
                    <Text fontSize="sm" fontWeight="600">
                      Total Annual Fees
                    </Text>
                    <Text fontSize="sm" fontWeight="700" color="danger.fg">
                      {fmt(totalFees)}
                    </Text>
                  </Flex>
                </VStack>
              </Card.Body>
            </Card.Root>
          )}

          {/* Quick Actions */}
          <Box>
            <Heading size="lg" fontWeight="600" mb={5}>
              Quick Actions
            </Heading>
            <Box
              display="grid"
              gridTemplateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
              gap={4}
            >
              <QuickActionCard
                title="Look Up a Merchant"
                description="See which card earns the most at any store."
                href="/dashboard/merchants"
                icon={"\u2302"}
              />
              <QuickActionCard
                title="Run a Scenario"
                description="Model your monthly spend and optimize card allocation."
                href="/dashboard/scenarios"
                icon={"\u2261"}
              />
              <QuickActionCard
                title="Sync Offers"
                description="Visit your card issuer portal with our extension installed."
                href="/dashboard/offers"
                icon={"\u2605"}
              />
            </Box>
          </Box>
        </>
      )}
    </VStack>
  );
}

function StatCard({
  label,
  value,
  description,
  accentColor,
  icon,
  href,
}: {
  label: string;
  value: string;
  description: string;
  accentColor: string;
  icon: string;
  href?: string;
}) {
  const content = (
    <Card.Root
      bg="bg.surface"
      borderRadius="card"
      shadow="card"
      _hover={href ? { shadow: "cardHover", transform: "translateY(-1px)" } : undefined}
      transition="all 0.2s"
      cursor={href ? "pointer" : undefined}
      overflow="hidden"
    >
      <Card.Body p={5}>
        <Flex justifyContent="space-between" alignItems="start" mb={3}>
          <Text fontSize="sm" fontWeight="500" color="fg.muted">
            {label}
          </Text>
          <Flex
            w={8}
            h={8}
            bg={accentColor}
            borderRadius="md"
            alignItems="center"
            justifyContent="center"
            opacity={0.15}
          >
            <Text fontSize="md" color="fg.default">
              {icon}
            </Text>
          </Flex>
        </Flex>
        <Text fontSize="3xl" fontWeight="700" letterSpacing="-0.02em" color="fg.default" lineHeight="1">
          {value}
        </Text>
        <Text fontSize="xs" color="fg.muted" mt={2}>
          {description}
        </Text>
      </Card.Body>
    </Card.Root>
  );

  if (href) {
    return <Link href={href} style={{ textDecoration: "none" }}>{content}</Link>;
  }
  return content;
}

function ActionCard({
  step,
  title,
  description,
  href,
  accentColor,
}: {
  step: string;
  title: string;
  description: string;
  href: string;
  accentColor: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <Card.Root
        bg="bg.surface"
        borderRadius="card"
        shadow="card"
        _hover={{ shadow: "cardHover", transform: "translateY(-1px)" }}
        transition="all 0.2s"
        h="full"
        overflow="hidden"
      >
        <Box h="3px" bg={accentColor} />
        <Card.Body p={6}>
          <Flex
            w={7}
            h={7}
            bg={accentColor}
            borderRadius="full"
            alignItems="center"
            justifyContent="center"
            mb={3}
          >
            <Text fontSize="xs" fontWeight="700" color="white">
              {step}
            </Text>
          </Flex>
          <Heading size="sm" fontWeight="600" mb={2}>
            {title}
          </Heading>
          <Text fontSize="sm" color="fg.muted" lineHeight="1.5">
            {description}
          </Text>
        </Card.Body>
      </Card.Root>
    </Link>
  );
}

function QuickActionCard({
  title,
  description,
  href,
  icon,
}: {
  title: string;
  description: string;
  href: string;
  icon: string;
}) {
  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      <Card.Root
        bg="bg.surface"
        borderRadius="card"
        shadow="card"
        borderWidth="1px"
        borderColor="border.default"
        _hover={{ shadow: "cardHover", borderColor: "brand.400" }}
        transition="all 0.2s"
        h="full"
      >
        <Card.Body p={5}>
          <HStack gap={3} mb={2}>
            <Flex
              w={8}
              h={8}
              bg="brand.subtle"
              borderRadius="md"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontSize="md" color="brand.fg">
                {icon}
              </Text>
            </Flex>
            <Heading size="sm" fontWeight="600">
              {title}
            </Heading>
          </HStack>
          <Text fontSize="sm" color="fg.muted" lineHeight="1.5">
            {description}
          </Text>
        </Card.Body>
      </Card.Root>
    </Link>
  );
}
