"use client";

import {
  Box,
  Heading,
  Text,
  VStack,
  Input,
  HStack,
  Badge,
  Flex,
} from "@chakra-ui/react";
import { useState } from "react";
import type {
  Merchant,
  MerchantDetail,
  MerchantOffer,
  MerchantSearchResult,
} from "@/types/api";

export default function MerchantsPage() {
  const [query, setQuery] = useState("");
  const [searchResults, setMerchantSearchResults] = useState<MerchantSearchResult[]>([]);
  const [selectedMerchant, setSelectedMerchant] =
    useState<MerchantDetail | null>(null);
  const [searching, setSearching] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  const searchMerchants = async () => {
    if (!query.trim() || query.length < 2) return;
    setSearching(true);
    setSelectedMerchant(null);
    try {
      const res = await fetch(
        `/api/merchants/search?q=${encodeURIComponent(query)}`
      );
      const json = await res.json();
      if (json.data) setMerchantSearchResults(json.data);
    } catch (err) {
      console.error("Search failed:", err);
    } finally {
      setSearching(false);
    }
  };

  const selectMerchant = async (merchant: MerchantSearchResult) => {
    setLoadingDetail(true);
    try {
      const res = await fetch(`/api/merchants/${merchant.slug}`);
      const json = await res.json();
      if (json.data) {
        setSelectedMerchant(json.data);
        setMerchantSearchResults([]);
      }
    } catch (err) {
      console.error("Failed to load merchant:", err);
    } finally {
      setLoadingDetail(false);
    }
  };

  const issuerColor = (issuer: string) => {
    switch (issuer) {
      case "chase": return "blue";
      case "amex": return "cyan";
      case "capital_one": return "red";
      case "citi": return "purple";
      default: return "gray";
    }
  };

  const formatValue = (offer: MerchantOffer) => {
    if (offer.valueType === "percentage") return `${offer.value}% back`;
    if (offer.valueType === "fixed") return `$${offer.value} off`;
    if (offer.valueType === "points_multiplier") return `${offer.value}x pts/dollar`;
    if (offer.valueType === "points_flat") return `${Number(offer.value).toLocaleString()} pts`;
    return `${Number(offer.value).toLocaleString()} points`;
  };

  return (
    <VStack gap={8} align="stretch">
      <Box textAlign="center" mb={4}>
        <Heading size="4xl" fontWeight="800" letterSpacing="-0.04em" lineHeight="1.1">
          Maximize every swipe.
        </Heading>
      </Box>

      {/* Search */}
      <Box bg="bg.surface" p={6} borderRadius="card" shadow="card">
        <Input
          placeholder="Search for a merchant (e.g., Amazon, Whole Foods, Delta)..."
          size="lg"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && searchMerchants()}
        />
      </Box>

      {/* Search Results */}
      {searching && (
        <Text color="fg.muted" textAlign="center">
          Searching...
        </Text>
      )}

      {searchResults.length > 0 && (
        <Box bg="bg.surface" borderRadius="card" shadow="card" overflow="hidden">
          {searchResults.map((merchant, i) => (
            <Flex
              key={merchant.id}
              p={4}
              alignItems="center"
              justifyContent="space-between"
              borderBottomWidth={i < searchResults.length - 1 ? "1px" : "0"}
              borderColor="border.muted"
              cursor="pointer"
              _hover={{ bg: "bg.subtle" }}
              onClick={() => selectMerchant(merchant)}
            >
              <Box>
                <Text fontWeight="600">{merchant.name}</Text>
                <HStack gap={2} mt={1}>
                  <Badge size="sm" variant="subtle">
                    {merchant.category}
                  </Badge>
                  {merchant.websiteDomain && (
                    <Text fontSize="xs" color="fg.subtle">
                      {merchant.websiteDomain}
                    </Text>
                  )}
                </HStack>
              </Box>
              <Text fontSize="sm" color="brand.fg">
                View cards &rarr;
              </Text>
            </Flex>
          ))}
        </Box>
      )}

      {/* Merchant Detail */}
      {loadingDetail && (
        <Text color="fg.muted" textAlign="center">
          Loading merchant details...
        </Text>
      )}

      {selectedMerchant && (
        <VStack gap={6} align="stretch">
          {/* Merchant Header */}
          <Box bg="bg.surface" p={6} borderRadius="card" shadow="card">
            <HStack gap={3} mb={1}>
              <Heading size="lg">{selectedMerchant.merchant.name}</Heading>
              <Badge size="sm">{selectedMerchant.merchant.category}</Badge>
            </HStack>
            {selectedMerchant.merchant.websiteDomain && (
              <Text fontSize="sm" color="fg.muted">
                {selectedMerchant.merchant.websiteDomain}
              </Text>
            )}
          </Box>

          {/* Card Rankings */}
          <Box>
            <Heading size="md" mb={4}>
              Best Cards for {selectedMerchant.merchant.name}
            </Heading>
            <VStack gap={2} align="stretch">
              {selectedMerchant.cardRankings.map((card, i) => (
                <Flex
                  key={card.cardId}
                  bg="bg.surface"
                  p={4}
                  borderRadius="card"
                  shadow="card"
                  alignItems="center"
                  justifyContent="space-between"
                  direction={{ base: "column", sm: "row" }}
                  gap={{ base: 3, sm: 0 }}
                  borderLeftWidth="4px"
                  borderLeftColor={
                    i === 0
                      ? "success.300"
                      : i === 1
                      ? "accent.200"
                      : i === 2
                      ? "danger.300"
                      : "border.default"
                  }
                >
                  <HStack gap={4}>
                    <Text
                      fontWeight="bold"
                      fontSize="lg"
                      color="fg.subtle"
                      w="24px"
                      textAlign="center"
                    >
                      {i + 1}
                    </Text>
                    <Box>
                      <HStack gap={2}>
                        <Text fontWeight="600" fontSize="sm">
                          {card.cardName}
                        </Text>
                        <Badge
                          colorPalette={issuerColor(card.issuer)}
                          size="sm"
                        >
                          {card.issuer.replace("_", " ")}
                        </Badge>
                      </HStack>
                      <HStack gap={3} mt={1} fontSize="xs" color="fg.muted">
                        <Text>
                          AF: ${Number(card.annualFee).toLocaleString()}
                        </Text>
                        {card.capAmount && (
                          <Text>
                            Cap: ${Number(card.capAmount).toLocaleString()}/
                            {card.capPeriod}
                          </Text>
                        )}
                        {card.isBaseRate && (
                          <Badge size="sm" variant="outline" colorPalette="gray">
                            base rate
                          </Badge>
                        )}
                      </HStack>
                    </Box>
                  </HStack>
                  <Box textAlign="right">
                    <Text
                      fontSize="xl"
                      fontWeight="bold"
                      color={i === 0 ? "success.fg" : "fg.default"}
                    >
                      {card.multiplier}x
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      {card.currency}
                    </Text>
                  </Box>
                </Flex>
              ))}
            </VStack>
          </Box>

          {/* Active Offers */}
          {selectedMerchant.offers.length > 0 && (
            <Box>
              <Heading size="md" mb={4}>
                Active Offers
              </Heading>
              <VStack gap={2} align="stretch">
                {selectedMerchant.offers.map((offer) => (
                  <Flex
                    key={offer.id}
                    bg="bg.surface"
                    p={4}
                    borderRadius="card"
                    shadow="card"
                    justifyContent="space-between"
                    alignItems="center"
                    direction={{ base: "column", sm: "row" }}
                    gap={{ base: 2, sm: 0 }}
                  >
                    <Box>
                      <HStack gap={2}>
                        <Text fontWeight="600" fontSize="sm">
                          {offer.title}
                        </Text>
                        <Badge
                          colorPalette={issuerColor(offer.issuer)}
                          size="sm"
                        >
                          {offer.issuer.replace("_", " ")}
                        </Badge>
                      </HStack>
                      {offer.description && (
                        <Text fontSize="xs" color="fg.muted" mt={1}>
                          {offer.description}
                        </Text>
                      )}
                      {offer.endDate && (
                        <Text fontSize="xs" color="fg.subtle" mt={1}>
                          Expires:{" "}
                          {new Date(offer.endDate).toLocaleDateString()}
                        </Text>
                      )}
                    </Box>
                    <Text fontWeight="bold" color="success.fg" fontSize="lg">
                      {formatValue(offer)}
                    </Text>
                  </Flex>
                ))}
              </VStack>
            </Box>
          )}
        </VStack>
      )}

      {/* Empty State */}
      {!searching &&
        searchResults.length === 0 &&
        !selectedMerchant &&
        !loadingDetail && (
          <Box
            bg="bg.surface"
            p={8}
            borderRadius="card"
            shadow="card"
            textAlign="center"
          >
            <VStack gap={4}>
              <Text fontSize="4xl">🔍</Text>
              <Heading size="md">Search for a Merchant</Heading>
              <Text color="fg.muted" maxW="400px">
                Type a merchant name above to see earning rates across all
                cards, active offers, and sign-up bonus opportunities.
              </Text>
            </VStack>
          </Box>
        )}
    </VStack>
  );
}
