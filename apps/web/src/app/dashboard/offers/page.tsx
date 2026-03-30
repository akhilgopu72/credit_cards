"use client";

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Badge,
  Flex,
  Button,
  Input,
  Card,
  Separator,
  Link,
} from "@chakra-ui/react";
import { useState, useMemo } from "react";
import type { Offer } from "@/types/api";
import { useOffers } from "@/generated/api-client";
import { ISSUER_PALETTE, ISSUER_LABELS } from "@/types/api";

type SortField = "value" | "endDate" | "merchantName" | "createdAt";
type SortDir = "asc" | "desc";

const OFFER_TYPE_LABELS: Record<string, string> = {
  cashback: "Cash Back",
  points_bonus: "Bonus Points",
  discount: "Discount",
  statement_credit: "Statement Credit",
};

export default function OffersPage() {
  const { data: rawOffers, loading, refetch: fetchOffers } = useOffers();
  const offers = (rawOffers ?? []) as Offer[];
  const [searchQuery, setSearchQuery] = useState("");
  const [issuerFilter, setIssuerFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [cardFilter, setCardFilter] = useState<string>("all");
  const [sortField, setSortField] = useState<SortField>("value");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  // Derive unique issuers and cards for filters
  const issuers = useMemo(
    () => [...new Set(offers.map((o) => o.issuer))].sort(),
    [offers]
  );
  const cardNames = useMemo(
    () =>
      [
        ...new Set(
          offers.map((o) => o.cardName).filter(Boolean) as string[]
        ),
      ].sort(),
    [offers]
  );

  // Filter and sort
  const filteredOffers = useMemo(() => {
    let result = [...offers];

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (o) =>
          o.merchantName.toLowerCase().includes(q) ||
          o.title.toLowerCase().includes(q) ||
          (o.description?.toLowerCase().includes(q) ?? false)
      );
    }

    if (issuerFilter !== "all") {
      result = result.filter((o) => o.issuer === issuerFilter);
    }

    if (cardFilter !== "all") {
      result = result.filter((o) => o.cardName === cardFilter);
    }

    if (statusFilter === "added") {
      result = result.filter((o) => !o.requiresAdd);
    } else if (statusFilter === "available") {
      result = result.filter((o) => o.requiresAdd);
    }

    result.sort((a, b) => {
      let cmp = 0;
      switch (sortField) {
        case "value":
          cmp = Number(a.value) - Number(b.value);
          break;
        case "endDate":
          cmp = (a.endDate ?? "9999").localeCompare(b.endDate ?? "9999");
          break;
        case "merchantName":
          cmp = a.merchantName.localeCompare(b.merchantName);
          break;
        case "createdAt":
          cmp = a.createdAt.localeCompare(b.createdAt);
          break;
      }
      return sortDir === "desc" ? -cmp : cmp;
    });

    return result;
  }, [
    offers,
    searchQuery,
    issuerFilter,
    cardFilter,
    statusFilter,
    sortField,
    sortDir,
  ]);

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(sortDir === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDir("desc");
    }
  };

  const formatValue = (offer: Offer) => {
    if (offer.valueType === "percentage")
      return `${offer.value}%`;
    if (offer.valueType === "fixed")
      return `$${Number(offer.value).toLocaleString()}`;
    if (offer.valueType === "points_multiplier")
      return `${Number(offer.value).toLocaleString()}x pts/dollar`;
    if (offer.valueType === "points_flat")
      return `${Number(offer.value).toLocaleString()} pts`;
    return offer.value;
  };

  const formatDate = (dateStr: string | null) => {
    if (!dateStr) return null;
    try {
      return new Date(dateStr).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      });
    } catch {
      return dateStr;
    }
  };

  const isExpiringSoon = (dateStr: string | null) => {
    if (!dateStr) return false;
    try {
      const diff = new Date(dateStr).getTime() - Date.now();
      return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000;
    } catch {
      return false;
    }
  };

  const addedCount = offers.filter((o) => !o.requiresAdd).length;
  const availableCount = offers.filter((o) => o.requiresAdd).length;

  return (
    <VStack gap={8} align="stretch">
      {/* Header */}
      <Flex
        justifyContent="space-between"
        alignItems="start"
        flexWrap="wrap"
        gap={4}
      >
        <Box>
          <Heading size="3xl" fontWeight="800" letterSpacing="-0.03em">
            Your Offers
          </Heading>
          <Text color="fg.muted" mt={1}>
            All your credit card offers in one place
          </Text>
        </Box>
        <Button
          variant="outline"
          size="sm"
          borderColor="border.default"
          onClick={fetchOffers}
          loading={loading}
        >
          Refresh
        </Button>
      </Flex>

      {/* Summary Stats */}
      <Box
        display="grid"
        gridTemplateColumns={{ base: "repeat(2, 1fr)", md: "repeat(4, 1fr)" }}
        gap={4}
      >
        <Card.Root bg="bg.surface" borderRadius="card" shadow="card">
          <Card.Body p={4}>
            <Text fontSize="xs" color="fg.muted" fontWeight="500">
              Total Offers
            </Text>
            <Text fontSize="2xl" fontWeight="700" color="fg.default">
              {offers.length}
            </Text>
          </Card.Body>
        </Card.Root>
        <Card.Root bg="bg.surface" borderRadius="card" shadow="card">
          <Card.Body p={4}>
            <Text fontSize="xs" color="fg.muted" fontWeight="500">
              Added to Card
            </Text>
            <Text fontSize="2xl" fontWeight="700" color="success.fg">
              {addedCount}
            </Text>
          </Card.Body>
        </Card.Root>
        <Card.Root bg="bg.surface" borderRadius="card" shadow="card">
          <Card.Body p={4}>
            <Text fontSize="xs" color="fg.muted" fontWeight="500">
              Available
            </Text>
            <Text fontSize="2xl" fontWeight="700" color="accent.fg">
              {availableCount}
            </Text>
          </Card.Body>
        </Card.Root>
        <Card.Root bg="bg.surface" borderRadius="card" shadow="card">
          <Card.Body p={4}>
            <Text fontSize="xs" color="fg.muted" fontWeight="500">
              Issuers
            </Text>
            <Text fontSize="2xl" fontWeight="700" color="brand.fg">
              {issuers.length}
            </Text>
          </Card.Body>
        </Card.Root>
      </Box>

      {offers.length === 0 && !loading ? (
        /* Empty State */
        <Card.Root bg="bg.surface" borderRadius="card" shadow="card">
          <Card.Body p={12} textAlign="center">
            <VStack gap={5}>
              <Flex
                w={16}
                h={16}
                bg="accent.subtle"
                borderRadius="xl"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="2xl" color="accent.fg">
                  {"\u2605"}
                </Text>
              </Flex>
              <Heading size="md" fontWeight="600">
                Sync Your Offers
              </Heading>
              <Text color="fg.muted" maxW="480px" lineHeight="1.6">
                Install the CardMax Chrome extension, then visit your card
                issuer portals (amex.com, chase.com). The extension will
                automatically detect and scrape your offers -- no passwords
                shared.
              </Text>
              <Box
                bg="bg.subtle"
                borderRadius="lg"
                p={5}
                maxW="400px"
                w="full"
              >
                <VStack gap={3} align="stretch">
                  <HStack gap={3}>
                    <Flex
                      w={6}
                      h={6}
                      bg="brand.600"
                      borderRadius="full"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <Text fontSize="xs" fontWeight="700" color="white">
                        1
                      </Text>
                    </Flex>
                    <Text fontSize="sm">
                      Install the CardMax Chrome extension
                    </Text>
                  </HStack>
                  <HStack gap={3}>
                    <Flex
                      w={6}
                      h={6}
                      bg="brand.600"
                      borderRadius="full"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <Text fontSize="xs" fontWeight="700" color="white">
                        2
                      </Text>
                    </Flex>
                    <Text fontSize="sm">
                      Log in to your card issuer portal
                    </Text>
                  </HStack>
                  <HStack gap={3}>
                    <Flex
                      w={6}
                      h={6}
                      bg="brand.600"
                      borderRadius="full"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <Text fontSize="xs" fontWeight="700" color="white">
                        3
                      </Text>
                    </Flex>
                    <Text fontSize="sm">
                      Click &quot;Scrape Offers&quot; in the extension popup
                    </Text>
                  </HStack>
                  <HStack gap={3}>
                    <Flex
                      w={6}
                      h={6}
                      bg="success.600"
                      borderRadius="full"
                      alignItems="center"
                      justifyContent="center"
                      flexShrink={0}
                    >
                      <Text fontSize="xs" fontWeight="700" color="white">
                        {"\u2713"}
                      </Text>
                    </Flex>
                    <Text fontSize="sm">
                      Offers appear here automatically
                    </Text>
                  </HStack>
                </VStack>
              </Box>
            </VStack>
          </Card.Body>
        </Card.Root>
      ) : (
        <>
          {/* Filters */}
          <Card.Root bg="bg.surface" borderRadius="card" shadow="card">
            <Card.Body p={4}>
              <Flex gap={3} flexWrap="wrap" alignItems="center">
                <Input
                  placeholder="Search offers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  maxW="280px"
                  size="sm"
                  borderColor="border.default"
                  _focus={{ borderColor: "brand.400" }}
                />

                {/* Issuer filter buttons */}
                <HStack gap={1}>
                  <Button
                    size="xs"
                    variant={issuerFilter === "all" ? "solid" : "outline"}
                    bg={issuerFilter === "all" ? "brand.800" : undefined}
                    color={issuerFilter === "all" ? "white" : "fg.muted"}
                    borderColor="border.default"
                    onClick={() => setIssuerFilter("all")}
                  >
                    All
                  </Button>
                  {issuers.map((iss) => (
                    <Button
                      key={iss}
                      size="xs"
                      variant={issuerFilter === iss ? "solid" : "outline"}
                      bg={issuerFilter === iss ? "brand.800" : undefined}
                      color={issuerFilter === iss ? "white" : "fg.muted"}
                      borderColor="border.default"
                      onClick={() =>
                        setIssuerFilter(iss === issuerFilter ? "all" : iss)
                      }
                    >
                      {ISSUER_LABELS[iss] ?? iss}
                    </Button>
                  ))}
                </HStack>

                <Separator
                  orientation="vertical"
                  h={6}
                  display={{ base: "none", md: "block" }}
                />

                {/* Status filter */}
                <HStack gap={1}>
                  <Button
                    size="xs"
                    variant={statusFilter === "all" ? "solid" : "outline"}
                    bg={statusFilter === "all" ? "brand.800" : undefined}
                    color={statusFilter === "all" ? "white" : "fg.muted"}
                    borderColor="border.default"
                    onClick={() => setStatusFilter("all")}
                  >
                    All Status
                  </Button>
                  <Button
                    size="xs"
                    variant={
                      statusFilter === "added" ? "solid" : "outline"
                    }
                    bg={
                      statusFilter === "added" ? "success.600" : undefined
                    }
                    color={
                      statusFilter === "added" ? "white" : "fg.muted"
                    }
                    borderColor="border.default"
                    onClick={() =>
                      setStatusFilter(
                        statusFilter === "added" ? "all" : "added"
                      )
                    }
                  >
                    Added
                  </Button>
                  <Button
                    size="xs"
                    variant={
                      statusFilter === "available" ? "solid" : "outline"
                    }
                    bg={
                      statusFilter === "available"
                        ? "accent.500"
                        : undefined
                    }
                    color={
                      statusFilter === "available" ? "white" : "fg.muted"
                    }
                    borderColor="border.default"
                    onClick={() =>
                      setStatusFilter(
                        statusFilter === "available" ? "all" : "available"
                      )
                    }
                  >
                    Available
                  </Button>
                </HStack>

                {/* Card name filter */}
                {cardNames.length > 1 && (
                  <>
                    <Separator
                      orientation="vertical"
                      h={6}
                      display={{ base: "none", md: "block" }}
                    />
                    <HStack gap={1} flexWrap="wrap">
                      <Button
                        size="xs"
                        variant={cardFilter === "all" ? "solid" : "outline"}
                        bg={cardFilter === "all" ? "brand.800" : undefined}
                        color={
                          cardFilter === "all" ? "white" : "fg.muted"
                        }
                        borderColor="border.default"
                        onClick={() => setCardFilter("all")}
                      >
                        All Cards
                      </Button>
                      {cardNames.map((cn) => (
                        <Button
                          key={cn}
                          size="xs"
                          variant={
                            cardFilter === cn ? "solid" : "outline"
                          }
                          bg={
                            cardFilter === cn ? "brand.800" : undefined
                          }
                          color={
                            cardFilter === cn ? "white" : "fg.muted"
                          }
                          borderColor="border.default"
                          onClick={() =>
                            setCardFilter(cn === cardFilter ? "all" : cn)
                          }
                        >
                          {cn}
                        </Button>
                      ))}
                    </HStack>
                  </>
                )}
              </Flex>
            </Card.Body>
          </Card.Root>

          {/* Sort Bar */}
          <Flex justifyContent="space-between" alignItems="center">
            <Text fontSize="sm" color="fg.muted">
              {filteredOffers.length} offer
              {filteredOffers.length !== 1 ? "s" : ""}
              {filteredOffers.length !== offers.length &&
                ` of ${offers.length}`}
            </Text>
            <HStack gap={1}>
              <Text fontSize="xs" color="fg.muted" mr={1}>
                Sort by:
              </Text>
              {(
                [
                  ["value", "Value"],
                  ["endDate", "Expiry"],
                  ["merchantName", "Merchant"],
                  ["createdAt", "Newest"],
                ] as [SortField, string][]
              ).map(([field, label]) => (
                <Button
                  key={field}
                  size="xs"
                  variant={sortField === field ? "solid" : "ghost"}
                  bg={sortField === field ? "brand.800" : undefined}
                  color={sortField === field ? "white" : "fg.muted"}
                  onClick={() => toggleSort(field)}
                >
                  {label}
                  {sortField === field &&
                    (sortDir === "desc" ? " \u2193" : " \u2191")}
                </Button>
              ))}
            </HStack>
          </Flex>

          {/* Offers Grid */}
          {loading ? (
            <Box textAlign="center" py={12}>
              <Text color="fg.muted" fontSize="sm">
                Loading offers...
              </Text>
            </Box>
          ) : filteredOffers.length === 0 ? (
            <Card.Root bg="bg.surface" borderRadius="card" shadow="card">
              <Card.Body p={8} textAlign="center">
                <Text color="fg.muted">
                  No offers match your filters. Try adjusting the search or
                  filters.
                </Text>
              </Card.Body>
            </Card.Root>
          ) : (
            <Box
              display="grid"
              gridTemplateColumns={{
                base: "1fr",
                sm: "repeat(2, 1fr)",
                lg: "repeat(3, 1fr)",
              }}
              gap={4}
            >
              {filteredOffers.map((offer) => (
                <Card.Root
                  key={offer.id}
                  bg="bg.surface"
                  borderRadius="card"
                  shadow="card"
                  overflow="hidden"
                  _hover={{ shadow: "cardHover" }}
                  transition="all 0.2s"
                >
                  <Card.Body p={4}>
                    {/* Merchant & Value */}
                    <Flex
                      justifyContent="space-between"
                      alignItems="start"
                      mb={2}
                    >
                      <Box flex={1} mr={2}>
                        {(() => {
                          const domain = offer.merchantDomain ?? offer.merchantWebsiteDomain;
                          return domain ? (
                            <Link
                              href={`https://${domain}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              fontWeight="600"
                              fontSize="sm"
                              color="fg.default"
                              lineClamp={1}
                              display="block"
                              _hover={{ textDecoration: "underline", color: "brand.fg" }}
                              textDecoration="none"
                            >
                              {offer.merchantName}
                            </Link>
                          ) : (
                            <Text
                              fontWeight="600"
                              fontSize="sm"
                              color="fg.default"
                              lineClamp={1}
                            >
                              {offer.merchantName}
                            </Text>
                          );
                        })()}
                        <HStack gap={2} mt={1} flexWrap="wrap">
                          <Badge
                            colorPalette={
                              ISSUER_PALETTE[offer.issuer] ?? "gray"
                            }
                            size="sm"
                          >
                            {ISSUER_LABELS[offer.issuer] ?? offer.issuer}
                          </Badge>
                          {offer.cardName && (
                            <Text
                              fontSize="xs"
                              color="fg.muted"
                              lineClamp={1}
                            >
                              {offer.cardName}
                            </Text>
                          )}
                        </HStack>
                      </Box>
                      <Box
                        bg={
                          offer.requiresAdd
                            ? "accent.subtle"
                            : "success.subtle"
                        }
                        px={3}
                        py={1.5}
                        borderRadius="md"
                        borderWidth="1px"
                        borderColor={
                          offer.requiresAdd
                            ? "accent.muted"
                            : "success.muted"
                        }
                        flexShrink={0}
                        textAlign="center"
                      >
                        <Text
                          fontWeight="700"
                          fontSize="sm"
                          color={
                            offer.requiresAdd
                              ? "accent.fg"
                              : "success.fg"
                          }
                        >
                          {formatValue(offer)}
                        </Text>
                        <Text fontSize="xs" color="fg.muted">
                          {OFFER_TYPE_LABELS[offer.offerType] ??
                            offer.offerType}
                        </Text>
                      </Box>
                    </Flex>

                    {/* Title */}
                    <Text
                      fontSize="xs"
                      color="fg.muted"
                      lineClamp={2}
                      mb={2}
                    >
                      {offer.title}
                    </Text>

                    {/* Min spend / Max reward */}
                    {(offer.minSpend || offer.maxReward) && (
                      <HStack
                        gap={3}
                        fontSize="xs"
                        color="fg.subtle"
                        mb={2}
                      >
                        {offer.minSpend && (
                          <Text>
                            Min: ${Number(offer.minSpend).toLocaleString()}
                          </Text>
                        )}
                        {offer.maxReward && (
                          <Text>
                            Max: $
                            {Number(offer.maxReward).toLocaleString()}
                          </Text>
                        )}
                      </HStack>
                    )}

                    <Separator my={2} borderColor="border.muted" />

                    {/* Footer */}
                    <Flex
                      justifyContent="space-between"
                      alignItems="center"
                    >
                      <HStack gap={2}>
                        <Badge
                          size="sm"
                          colorPalette={
                            offer.requiresAdd ? "orange" : "green"
                          }
                          variant="subtle"
                        >
                          {offer.requiresAdd ? "Available" : "Added"}
                        </Badge>
                        {isExpiringSoon(offer.endDate) && (
                          <Badge
                            size="sm"
                            colorPalette="red"
                            variant="subtle"
                          >
                            Expiring soon
                          </Badge>
                        )}
                      </HStack>
                      {offer.endDate && (
                        <Text fontSize="xs" color="fg.muted">
                          Exp: {formatDate(offer.endDate)}
                        </Text>
                      )}
                    </Flex>
                  </Card.Body>
                </Card.Root>
              ))}
            </Box>
          )}
        </>
      )}
    </VStack>
  );
}
