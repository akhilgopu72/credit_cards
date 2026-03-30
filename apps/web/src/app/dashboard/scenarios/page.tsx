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
  Spinner,
  Separator,
  SimpleGrid,
  Table,
  Checkbox,
} from "@chakra-ui/react";
import { useState, useEffect, useCallback } from "react";
import type { ScenarioOutput, Allocation } from "@/server/services/scenario-engine";

// ─── Category Labels ─────────────────────────────────────────────

const spendCategories = [
  { key: "dining", label: "Dining & Restaurants" },
  { key: "groceries", label: "Groceries" },
  { key: "travel", label: "Travel" },
  { key: "gas", label: "Gas" },
  { key: "streaming", label: "Streaming" },
  { key: "online_shopping", label: "Online Shopping" },
  { key: "transit", label: "Transit & Rideshare" },
  { key: "general", label: "Everything Else" },
];

// ─── Types ───────────────────────────────────────────────────────

import type { WalletCard } from "@/types/api";
type WalletCardData = WalletCard;

// ─── Formatting helpers ──────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPts(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

// ─── Component ───────────────────────────────────────────────────

export default function ScenariosPage() {
  // Wallet state
  const [walletCards, setWalletCards] = useState<WalletCardData[]>([]);
  const [loadingWallet, setLoadingWallet] = useState(true);
  const [walletError, setWalletError] = useState<string | null>(null);

  // Spend input
  const [monthlySpend, setMonthlySpend] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const cat of spendCategories) {
      initial[cat.key] = 0;
    }
    return initial;
  });

  // Card selection (userCard IDs)
  const [selectedCards, setSelectedCards] = useState<Set<string>>(new Set());

  // Timeframe
  const [timeframeMonths, setTimeframeMonths] = useState(12);

  // Results
  const [calculating, setCalculating] = useState(false);
  const [results, setResults] = useState<ScenarioOutput | null>(null);
  const [optimizedResults, setOptimizedResults] = useState<
    (ScenarioOutput & { allocation: Allocation }) | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  // ─── Fetch Wallet ────────────────────────────────────────────

  useEffect(() => {
    async function fetchWallet() {
      try {
        const res = await fetch("/api/wallet");
        const json = await res.json();
        if (json.error) {
          setWalletError(json.error);
        } else {
          setWalletCards(json.data ?? []);
        }
      } catch {
        setWalletError("Failed to load wallet");
      } finally {
        setLoadingWallet(false);
      }
    }
    fetchWallet();
  }, []);

  // ─── Card Selection ──────────────────────────────────────────

  const toggleCard = useCallback((userCardId: string) => {
    setSelectedCards((prev) => {
      const next = new Set(prev);
      if (next.has(userCardId)) {
        next.delete(userCardId);
      } else {
        next.add(userCardId);
      }
      return next;
    });
  }, []);

  // ─── Build default allocation (uniform) ──────────────────────

  function buildUniformAllocation(): Allocation {
    const cards = Array.from(selectedCards);
    const pctPerCard = cards.length > 0 ? 100 / cards.length : 0;
    const allocation: Allocation = {};
    for (const cardId of cards) {
      allocation[cardId] = {};
      for (const cat of spendCategories) {
        allocation[cardId][cat.key] = pctPerCard;
      }
    }
    return allocation;
  }

  // ─── Calculate ───────────────────────────────────────────────

  async function handleCalculate() {
    if (selectedCards.size === 0) {
      setError("Select at least one card from your wallet.");
      return;
    }

    const hasSpend = Object.values(monthlySpend).some((v) => v > 0);
    if (!hasSpend) {
      setError("Enter monthly spend in at least one category.");
      return;
    }

    setCalculating(true);
    setError(null);
    setResults(null);
    setOptimizedResults(null);

    try {
      const allocation = buildUniformAllocation();
      const res = await fetch("/api/scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthly_spend: monthlySpend,
          card_ids: Array.from(selectedCards),
          allocation,
          timeframe_months: timeframeMonths,
        }),
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setResults(json.data);
      }
    } catch {
      setError("Calculation failed. Please try again.");
    } finally {
      setCalculating(false);
    }
  }

  // ─── Auto-Optimize ──────────────────────────────────────────

  async function handleOptimize() {
    if (selectedCards.size === 0) {
      setError("Select at least one card from your wallet.");
      return;
    }

    const hasSpend = Object.values(monthlySpend).some((v) => v > 0);
    if (!hasSpend) {
      setError("Enter monthly spend in at least one category.");
      return;
    }

    setCalculating(true);
    setError(null);
    setOptimizedResults(null);

    try {
      const res = await fetch("/api/scenarios?action=optimize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthly_spend: monthlySpend,
          card_ids: Array.from(selectedCards),
          timeframe_months: timeframeMonths,
        }),
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setOptimizedResults(json.data);
      }
    } catch {
      setError("Optimization failed. Please try again.");
    } finally {
      setCalculating(false);
    }
  }

  // ─── Save Scenario ──────────────────────────────────────────

  async function handleSave() {
    if (!results) return;

    const name = prompt("Enter a name for this scenario:");
    if (!name) return;

    try {
      const res = await fetch("/api/scenarios?action=save", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          config: {
            monthly_spend: monthlySpend,
            cards: Array.from(selectedCards),
            allocation: buildUniformAllocation(),
          },
          results: results.results,
        }),
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        alert("Scenario saved successfully!");
      }
    } catch {
      setError("Failed to save scenario.");
    }
  }

  // ─── Render helpers ─────────────────────────────────────────

  function getCardLabel(wc: WalletCardData): string {
    return wc.nickname ?? wc.card.name;
  }

  // ─── Render ──────────────────────────────────────────────────

  return (
    <VStack gap={8} align="stretch">
      <Box>
        <Heading size="xl">Scenario Modeling</Heading>
        <Text color="fg.muted" mt={1}>
          Model different spend strategies and see how many points you could
          earn.
        </Text>
      </Box>

      {/* Monthly Spend Input */}
      <Box bg="bg.surface" p={6} borderRadius="card" shadow="card">
        <HStack justifyContent="space-between" mb={4} flexWrap="wrap" gap={3}>
          <Heading size="md">Monthly Spend by Category</Heading>
          <HStack>
            <Text fontSize="sm" color="fg.muted">
              Timeframe:
            </Text>
            <Input
              type="number"
              value={timeframeMonths}
              onChange={(e) =>
                setTimeframeMonths(Math.max(1, parseInt(e.target.value) || 12))
              }
              w="80px"
              size="sm"
              min={1}
              max={120}
            />
            <Text fontSize="sm" color="fg.muted">
              months
            </Text>
          </HStack>
        </HStack>
        <VStack gap={3} align="stretch">
          {spendCategories.map((cat) => (
            <HStack key={cat.key} justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Text w={{ base: "full", sm: "200px" }} fontSize="sm">
                {cat.label}
              </Text>
              <HStack>
                <Text color="fg.muted">$</Text>
                <Input
                  type="number"
                  placeholder="0"
                  w="150px"
                  size="sm"
                  value={monthlySpend[cat.key] || ""}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setMonthlySpend((prev) => ({ ...prev, [cat.key]: val }));
                  }}
                />
              </HStack>
            </HStack>
          ))}
          <Separator />
          <HStack justifyContent="space-between">
            <Text w="200px" fontSize="sm" fontWeight="bold">
              Total Monthly Spend
            </Text>
            <Text fontWeight="bold">
              ${fmt(Object.values(monthlySpend).reduce((a, b) => a + b, 0))}
            </Text>
          </HStack>
        </VStack>
      </Box>

      {/* Card Selection */}
      <Box bg="bg.surface" p={6} borderRadius="card" shadow="card">
        <Heading size="md" mb={4}>
          Cards to Compare
        </Heading>
        {loadingWallet ? (
          <HStack justifyContent="center" py={4}>
            <Spinner size="sm" />
            <Text color="fg.muted" fontSize="sm">
              Loading wallet...
            </Text>
          </HStack>
        ) : walletError ? (
          <Text color="danger.fg" fontSize="sm">
            {walletError}
          </Text>
        ) : walletCards.length === 0 ? (
          <Text color="fg.muted" fontSize="sm">
            No cards in your wallet. Add cards from the{" "}
            <Text as="span" fontWeight="bold">
              My Cards
            </Text>{" "}
            page first.
          </Text>
        ) : (
          <VStack gap={2} align="stretch">
            {walletCards.map((wc) => {
              const version = wc.card.versions[0];
              const isSelected = selectedCards.has(wc.id);
              return (
                <Box
                  key={wc.id}
                  p={3}
                  borderWidth="1px"
                  borderColor={isSelected ? "brand.emphasized" : "border.default"}
                  borderRadius="md"
                  bg={isSelected ? "brand.subtle" : "bg.surface"}
                  cursor="pointer"
                  onClick={() => toggleCard(wc.id)}
                  _hover={{ borderColor: "brand.emphasized" }}
                >
                  <HStack justifyContent="space-between">
                    <HStack>
                      <Checkbox.Root
                        checked={isSelected}
                        onCheckedChange={() => toggleCard(wc.id)}
                        size="sm"
                      >
                        <Checkbox.HiddenInput />
                        <Checkbox.Control />
                      </Checkbox.Root>
                      <VStack gap={0} align="start">
                        <Text fontWeight="medium" fontSize="sm">
                          {getCardLabel(wc)}
                        </Text>
                        <Text fontSize="xs" color="fg.muted">
                          {wc.card.issuer.replace(/_/g, " ").toUpperCase()} -{" "}
                          {wc.card.network.toUpperCase()}
                        </Text>
                      </VStack>
                    </HStack>
                    <HStack gap={1} flexWrap="wrap" justifyContent="flex-end">
                      {version?.categoryBonuses
                        .slice(0, 4)
                        .map((b) => (
                          <Badge key={b.category} size="sm" colorPalette="green">
                            {b.category}: {b.multiplier}x
                          </Badge>
                        ))}
                      <Badge size="sm" colorPalette="gray">
                        Base: {version?.baseEarnRate.points_per_dollar ?? 1}x
                      </Badge>
                    </HStack>
                  </HStack>
                </Box>
              );
            })}
            <Text fontSize="xs" color="fg.muted" mt={1}>
              {selectedCards.size} card{selectedCards.size !== 1 ? "s" : ""}{" "}
              selected
            </Text>
          </VStack>
        )}
      </Box>

      {/* Error */}
      {error && (
        <Box bg="danger.subtle" p={4} borderRadius="md" borderWidth="1px" borderColor="danger.muted">
          <Text color="danger.fg" fontSize="sm">
            {error}
          </Text>
        </Box>
      )}

      {/* Actions */}
      <HStack justifyContent="flex-end" gap={3} flexWrap="wrap">
        <Button
          variant="outline"
          colorPalette="green"
          size="lg"
          onClick={handleOptimize}
          disabled={calculating}
        >
          Auto-Optimize
        </Button>
        <Button
          colorPalette="blue"
          size="lg"
          onClick={handleCalculate}
          disabled={calculating}
        >
          {calculating ? <Spinner size="sm" /> : "Calculate Rewards"}
        </Button>
      </HStack>

      {/* Results: Current Allocation */}
      {results && (
        <ResultsDisplay
          title="Current Allocation (Uniform Split)"
          output={results}
          walletCards={walletCards}
          selectedCards={selectedCards}
          timeframeMonths={timeframeMonths}
          onSave={handleSave}
        />
      )}

      {/* Results: Optimized Allocation */}
      {optimizedResults && (
        <ResultsDisplay
          title="Optimized Allocation (Best Card per Category)"
          output={optimizedResults}
          walletCards={walletCards}
          selectedCards={selectedCards}
          timeframeMonths={timeframeMonths}
          allocation={optimizedResults.allocation}
          isOptimized
        />
      )}

      {/* Comparison */}
      {results && optimizedResults && (
        <ComparisonDisplay
          current={results}
          optimized={optimizedResults}
          timeframeMonths={timeframeMonths}
        />
      )}
    </VStack>
  );
}

// ─── Results Display ─────────────────────────────────────────────

function ResultsDisplay({
  title,
  output,
  walletCards,
  selectedCards,
  timeframeMonths,
  onSave,
  allocation,
  isOptimized,
}: {
  title: string;
  output: ScenarioOutput;
  walletCards: WalletCardData[];
  selectedCards: Set<string>;
  timeframeMonths: number;
  onSave?: () => void;
  allocation?: Allocation;
  isOptimized?: boolean;
}) {
  const { results, detail } = output;

  return (
    <Box bg="bg.surface" p={6} borderRadius="card" shadow="card">
      <HStack justifyContent="space-between" mb={4} flexWrap="wrap" gap={2}>
        <Heading size="md">{title}</Heading>
        {onSave && (
          <Button size="sm" variant="outline" onClick={onSave}>
            Save Scenario
          </Button>
        )}
      </HStack>

      {/* Summary Stat Cards */}
      <SimpleGrid columns={{ base: 2, md: 4 }} gap={4} mb={6}>
        <StatCard
          label="Total Points"
          value={fmtPts(results.total_points)}
          subtext={`over ${timeframeMonths} months`}
          color="blue"
        />
        <StatCard
          label="Point Value"
          value={`$${fmt(results.total_cashback)}`}
          subtext="estimated cash value"
          color="green"
        />
        <StatCard
          label="Credits Value"
          value={`$${fmt(detail.per_card.reduce((s, c) => s + c.credits_value, 0))}`}
          subtext="statement credits"
          color="purple"
        />
        <StatCard
          label="Net Rewards"
          value={`$${fmt(detail.net_rewards_value)}`}
          subtext="value - fees"
          color={detail.net_rewards_value >= 0 ? "green" : "red"}
        />
      </SimpleGrid>

      {/* Per-Card Breakdown */}
      <Heading size="sm" mb={3}>
        Per-Card Breakdown
      </Heading>
      <Box overflowX="auto">
        <Table.Root size="sm" variant="outline">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader>Card</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Points</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Point Value</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Credits</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Ann. Fee</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">Net Fee</Table.ColumnHeader>
              <Table.ColumnHeader textAlign="right">SUB Value</Table.ColumnHeader>
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {detail.per_card.map((card) => (
              <Table.Row key={card.user_card_id}>
                <Table.Cell>
                  <VStack gap={0} align="start">
                    <Text fontWeight="medium" fontSize="sm">
                      {card.card_name}
                    </Text>
                    <Text fontSize="xs" color="fg.muted">
                      ${fmt(card.total_allocated_spend_monthly)}/mo
                    </Text>
                  </VStack>
                </Table.Cell>
                <Table.Cell textAlign="right">{fmtPts(card.points_earned)}</Table.Cell>
                <Table.Cell textAlign="right">${fmt(card.point_value_dollars)}</Table.Cell>
                <Table.Cell textAlign="right">${fmt(card.credits_value)}</Table.Cell>
                <Table.Cell textAlign="right">${fmt(card.annual_fee)}</Table.Cell>
                <Table.Cell textAlign="right">
                  <Text color={card.net_annual_fee > 0 ? "danger.fg" : "success.fg"}>
                    ${fmt(card.net_annual_fee)}
                  </Text>
                </Table.Cell>
                <Table.Cell textAlign="right">
                  {card.sign_up_bonus ? (
                    <VStack gap={0} align="end">
                      <Text fontSize="sm">${fmt(card.sign_up_bonus_value)}</Text>
                      <Badge
                        size="sm"
                        colorPalette={card.can_meet_sub_requirement ? "green" : "orange"}
                      >
                        {card.can_meet_sub_requirement ? "Achievable" : "May not meet req"}
                      </Badge>
                    </VStack>
                  ) : (
                    <Text color="fg.subtle" fontSize="sm">
                      N/A
                    </Text>
                  )}
                </Table.Cell>
              </Table.Row>
            ))}
          </Table.Body>
        </Table.Root>
      </Box>

      {/* Optimized Allocation Details */}
      {isOptimized && allocation && (
        <Box mt={6}>
          <Heading size="sm" mb={3}>
            Optimal Card Assignment per Category
          </Heading>
          <VStack gap={2} align="stretch">
            {spendCategories.map((cat) => {
              // Find which card gets 100% for this category
              const assignedCardId = Object.entries(allocation).find(
                ([, cats]) => (cats[cat.key] ?? 0) === 100
              )?.[0];
              const assignedCard = walletCards.find((wc) => wc.id === assignedCardId);
              return (
                <HStack
                  key={cat.key}
                  justifyContent="space-between"
                  p={2}
                  borderRadius="md"
                  bg="bg.subtle"
                >
                  <Text fontSize="sm">{cat.label}</Text>
                  <HStack>
                    <Text fontSize="sm" fontWeight="medium">
                      {assignedCard?.nickname ?? assignedCard?.card.name ?? "None"}
                    </Text>
                    {assignedCard && (
                      <Badge size="sm" colorPalette="blue">
                        {getMultiplierLabel(assignedCard, cat.key)}
                      </Badge>
                    )}
                  </HStack>
                </HStack>
              );
            })}
          </VStack>
        </Box>
      )}
    </Box>
  );
}

// ─── Comparison Display ──────────────────────────────────────────

function ComparisonDisplay({
  current,
  optimized,
  timeframeMonths,
}: {
  current: ScenarioOutput;
  optimized: ScenarioOutput;
  timeframeMonths: number;
}) {
  const pointsDiff = optimized.results.total_points - current.results.total_points;
  const valueDiff = optimized.detail.net_rewards_value - current.detail.net_rewards_value;

  return (
    <Box
      bg="bg.surface"
      p={6}
      borderRadius="card"
      shadow="card"
      borderWidth="2px"
      borderColor="brand.muted"
    >
      <Heading size="md" mb={4}>
        Comparison: Uniform vs. Optimized
      </Heading>
      <SimpleGrid columns={{ base: 1, md: 3 }} gap={4}>
        <ComparisonStat
          label="Total Points"
          current={fmtPts(current.results.total_points)}
          optimized={fmtPts(optimized.results.total_points)}
          diff={`+${fmtPts(pointsDiff)}`}
          positive={pointsDiff > 0}
        />
        <ComparisonStat
          label="Point Value"
          current={`$${fmt(current.results.total_cashback)}`}
          optimized={`$${fmt(optimized.results.total_cashback)}`}
          diff={`+$${fmt(optimized.results.total_cashback - current.results.total_cashback)}`}
          positive={optimized.results.total_cashback > current.results.total_cashback}
        />
        <ComparisonStat
          label="Net Rewards"
          current={`$${fmt(current.detail.net_rewards_value)}`}
          optimized={`$${fmt(optimized.detail.net_rewards_value)}`}
          diff={`+$${fmt(valueDiff)}`}
          positive={valueDiff > 0}
        />
      </SimpleGrid>
    </Box>
  );
}

// ─── Small Sub-Components ────────────────────────────────────────

const STAT_COLORS: Record<string, { accent: string; bg: string }> = {
  blue: { accent: "brand.400", bg: "bg.subtle" },
  green: { accent: "success.300", bg: "bg.subtle" },
  purple: { accent: "brand.300", bg: "bg.subtle" },
  red: { accent: "danger.300", bg: "bg.subtle" },
};

function StatCard({
  label,
  value,
  subtext,
  color,
}: {
  label: string;
  value: string;
  subtext: string;
  color: string;
}) {
  const c = STAT_COLORS[color] ?? STAT_COLORS.blue;
  return (
    <Box p={4} borderRadius="card" borderWidth="1px" borderColor="border.default" bg={c.bg}>
      <Text fontSize="xs" color="fg.muted" fontWeight="medium">
        {label}
      </Text>
      <Text fontSize="xl" fontWeight="bold" color={c.accent}>
        {value}
      </Text>
      <Text fontSize="xs" color="fg.subtle">
        {subtext}
      </Text>
    </Box>
  );
}

function ComparisonStat({
  label,
  current,
  optimized,
  diff,
  positive,
}: {
  label: string;
  current: string;
  optimized: string;
  diff: string;
  positive: boolean;
}) {
  return (
    <Box p={4} borderRadius="md" bg="bg.subtle">
      <Text fontSize="xs" fontWeight="medium" color="fg.muted" mb={2}>
        {label}
      </Text>
      <HStack justifyContent="space-between" mb={1}>
        <Text fontSize="sm" color="fg.muted">
          Current:
        </Text>
        <Text fontSize="sm">{current}</Text>
      </HStack>
      <HStack justifyContent="space-between" mb={1}>
        <Text fontSize="sm" color="fg.muted">
          Optimized:
        </Text>
        <Text fontSize="sm" fontWeight="bold">
          {optimized}
        </Text>
      </HStack>
      <Separator my={1} />
      <Text
        fontSize="sm"
        fontWeight="bold"
        textAlign="right"
        color={positive ? "success.fg" : "fg.muted"}
      >
        {positive ? diff : "No improvement"}
      </Text>
    </Box>
  );
}

function getMultiplierLabel(wc: WalletCardData, category: string): string {
  const version = wc.card.versions[0];
  if (!version) return "1x";
  const bonus = version.categoryBonuses.find((b) => b.category === category);
  if (bonus) return `${bonus.multiplier}x`;
  return `${version.baseEarnRate.points_per_dollar}x`;
}
