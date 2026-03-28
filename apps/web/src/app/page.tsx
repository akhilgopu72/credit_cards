import { Box, Container, Heading, Text, VStack, Button } from "@chakra-ui/react";
import Link from "next/link";

export default function HomePage() {
  return (
    <Box minH="100vh" bg="gray.50">
      <Container maxW="container.lg" py={20}>
        <VStack gap={8} textAlign="center">
          <Heading size="4xl" fontWeight="bold">
            CardMax
          </Heading>
          <Text fontSize="xl" color="gray.600" maxW="600px">
            Maximize your credit card rewards. Track offers, optimize spend, and
            never miss a statement credit.
          </Text>

          <Link href="/dashboard">
            <Button size="lg" colorPalette="blue">
              Go to Dashboard
            </Button>
          </Link>

          <VStack gap={4} pt={8}>
            <Heading size="lg">Why CardMax?</Heading>
            <Box
              display="grid"
              gridTemplateColumns={{ base: "1fr", md: "repeat(3, 1fr)" }}
              gap={6}
              w="full"
            >
              <FeatureCard
                title="Offer Tracking"
                description="See all your Amex, Chase, and Capital One offers in one place. Never miss a deal."
              />
              <FeatureCard
                title="Spend Optimization"
                description="Know which card to use for every purchase. Maximize points on every dollar."
              />
              <FeatureCard
                title="Scenario Modeling"
                description="What if you switched cards? Model your spend and see the impact before you commit."
              />
            </Box>
          </VStack>
        </VStack>
      </Container>
    </Box>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Box bg="white" p={6} borderRadius="lg" shadow="sm" textAlign="left">
      <Heading size="md" mb={2}>
        {title}
      </Heading>
      <Text color="gray.600">{description}</Text>
    </Box>
  );
}
