"use client";

import {
  Box,
  Heading,
  Text,
  VStack,
  Button,
  Input,
  HStack,
  Badge,
  Flex,
  Separator,
  Card,
} from "@chakra-ui/react";
import { useState, useEffect, useCallback } from "react";
import type { WalletCard, CardProduct } from "@/types/api";
import { ISSUER_COLORS } from "@/types/api";

const ISSUER_BG: Record<string, string> = {
  chase: "linear-gradient(135deg, #0a1e3b 0%, #010811 100%)",
  amex: "linear-gradient(135deg, #2c2c2c 0%, #000000 100%)",
  capital_one: "linear-gradient(135deg, #1b1b1b 0%, #0c1c2e 100%)",
  citi: "linear-gradient(135deg, #0a1e3b 0%, #000000 100%)",
  us_bank: "linear-gradient(135deg, #1a1a1a 0%, #0e0e0e 100%)",
  barclays: "linear-gradient(135deg, #1a1a1a 0%, #0e0e0e 100%)",
  wells_fargo: "linear-gradient(135deg, #1a1a1a 0%, #0e0e0e 100%)",
  bank_of_america: "linear-gradient(135deg, #1a1a1a 0%, #0e0e0e 100%)",
};

const ISSUER_PALETTE: Record<string, string> = {
  chase: "blue",
  amex: "cyan",
  capital_one: "red",
  citi: "purple",
};

const NETWORK_LABEL: Record<string, string> = {
  visa: "VISA",
  mastercard: "MC",
  amex: "AMEX",
  discover: "DISC",
};

export default function WalletPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<CardProduct[]>([]);
  const [walletCards, setWalletCards] = useState<WalletCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [adding, setAdding] = useState<string | null>(null);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [editingBonus, setEditingBonus] = useState<string | null>(null);
  const [bonusPoints, setBonusPoints] = useState("");
  const [bonusSpend, setBonusSpend] = useState("");
  const [bonusMonths, setBonusMonths] = useState("");
  const [showSearch, setShowSearch] = useState(false);

  const fetchWallet = useCallback(async () => {
    try {
      const res = await fetch("/api/wallet");
      const json = await res.json();
      if (json.data) setWalletCards(json.data);
    } catch (err) {
      console.error("Failed to fetch wallet:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchWallet();
  }, [fetchWallet]);

  const searchCards = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    try {
      const res = await fetch(`/api/cards?q=${encodeURIComponent(searchQuery)}`);
      const json = await res.json();
      if (json.data) {
        const walletCardIds = new Set(walletCards.map((wc) => wc.cardId));
        setSearchResults(
          json.data.filter((c: CardProduct) => !walletCardIds.has(c.id))
        );
      }
    } catch (err) {
      console.error("Failed to search cards:", err);
    } finally {
      setSearching(false);
    }
  };

  const addCard = async (cardId: string) => {
    setAdding(cardId);
    try {
      const res = await fetch("/api/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cardId }),
      });
      if (res.ok) {
        setSearchResults((prev) => prev.filter((c) => c.id !== cardId));
        await fetchWallet();
      }
    } catch (err) {
      console.error("Failed to add card:", err);
    } finally {
      setAdding(null);
    }
  };

  const removeCard = async (userCardId: string) => {
    try {
      const res = await fetch("/api/wallet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userCardId, isActive: false }),
      });
      if (res.ok) {
        setWalletCards((prev) => prev.filter((wc) => wc.id !== userCardId));
      }
    } catch (err) {
      console.error("Failed to remove card:", err);
    }
  };

  const saveSignUpBonusOverride = async (userCardId: string, currency: string) => {
    const points = parseInt(bonusPoints, 10);
    const spend = parseInt(bonusSpend, 10);
    const months = parseInt(bonusMonths, 10);

    if (!points || !spend || !months) return;

    try {
      const res = await fetch("/api/wallet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userCardId,
          signUpBonusOverride: {
            points,
            spend_requirement: spend,
            timeframe_months: months,
            currency,
          },
        }),
      });
      if (res.ok) {
        setEditingBonus(null);
        setBonusPoints("");
        setBonusSpend("");
        setBonusMonths("");
        await fetchWallet();
      }
    } catch (err) {
      console.error("Failed to save override:", err);
    }
  };

  const clearOverride = async (userCardId: string) => {
    try {
      const res = await fetch("/api/wallet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userCardId,
          signUpBonusOverride: null,
        }),
      });
      if (res.ok) await fetchWallet();
    } catch (err) {
      console.error("Failed to clear override:", err);
    }
  };

  const formatCurrency = (val: string | number) =>
    `$${Number(val).toLocaleString()}`;

  const formatPoints = (val: number) => val.toLocaleString();

  return (
    <VStack gap={8} align="stretch">
      {/* Page Header */}
      <Flex justifyContent="space-between" alignItems="start" flexWrap="wrap" gap={4}>
        <Box>
          <Heading size="3xl" fontWeight="800" letterSpacing="-0.03em">
            My Wallet
          </Heading>
          <Text color="fg.muted" mt={1}>
            {walletCards.length > 0
              ? `${walletCards.length} card${walletCards.length !== 1 ? "s" : ""} in your wallet`
              : "Add your credit cards to get started"}
          </Text>
        </Box>
        <Button
          bg="brand.800"
          color="white"
          _hover={{ bg: "brand.700" }}
          size="sm"
          onClick={() => setShowSearch(!showSearch)}
        >
          {showSearch ? "Close" : "+ Add Card"}
        </Button>
      </Flex>

      {/* Add Card Section */}
      {showSearch && (
        <Card.Root bg="bg.surface" borderRadius="card" shadow="card" overflow="hidden">
          <Box h="3px" bg="brand.600" />
          <Card.Body p={6}>
            <Heading size="md" fontWeight="600" mb={4}>
              Search Card Database
            </Heading>
            <Flex gap={3} direction={{ base: "column", sm: "row" }}>
              <Input
                placeholder="Search by card name (e.g. Sapphire Reserve)..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchCards()}
                flex={1}
                borderColor="border.default"
                _focus={{ borderColor: "brand.400", boxShadow: "0 0 0 1px var(--chakra-colors-brand-400)" }}
              />
              <Button
                bg="brand.800"
                color="white"
                _hover={{ bg: "brand.700" }}
                onClick={searchCards}
                loading={searching}
                flexShrink={0}
              >
                Search
              </Button>
            </Flex>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <VStack gap={2} mt={5} align="stretch">
                <Text fontSize="sm" color="fg.muted" fontWeight="500">
                  {searchResults.length} card{searchResults.length !== 1 ? "s" : ""} found
                </Text>
                {searchResults.map((card) => {
                  const version = card.versions[0];
                  const sub = version?.signUpBonus;
                  return (
                    <Flex
                      key={card.id}
                      p={4}
                      borderWidth="1px"
                      borderColor="border.default"
                      borderRadius="md"
                      alignItems="center"
                      justifyContent="space-between"
                      _hover={{ bg: "bg.subtle" }}
                      transition="all 0.15s"
                      gap={4}
                      direction={{ base: "column", sm: "row" }}
                    >
                      <Box flex={1}>
                        <HStack gap={2} mb={1} flexWrap="wrap">
                          <Text fontWeight="600" fontSize="sm">{card.name}</Text>
                          <Badge
                            colorPalette={ISSUER_PALETTE[card.issuer] ?? "gray"}
                            size="sm"
                          >
                            {card.issuer.replace("_", " ")}
                          </Badge>
                          <Badge variant="outline" size="sm">
                            {NETWORK_LABEL[card.network] ?? card.network}
                          </Badge>
                        </HStack>
                        <HStack gap={4} fontSize="xs" color="fg.muted" flexWrap="wrap">
                          <Text>{formatCurrency(card.annualFee)}/yr</Text>
                          {version && (
                            <Text>
                              {version.baseEarnRate.points_per_dollar}x base {version.baseEarnRate.currency}
                            </Text>
                          )}
                          {sub && (
                            <Text color="success.fg" fontWeight="500">
                              SUB: {formatPoints(sub.points)} pts
                            </Text>
                          )}
                        </HStack>
                      </Box>
                      <Button
                        size="sm"
                        bg="success.600"
                        color="white"
                        _hover={{ bg: "success.700" }}
                        onClick={() => addCard(card.id)}
                        loading={adding === card.id}
                        flexShrink={0}
                      >
                        + Add
                      </Button>
                    </Flex>
                  );
                })}
              </VStack>
            )}
          </Card.Body>
        </Card.Root>
      )}

      {/* Wallet Cards Grid */}
      {loading ? (
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
              Loading your cards...
            </Text>
          </VStack>
        </Box>
      ) : walletCards.length === 0 ? (
        <Card.Root bg="bg.surface" borderRadius="card" shadow="card">
          <Card.Body p={12} textAlign="center">
            <VStack gap={4}>
              <Flex
                w={16}
                h={16}
                bg="brand.subtle"
                borderRadius="xl"
                alignItems="center"
                justifyContent="center"
              >
                <Text fontSize="2xl" color="brand.fg">{"\u2660"}</Text>
              </Flex>
              <Heading size="md" fontWeight="600">
                No cards yet
              </Heading>
              <Text color="fg.muted" maxW="360px">
                Add your first credit card to start seeing personalized
                optimization recommendations.
              </Text>
              <Button
                bg="brand.800"
                color="white"
                _hover={{ bg: "brand.700" }}
                size="sm"
                onClick={() => setShowSearch(true)}
              >
                + Add Your First Card
              </Button>
            </VStack>
          </Card.Body>
        </Card.Root>
      ) : (
        <Box
          display="grid"
          gridTemplateColumns={{ base: "1fr", md: "repeat(2, 1fr)" }}
          gap={5}
        >
          {walletCards.map((wc) => {
            const version = wc.card.versions[0];
            const publicSub = version?.signUpBonus;
            const effectiveSub = wc.signUpBonusOverride ?? publicSub;
            const isOverridden = !!wc.signUpBonusOverride;
            const isEditing = editingBonus === wc.id;
            const isExpanded = expandedCard === wc.id;
            const issuerBg = ISSUER_BG[wc.card.issuer] ?? "linear-gradient(135deg, #495057 0%, #868e96 100%)";

            return (
              <Card.Root
                key={wc.id}
                bg="bg.surface"
                borderRadius="card"
                shadow="card"
                overflow="hidden"
                _hover={{ shadow: "cardHover" }}
                transition="all 0.2s"
              >
                {/* Card Visual Header */}
                <Box
                  bg={issuerBg}
                  px={5}
                  py={4}
                  position="relative"
                  minH="100px"
                >
                  <Flex justifyContent="space-between" alignItems="start">
                    <Box>
                      <Text
                        color="whiteAlpha.800"
                        fontSize="xs"
                        fontWeight="500"
                        textTransform="uppercase"
                        letterSpacing="0.05em"
                      >
                        {wc.card.issuer.replace("_", " ")}
                      </Text>
                      <Text
                        color="white"
                        fontWeight="700"
                        fontSize="md"
                        mt={1}
                      >
                        {wc.card.name}
                      </Text>
                    </Box>
                    <Text
                      color="whiteAlpha.700"
                      fontSize="xs"
                      fontWeight="600"
                      bg="whiteAlpha.200"
                      px={2}
                      py={0.5}
                      borderRadius="sm"
                    >
                      {NETWORK_LABEL[wc.card.network] ?? wc.card.network}
                    </Text>
                  </Flex>
                  <HStack mt={4} gap={6}>
                    <Box>
                      <Text color="whiteAlpha.700" fontSize="xs">
                        Annual Fee
                      </Text>
                      <Text color="white" fontWeight="600" fontSize="sm">
                        {formatCurrency(wc.card.annualFee)}
                      </Text>
                    </Box>
                    {version && (
                      <Box>
                        <Text color="whiteAlpha.700" fontSize="xs">
                          Base Earn
                        </Text>
                        <Text color="white" fontWeight="600" fontSize="sm">
                          {version.baseEarnRate.points_per_dollar}x {version.baseEarnRate.currency}
                        </Text>
                      </Box>
                    )}
                  </HStack>
                </Box>

                {/* Card Details */}
                <Card.Body px={5} py={4}>
                  {/* Category Bonuses */}
                  {version && version.categoryBonuses.length > 0 && (
                    <Box mb={3}>
                      <Text fontSize="xs" fontWeight="600" color="fg.muted" mb={2} textTransform="uppercase" letterSpacing="0.04em">
                        Category Bonuses
                      </Text>
                      <Flex gap={2} flexWrap="wrap">
                        {version.categoryBonuses
                          .slice(0, isExpanded ? undefined : 4)
                          .map((cb) => (
                            <Badge
                              key={cb.id}
                              variant="subtle"
                              colorPalette="blue"
                              size="sm"
                            >
                              {cb.category}: {cb.multiplier}x
                              {cb.capAmount
                                ? ` (${formatCurrency(cb.capAmount)}/${cb.capPeriod})`
                                : ""}
                            </Badge>
                          ))}
                        {!isExpanded && version.categoryBonuses.length > 4 && (
                          <Badge variant="outline" size="sm" color="fg.muted">
                            +{version.categoryBonuses.length - 4} more
                          </Badge>
                        )}
                      </Flex>
                    </Box>
                  )}

                  {/* Benefits - shown when expanded */}
                  {isExpanded && version && version.benefits.length > 0 && (
                    <Box mb={3}>
                      <Text fontSize="xs" fontWeight="600" color="fg.muted" mb={2} textTransform="uppercase" letterSpacing="0.04em">
                        Benefits & Credits
                      </Text>
                      <Flex gap={2} flexWrap="wrap">
                        {version.benefits
                          .filter((b) => Number(b.value) > 0)
                          .map((b) => (
                            <Badge
                              key={b.id}
                              variant="subtle"
                              colorPalette="green"
                              size="sm"
                            >
                              {b.name}: {formatCurrency(b.value)}/{b.frequency}
                            </Badge>
                          ))}
                      </Flex>
                    </Box>
                  )}

                  <Separator my={3} borderColor="border.muted" />

                  {/* Sign-Up Bonus */}
                  <Box>
                    <Flex justifyContent="space-between" alignItems="center" mb={1}>
                      <HStack gap={2}>
                        <Text fontSize="xs" fontWeight="600" color="fg.muted" textTransform="uppercase" letterSpacing="0.04em">
                          Sign-Up Bonus
                        </Text>
                        {isOverridden && (
                          <Badge colorPalette="orange" size="sm">
                            Custom
                          </Badge>
                        )}
                      </HStack>
                      <HStack gap={1}>
                        {isOverridden && (
                          <Button
                            size="xs"
                            variant="ghost"
                            color="fg.muted"
                            onClick={() => clearOverride(wc.id)}
                          >
                            Reset
                          </Button>
                        )}
                        <Button
                          size="xs"
                          variant="ghost"
                          color="brand.fg"
                          onClick={() => {
                            if (isEditing) {
                              setEditingBonus(null);
                            } else {
                              setEditingBonus(wc.id);
                              if (effectiveSub) {
                                setBonusPoints(effectiveSub.points.toString());
                                setBonusSpend(effectiveSub.spend_requirement.toString());
                                setBonusMonths(effectiveSub.timeframe_months.toString());
                              }
                            }
                          }}
                        >
                          {isEditing ? "Cancel" : "Edit"}
                        </Button>
                      </HStack>
                    </Flex>

                    {effectiveSub && !isEditing && (
                      <Box
                        bg="accent.subtle"
                        borderRadius="md"
                        px={3}
                        py={2}
                        borderWidth="1px"
                        borderColor="accent.muted"
                      >
                        <Text fontSize="sm" fontWeight="600" color="accent.fg">
                          {formatPoints(effectiveSub.points)} {effectiveSub.currency}
                        </Text>
                        <Text fontSize="xs" color="fg.muted">
                          After {formatCurrency(effectiveSub.spend_requirement)} in{" "}
                          {effectiveSub.timeframe_months} months
                        </Text>
                      </Box>
                    )}

                    {!effectiveSub && !isEditing && (
                      <Text fontSize="sm" color="fg.subtle" fontStyle="italic">
                        No sign-up bonus on file
                      </Text>
                    )}

                    {isEditing && (
                      <Flex mt={2} gap={2} flexWrap="wrap">
                        <Input
                          size="sm"
                          placeholder="Points"
                          type="number"
                          value={bonusPoints}
                          onChange={(e) => setBonusPoints(e.target.value)}
                          w="120px"
                          borderColor="border.default"
                        />
                        <Input
                          size="sm"
                          placeholder="Spend ($)"
                          type="number"
                          value={bonusSpend}
                          onChange={(e) => setBonusSpend(e.target.value)}
                          w="110px"
                          borderColor="border.default"
                        />
                        <Input
                          size="sm"
                          placeholder="Months"
                          type="number"
                          value={bonusMonths}
                          onChange={(e) => setBonusMonths(e.target.value)}
                          w="80px"
                          borderColor="border.default"
                        />
                        <Button
                          size="sm"
                          bg="brand.800"
                          color="white"
                          _hover={{ bg: "brand.700" }}
                          onClick={() =>
                            saveSignUpBonusOverride(
                              wc.id,
                              version?.baseEarnRate.currency ?? "Points"
                            )
                          }
                        >
                          Save
                        </Button>
                      </Flex>
                    )}
                  </Box>
                </Card.Body>

                {/* Card Footer */}
                <Card.Footer px={5} py={3} borderTopWidth="1px" borderColor="border.muted">
                  <Flex justifyContent="space-between" w="full">
                    <Button
                      size="xs"
                      variant="ghost"
                      color="fg.muted"
                      onClick={() =>
                        setExpandedCard(isExpanded ? null : wc.id)
                      }
                    >
                      {isExpanded ? "Show less" : "Show details"}
                    </Button>
                    <Button
                      size="xs"
                      variant="ghost"
                      color="danger.fg"
                      _hover={{ bg: "danger.subtle" }}
                      onClick={() => removeCard(wc.id)}
                    >
                      Remove
                    </Button>
                  </Flex>
                </Card.Footer>
              </Card.Root>
            );
          })}
        </Box>
      )}
    </VStack>
  );
}
