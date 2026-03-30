"use client";

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Flex,
  Card,
  Separator,
  Button,
  Table,
} from "@chakra-ui/react";
import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import type { CardProduct } from "@/types/api";
import { ISSUER_LABELS } from "@/types/api";

// ─── Constants ────────────────────────────────────────────────────

const ISSUER_BG: Record<string, string> = {
  chase: "linear-gradient(135deg, #003087 0%, #0052cc 100%)",
  amex: "linear-gradient(135deg, #006fcf 0%, #00a3e0 100%)",
  capital_one: "linear-gradient(135deg, #d03027 0%, #e85d5d 100%)",
  citi: "linear-gradient(135deg, #003b70 0%, #0066b2 100%)",
};

const NETWORK_LABEL: Record<string, string> = {
  visa: "VISA",
  mastercard: "Mastercard",
  amex: "American Express",
  discover: "Discover",
};

const BENEFIT_TYPE_LABELS: Record<string, string> = {
  statement_credit: "Statement Credits",
  travel_credit: "Travel Credits",
  lounge_access: "Lounge Access",
  insurance: "Insurance",
  perk: "Perks",
  dining_credit: "Dining Credits",
  entertainment_credit: "Entertainment Credits",
  hotel_credit: "Hotel Credits",
  airline_credit: "Airline Credits",
  uber_credit: "Uber Credits",
  streaming_credit: "Streaming Credits",
  wellness_credit: "Wellness Credits",
  shopping_credit: "Shopping Credits",
};

const BENEFIT_TYPE_PALETTE: Record<string, string> = {
  statement_credit: "green",
  travel_credit: "blue",
  lounge_access: "purple",
  insurance: "orange",
  perk: "cyan",
  dining_credit: "red",
  entertainment_credit: "pink",
  hotel_credit: "teal",
  airline_credit: "blue",
  uber_credit: "gray",
  streaming_credit: "purple",
  wellness_credit: "green",
  shopping_credit: "orange",
};

const FREQUENCY_LABELS: Record<string, string> = {
  monthly: "Monthly",
  quarterly: "Quarterly",
  semi_annual: "Semi-Annual",
  annual: "Annual",
  one_time: "One-Time",
};

const CAP_PERIOD_LABELS: Record<string, string> = {
  monthly: "month",
  quarterly: "quarter",
  annually: "year",
  calendar_year: "calendar year",
  none: "",
};

// ─── Helpers ──────────────────────────────────────────────────────

const formatCurrency = (val: string | number) =>
  `$${Number(val).toLocaleString()}`;

const formatPoints = (val: number) => val.toLocaleString();

// ─── Component ────────────────────────────────────────────────────

export default function CardDetailPage() {
  const params = useParams<{ slug: string }>();
  const router = useRouter();
  const slug = params.slug;

  const [card, setCard] = useState<CardProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offersCount, setOffersCount] = useState<number>(0);

  const fetchCard = useCallback(async () => {
    if (!slug) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/cards/${slug}`);
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else if (json.data) {
        setCard(json.data);
      }
    } catch (err) {
      console.error("Failed to fetch card:", err);
      setError("Failed to load card details. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [slug]);

  const fetchOffersCount = useCallback(async () => {
    if (!slug) return;
    try {
      const res = await fetch(`/api/offers?cardSlug=${slug}&countOnly=true`);
      if (res.ok) {
        const json = await res.json();
        if (json.data?.count !== undefined) {
          setOffersCount(json.data.count);
        } else if (json.meta?.total !== undefined) {
          setOffersCount(json.meta.total);
        }
      }
    } catch {
      // Offers count is non-critical, silently ignore
    }
  }, [slug]);

  useEffect(() => {
    fetchCard();
    fetchOffersCount();
  }, [fetchCard, fetchOffersCount]);

  // ─── Loading State ──────────────────────────────────────────────

  if (loading) {
    return (
      <VStack gap={8} align="stretch">
        <Box>
          <Link href="/dashboard/wallet" style={{ textDecoration: "none" }}>
            <Button variant="ghost" size="sm" color="fg.muted" mb={4}>
              &larr; Back to Wallet
            </Button>
          </Link>
        </Box>
        <Box textAlign="center" py={16}>
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
              Loading card details...
            </Text>
          </VStack>
        </Box>
      </VStack>
    );
  }

  // ─── Error State ────────────────────────────────────────────────

  if (error || !card) {
    return (
      <VStack gap={8} align="stretch">
        <Box>
          <Link href="/dashboard/wallet" style={{ textDecoration: "none" }}>
            <Button variant="ghost" size="sm" color="fg.muted" mb={4}>
              &larr; Back to Wallet
            </Button>
          </Link>
        </Box>
        <Card.Root bg="bg.surface" borderRadius="card" shadow="card">
          <Card.Body p={12} textAlign="center">
            <VStack gap={4}>
              <Flex
                w={16}
                h={16}
                bg="danger.subtle"
                borderRadius="xl"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="2xl" color="danger.fg">
                  !
                </Text>
              </Flex>
              <Heading size="md" fontWeight="600">
                Card Not Found
              </Heading>
              <Text color="fg.muted" maxW="360px">
                {error ?? "The card you are looking for does not exist or has been removed."}
              </Text>
              <Button
                bg="brand.800"
                color="white"
                _hover={{ bg: "brand.700" }}
                size="sm"
                onClick={() => router.push("/dashboard/wallet")}
              >
                Go to Wallet
              </Button>
            </VStack>
          </Card.Body>
        </Card.Root>
      </VStack>
    );
  }

  // ─── Data Extraction ────────────────────────────────────────────

  const version = card.versions[0];
  const signUpBonus = version?.signUpBonus ?? null;
  const baseEarnRate = version?.baseEarnRate;
  const categoryBonuses = version?.categoryBonuses ?? [];
  const benefits = version?.benefits ?? [];
  const issuerBg =
    ISSUER_BG[card.issuer] ??
    "linear-gradient(135deg, #495057 0%, #868e96 100%)";
  const issuerLabel = ISSUER_LABELS[card.issuer] ?? card.issuer.replace("_", " ");
  const networkLabel = NETWORK_LABEL[card.network] ?? card.network;

  // Sort category bonuses by highest multiplier first
  const sortedBonuses = [...categoryBonuses].sort(
    (a, b) => Number(b.multiplier) - Number(a.multiplier)
  );

  // Group benefits by type
  const benefitsByType = benefits.reduce<
    Record<string, typeof benefits>
  >((acc, benefit) => {
    const type = benefit.benefitType ?? "perk";
    if (!acc[type]) acc[type] = [];
    acc[type].push(benefit);
    return acc;
  }, {});

  // ─── Render ─────────────────────────────────────────────────────

  return (
    <VStack gap={6} align="stretch">
      {/* Back Navigation */}
      <Box>
        <Link href="/dashboard/wallet" style={{ textDecoration: "none" }}>
          <Button variant="ghost" size="sm" color="fg.muted">
            &larr; Back to Wallet
          </Button>
        </Link>
      </Box>

      {/* Card Header */}
      <Card.Root bg="bg.surface" borderRadius="card" shadow="card" overflow="hidden">
        <Box bg={issuerBg} px={{ base: 5, md: 8 }} py={{ base: 5, md: 6 }} position="relative">
          <Flex
            justifyContent="space-between"
            alignItems={{ base: "start", md: "center" }}
            direction={{ base: "column", md: "row" }}
            gap={4}
          >
            <Box>
              <Text
                color="whiteAlpha.800"
                fontSize="xs"
                fontWeight="500"
                textTransform="uppercase"
                letterSpacing="0.05em"
              >
                {issuerLabel}
              </Text>
              <Heading
                color="white"
                fontWeight="700"
                size={{ base: "xl", md: "2xl" }}
                mt={1}
                letterSpacing="-0.02em"
              >
                {card.name}
              </Heading>
              <HStack gap={3} mt={3} flexWrap="wrap">
                <Badge
                  bg="whiteAlpha.200"
                  color="white"
                  size="sm"
                  px={2}
                  py={0.5}
                >
                  {networkLabel}
                </Badge>
                <Text color="whiteAlpha.900" fontSize="sm" fontWeight="600">
                  {formatCurrency(card.annualFee)}/yr
                </Text>
              </HStack>
            </Box>
            {card.imageUrl && (
              <Box
                w={{ base: "full", md: "180px" }}
                maxW="180px"
                h="110px"
                borderRadius="lg"
                overflow="hidden"
                shadow="lg"
                flexShrink={0}
                bg="whiteAlpha.200"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  style={{
                    width: "100%",
                    height: "100%",
                    objectFit: "cover",
                  }}
                />
              </Box>
            )}
          </Flex>
        </Box>
      </Card.Root>

      {/* Quick Stats Row */}
      <Box
        display="grid"
        gridTemplateColumns={{
          base: "1fr",
          sm: "repeat(2, 1fr)",
          md: `repeat(${signUpBonus ? 4 : 3}, 1fr)`,
        }}
        gap={4}
      >
        {/* Base Earn Rate */}
        {baseEarnRate && (
          <Card.Root bg="bg.surface" borderRadius="card" shadow="card" overflow="hidden">
            <Box h="3px" bg="brand.600" />
            <Card.Body px={5} py={4}>
              <Text fontSize="xs" fontWeight="600" color="fg.muted" textTransform="uppercase" letterSpacing="0.04em">
                Base Earn Rate
              </Text>
              <HStack mt={2} gap={1} alignItems="baseline">
                <Text fontSize="2xl" fontWeight="700" color="brand.fg">
                  {baseEarnRate.points_per_dollar}x
                </Text>
                <Text fontSize="sm" color="fg.muted">
                  {baseEarnRate.currency}
                </Text>
              </HStack>
              <Text fontSize="xs" color="fg.subtle" mt={1}>
                per dollar on all purchases
              </Text>
            </Card.Body>
          </Card.Root>
        )}

        {/* Annual Fee */}
        <Card.Root bg="bg.surface" borderRadius="card" shadow="card" overflow="hidden">
          <Box h="3px" bg="accent.500" />
          <Card.Body px={5} py={4}>
            <Text fontSize="xs" fontWeight="600" color="fg.muted" textTransform="uppercase" letterSpacing="0.04em">
              Annual Fee
            </Text>
            <Text fontSize="2xl" fontWeight="700" color="fg.default" mt={2}>
              {formatCurrency(card.annualFee)}
            </Text>
            <Text fontSize="xs" color="fg.subtle" mt={1}>
              per year
            </Text>
          </Card.Body>
        </Card.Root>

        {/* Category Bonuses Count */}
        <Card.Root bg="bg.surface" borderRadius="card" shadow="card" overflow="hidden">
          <Box h="3px" bg="brand.400" />
          <Card.Body px={5} py={4}>
            <Text fontSize="xs" fontWeight="600" color="fg.muted" textTransform="uppercase" letterSpacing="0.04em">
              Bonus Categories
            </Text>
            <Text fontSize="2xl" fontWeight="700" color="fg.default" mt={2}>
              {categoryBonuses.length}
            </Text>
            <Text fontSize="xs" color="fg.subtle" mt={1}>
              {categoryBonuses.length === 1 ? "category" : "categories"} with bonus earn
            </Text>
          </Card.Body>
        </Card.Root>

        {/* Active Offers */}
        {offersCount > 0 && (
          <Card.Root bg="bg.surface" borderRadius="card" shadow="card" overflow="hidden">
            <Box h="3px" bg="success.300" />
            <Card.Body px={5} py={4}>
              <Text fontSize="xs" fontWeight="600" color="fg.muted" textTransform="uppercase" letterSpacing="0.04em">
                Active Offers
              </Text>
              <Text fontSize="2xl" fontWeight="700" color="success.fg" mt={2}>
                {offersCount}
              </Text>
              <Text fontSize="xs" color="fg.subtle" mt={1}>
                {offersCount === 1 ? "offer" : "offers"} available
              </Text>
            </Card.Body>
          </Card.Root>
        )}
      </Box>

      {/* Sign-Up Bonus Section */}
      {signUpBonus && (
        <Card.Root bg="bg.surface" borderRadius="card" shadow="card" overflow="hidden">
          <Box h="3px" bg="accent.500" />
          <Card.Body p={{ base: 5, md: 6 }}>
            <Heading size="md" fontWeight="600" mb={4}>
              Sign-Up Bonus
            </Heading>
            <Box
              bg="accent.subtle"
              borderRadius="lg"
              px={{ base: 4, md: 6 }}
              py={5}
              borderWidth="1px"
              borderColor="accent.muted"
            >
              <Flex
                direction={{ base: "column", sm: "row" }}
                gap={{ base: 4, sm: 8 }}
                alignItems={{ base: "start", sm: "center" }}
              >
                <Box>
                  <Text fontSize="xs" fontWeight="600" color="fg.muted" textTransform="uppercase" letterSpacing="0.04em">
                    Earn
                  </Text>
                  <HStack gap={2} mt={1} alignItems="baseline">
                    <Text fontSize="3xl" fontWeight="700" color="accent.fg">
                      {formatPoints(signUpBonus.points)}
                    </Text>
                    <Text fontSize="sm" fontWeight="500" color="fg.muted">
                      {signUpBonus.currency}
                    </Text>
                  </HStack>
                </Box>
                <Separator
                  orientation="vertical"
                  h={12}
                  borderColor="accent.muted"
                  display={{ base: "none", sm: "block" }}
                />
                <Separator
                  borderColor="accent.muted"
                  display={{ base: "block", sm: "none" }}
                />
                <Box>
                  <Text fontSize="xs" fontWeight="600" color="fg.muted" textTransform="uppercase" letterSpacing="0.04em">
                    After Spending
                  </Text>
                  <Text fontSize="xl" fontWeight="600" color="fg.default" mt={1}>
                    {formatCurrency(signUpBonus.spend_requirement)}
                  </Text>
                </Box>
                <Separator
                  orientation="vertical"
                  h={12}
                  borderColor="accent.muted"
                  display={{ base: "none", sm: "block" }}
                />
                <Separator
                  borderColor="accent.muted"
                  display={{ base: "block", sm: "none" }}
                />
                <Box>
                  <Text fontSize="xs" fontWeight="600" color="fg.muted" textTransform="uppercase" letterSpacing="0.04em">
                    Within
                  </Text>
                  <Text fontSize="xl" fontWeight="600" color="fg.default" mt={1}>
                    {signUpBonus.timeframe_months}{" "}
                    {signUpBonus.timeframe_months === 1 ? "month" : "months"}
                  </Text>
                </Box>
              </Flex>
            </Box>
          </Card.Body>
        </Card.Root>
      )}

      {/* Category Bonuses Table */}
      {sortedBonuses.length > 0 && (
        <Card.Root bg="bg.surface" borderRadius="card" shadow="card" overflow="hidden">
          <Box h="3px" bg="brand.400" />
          <Card.Body p={{ base: 5, md: 6 }}>
            <Heading size="md" fontWeight="600" mb={4}>
              Category Bonuses
            </Heading>
            <Box overflowX="auto">
              <Table.Root size="sm" variant="outline">
                <Table.Header>
                  <Table.Row bg="bg.subtle">
                    <Table.ColumnHeader
                      fontWeight="600"
                      fontSize="xs"
                      textTransform="uppercase"
                      letterSpacing="0.04em"
                      color="fg.muted"
                      py={3}
                    >
                      Category
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      fontWeight="600"
                      fontSize="xs"
                      textTransform="uppercase"
                      letterSpacing="0.04em"
                      color="fg.muted"
                      py={3}
                      textAlign="center"
                    >
                      Multiplier
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      fontWeight="600"
                      fontSize="xs"
                      textTransform="uppercase"
                      letterSpacing="0.04em"
                      color="fg.muted"
                      py={3}
                      textAlign="right"
                    >
                      Cap
                    </Table.ColumnHeader>
                    <Table.ColumnHeader
                      fontWeight="600"
                      fontSize="xs"
                      textTransform="uppercase"
                      letterSpacing="0.04em"
                      color="fg.muted"
                      py={3}
                      textAlign="right"
                    >
                      Period
                    </Table.ColumnHeader>
                  </Table.Row>
                </Table.Header>
                <Table.Body>
                  {sortedBonuses.map((cb) => (
                    <Table.Row key={cb.id} _hover={{ bg: "bg.subtle" }} transition="all 0.1s">
                      <Table.Cell py={3}>
                        <Text fontSize="sm" fontWeight="500" textTransform="capitalize">
                          {cb.category.replace(/_/g, " ")}
                        </Text>
                      </Table.Cell>
                      <Table.Cell py={3} textAlign="center">
                        <Badge
                          colorPalette={
                            Number(cb.multiplier) >= 5
                              ? "green"
                              : Number(cb.multiplier) >= 3
                              ? "blue"
                              : "gray"
                          }
                          size="sm"
                          fontWeight="700"
                        >
                          {cb.multiplier}x
                        </Badge>
                      </Table.Cell>
                      <Table.Cell py={3} textAlign="right">
                        <Text fontSize="sm" color={cb.capAmount ? "fg.default" : "fg.subtle"}>
                          {cb.capAmount ? formatCurrency(cb.capAmount) : "No cap"}
                        </Text>
                      </Table.Cell>
                      <Table.Cell py={3} textAlign="right">
                        <Text fontSize="sm" color="fg.muted">
                          {cb.capPeriod && cb.capPeriod !== "none"
                            ? `per ${CAP_PERIOD_LABELS[cb.capPeriod] ?? cb.capPeriod}`
                            : "\u2014"}
                        </Text>
                      </Table.Cell>
                    </Table.Row>
                  ))}
                </Table.Body>
              </Table.Root>
            </Box>
          </Card.Body>
        </Card.Root>
      )}

      {/* Benefits Section */}
      {benefits.length > 0 && (
        <Card.Root bg="bg.surface" borderRadius="card" shadow="card" overflow="hidden">
          <Box h="3px" bg="success.300" />
          <Card.Body p={{ base: 5, md: 6 }}>
            <Heading size="md" fontWeight="600" mb={4}>
              Benefits &amp; Credits
            </Heading>
            <VStack gap={5} align="stretch">
              {Object.entries(benefitsByType).map(([type, items]) => (
                <Box key={type}>
                  <HStack gap={2} mb={3}>
                    <Badge
                      colorPalette={BENEFIT_TYPE_PALETTE[type] ?? "gray"}
                      size="sm"
                      fontWeight="600"
                    >
                      {BENEFIT_TYPE_LABELS[type] ?? type.replace(/_/g, " ")}
                    </Badge>
                    <Text fontSize="xs" color="fg.subtle">
                      {items.length} {items.length === 1 ? "benefit" : "benefits"}
                    </Text>
                  </HStack>
                  <VStack gap={2} align="stretch">
                    {items.map((benefit) => (
                      <Flex
                        key={benefit.id}
                        px={4}
                        py={3}
                        borderWidth="1px"
                        borderColor="border.default"
                        borderRadius="md"
                        alignItems="start"
                        justifyContent="space-between"
                        _hover={{ bg: "bg.subtle" }}
                        transition="all 0.15s"
                        gap={4}
                        direction={{ base: "column", sm: "row" }}
                      >
                        <Box flex={1}>
                          <HStack gap={2} flexWrap="wrap">
                            <Text fontWeight="600" fontSize="sm">
                              {benefit.name}
                            </Text>
                            {"autoTrigger" in benefit &&
                              (benefit as Record<string, unknown>).autoTrigger === true && (
                                <Badge colorPalette="green" size="sm" variant="subtle">
                                  Auto
                                </Badge>
                              )}
                          </HStack>
                          <Text fontSize="xs" color="fg.muted" mt={1}>
                            {benefit.description}
                          </Text>
                        </Box>
                        <HStack gap={3} flexShrink={0} alignItems="center">
                          {Number(benefit.value) > 0 && (
                            <Text fontWeight="700" fontSize="sm" color="success.fg">
                              {formatCurrency(benefit.value)}
                            </Text>
                          )}
                          <Badge variant="outline" size="sm" color="fg.muted">
                            {FREQUENCY_LABELS[benefit.frequency] ?? benefit.frequency}
                          </Badge>
                        </HStack>
                      </Flex>
                    ))}
                  </VStack>
                  {type !==
                    Object.keys(benefitsByType)[
                      Object.keys(benefitsByType).length - 1
                    ] && <Separator mt={4} borderColor="border.muted" />}
                </Box>
              ))}
            </VStack>
          </Card.Body>
        </Card.Root>
      )}

      {/* No Benefits / No Bonuses Empty State */}
      {benefits.length === 0 && sortedBonuses.length === 0 && !signUpBonus && (
        <Card.Root bg="bg.surface" borderRadius="card" shadow="card">
          <Card.Body p={8} textAlign="center">
            <VStack gap={3}>
              <Text fontSize="lg" color="fg.muted">
                No detailed information available for this card version yet.
              </Text>
            </VStack>
          </Card.Body>
        </Card.Root>
      )}
    </VStack>
  );
}
