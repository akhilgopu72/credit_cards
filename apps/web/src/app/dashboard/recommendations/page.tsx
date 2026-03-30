"use client";

import { useState } from "react";
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
  Switch,
  Checkbox,
  Table,
} from "@chakra-ui/react";
import { ISSUER_PALETTE, ISSUER_LABELS } from "@/types/api";
import type { CardEvaluation, RecommendOutput, PerkPreferences } from "@/server/services/scenario-engine";

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

// ─── Toggleable Perks ────────────────────────────────────────────

const toggleablePerks = [
  { key: "entertainment_credit", label: "Entertainment Credits", description: "Disney+, Hulu, ESPN+, etc." },
  { key: "hotel_credit", label: "Hotel Credits", description: "Hilton, Marriott property credits" },
  { key: "airline_credit", label: "Airline Credits", description: "Airline incidental fee credits" },
  { key: "wellness_credit", label: "Wellness Credits", description: "Equinox, SoulCycle, etc." },
  { key: "shopping_credit", label: "Shopping Credits", description: "Saks, lululemon, etc." },
];

// ─── Formatting helpers ──────────────────────────────────────────

function fmt(n: number): string {
  return n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function fmtPts(n: number): string {
  return Math.round(n).toLocaleString("en-US");
}

function issuerLabel(issuer: string): string {
  return ISSUER_LABELS[issuer] ?? issuer.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ─── Component ───────────────────────────────────────────────────

export default function RecommendationsPage() {
  // Spend input
  const [monthlySpend, setMonthlySpend] = useState<Record<string, number>>(() => {
    const initial: Record<string, number> = {};
    for (const cat of spendCategories) {
      initial[cat.key] = 0;
    }
    return initial;
  });

  // Perk preferences
  const [perkPrefs, setPerkPrefs] = useState<PerkPreferences>({
    enabled: {
      entertainment_credit: false,
      hotel_credit: false,
      airline_credit: true,
      wellness_credit: false,
      shopping_credit: true,
    },
  });

  // Sort mode
  const [sortByYear1, setSortByYear1] = useState(true);

  // Results
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<RecommendOutput | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Expanded card details
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  // Comparison mode
  const [compareIds, setCompareIds] = useState<Set<string>>(new Set());

  function toggleCompare(cardId: string) {
    setCompareIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else if (next.size < 3) {
        next.add(cardId);
      }
      return next;
    });
  }

  const compareCards = results
    ? results.recommendations.filter((c) => compareIds.has(c.card_id))
    : [];

  // ─── Fetch Recommendations ────────────────────────────────────

  async function handleRecommend() {
    const hasSpend = Object.values(monthlySpend).some((v) => v > 0);
    if (!hasSpend) {
      setError("Enter monthly spend in at least one category.");
      return;
    }

    setLoading(true);
    setError(null);
    setResults(null);
    setExpandedCard(null);

    try {
      const res = await fetch("/api/scenarios?action=recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          monthly_spend: monthlySpend,
          perk_preferences: perkPrefs,
          max_results: 20,
          include_year1_sub: sortByYear1,
        }),
      });
      const json = await res.json();
      if (json.error) {
        setError(json.error);
      } else {
        setResults(json.data);
      }
    } catch {
      setError("Failed to get recommendations. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  const totalMonthly = Object.values(monthlySpend).reduce((a, b) => a + b, 0);

  return (
    <VStack gap={8} align="stretch">
      <Box>
        <Heading size="xl">Card Recommendations</Heading>
        <Text color="fg.muted" mt={1}>
          Find the best credit cards for your spending profile. We evaluate every
          card in our database and rank them by net value.
        </Text>
      </Box>

      {/* Monthly Spend Input */}
      <Box bg="bg.surface" p={6} borderRadius="card" shadow="card">
        <Heading size="md" mb={4}>
          Monthly Spend by Category
        </Heading>
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
            <Text fontWeight="bold">${fmt(totalMonthly)}</Text>
          </HStack>
        </VStack>
      </Box>

      {/* Perk Preferences */}
      <Box bg="bg.surface" p={6} borderRadius="card" shadow="card">
        <VStack align="stretch" gap={1} mb={4}>
          <Heading size="md">Perk Preferences</Heading>
          <Text fontSize="sm" color="fg.muted">
            Toggle which card perks you would actually use. Statement credits
            and travel credits are always counted.
          </Text>
        </VStack>
        <VStack gap={3} align="stretch">
          {toggleablePerks.map((perk) => (
            <HStack key={perk.key} justifyContent="space-between">
              <VStack gap={0} align="start">
                <Text fontSize="sm">{perk.label}</Text>
                <Text fontSize="xs" color="fg.muted">
                  {perk.description}
                </Text>
              </VStack>
              <Switch.Root
                checked={perkPrefs.enabled[perk.key] ?? false}
                onCheckedChange={(e) => {
                  setPerkPrefs((prev) => ({
                    enabled: { ...prev.enabled, [perk.key]: e.checked },
                  }));
                }}
                size="sm"
              >
                <Switch.HiddenInput />
                <Switch.Control>
                  <Switch.Thumb />
                </Switch.Control>
              </Switch.Root>
            </HStack>
          ))}
        </VStack>
      </Box>

      {/* Actions */}
      <HStack justifyContent="space-between" flexWrap="wrap" gap={3}>
        <HStack gap={3}>
          <Text fontSize="sm" color="fg.muted">
            Sort by:
          </Text>
          <Button
            size="sm"
            variant={sortByYear1 ? "solid" : "outline"}
            colorPalette="blue"
            onClick={() => setSortByYear1(true)}
          >
            Year 1 Value
          </Button>
          <Button
            size="sm"
            variant={!sortByYear1 ? "solid" : "outline"}
            colorPalette="blue"
            onClick={() => setSortByYear1(false)}
          >
            Ongoing Value
          </Button>
        </HStack>
        <Button
          colorPalette="blue"
          size="lg"
          onClick={handleRecommend}
          disabled={loading}
        >
          {loading ? <Spinner size="sm" /> : "Find Best Cards"}
        </Button>
      </HStack>

      {/* Error */}
      {error && (
        <Box bg="danger.subtle" p={4} borderRadius="md" borderWidth="1px" borderColor="danger.muted">
          <Text color="danger.fg" fontSize="sm">
            {error}
          </Text>
        </Box>
      )}

      {/* Results */}
      {results && (
        <VStack gap={4} align="stretch">
          <HStack justifyContent="space-between">
            <Heading size="md">
              Top {results.recommendations.length} Cards for Your Spend
            </Heading>
            <HStack gap={4}>
              {compareIds.size > 0 && (
                <Badge colorPalette="purple" size="sm">
                  {compareIds.size}/3 selected for comparison
                </Badge>
              )}
              <Text fontSize="sm" color="fg.muted">
                ${fmt(results.total_monthly_spend)}/mo total spend
              </Text>
            </HStack>
          </HStack>

          {/* Comparison Panel */}
          {compareCards.length >= 2 && (
            <CardComparison
              cards={compareCards}
              sortByYear1={sortByYear1}
              onClear={() => setCompareIds(new Set())}
            />
          )}

          {results.recommendations.map((card, index) => (
            <CardRecommendation
              key={card.card_id}
              card={card}
              rank={index + 1}
              sortByYear1={sortByYear1}
              expanded={expandedCard === card.card_id}
              onToggle={() =>
                setExpandedCard(
                  expandedCard === card.card_id ? null : card.card_id
                )
              }
              isComparing={compareIds.has(card.card_id)}
              onCompareToggle={() => toggleCompare(card.card_id)}
              compareDisabled={compareIds.size >= 3 && !compareIds.has(card.card_id)}
            />
          ))}
        </VStack>
      )}
    </VStack>
  );
}

// ─── Card Recommendation Row ──────────────────────────────────────

function CardRecommendation({
  card,
  rank,
  sortByYear1,
  expanded,
  onToggle,
  isComparing,
  onCompareToggle,
  compareDisabled,
}: {
  card: CardEvaluation;
  rank: number;
  sortByYear1: boolean;
  expanded: boolean;
  onToggle: () => void;
  isComparing: boolean;
  onCompareToggle: () => void;
  compareDisabled: boolean;
}) {
  const netValue = sortByYear1 ? card.net_value_year1 : card.net_value_ongoing;
  const palette = ISSUER_PALETTE[card.issuer] ?? "gray";
  const isPositive = netValue >= 0;

  return (
    <Box
      bg="bg.surface"
      borderRadius="card"
      shadow="card"
      overflow="hidden"
      borderWidth={isComparing ? "2px" : "0"}
      borderColor={isComparing ? "brand.400" : "transparent"}
    >
      {/* Main row */}
      <Box
        p={5}
        cursor="pointer"
        onClick={onToggle}
        _hover={{ bg: "bg.subtle" }}
        transition="background 0.15s"
      >
        <HStack justifyContent="space-between" align="start">
          <HStack gap={4} align="start">
            {/* Rank */}
            <Box
              w={8}
              h={8}
              borderRadius="full"
              bg={rank <= 3 ? "bg.muted" : "bg.subtle"}
              display="flex"
              alignItems="center"
              justifyContent="center"
              flexShrink={0}
              mt={0.5}
            >
              <Text
                fontSize="sm"
                fontWeight="bold"
                color={rank <= 3 ? "fg.default" : "fg.muted"}
              >
                {rank}
              </Text>
            </Box>

            {/* Card info */}
            <VStack gap={1} align="start">
              <HStack gap={2}>
                <Text fontWeight="bold" fontSize="md">
                  {card.card_name}
                </Text>
                <Badge size="sm" colorPalette={palette}>
                  {issuerLabel(card.issuer)}
                </Badge>
              </HStack>
              <HStack gap={4} flexWrap="wrap">
                <Text fontSize="xs" color="fg.muted">
                  {card.network.toUpperCase()}
                </Text>
                <Text fontSize="xs" color="fg.muted">
                  Annual fee: ${fmt(card.annual_fee)}
                </Text>
                {card.sign_up_bonus && card.can_meet_sub_requirement && (
                  <Badge size="sm" colorPalette="green">
                    SUB: ${fmt(card.sign_up_bonus_value)}
                  </Badge>
                )}
              </HStack>
            </VStack>
          </HStack>

          {/* Net value + compare */}
          <HStack gap={4} flexShrink={0} align="start">
            <VStack gap={0} align="end">
              <Text
                fontSize="xl"
                fontWeight="bold"
                color={isPositive ? "success.fg" : "danger.fg"}
              >
                {isPositive ? "+" : ""}${fmt(netValue)}
              </Text>
              <Text fontSize="xs" color="fg.muted">
                {sortByYear1 ? "year 1 net value" : "ongoing/year"}
              </Text>
            </VStack>
            <Box pt={1} onClick={(e) => e.stopPropagation()}>
              <Checkbox.Root
                checked={isComparing}
                onCheckedChange={onCompareToggle}
                disabled={compareDisabled}
                size="sm"
              >
                <Checkbox.HiddenInput />
                <Checkbox.Control />
                <Checkbox.Label>
                  <Text fontSize="xs" color="fg.muted">Compare</Text>
                </Checkbox.Label>
              </Checkbox.Root>
            </Box>
          </HStack>
        </HStack>

        {/* Quick stats */}
        <SimpleGrid columns={{ base: 2, md: 4 }} gap={3} mt={4}>
          <MiniStat label="Rewards" value={`$${fmt(card.rewards_value_annual)}`} color="blue" />
          <MiniStat label="Credits" value={`$${fmt(card.credits_value_annual)}`} color="purple" />
          <MiniStat label="Annual Fee" value={`-$${fmt(card.annual_fee)}`} color="red" />
          <MiniStat
            label="Points/yr"
            value={fmtPts(card.total_points_annual)}
            color="green"
          />
        </SimpleGrid>
      </Box>

      {/* Expanded detail */}
      {expanded && (
        <Box px={5} pb={5} pt={0}>
          <Separator mb={4} />

          {/* Category rewards breakdown */}
          <Heading size="sm" mb={3}>
            Rewards by Category
          </Heading>
          <VStack gap={2} align="stretch" mb={5}>
            {card.category_rewards
              .filter((cr) => cr.monthly_spend > 0)
              .sort((a, b) => b.dollar_value_annual - a.dollar_value_annual)
              .map((cr) => (
                <HStack key={cr.category} justifyContent="space-between" px={2} py={1.5} bg="bg.subtle" borderRadius="md" flexWrap="wrap">
                  <HStack gap={3}>
                    <Text fontSize="sm" w="160px">
                      {formatCategory(cr.category)}
                    </Text>
                    <Badge size="sm" colorPalette={cr.multiplier > 1 ? "green" : "gray"}>
                      {cr.multiplier}x
                    </Badge>
                    {cr.capped && (
                      <Badge size="sm" colorPalette="orange">
                        Capped
                      </Badge>
                    )}
                  </HStack>
                  <HStack gap={4}>
                    <Text fontSize="xs" color="fg.muted">
                      {fmtPts(cr.points_annual)} pts
                    </Text>
                    <Text fontSize="sm" fontWeight="medium">
                      ${fmt(cr.dollar_value_annual)}/yr
                    </Text>
                  </HStack>
                </HStack>
              ))}
          </VStack>

          {/* Benefits breakdown */}
          {card.benefits_detail.length > 0 && (
            <>
              <Heading size="sm" mb={3}>
                Benefits & Credits
              </Heading>
              <VStack gap={2} align="stretch" mb={5}>
                {card.benefits_detail
                  .filter((b) => b.annual_value > 0)
                  .sort((a, b) => b.annual_value - a.annual_value)
                  .map((b, i) => (
                    <HStack key={i} justifyContent="space-between" px={2} py={1.5} bg="bg.subtle" borderRadius="md" flexWrap="wrap">
                      <HStack gap={2}>
                        <Text fontSize="sm">{b.name}</Text>
                        <Badge
                          size="sm"
                          colorPalette={
                            b.tier === "auto"
                              ? "green"
                              : b.tier === "toggle"
                                ? b.included
                                  ? "blue"
                                  : "gray"
                                : "gray"
                          }
                        >
                          {b.tier === "auto"
                            ? "Auto"
                            : b.tier === "toggle"
                              ? b.included
                                ? "Included"
                                : "Not using"
                              : "Excluded"}
                        </Badge>
                      </HStack>
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        color={b.included ? "inherit" : "fg.subtle"}
                        textDecoration={b.included ? "none" : "line-through"}
                      >
                        ${fmt(b.annual_value)}/yr
                      </Text>
                    </HStack>
                  ))}
              </VStack>
            </>
          )}

          {/* Sign-up bonus detail */}
          {card.sign_up_bonus && (
            <Box bg="brand.subtle" p={4} borderRadius="md" mb={4}>
              <HStack justifyContent="space-between" mb={1}>
                <Text fontSize="sm" fontWeight="bold" color="brand.fg">
                  Sign-Up Bonus
                </Text>
                <Text fontSize="sm" fontWeight="bold" color="brand.fg">
                  ${fmt(card.sign_up_bonus_value)}
                </Text>
              </HStack>
              <Text fontSize="xs" color="brand.emphasized">
                Earn {fmtPts(card.sign_up_bonus.points)} {card.sign_up_bonus.currency} after
                spending ${fmt(card.sign_up_bonus.spend_requirement)} in{" "}
                {card.sign_up_bonus.timeframe_months} months
              </Text>
              <Badge
                size="sm"
                mt={2}
                colorPalette={card.can_meet_sub_requirement ? "green" : "orange"}
              >
                {card.can_meet_sub_requirement
                  ? "You can meet this requirement"
                  : "May be hard to meet with your spend"}
              </Badge>
            </Box>
          )}

          {/* Value summary */}
          <Box bg="bg.subtle" p={4} borderRadius="md">
            <Heading size="sm" mb={3}>
              Value Summary
            </Heading>
            <VStack gap={1} align="stretch">
              <HStack justifyContent="space-between">
                <Text fontSize="sm">Annual rewards value</Text>
                <Text fontSize="sm" fontWeight="medium">
                  +${fmt(card.rewards_value_annual)}
                </Text>
              </HStack>
              <HStack justifyContent="space-between">
                <Text fontSize="sm">Credits & perks value</Text>
                <Text fontSize="sm" fontWeight="medium">
                  +${fmt(card.credits_value_annual)}
                </Text>
              </HStack>
              {card.sign_up_bonus && card.can_meet_sub_requirement && (
                <HStack justifyContent="space-between">
                  <Text fontSize="sm">Sign-up bonus (year 1)</Text>
                  <Text fontSize="sm" fontWeight="medium">
                    +${fmt(card.sign_up_bonus_value)}
                  </Text>
                </HStack>
              )}
              <HStack justifyContent="space-between">
                <Text fontSize="sm">Annual fee</Text>
                <Text fontSize="sm" fontWeight="medium" color="danger.fg">
                  -${fmt(card.annual_fee)}
                </Text>
              </HStack>
              <Separator my={1} />
              <HStack justifyContent="space-between">
                <Text fontSize="sm" fontWeight="bold">
                  Net value (year 1)
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color={card.net_value_year1 >= 0 ? "success.fg" : "danger.fg"}
                >
                  ${fmt(card.net_value_year1)}
                </Text>
              </HStack>
              <HStack justifyContent="space-between">
                <Text fontSize="sm" fontWeight="bold">
                  Net value (ongoing)
                </Text>
                <Text
                  fontSize="sm"
                  fontWeight="bold"
                  color={card.net_value_ongoing >= 0 ? "success.fg" : "danger.fg"}
                >
                  ${fmt(card.net_value_ongoing)}/yr
                </Text>
              </HStack>
            </VStack>
          </Box>

          {/* Apply CTA */}
          {card.affiliate_url && (
            <a
              href={card.affiliate_url}
              target="_blank"
              rel="noopener noreferrer"
              style={{ display: "block", marginTop: "16px" }}
            >
              <Button colorPalette="green" size="lg" w="full">
                Apply Now
              </Button>
            </a>
          )}
        </Box>
      )}
    </Box>
  );
}

// ─── Small Sub-Components ────────────────────────────────────────

const MINI_STAT_COLORS: Record<string, string> = {
  blue: "brand.400",
  green: "success.300",
  purple: "brand.300",
  red: "danger.300",
};

function MiniStat({
  label,
  value,
  color,
}: {
  label: string;
  value: string;
  color: string;
}) {
  const accent = MINI_STAT_COLORS[color] ?? "fg.muted";
  return (
    <Box px={3} py={2} borderRadius="card" bg="bg.subtle">
      <Text fontSize="xs" color="fg.muted">
        {label}
      </Text>
      <Text fontSize="sm" fontWeight="bold" color={accent}>
        {value}
      </Text>
    </Box>
  );
}

// ─── Card Comparison View ──────────────────────────────────────

function CardComparison({
  cards,
  sortByYear1,
  onClear,
}: {
  cards: CardEvaluation[];
  sortByYear1: boolean;
  onClear: () => void;
}) {
  // Collect all categories across all cards
  const allCategories = new Set<string>();
  for (const card of cards) {
    for (const cr of card.category_rewards) {
      if (cr.monthly_spend > 0) allCategories.add(cr.category);
    }
  }
  const categories = Array.from(allCategories).sort();

  function getRewardForCategory(card: CardEvaluation, category: string) {
    return card.category_rewards.find((cr) => cr.category === category);
  }

  // Find the winner for each row
  function bestIdx(values: number[]): number {
    let best = 0;
    for (let i = 1; i < values.length; i++) {
      if (values[i] > values[best]) best = i;
    }
    return best;
  }

  return (
    <Box
      bg="bg.surface"
      p={6}
      borderRadius="card"
      shadow="card"
      borderWidth="2px"
      borderColor="brand.400"
    >
      <HStack justifyContent="space-between" mb={4}>
        <Heading size="md">Card Comparison</Heading>
        <Button size="sm" variant="ghost" onClick={onClear}>
          Clear
        </Button>
      </HStack>

      <Box overflowX="auto">
        <Table.Root size="sm" variant="outline">
          <Table.Header>
            <Table.Row>
              <Table.ColumnHeader w="160px">Metric</Table.ColumnHeader>
              {cards.map((card) => (
                <Table.ColumnHeader key={card.card_id} textAlign="right">
                  <VStack gap={0} align="end">
                    <Text fontWeight="bold" fontSize="sm">{card.card_name}</Text>
                    <Badge size="sm" colorPalette={ISSUER_PALETTE[card.issuer] ?? "gray"}>
                      {issuerLabel(card.issuer)}
                    </Badge>
                  </VStack>
                </Table.ColumnHeader>
              ))}
            </Table.Row>
          </Table.Header>
          <Table.Body>
            {/* Annual Fee */}
            <Table.Row>
              <Table.Cell fontWeight="medium">Annual Fee</Table.Cell>
              {cards.map((card, i) => {
                const best = bestIdx(cards.map((c) => -c.annual_fee));
                return (
                  <Table.Cell key={card.card_id} textAlign="right">
                    <Text fontWeight={i === best ? "bold" : "normal"} color={i === best ? "success.300" : undefined}>
                      ${fmt(card.annual_fee)}
                    </Text>
                  </Table.Cell>
                );
              })}
            </Table.Row>

            {/* Category Rewards */}
            {categories.map((category) => {
              const values = cards.map((card) => {
                const cr = getRewardForCategory(card, category);
                return cr?.dollar_value_annual ?? 0;
              });
              const winner = bestIdx(values);
              return (
                <Table.Row key={category}>
                  <Table.Cell>
                    <Text fontSize="sm">{formatCategory(category)}</Text>
                  </Table.Cell>
                  {cards.map((card, i) => {
                    const cr = getRewardForCategory(card, category);
                    return (
                      <Table.Cell key={card.card_id} textAlign="right">
                        <VStack gap={0} align="end">
                          <Text
                            fontSize="sm"
                            fontWeight={i === winner ? "bold" : "normal"}
                            color={i === winner ? "success.300" : undefined}
                          >
                            ${fmt(cr?.dollar_value_annual ?? 0)}
                          </Text>
                          <Text fontSize="xs" color="fg.muted">
                            {cr?.multiplier ?? 1}x
                          </Text>
                        </VStack>
                      </Table.Cell>
                    );
                  })}
                </Table.Row>
              );
            })}

            <Table.Row>
              <Table.Cell fontWeight="medium">Total Rewards</Table.Cell>
              {cards.map((card, i) => {
                const best = bestIdx(cards.map((c) => c.rewards_value_annual));
                return (
                  <Table.Cell key={card.card_id} textAlign="right">
                    <Text fontWeight={i === best ? "bold" : "normal"} color={i === best ? "success.300" : undefined}>
                      ${fmt(card.rewards_value_annual)}
                    </Text>
                  </Table.Cell>
                );
              })}
            </Table.Row>

            <Table.Row>
              <Table.Cell fontWeight="medium">Credits & Perks</Table.Cell>
              {cards.map((card, i) => {
                const best = bestIdx(cards.map((c) => c.credits_value_annual));
                return (
                  <Table.Cell key={card.card_id} textAlign="right">
                    <Text fontWeight={i === best ? "bold" : "normal"} color={i === best ? "brand.300" : undefined}>
                      ${fmt(card.credits_value_annual)}
                    </Text>
                  </Table.Cell>
                );
              })}
            </Table.Row>

            {/* SUB */}
            <Table.Row>
              <Table.Cell fontWeight="medium">Sign-Up Bonus</Table.Cell>
              {cards.map((card, i) => {
                const best = bestIdx(cards.map((c) => c.can_meet_sub_requirement ? c.sign_up_bonus_value : 0));
                const val = card.can_meet_sub_requirement ? card.sign_up_bonus_value : 0;
                return (
                  <Table.Cell key={card.card_id} textAlign="right">
                    {card.sign_up_bonus ? (
                      <VStack gap={0} align="end">
                        <Text fontWeight={i === best ? "bold" : "normal"} color={i === best ? "brand.400" : undefined}>
                          ${fmt(val)}
                        </Text>
                        <Badge size="sm" colorPalette={card.can_meet_sub_requirement ? "green" : "orange"}>
                          {card.can_meet_sub_requirement ? "Meetable" : "Hard"}
                        </Badge>
                      </VStack>
                    ) : (
                      <Text color="fg.subtle">N/A</Text>
                    )}
                  </Table.Cell>
                );
              })}
            </Table.Row>

            {/* Net Value Year 1 */}
            <Table.Row bg={sortByYear1 ? "brand.subtle" : undefined}>
              <Table.Cell fontWeight="bold">Net Value (Year 1)</Table.Cell>
              {cards.map((card, i) => {
                const best = bestIdx(cards.map((c) => c.net_value_year1));
                return (
                  <Table.Cell key={card.card_id} textAlign="right">
                    <Text
                      fontWeight="bold"
                      fontSize="md"
                      color={i === best ? "success.300" : card.net_value_year1 >= 0 ? "success.fg" : "danger.fg"}
                    >
                      ${fmt(card.net_value_year1)}
                    </Text>
                  </Table.Cell>
                );
              })}
            </Table.Row>

            {/* Net Value Ongoing */}
            <Table.Row bg={!sortByYear1 ? "brand.subtle" : undefined}>
              <Table.Cell fontWeight="bold">Net Value (Ongoing)</Table.Cell>
              {cards.map((card, i) => {
                const best = bestIdx(cards.map((c) => c.net_value_ongoing));
                return (
                  <Table.Cell key={card.card_id} textAlign="right">
                    <Text
                      fontWeight="bold"
                      fontSize="md"
                      color={i === best ? "success.300" : card.net_value_ongoing >= 0 ? "success.fg" : "danger.fg"}
                    >
                      ${fmt(card.net_value_ongoing)}/yr
                    </Text>
                  </Table.Cell>
                );
              })}
            </Table.Row>
          </Table.Body>
        </Table.Root>
      </Box>
    </Box>
  );
}

// ─── Helpers ──────────────────────────────────────────────────────

function formatCategory(key: string): string {
  const labels: Record<string, string> = {
    dining: "Dining & Restaurants",
    groceries: "Groceries",
    travel: "Travel",
    gas: "Gas",
    streaming: "Streaming",
    online_shopping: "Online Shopping",
    transit: "Transit & Rideshare",
    general: "Everything Else",
    drugstores: "Drugstores",
    home_improvement: "Home Improvement",
    hotels: "Hotels",
    airlines: "Airlines",
    car_rental: "Car Rental",
  };
  return labels[key] ?? key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}
