import useCalculatedXirr from '@/hooks/useCalculatedXirr';
import { Button, Stack, Title, Text, Group } from '@mantine/core';
import Link from 'next/link';

export default function Home() {
  const [xirr] = useCalculatedXirr();

  return (
    <Stack p="md">
      <Title>XIRR Calculator</Title>
      <Text>View XIRR for realized trades from Zerodha or Groww.</Text>
      <Group>
        <Link href="/upload">
          <Button variant="filled">Upload</Button>
        </Link>
        <Button
          variant="outline"
          color="red"
          onClick={() => localStorage.setItem('allTrades', '[]')}
        >
          Reset Saved Trades
        </Button>
      </Group>
      Your XIRR is: {(100 * xirr).toFixed(2)}%
    </Stack>
  );
}
