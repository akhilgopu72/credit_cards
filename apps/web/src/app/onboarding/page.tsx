"use client";

import {
  Box,
  Heading,
  Text,
  VStack,
  HStack,
  Flex,
  SimpleGrid,
  Container,
} from "@chakra-ui/react";
import { useState } from "react";
import Link from "next/link";

// ─── Types ───────────────────────────────────────────────────────

type Step = 1 | 2 | 3;

// ─── HARDCODED: Popular cards for Step 1 ─────────────────────────
// Needs: GET /api/cards?popular=true to show most-owned cards
const POPULAR_CARDS = [
  { id: "csr", issuer: "CHASE", name: "Sapphire Reserve", color: "#003087", selected: true },
  { id: "amex-gold", issuer: "AMEX", name: "Gold Card", color: "#006fcf", selected: true },
  { id: "venture-x", issuer: "CAPITAL ONE", name: "Venture X", color: "#004977", selected: true },
  { id: "cfu", issuer: "CHASE", name: "Freedom Unlimited", color: "#113562", selected: false },
  { id: "amex-plat", issuer: "AMEX", name: "Platinum Card", color: "#006fcf", selected: false },
  { id: "bcp", issuer: "AMEX", name: "Blue Cash Preferred", color: "#006fcf", selected: false },
];

// ─── HARDCODED: Default spend for Step 2 ─────────────────────────
// Needs: Pre-fill from Plaid transaction aggregation if connected
const DEFAULT_SPEND = [
  { key: "dining", label: "Dining & Restaurants", value: 500 },
  { key: "groceries", label: "Groceries", value: 800 },
  { key: "travel", label: "Travel", value: 300 },
  { key: "gas", label: "Gas", value: 200 },
  { key: "online_shopping", label: "Online Shopping", value: 400 },
  { key: "general", label: "Everything Else", value: 1500 },
];

// ─── HARDCODED: Results for Step 3 ───────────────────────────────
// Needs: Call POST /api/scenarios?action=recommend with user's spend + selected cards
const MOCK_RESULTS = {
  annualValue: 4200,
  pointsPerYear: 284000,
  bestPerCategory: [
    { category: "Dining", card: "Amex Gold", multiplier: "4x" },
    { category: "Groceries", card: "Blue Cash Preferred", multiplier: "6%" },
    { category: "Travel", card: "Sapphire Reserve", multiplier: "3x" },
  ],
  potentialUpside: 800,
};

export default function OnboardingPage() {
  const [step, setStep] = useState<Step>(1);
  const [selectedCards, setSelectedCards] = useState<Set<string>>(
    new Set(POPULAR_CARDS.filter((c) => c.selected).map((c) => c.id))
  );
  const [spend, setSpend] = useState<Record<string, number>>(
    Object.fromEntries(DEFAULT_SPEND.map((s) => [s.key, s.value]))
  );

  const totalSpend = Object.values(spend).reduce((a, b) => a + b, 0);

  return (
    <Box minH="100vh" bg="bg.page" position="relative" overflow="hidden">
      {/* Background glows */}
      <Box position="fixed" top={0} right={0} w="500px" h="500px" bg="rgba(63,255,139,0.03)" borderRadius="full" filter="blur(120px)" pointerEvents="none" />
      <Box position="fixed" bottom={0} left={0} w="600px" h="600px" bg="rgba(110,155,255,0.03)" borderRadius="full" filter="blur(150px)" pointerEvents="none" />

      {/* Progress bar */}
      <Box position="fixed" top={0} left={0} right={0} zIndex={50}>
        <Flex h="1px" bg="rgba(255,255,255,0.05)">
          <Box h="full" bg="success.300" transition="width 0.5s" w={step === 1 ? "33%" : step === 2 ? "66%" : "100%"} />
        </Flex>
      </Box>

      {/* Header */}
      <Flex justify="space-between" align="center" px={8} py={5}>
        <HStack gap={3}>
          <Box w={8} h={8} bg="success.300" borderRadius="md" display="flex" alignItems="center" justifyContent="center">
            <Text fontWeight="800" fontSize="sm" color="#0e0e0e">C</Text>
          </Box>
          <Text fontWeight="700" fontSize="lg" letterSpacing="-0.02em">CardMax</Text>
        </HStack>
        <HStack gap={6}>
          {[1, 2, 3].map((s) => (
            <HStack key={s} gap={2} opacity={s === step ? 1 : 0.3}>
              <Box w={6} h={6} borderRadius="full" bg={s < step ? "success.300" : s === step ? "fg.default" : "bg.muted"} display="flex" alignItems="center" justifyContent="center">
                <Text fontSize="2xs" fontWeight="900" color={s < step ? "#0e0e0e" : s === step ? "#0e0e0e" : "fg.muted"}>{s < step ? "✓" : s}</Text>
              </Box>
              <Text fontSize="xs" fontWeight="700" display={{ base: "none", md: "block" }}>
                {s === 1 ? "Cards" : s === 2 ? "Spending" : "Results"}
              </Text>
            </HStack>
          ))}
        </HStack>
      </Flex>

      {/* Step Content */}
      <Container maxW="800px" py={12}>
        {step === 1 && (
          <VStack gap={10} align="stretch">
            <Box textAlign="center">
              <Heading size="4xl" fontWeight="800" letterSpacing="-0.04em" lineHeight="1.1" mb={4}>
                Which cards do you carry?
              </Heading>
              <Text color="fg.muted" fontSize="lg">
                Select the credit cards in your wallet. We&apos;ll optimize rewards across all of them.
              </Text>
            </Box>

            {/* Search */}
            <Box bg="#131313" borderRadius="card" px={5} py={3} borderBottomWidth="1px" borderColor="rgba(255,255,255,0.1)">
              <input
                placeholder="Search for a card..."
                style={{ background: "transparent", border: "none", outline: "none", color: "#ffffff", fontSize: "14px", width: "100%" }}
              />
            </Box>

            {/* Card Grid */}
            <SimpleGrid columns={{ base: 2, md: 3 }} gap={4}>
              {POPULAR_CARDS.map((card) => {
                const selected = selectedCards.has(card.id);
                return (
                  <Box
                    key={card.id}
                    h="200px"
                    bg={selected ? "#1a1919" : "#0a0a0a"}
                    borderRadius="lg"
                    p={6}
                    cursor="pointer"
                    borderWidth="1px"
                    borderColor={selected ? "rgba(63,255,139,0.2)" : "rgba(255,255,255,0.05)"}
                    _hover={{ borderColor: "rgba(63,255,139,0.3)", bg: "#1a1919" }}
                    transition="all 0.2s"
                    display="flex"
                    flexDirection="column"
                    justifyContent="space-between"
                    onClick={() => {
                      const next = new Set(selectedCards);
                      next.has(card.id) ? next.delete(card.id) : next.add(card.id);
                      setSelectedCards(next);
                    }}
                    position="relative"
                  >
                    <Flex justify="space-between" align="start">
                      <Box w={12} h={8} bg={card.color} borderRadius="sm" opacity={0.6} />
                      <Box w={8} h={8} borderRadius="full" bg={selected ? "rgba(63,255,139,0.15)" : "#262626"} display="flex" alignItems="center" justifyContent="center" borderWidth="1px" borderColor={selected ? "rgba(63,255,139,0.3)" : "rgba(255,255,255,0.1)"}>
                        <Text fontSize="xs" color={selected ? "success.300" : "fg.subtle"}>
                          {selected ? "✓" : "+"}
                        </Text>
                      </Box>
                    </Flex>
                    <Box>
                      <Text fontSize="2xs" fontWeight="700" color={card.issuer === "CHASE" ? "#6e9bff" : card.issuer === "AMEX" ? "#6e9bff" : "fg.muted"} textTransform="uppercase" letterSpacing="0.15em" mb={1}>
                        {card.issuer}
                      </Text>
                      <Text fontWeight="700" letterSpacing="-0.02em">{card.name}</Text>
                    </Box>
                  </Box>
                );
              })}
            </SimpleGrid>
          </VStack>
        )}

        {step === 2 && (
          <VStack gap={10} align="stretch">
            <Box textAlign="center">
              <Heading size="4xl" fontWeight="800" letterSpacing="-0.04em" lineHeight="1.1" mb={4}>
                Where does your money go?
              </Heading>
              <Text color="fg.muted" fontSize="lg">
                Estimate your monthly spending by category. We&apos;ll use this to find the best card for each purchase.
              </Text>
            </Box>

            <VStack gap={4} align="stretch">
              {DEFAULT_SPEND.map((cat) => (
                <Flex key={cat.key} justify="space-between" align="center" py={2}>
                  <Text fontSize="sm" fontWeight="500">{cat.label}</Text>
                  <Flex bg="#000000" borderRadius="sm" px={4} py={3} borderBottomWidth="1px" borderColor="rgba(255,255,255,0.1)" align="center" w="180px" _focusWithin={{ borderColor: "brand.400" }}>
                    <Text fontSize="sm" color="fg.muted" mr={2}>$</Text>
                    <input
                      type="number"
                      value={spend[cat.key] || ""}
                      onChange={(e) => setSpend((prev) => ({ ...prev, [cat.key]: parseFloat(e.target.value) || 0 }))}
                      style={{ background: "transparent", border: "none", outline: "none", color: "#ffffff", fontSize: "16px", fontWeight: 600, width: "100%" }}
                    />
                  </Flex>
                </Flex>
              ))}
              <Flex justify="space-between" pt={4} borderTopWidth="1px" borderColor="border.default">
                <Text fontWeight="700">Total Monthly Spend</Text>
                <Text fontWeight="900" fontSize="lg">${totalSpend.toLocaleString()}</Text>
              </Flex>
            </VStack>
          </VStack>
        )}

        {step === 3 && (
          <VStack gap={10} align="stretch">
            <Box textAlign="center">
              <Heading size="4xl" fontWeight="800" letterSpacing="-0.04em" lineHeight="1.1" mb={4}>
                Here&apos;s what you&apos;re earning
              </Heading>
              <Text color="fg.muted" fontSize="lg">
                Based on your cards and spending, here&apos;s your projected annual rewards.
              </Text>
            </Box>

            {/* Big number reveal */}
            <Box textAlign="center" py={8}>
              <Text fontSize="7xl" fontWeight="900" letterSpacing="-0.04em" color="success.300" lineHeight="1">
                +${MOCK_RESULTS.annualValue.toLocaleString()}
              </Text>
              <Text fontSize="lg" color="fg.muted" mt={2}>estimated annual rewards value</Text>
            </Box>

            <SimpleGrid columns={2} gap={4}>
              <Box bg="#131313" p={6} borderRadius="card" textAlign="center" borderWidth="1px" borderColor="border.default">
                <Text fontSize="2xl" fontWeight="900" letterSpacing="-0.03em" color="brand.400">
                  {(MOCK_RESULTS.pointsPerYear / 1000).toFixed(0)}K
                </Text>
                <Text fontSize="xs" color="fg.muted" mt={1}>Points per Year</Text>
              </Box>
              <Box bg="rgba(63,255,139,0.05)" p={6} borderRadius="card" textAlign="center" borderWidth="1px" borderColor="rgba(63,255,139,0.15)">
                <Text fontSize="2xl" fontWeight="900" letterSpacing="-0.03em" color="success.300">
                  +${MOCK_RESULTS.potentialUpside}
                </Text>
                <Text fontSize="xs" color="fg.muted" mt={1}>More by Optimizing</Text>
              </Box>
            </SimpleGrid>

            {/* Best card per category */}
            <Box bg="#131313" borderRadius="card" overflow="hidden" borderWidth="1px" borderColor="border.default">
              <Box px={6} py={4}>
                <Text fontSize="xs" fontWeight="700" color="fg.muted" letterSpacing="0.15em" textTransform="uppercase">
                  Best Card per Category
                </Text>
              </Box>
              {MOCK_RESULTS.bestPerCategory.map((item, i) => (
                <Flex key={i} px={6} py={4} justify="space-between" borderTopWidth="1px" borderColor="rgba(255,255,255,0.04)" _hover={{ bg: "#000000" }}>
                  <Text fontSize="sm" fontWeight="500">{item.category}</Text>
                  <HStack gap={3}>
                    <Text fontSize="sm" color="success.300" fontWeight="700">{item.card}</Text>
                    <Box px={2} py={0.5} borderRadius="sm" bg="rgba(63,255,139,0.1)">
                      <Text fontSize="2xs" fontWeight="700" color="success.300">{item.multiplier}</Text>
                    </Box>
                  </HStack>
                </Flex>
              ))}
            </Box>
          </VStack>
        )}
      </Container>

      {/* Sticky Footer */}
      <Box position="fixed" bottom={0} left={0} right={0} bg="rgba(14,14,14,0.8)" borderTopWidth="1px" borderColor="rgba(255,255,255,0.05)" backdropFilter="blur(20px)" zIndex={50}>
        <Container maxW="800px">
          <Flex h="96px" align="center" justify="space-between">
            <Box>
              {step === 1 && (
                <>
                  <Box display="inline-flex" px={3} py={1} borderRadius="badge" bg="rgba(63,255,139,0.1)" mb={1}>
                    <Text fontSize="xs" fontWeight="700" color="success.300">{selectedCards.size} cards added</Text>
                  </Box>
                  <Text fontSize="sm" color="fg.muted">Complete your setup to see deals.</Text>
                </>
              )}
              {step === 2 && (
                <Text fontSize="sm" color="fg.muted">${totalSpend.toLocaleString()}/mo total spend</Text>
              )}
              {step === 3 && (
                <Text fontSize="sm" color="fg.muted">Your dashboard is ready.</Text>
              )}
            </Box>
            <HStack gap={4}>
              {step > 1 && (
                <Box as="button" px={6} py={3} borderRadius="badge" borderWidth="1px" borderColor="rgba(255,255,255,0.1)" fontWeight="700" fontSize="sm" _hover={{ bg: "bg.subtle" }} onClick={() => setStep((s) => (s - 1) as Step)}>
                  Back
                </Box>
              )}
              {step < 3 ? (
                <Box as="button" px={10} py={3} borderRadius="badge" bg="success.300" color="#0e0e0e" fontWeight="700" fontSize="lg" _hover={{ bg: "success.200" }} onClick={() => setStep((s) => (s + 1) as Step)} shadow="0 10px 40px -10px rgba(63,255,139,0.3)">
                  Continue
                </Box>
              ) : (
                <Link href="/dashboard">
                  <Box as="button" px={10} py={3} borderRadius="badge" bg="success.300" color="#0e0e0e" fontWeight="700" fontSize="lg" _hover={{ bg: "success.200" }} shadow="0 10px 40px -10px rgba(63,255,139,0.3)">
                    Go to Dashboard
                  </Box>
                </Link>
              )}
            </HStack>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}
