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
  SimpleGrid,
} from "@chakra-ui/react";
import Link from "next/link";
import { useDashboard } from "@/generated/api-client";
import { ISSUER_PALETTE } from "@/types/api";

// ─── Mock data for widgets not yet backed by API ────────────────
const MOCK_TRANSACTIONS = [
  { merchant: "Blue Hill", category: "Dining", categoryColor: "success.300", time: "2h ago", amount: "-$142.50", points: "+570 pts", icon: "🍽️" },
  { merchant: "Delta Air Lines", category: "Travel", categoryColor: "brand.400", time: "Yesterday", amount: "-$890.00", points: "+4,450 pts", icon: "✈️" },
  { merchant: "Apple Store", category: "Shopping", categoryColor: "#a78bfa", time: "Oct 24", amount: "-$1,299.00", points: "+1,299 pts", icon: "🛍️" },
  { merchant: "La Colombe", category: "Dining", categoryColor: "success.300", time: "Oct 23", amount: "-$6.50", points: "+26 pts", icon: "☕" },
  { merchant: "Whole Foods", category: "Groceries", categoryColor: "#a78bfa", time: "Oct 22", amount: "-$84.20", points: "+168 pts", icon: "🛒" },
];

const REWARD_VELOCITY = [40, 55, 35, 70, 90, 85, 95]; // % heights
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export default function DashboardPage() {
  const { data: stats, loading } = useDashboard();

  const fmt = (val: number) => `$${val.toLocaleString()}`;

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
            borderTopColor="brand.400"
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
  const netValue = hasCards ? stats.totalCreditsAvailable - totalFees : 0;

  return (
    <VStack gap={10} align="stretch">
      {/* ─── Welcome Header ────────────────────────────────── */}
      <Box>
        <Heading
          size="3xl"
          fontWeight="800"
          letterSpacing="-0.03em"
          lineHeight="1.1"
        >
          Welcome back, Alex.
        </Heading>
        <Text color="fg.muted" mt={2}>
          {hasCards
            ? `Your rewards portfolio is worth ${fmt(netValue)} net this year.`
            : "Your rewards portfolio is ready to be optimized."}
        </Text>
      </Box>

      {/* ─── Stats Row ─────────────────────────────────────── */}
      <SimpleGrid columns={{ base: 1, sm: 2, lg: 4 }} gap={6}>
        <StatTile
          label="Cards in Wallet"
          value={stats?.cardsCount.toString() ?? "0"}
          icon="💳"
          iconColor="success.300"
          href="/dashboard/wallet"
        />
        <StatTile
          label="Annual Rewards Value"
          value={hasCards ? fmt(stats.totalCreditsAvailable) : "--"}
          icon="💰"
          iconColor="brand.400"
        />
        <StatTile
          label="Active Offers"
          value={stats?.activeOffersCount.toString() ?? "0"}
          icon="🏷️"
          iconColor="success.300"
          href="/dashboard/offers"
        />
        <StatTile
          label="Upcoming Fees"
          value={hasCards ? fmt(totalFees) : "--"}
          icon="📅"
          iconColor="danger.300"
        />
      </SimpleGrid>

      {/* ─── Bento Grid: Best Card + Transactions ──────────── */}
      <Box
        display="grid"
        gridTemplateColumns={{ base: "1fr", lg: "2fr 1fr" }}
        gap={8}
      >
        {/* Left: Best Card Right Now */}
        <VStack gap={8} align="stretch">
          <BestCardWidget hasCards={hasCards} stats={stats} />
          <RewardVelocityChart />
        </VStack>

        {/* Right: Transactions + Points Balance */}
        <TransactionsPanel />
      </Box>
    </VStack>
  );
}

// ─── Stats Tile ──────────────────────────────────────────────────

function StatTile({
  label,
  value,
  icon,
  iconColor,
  href,
}: {
  label: string;
  value: string;
  icon: string;
  iconColor: string;
  href?: string;
}) {
  const content = (
    <Box
      bg="bg.surface"
      p={6}
      borderRadius="card"
      _hover={{ bg: "bg.subtle" }}
      transition="all 0.3s"
      cursor={href ? "pointer" : undefined}
    >
      <Flex justify="space-between" align="start" mb={4}>
        <Text
          fontSize="xs"
          fontWeight="700"
          color="fg.muted"
          textTransform="uppercase"
          letterSpacing="0.08em"
        >
          {label}
        </Text>
        <Text fontSize="lg" opacity={0.2} _groupHover={{ opacity: 1 }}>
          {icon}
        </Text>
      </Flex>
      <Text
        fontSize="4xl"
        fontWeight="900"
        letterSpacing="-0.03em"
        lineHeight="1"
      >
        {value}
      </Text>
    </Box>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: "none" }}>
        {content}
      </Link>
    );
  }
  return content;
}

// ─── Best Card Widget ────────────────────────────────────────────

function BestCardWidget({ hasCards, stats }: { hasCards: boolean; stats: any }) {
  const topCard = hasCards ? stats?.cardSummaries?.[0] : null;

  return (
    <Box
      bg="bg.surface"
      borderRadius="card"
      borderWidth="1px"
      borderColor="border.default"
      overflow="hidden"
      position="relative"
    >
      {/* Subtle gradient overlay */}
      <Box
        position="absolute"
        inset={0}
        bgGradient="to-br"
        gradientFrom="rgba(63,255,139,0.03)"
        gradientTo="transparent"
        pointerEvents="none"
      />

      <Box p={8} position="relative" zIndex={1}>
        <Flex justify="space-between" align="center" mb={8}>
          <Box>
            <Heading size="lg" fontWeight="700" letterSpacing="-0.02em" mb={1}>
              Best Card Right Now
            </Heading>
            <Text fontSize="sm" color="fg.muted">
              Based on your spending profile
            </Text>
          </Box>
          <Box
            px={3}
            py={1}
            bg="rgba(63,255,139,0.1)"
            borderWidth="1px"
            borderColor="rgba(63,255,139,0.2)"
            borderRadius="badge"
          >
            <Text
              fontSize="2xs"
              fontWeight="900"
              color="success.300"
              textTransform="uppercase"
              letterSpacing="0.15em"
            >
              Optimized
            </Text>
          </Box>
        </Flex>

        <Flex direction={{ base: "column", md: "row" }} gap={8} align="center">
          {/* Card Visual */}
          <Box
            w="full"
            maxW="320px"
            aspectRatio={1.58}
            borderRadius="xl"
            overflow="hidden"
            position="relative"
            shadow="0 25px 50px -12px rgba(0,0,0,0.8)"
            ring="1px"
            ringColor="whiteAlpha.100"
          >
            <Box
              position="absolute"
              inset={0}
              bgGradient="to-br"
              gradientFrom="#1a1a1a"
              gradientVia="#0e0e0e"
              gradientTo="#262626"
            />
            <Box position="absolute" top={6} left={6}>
              <Text fontSize="sm" fontWeight="700" opacity={0.6} letterSpacing="-0.02em">
                {topCard?.cardName ?? "Sapphire Reserve"}
              </Text>
              <Box
                h={10}
                w={14}
                bgGradient="to-br"
                gradientFrom="rgba(234,179,8,0.2)"
                gradientTo="rgba(234,179,8,0.4)"
                borderRadius="md"
                mt={2}
                borderWidth="1px"
                borderColor="rgba(234,179,8,0.1)"
              />
            </Box>
            <Box position="absolute" bottom={6} left={6}>
              <Text fontFamily="mono" fontSize="lg" letterSpacing="0.2em">
                •••• 8829
              </Text>
            </Box>
            <Box position="absolute" bottom={6} right={6}>
              <Text fontSize="xl" fontWeight="900" color="success.300" letterSpacing="-0.03em">
                4X
              </Text>
            </Box>
          </Box>

          {/* Reward Details */}
          <VStack flex={1} gap={5} align="stretch" w="full">
            <Box
              bg="bg.subtle"
              p={5}
              borderRadius="card"
              borderWidth="1px"
              borderColor="border.default"
            >
              <HStack gap={4}>
                <Flex
                  h={12}
                  w={12}
                  borderRadius="card"
                  bg="bg.muted"
                  align="center"
                  justify="center"
                >
                  <Text fontSize="2xl">🍽️</Text>
                </Flex>
                <Box>
                  <Text fontWeight="700">4.0x Points</Text>
                  <Text fontSize="xs" color="fg.muted">
                    Category: Dining &amp; Bars
                  </Text>
                </Box>
              </HStack>
            </Box>
            <Text fontSize="sm" color="fg.muted" lineHeight="1.6">
              Using your{" "}
              <Text as="span" color="fg.default" fontWeight="500">
                {topCard?.cardName ?? "Sapphire Reserve"}
              </Text>{" "}
              here will net you{" "}
              <Text as="span" color="success.300">
                420 points
              </Text>{" "}
              on a typical $105 dinner bill. No other card in your wallet exceeds
              2.5x for this merchant.
            </Text>
            <Link href="/dashboard/merchants" style={{ textDecoration: "none", width: "100%" }}>
              <Box
                as="button"
                w="full"
                py={3}
                bg="#f9f9f9"
                color="#0e0e0e"
                borderRadius="badge"
                fontWeight="700"
                fontSize="sm"
                _hover={{ bg: "#ebebeb" }}
                transition="all 0.2s"
              >
                Look Up a Merchant
              </Box>
            </Link>
          </VStack>
        </Flex>
      </Box>
    </Box>
  );
}

// ─── Reward Velocity Chart ───────────────────────────────────────

function RewardVelocityChart() {
  return (
    <Box bg="bg.surface" p={8} borderRadius="card">
      <Flex justify="space-between" align="center" mb={8}>
        <Heading size="md" fontWeight="700" letterSpacing="-0.02em">
          Reward Velocity
        </Heading>
        <HStack gap={2}>
          <Box h={2} w={2} borderRadius="full" bg="success.300" />
          <Box h={2} w={2} borderRadius="full" bg="brand.400" />
        </HStack>
      </Flex>
      {/* Bar Chart */}
      <Flex h="192px" align="flex-end" gap={2} px={2}>
        {REWARD_VELOCITY.map((h, i) => (
          <Box
            key={i}
            flex={1}
            bg="rgba(63,255,139,0.1)"
            borderTopRadius="sm"
            h={`${h}%`}
            _hover={{ bg: "rgba(63,255,139,0.3)" }}
            transition="all 0.2s"
            cursor="pointer"
          />
        ))}
      </Flex>
      <Flex justify="space-between" mt={4}>
        {DAYS.map((d) => (
          <Text
            key={d}
            fontSize="2xs"
            fontWeight="700"
            color="fg.muted"
            textTransform="uppercase"
            letterSpacing="0.15em"
          >
            {d}
          </Text>
        ))}
      </Flex>
    </Box>
  );
}

// ─── Transactions Panel ──────────────────────────────────────────

function TransactionsPanel() {
  return (
    <Box bg="bg.surface" p={6} borderRadius="card" display="flex" flexDirection="column">
      <Flex justify="space-between" align="center" mb={8}>
        <Heading size="md" fontWeight="700" letterSpacing="-0.02em">
          Transactions
        </Heading>
        <Link href="/dashboard/offers">
          <Text
            fontSize="xs"
            fontWeight="700"
            color="success.300"
            textTransform="uppercase"
            letterSpacing="0.15em"
            _hover={{ textDecoration: "underline" }}
            cursor="pointer"
          >
            View All
          </Text>
        </Link>
      </Flex>

      <VStack gap={1} align="stretch">
        {MOCK_TRANSACTIONS.map((txn, i) => (
          <Flex
            key={i}
            align="center"
            justify="space-between"
            p={4}
            borderRadius="card"
            borderLeftWidth="2px"
            borderLeftColor="transparent"
            _hover={{ bg: "bg.subtle", borderLeftColor: txn.categoryColor }}
            transition="all 0.2s"
            cursor="pointer"
          >
            <HStack gap={4}>
              <Flex
                h={10}
                w={10}
                bg="bg.muted"
                borderRadius="card"
                align="center"
                justify="center"
              >
                <Text fontSize="lg">{txn.icon}</Text>
              </Flex>
              <Box>
                <Text fontSize="sm" fontWeight="700">
                  {txn.merchant}
                </Text>
                <HStack gap={2}>
                  <Box
                    px={2}
                    py={0.5}
                    borderRadius="badge"
                    bg={`color-mix(in srgb, ${txn.categoryColor === "success.300" ? "#3fff8b" : txn.categoryColor === "brand.400" ? "#6e9bff" : "#a78bfa"} 15%, transparent)`}
                  >
                    <Text
                      fontSize="2xs"
                      fontWeight="700"
                      color={txn.categoryColor}
                    >
                      {txn.category}
                    </Text>
                  </Box>
                  <Text fontSize="2xs" color="fg.muted">
                    {txn.time}
                  </Text>
                </HStack>
              </Box>
            </HStack>
            <Box textAlign="right">
              <Text fontSize="sm" fontWeight="700">
                {txn.amount}
              </Text>
              <Text fontSize="2xs" fontWeight="500" color={txn.categoryColor}>
                {txn.points}
              </Text>
            </Box>
          </Flex>
        ))}
      </VStack>

      {/* Points Balance */}
      <Box mt="auto" pt={8}>
        <Box
          bg="#1a1919"
          borderRadius="card"
          p={5}
          borderWidth="1px"
          borderColor="rgba(255,255,255,0.08)"
          textAlign="center"
        >
          <Text
            fontSize="2xs"
            fontWeight="900"
            textTransform="uppercase"
            letterSpacing="0.2em"
            color="#adaaaa"
            mb={2}
          >
            Current Points Balance
          </Text>
          <Text
            fontSize="3xl"
            fontWeight="900"
            letterSpacing="-0.03em"
            color="#ffffff"
          >
            842,901
          </Text>
          <Text
            fontSize="xs"
            color="success.300"
            fontWeight="500"
            mt={3}
            cursor="pointer"
            _hover={{ textDecoration: "underline" }}
          >
            Transfer to Partners
          </Text>
        </Box>
      </Box>
    </Box>
  );
}
