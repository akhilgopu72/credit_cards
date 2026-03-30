"use client";

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  Badge,
  Spinner,
  SimpleGrid,
  Table,
} from "@chakra-ui/react";
import { useState, useEffect, useCallback } from "react";
import type { ScenarioOutput, Allocation } from "@/server/services/scenario-engine";
import type { WalletCard } from "@/types/api";

// ─── Category Labels ─────────────────────────────────────────────

const spendCategories = [
  { key: "dining", label: "Dining & Restaurants" },
  { key: "groceries", label: "Groceries" },
  { key: "travel", label: "Travel & Flights" },
  { key: "gas", label: "Gas & Transit" },
  { key: "streaming", label: "Streaming" },
  { key: "online_shopping", label: "General Shopping" },
  { key: "transit", label: "Transit & Rideshare" },
  { key: "general", label: "Everything Else" },
];

type WalletCardData = WalletCard;

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}
function fmtPts(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}
function fmtK(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}k` : n.toString();
}

// ─── Component ───────────────────────────────────────────────────

export default function ScenariosPage() {
  const [walletCards, setWalletCards] = useState<WalletCardData[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);
  const [monthlySpend, setMonthlySpend] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const cat of spendCategories) initial[cat.key] = 0;
    return initial;
  });
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());
  const [timeframeMonths] = useState(12);
  const [calculating, setCalculating] = useState(false);
  const [results, setResults] = useState<ScenarioOutput | null>(null);
  const [optimizedResults, setOptimizedResults] = useState<
    (ScenarioOutput & { allocation: Allocation }) | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch Wallet ─────────────────────────────────────────────

  useEffect(() => {
    async function fetchWallet() {
      try {
        const res = await fetch("/api/wallet");
        const json = await res.json();
        if (json.error) setWalletError(json.error);
        else {
          const cards = json.data ?? [];
          setWalletCards(cards);
          // Auto-select all cards
          setSelectedCards(new Set(cards.map((c: WalletCardData) => c.id)));
        }
      } catch { setWalletError("Failed to load wallet"); }
      finally { setLoadingWallet(false); }
    }
    fetchWallet();
  }, []);

  const toggleCard = useCallback((id: string) => {
    setSelectedCards((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  function buildUniformAllocation(): Allocation {
    const cards = Array.from(selectedCards);
    const pct = cards.length > 0 ? 100 / cards.length : 0;
    const allocation: Allocation = {};
    for (const id of cards) {
      allocation[id] = {};
      for (const cat of spendCategories) allocation[id][cat.key] = pct;
    }
    return allocation;
  }

  async function handleRunAnalysis() {
    if (selectedCards.size === 0) { setError("Select at least one card."); return; }
    const hasSpend = Object.values(monthlySpend).some((v) => v > 0);
    if (!hasSpend) { setError("Enter spend in at least one category."); return; }

    setCalculating(true);
    setError(null);
    setResults(null);
    setOptimizedResults(null);

    try {
      // Run both calculate and optimize in parallel
      const [calcRes, optRes] = await Promise.all([
        fetch("/api/scenarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            monthly_spend: monthlySpend,
            card_ids: Array.from(selectedCards),
            allocation: buildUniformAllocation(),
            timeframe_months: timeframeMonths,
          }),
        }),
        fetch("/api/scenarios?action=optimize", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            monthly_spend: monthlySpend,
            card_ids: Array.from(selectedCards),
            timeframe_months: timeframeMonths,
          }),
        }),
      ]);

      const calcJson = await calcRes.json();
      const optJson = await optRes.json();

      if (calcJson.error) setError(calcJson.error);
      else setResults(calcJson.data);

      if (!optJson.error) setOptimizedResults(optJson.data);
    } catch {
      setError("Analysis failed. Please try again.");
    } finally {
      setCalculating(false);
    }
  }

  async function handleSave() {
    if (!results) return;
    const name = prompt("Enter a name for this scenario:");
    if (!name) return;
    try {
      await fetch("/api/scenarios?action=save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          config: { monthly_spend: monthlySpend, cards: Array.from(selectedCards), allocation: buildUniformAllocation() },
          results: results.results,
        }),
      });
      alert("Scenario saved!");
    } catch { setError("Failed to save."); }
  }

  const totalSpend = Object.values(monthlySpend).reduce((a, b) => a + b, 0);

  // ─── Render ───────────────────────────────────────────────────

  return (
    <Box>
      {/* Header */}
      <Flex justify="space-between" align="end" mb={8}>
        <Box>
          <Heading size="2xl" fontWeight="800" letterSpacing="-0.03em">
            Scenario Modeling
          </Heading>
          <Text color="fg.muted" fontSize="sm" mt={1}>
            Optimize your wallet strategy based on projected monthly spending patterns.
          </Text>
        </Box>
        <HStack gap={3}>
          <Box
            as="button"
            px={4}
            py={2}
            borderRadius="badge"
            borderWidth="1px"
            borderColor="rgba(255,255,255,0.1)"
            fontSize="xs"
            fontWeight="700"
            color="fg.default"
            _hover={{ bg: "bg.subtle" }}
            onClick={handleSave}
            opacity={results ? 1 : 0.3}
          >
            SAVE SCENARIO
          </Box>
          <Box
            as="button"
            px={6}
            py={2}
            borderRadius="badge"
            bg="#f9f9f9"
            color="#0e0e0e"
            fontSize="xs"
            fontWeight="700"
            _hover={{ bg: "#ebebeb" }}
            onClick={handleRunAnalysis}
            opacity={calculating ? 0.5 : 1}
          >
            {calculating ? "ANALYZING..." : "RUN ANALYSIS"}
          </Box>
        </HStack>
      </Flex>

      {/* Error */}
      {error && (
        <Box bg="rgba(255,113,108,0.1)" p={4} borderRadius="card" mb={6} borderWidth="1px" borderColor="rgba(255,113,108,0.2)">
          <Text color="danger.300" fontSize="sm">{error}</Text>
        </Box>
      )}

      {/* Split Panel Layout */}
      <Flex gap={0} minH="70vh">
        {/* ─── Left Panel: Spend Inputs ──────────────────── */}
        <Box w={{ base: "full", lg: "33%" }} borderRightWidth={{ lg: "1px" }} borderColor="border.default" p={8} bg="#131313" borderRadius={{ base: "card", lg: "0" }} borderLeftRadius="card">

          <Text fontSize="xs" fontWeight="700" color="fg.muted" letterSpacing="0.2em" textTransform="uppercase" mb={6}>
            Monthly Estimates
          </Text>

          <VStack gap={5} align="stretch">
            {spendCategories.map((cat) => (
              <Box key={cat.key}>
                <Text fontSize="xs" fontWeight="500" color="fg.muted" mb={2}>
                  {cat.label}
                </Text>
                <Flex
                  bg="#000000"
                  borderRadius="sm"
                  px={4}
                  py={3}
                  borderBottomWidth="1px"
                  borderColor="rgba(255,255,255,0.1)"
                  _focusWithin={{ borderColor: "brand.400" }}
                  align="center"
                >
                  <Text fontSize="sm" color="fg.muted" mr={2}>$</Text>
                  <input
                    type="number"
                    value={monthlySpend[cat.key] || ""}
                    onChange={(e) => {
                      const val = parseFloat(e.target.value) || 0;
                      setMonthlySpend((prev) => ({ ...prev, [cat.key]: val }));
                    }}
                    placeholder="0"
                    style={{
                      background: "transparent",
                      border: "none",
                      outline: "none",
                      color: "#ffffff",
                      fontSize: "18px",
                      fontWeight: 600,
                      width: "100%",
                    }}
                  />
                </Flex>
              </Box>
            ))}
          </VStack>

          {/* Included Assets */}
          <Box pt={6} mt={6} borderTopWidth="1px" borderColor="border.default">
            <Text fontSize="xs" fontWeight="700" color="fg.muted" letterSpacing="0.2em" textTransform="uppercase" mb={4}>
              Included Assets
            </Text>
            {loadingWallet ? (
              <Spinner size="sm" />
            ) : walletError ? (
              <Text color="danger.300" fontSize="xs">{walletError}</Text>
            ) : (
              <Flex gap={2} flexWrap="wrap">
                {walletCards.map((wc) => {
                  const selected = selectedCards.has(wc.id);
                  return (
                    <Box
                      key={wc.id}
                      px={3}
                      py={1.5}
                      borderRadius="badge"
                      bg={selected ? "#262626" : "transparent"}
                      borderWidth="1px"
                      borderColor={selected ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.1)"}
                      borderStyle={selected ? "solid" : "dashed"}
                      color={selected ? "#ffffff" : "#adaaaa"}
                      fontSize="2xs"
                      fontWeight="700"
                      cursor="pointer"
                      opacity={selected ? 1 : 0.5}
                      onClick={() => toggleCard(wc.id)}
                      _hover={{ opacity: 1 }}
                      transition="all 0.15s"
                    >
                      <HStack gap={2}>
                        <Box w={1.5} h={1.5} borderRadius="full" bg={selected ? "success.300" : "fg.subtle"} />
                        <Text>{wc.nickname ?? wc.card.name.split(" ").slice(0, 2).join(" ")}</Text>
                      </HStack>
                    </Box>
                  );
                })}
              </Flex>
            )}
          </Box>
        </Box>

        {/* ─── Right Panel: Results ──────────────────────── */}
        <Box flex={1} p={8} bg="bg.page">
          {!results && !optimizedResults ? (
            <Flex h="full" align="center" justify="center" direction="column" gap={4} opacity={0.4}>
              <Text fontSize="4xl">📊</Text>
              <Text fontSize="sm" color="fg.muted" textAlign="center" maxW="300px">
                Enter your monthly spending and click "Run Analysis" to see optimized results.
              </Text>
            </Flex>
          ) : (
            <VStack gap={8} align="stretch">
              {/* ─── Metrics Bar ─────────────────────────── */}
              <SimpleGrid columns={3} gap={6}>
                <MetricTile
                  label="Total Projected Yield"
                  value={`$${fmtK(optimizedResults?.detail.net_rewards_value ?? results?.detail.net_rewards_value ?? 0)}`}
                  suffix="/yr"
                  accent="success.300"
                  subtext={optimizedResults && results ? `↑ +${Math.round(((optimizedResults.detail.net_rewards_value - results.detail.net_rewards_value) / Math.max(results.detail.net_rewards_value, 1)) * 100)}% vs Current` : undefined}
                  subtextColor="success.300"
                />
                {/* HARDCODED: Efficiency score — needs API computation */}
                <MetricTile
                  label="Efficiency Score"
                  value="94.2"
                  suffix="/100"
                  accent="fg.default"
                  subtext="Optimal Allocation Found"
                  subtextColor="brand.400"
                />
                <MetricTile
                  label="Est. Points/Miles"
                  value={fmtK(optimizedResults?.results.total_points ?? results?.results.total_points ?? 0)}
                  accent="brand.400"
                  /* HARDCODED: CPP valuation */
                  subtext="Valuation: 1.45 cpp"
                  subtextColor="fg.muted"
                />
              </SimpleGrid>

              {/* ─── Chart + Path Comparison ──────────────── */}
              <Flex gap={8} direction={{ base: "column", md: "row" }}>
                {/* Reward Accumulation Chart Mock */}
                <Box flex={3} bg="#131313" p={8} borderRadius="card" borderWidth="1px" borderColor="border.default">
                  <Flex justify="space-between" align="center" mb={8}>
                    <Text fontSize="sm" fontWeight="700" letterSpacing="-0.02em">
                      Reward Accumulation by Category
                    </Text>
                    <HStack gap={4}>
                      <HStack gap={1.5}>
                        <Box w={2} h={2} borderRadius="full" bg="success.300" />
                        <Text fontSize="2xs" color="fg.muted" fontWeight="700">Optimized</Text>
                      </HStack>
                      <HStack gap={1.5}>
                        <Box w={2} h={2} borderRadius="full" bg="brand.400" />
                        <Text fontSize="2xs" color="fg.muted" fontWeight="700">Current</Text>
                      </HStack>
                    </HStack>
                  </Flex>
                  {/* HARDCODED: Bar chart visualization */}
                  <Flex h="192px" align="flex-end" gap={6} px={4}>
                    {["Dining", "Grocery", "Travel", "Transit", "Other"].map((cat, i) => {
                      const heights = [75, 60, 100, 15, 50];
                      return (
                        <Flex key={cat} flex={1} direction="column" align="center" gap={2}>
                          <Flex direction="column" gap={1} justify="flex-end" h="full" w="full">
                            <Box w="full" bg="rgba(63,255,139,0.15)" h={`${heights[i]}%`} borderRadius="sm" _hover={{ bg: "rgba(63,255,139,0.3)" }} transition="all 0.2s" cursor="pointer" />
                          </Flex>
                          <Text fontSize="2xs" color="fg.muted" fontWeight="500">{cat}</Text>
                        </Flex>
                      );
                    })}
                  </Flex>
                </Box>

                {/* Optimized Path Comparison */}
                <VStack flex={2} gap={4} align="stretch">
                  <Text fontSize="sm" fontWeight="700" letterSpacing="-0.02em" mb={2}>
                    Optimized Path Comparison
                  </Text>
                  {/* HARDCODED: Path comparison combos — needs multi-wallet optimization (WS5 Mode 3) */}
                  <PathCard
                    label="Recommended Combo"
                    cards={optimizedResults ? getTopCards(optimizedResults, walletCards) : "Best 2-Card Setup"}
                    value={`$${fmtK(optimizedResults?.detail.net_rewards_value ?? 0)}`}
                    isRecommended
                  />
                  <PathCard
                    label="Current Setup"
                    cards="Mixed Wallet"
                    value={`$${fmtK(results?.detail.net_rewards_value ?? 0)}`}
                  />
                </VStack>
              </Flex>

              {/* ─── Category Allocation Matrix ───────────── */}
              {optimizedResults?.allocation && (
                <Box bg="#131313" borderRadius="card" overflow="hidden" borderWidth="1px" borderColor="border.default">
                  <Box px={6} py={4} bg="bg.surface">
                    <Text fontSize="xs" fontWeight="700" color="fg.muted" letterSpacing="0.2em" textTransform="uppercase">
                      Category Allocation Matrix
                    </Text>
                  </Box>
                  <Box overflowX="auto">
                    <Table.Root size="sm">
                      <Table.Header>
                        <Table.Row>
                          <Table.ColumnHeader px={6} py={4} fontSize="2xs" fontWeight="700" color="fg.muted" textTransform="uppercase" letterSpacing="0.1em">Spend Category</Table.ColumnHeader>
                          <Table.ColumnHeader px={6} py={4} fontSize="2xs" fontWeight="700" color="fg.muted" textTransform="uppercase" letterSpacing="0.1em">Optimal Card</Table.ColumnHeader>
                          <Table.ColumnHeader px={6} py={4} fontSize="2xs" fontWeight="700" color="fg.muted" textTransform="uppercase" letterSpacing="0.1em">Multiplier</Table.ColumnHeader>
                          <Table.ColumnHeader px={6} py={4} fontSize="2xs" fontWeight="700" color="fg.muted" textTransform="uppercase" letterSpacing="0.1em" textAlign="right">Ann. Delta</Table.ColumnHeader>
                        </Table.Row>
                      </Table.Header>
                      <Table.Body>
                        {spendCategories.filter(cat => monthlySpend[cat.key] > 0).map((cat) => {
                          const assignedCardId = Object.entries(optimizedResults.allocation).find(
                            ([, cats]) => (cats[cat.key] ?? 0) === 100
                          )?.[0];
                          const assignedCard = walletCards.find((wc) => wc.id === assignedCardId);
                          const version = assignedCard?.card.versions[0];
                          const bonus = version?.categoryBonuses.find((b) => b.category === cat.key);
                          const multiplier = bonus?.multiplier ?? version?.baseEarnRate.points_per_dollar ?? 1;

                          return (
                            <Table.Row key={cat.key} _hover={{ bg: "#000000" }} transition="all 0.15s">
                              <Table.Cell px={6} py={4}>
                                <Text fontWeight="600">{cat.label}</Text>
                              </Table.Cell>
                              <Table.Cell px={6} py={4}>
                                <Text color="success.300" fontWeight="700">
                                  {assignedCard?.nickname ?? assignedCard?.card.name.split(" ").slice(0, 3).join(" ") ?? "—"} ({multiplier}x)
                                </Text>
                              </Table.Cell>
                              <Table.Cell px={6} py={4}>
                                <Box
                                  display="inline-block"
                                  px={2}
                                  py={0.5}
                                  borderRadius="sm"
                                  bg={multiplier > 1 ? "rgba(63,255,139,0.1)" : "rgba(255,255,255,0.05)"}
                                >
                                  <Text fontSize="2xs" fontWeight="700" color={multiplier > 1 ? "success.300" : "fg.muted"}>
                                    {multiplier}x
                                  </Text>
                                </Box>
                              </Table.Cell>
                              <Table.Cell px={6} py={4} textAlign="right">
                                <Text fontFamily="mono" color="success.300" fontWeight="600">
                                  +${fmt(monthlySpend[cat.key] * (multiplier - 1) * 0.015 * 12)}
                                </Text>
                              </Table.Cell>
                            </Table.Row>
                          );
                        })}
                      </Table.Body>
                    </Table.Root>
                  </Box>
                </Box>
              )}
            </VStack>
          )}
        </Box>
      </Flex>
    </Box>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────

function MetricTile({
  label,
  value,
  suffix,
  accent,
  subtext,
  subtextColor,
}: {
  label: string;
  value: string;
  suffix?: string;
  accent: string;
  subtext?: string;
  subtextColor?: string;
}) {
  return (
    <Box bg="bg.subtle" p={6} borderRadius="card" position="relative" overflow="hidden">
      <Text fontSize="2xs" fontWeight="700" color="fg.muted" letterSpacing="0.15em" textTransform="uppercase" mb={1}>
        {label}
      </Text>
      <Text fontSize="3xl" fontWeight="900" letterSpacing="-0.03em" color={accent}>
        {value}
        {suffix && <Text as="span" fontSize="sm" fontWeight="500" color="fg.muted">{suffix}</Text>}
      </Text>
      {subtext && (
        <HStack mt={2} gap={1}>
          <Text fontSize="2xs" fontWeight="700" color={subtextColor ?? "fg.muted"}>
            {subtext}
          </Text>
        </HStack>
      )}
    </Box>
  );
}

function PathCard({
  label,
  cards,
  value,
  isRecommended,
}: {
  label: string;
  cards: string;
  value: string;
  isRecommended?: boolean;
}) {
  return (
    <Flex
      p={4}
      bg={isRecommended ? "rgba(63,255,139,0.05)" : "#131313"}
      borderLeftWidth="4px"
      borderLeftColor={isRecommended ? "success.300" : "rgba(255,255,255,0.1)"}
      borderRadius="card"
      justify="space-between"
      align="center"
    >
      <Box>
        <Text fontSize="2xs" fontWeight="700" color={isRecommended ? "success.300" : "fg.muted"} textTransform="uppercase">
          {label}
        </Text>
        <Text fontSize="sm" fontWeight="600">{cards}</Text>
      </Box>
      <Box textAlign="right">
        <Text fontSize="lg" fontWeight="900" letterSpacing="-0.03em" color={isRecommended ? "fg.default" : "fg.muted"}>
          {value}
        </Text>
        <Text fontSize="2xs" color="fg.muted">Projected Yield</Text>
      </Box>
    </Flex>
  );
}

function getTopCards(opt: ScenarioOutput & { allocation: Allocation }, walletCards: WalletCardData[]): string {
  const cardIds = Object.keys(opt.allocation);
  const usedCards = cardIds.filter(id => {
    const cats = opt.allocation[id];
    return Object.values(cats).some(v => v === 100);
  });
  return usedCards
    .map(id => walletCards.find(wc => wc.id === id)?.card.name.split(" ").slice(0, 2).join(" ") ?? "Card")
    .join(" + ") || "Optimized Combo";
}
