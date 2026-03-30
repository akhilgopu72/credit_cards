import {
  Box,
  Container,
  Heading,
  Text,
  VStack,
  HStack,
  Button,
  SimpleGrid,
  Flex,
} from "@chakra-ui/react";
import Link from "next/link";

export default function HomePage() {
  return (
    <Box minH="100vh" bg="bg.page">
      {/* ─── Nav ─────────────────────────────────────────── */}
      <Box
        as="nav"
        py={4}
        px={8}
        borderBottomWidth="1px"
        borderColor="border.default"
      >
        <Flex justify="space-between" align="center" maxW="1200px" mx="auto">
          <HStack gap={3}>
            <Box
              w={8}
              h={8}
              bg="success.300"
              borderRadius="md"
              display="flex"
              alignItems="center"
              justifyContent="center"
            >
              <Text fontWeight="800" fontSize="sm" color="bg.page">
                C
              </Text>
            </Box>
            <Text fontWeight="700" fontSize="lg" letterSpacing="-0.02em">
              CardMax
            </Text>
          </HStack>
          <HStack gap={6}>
            <Text fontSize="sm" color="fg.muted" cursor="pointer" _hover={{ color: "fg.default" }}>
              Features
            </Text>
            <Text fontSize="sm" color="fg.muted" cursor="pointer" _hover={{ color: "fg.default" }}>
              Pricing
            </Text>
            <Link href="/dashboard">
              <Button
                size="sm"
                bg="success.300"
                color="bg.page"
                borderRadius="badge"
                fontWeight="600"
                _hover={{ bg: "success.400" }}
              >
                Get Started
              </Button>
            </Link>
          </HStack>
        </Flex>
      </Box>

      {/* ─── Hero ────────────────────────────────────────── */}
      <Container maxW="1200px" py={{ base: 16, md: 24 }}>
        <VStack gap={6} textAlign="center">
          <Box
            px={4}
            py={1.5}
            borderRadius="badge"
            borderWidth="1px"
            borderColor="border.default"
          >
            <Text fontSize="xs" color="fg.muted" letterSpacing="0.05em" textTransform="uppercase">
              Premium Rewards Intelligence
            </Text>
          </Box>

          <Heading
            size={{ base: "3xl", md: "5xl" }}
            fontWeight="800"
            letterSpacing="-0.04em"
            lineHeight="1.1"
            maxW="800px"
          >
            Maximize{" "}
            <Text as="span" color="success.300">
              Every
            </Text>{" "}
            Swipe
          </Heading>

          <Text fontSize={{ base: "md", md: "lg" }} color="fg.muted" maxW="600px" lineHeight="1.6">
            The intelligent dashboard that tells you exactly which card to use,
            aggregates every offer, and optimizes your rewards across your entire wallet.
          </Text>

          <HStack gap={4} pt={4}>
            <Link href="/dashboard">
              <Button
                size="lg"
                bg="success.300"
                color="bg.page"
                borderRadius="badge"
                fontWeight="700"
                px={8}
                _hover={{ bg: "success.200" }}
              >
                Start Optimizing — Free
              </Button>
            </Link>
            <Button
              size="lg"
              variant="outline"
              borderColor="border.default"
              color="fg.muted"
              borderRadius="badge"
              px={8}
              _hover={{ borderColor: "fg.subtle", color: "fg.default" }}
            >
              See How It Works
            </Button>
          </HStack>
        </VStack>
      </Container>

      {/* ─── Partner Logos ────────────────────────────────── */}
      <Box py={12} borderTopWidth="1px" borderColor="border.default">
        <Container maxW="1200px">
          <Text textAlign="center" fontSize="xs" color="fg.subtle" letterSpacing="0.1em" textTransform="uppercase" mb={6}>
            Optimizing rewards across
          </Text>
          <HStack justify="center" gap={{ base: 8, md: 16 }} flexWrap="wrap" opacity={0.5}>
            <Text fontSize="lg" fontWeight="700" letterSpacing="-0.02em">Chase</Text>
            <Text fontSize="lg" fontWeight="700" letterSpacing="-0.02em">Amex</Text>
            <Text fontSize="lg" fontWeight="700" letterSpacing="-0.02em">Capital One</Text>
            <Text fontSize="lg" fontWeight="700" letterSpacing="-0.02em">Citi</Text>
            <Text fontSize="lg" fontWeight="700" letterSpacing="-0.02em">US Bank</Text>
          </HStack>
        </Container>
      </Box>

      {/* ─── Features ────────────────────────────────────── */}
      <Container maxW="1200px" py={{ base: 16, md: 24 }}>
        <VStack gap={4} textAlign="center" mb={16}>
          <Box
            px={4}
            py={1.5}
            borderRadius="badge"
            borderWidth="1px"
            borderColor="border.default"
            w="fit-content"
          >
            <Text fontSize="xs" color="fg.muted" letterSpacing="0.05em" textTransform="uppercase">
              Features
            </Text>
          </Box>
          <Heading size="2xl" fontWeight="800" letterSpacing="-0.03em">
            Everything you need to{" "}
            <Text as="span" color="brand.400">
              earn more
            </Text>
          </Heading>
        </VStack>

        <SimpleGrid columns={{ base: 1, md: 3 }} gap={6}>
          <FeatureCard
            icon="🎯"
            title="Smart Card Selection"
            description="Search any merchant and instantly see which card earns the most points, cash back, or miles."
          />
          <FeatureCard
            icon="📊"
            title="Scenario Modeling"
            description="Model different spend strategies. See exactly how switching cards impacts your annual rewards."
          />
          <FeatureCard
            icon="🔔"
            title="Offer Aggregation"
            description="All your Amex, Chase, and Capital One offers in one dashboard. Never miss a cash back deal."
          />
          <FeatureCard
            icon="💳"
            title="Card Recommendations"
            description="We evaluate every card against your actual spending profile and rank by net annual value."
          />
          <FeatureCard
            icon="🛡️"
            title="Credit Tracking"
            description="Track statement credits, travel credits, and card perks. Know exactly what you've used."
          />
          <FeatureCard
            icon="🔌"
            title="Chrome Extension"
            description="See the best card to use at checkout with our browser extension. Automatic offer detection."
          />
        </SimpleGrid>
      </Container>

      {/* ─── Stats ───────────────────────────────────────── */}
      <Box py={16} bg="bg.surface">
        <Container maxW="1200px">
          <SimpleGrid columns={{ base: 1, md: 3 }} gap={8} textAlign="center">
            <StatBlock value="4,300+" label="Offers tracked" />
            <StatBlock value="30+" label="Cards supported" />
            <StatBlock value="$2.1M" label="Rewards optimized" />
          </SimpleGrid>
        </Container>
      </Box>

      {/* ─── CTA ─────────────────────────────────────────── */}
      <Container maxW="1200px" py={{ base: 16, md: 24 }}>
        <VStack gap={6} textAlign="center">
          <Heading size="2xl" fontWeight="800" letterSpacing="-0.03em">
            Start Maximizing Your Rewards
          </Heading>
          <Text color="fg.muted" maxW="500px">
            Join thousands of cardholders who earn more on every purchase.
            Free to start, no credit card required.
          </Text>
          <Link href="/dashboard">
            <Button
              size="lg"
              bg="success.300"
              color="bg.page"
              borderRadius="badge"
              fontWeight="700"
              px={10}
              _hover={{ bg: "success.200" }}
            >
              Get Started Free
            </Button>
          </Link>
        </VStack>
      </Container>

      {/* ─── Footer ──────────────────────────────────────── */}
      <Box py={8} borderTopWidth="1px" borderColor="border.default">
        <Container maxW="1200px">
          <Flex justify="space-between" align="center" flexWrap="wrap" gap={4}>
            <Text fontSize="sm" color="fg.subtle">
              &copy; 2026 CardMax. All rights reserved.
            </Text>
            <HStack gap={6}>
              <Text fontSize="sm" color="fg.subtle" cursor="pointer" _hover={{ color: "fg.muted" }}>
                Privacy
              </Text>
              <Text fontSize="sm" color="fg.subtle" cursor="pointer" _hover={{ color: "fg.muted" }}>
                Terms
              </Text>
            </HStack>
          </Flex>
        </Container>
      </Box>
    </Box>
  );
}

// ─── Sub-Components ──────────────────────────────────────────────

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: string;
  title: string;
  description: string;
}) {
  return (
    <Box
      bg="bg.surface"
      p={6}
      borderRadius="card"
      borderWidth="1px"
      borderColor="border.default"
      transition="all 0.2s"
      _hover={{ borderColor: "border.ghost", bg: "bg.subtle" }}
    >
      <Text fontSize="2xl" mb={3}>
        {icon}
      </Text>
      <Heading size="md" mb={2} fontWeight="700" letterSpacing="-0.02em">
        {title}
      </Heading>
      <Text color="fg.muted" fontSize="sm" lineHeight="1.6">
        {description}
      </Text>
    </Box>
  );
}

function StatBlock({ value, label }: { value: string; label: string }) {
  return (
    <VStack gap={1}>
      <Text fontSize="4xl" fontWeight="800" letterSpacing="-0.03em" color="success.300">
        {value}
      </Text>
      <Text fontSize="sm" color="fg.muted" textTransform="uppercase" letterSpacing="0.05em">
        {label}
      </Text>
    </VStack>
  );
}
