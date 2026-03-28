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
      <Box>
        <Heading size="xl">Merchant Lookup</Heading>
        <Text color="gray.600" mt={1}>
          Search any merchant to see which card earns the most and what offers
          are available.
        </Text>
      </Box>

      {/* Search */}
      <Box bg="white" p={6} borderRadius="lg" shadow="sm">
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
        <Text color="gray.500" textAlign="center">
          Searching...
        </Text>
      )}

      {searchResults.length > 0 && (
        <Box bg="white" borderRadius="lg" shadow="sm" overflow="hidden">
          {searchResults.map((merchant, i) => (
            <Flex
              key={merchant.id}
              p={4}
              alignItems="center"
              justifyContent="space-between"
              borderBottomWidth={i < searchResults.length - 1 ? "1px" : "0"}
              borderColor="gray.100"
              cursor="pointer"
              _hover={{ bg: "gray.50" }}
              onClick={() => selectMerchant(merchant)}
            >
              <Box>
                <Text fontWeight="600">{merchant.name}</Text>
                <HStack gap={2} mt={1}>
                  <Badge size="sm" variant="subtle">
                    {merchant.category}
                  </Badge>
                  {merchant.websiteDomain && (
                    <Text fontSize="xs" color="gray.400">
                      {merchant.websiteDomain}
                    </Text>
                  )}
                </HStack>
              </Box>
              <Text fontSize="sm" color="blue.500">
                View cards &rarr;
              </Text>
            </Flex>
          ))}
        </Box>
      )}

      {/* Merchant Detail */}
      {loadingDetail && (
        <Text color="gray.500" textAlign="center">
          Loading merchant details...
        </Text>
      )}

      {selectedMerchant && (
        <VStack gap={6} align="stretch">
          {/* Merchant Header */}
          <Box bg="white" p={6} borderRadius="lg" shadow="sm">
            <HStack gap={3} mb={1}>
              <Heading size="lg">{selectedMerchant.merchant.name}</Heading>
              <Badge size="sm">{selectedMerchant.merchant.category}</Badge>
            </HStack>
            {selectedMerchant.merchant.websiteDomain && (
              <Text fontSize="sm" color="gray.500">
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
                  bg="white"
                  p={4}
                  borderRadius="lg"
                  shadow="sm"
                  alignItems="center"
                  justifyContent="space-between"
                  borderLeftWidth="4px"
                  borderLeftColor={
                    i === 0
                      ? "green.400"
                      : i === 1
                      ? "yellow.400"
                      : i === 2
                      ? "orange.400"
                      : "gray.200"
                  }
                >
                  <HStack gap={4}>
                    <Text
                      fontWeight="bold"
                      fontSize="lg"
                      color="gray.400"
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
                      <HStack gap={3} mt={1} fontSize="xs" color="gray.500">
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
                      color={i === 0 ? "green.600" : "gray.700"}
                    >
                      {card.multiplier}x
                    </Text>
                    <Text fontSize="xs" color="gray.500">
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
                    bg="white"
                    p={4}
                    borderRadius="lg"
                    shadow="sm"
                    justifyContent="space-between"
                    alignItems="center"
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
                        <Text fontSize="xs" color="gray.500" mt={1}>
                          {offer.description}
                        </Text>
                      )}
                      {offer.endDate && (
                        <Text fontSize="xs" color="gray.400" mt={1}>
                          Expires:{" "}
                          {new Date(offer.endDate).toLocaleDateString()}
                        </Text>
                      )}
                    </Box>
                    <Text fontWeight="bold" color="green.600" fontSize="lg">
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
            bg="white"
            p={8}
            borderRadius="lg"
            shadow="sm"
            textAlign="center"
          >
            <VStack gap={4}>
              <Text fontSize="4xl">🔍</Text>
              <Heading size="md">Search for a Merchant</Heading>
              <Text color="gray.600" maxW="400px">
                Type a merchant name above to see earning rates across all
                cards, active offers, and sign-up bonus opportunities.
              </Text>
            </VStack>
          </Box>
        )}
    </VStack>
  );
}
