import useCalculatedXirr from '@/hooks/useCalculatedXirr';
import { Code, Group, List, ListItem, Stack, Text, Title } from '@mantine/core';
import { Dropzone, MIME_TYPES } from '@mantine/dropzone';
import { csv2json } from 'json-2-csv';
import { useRouter } from 'next/router';

export default function Upload(props) {
  const router = useRouter();
  const [_, recalculateXirr] = useCalculatedXirr();

  const processFiles = async (files) => {
    const allTrades = [];
    const jsonContent = files.map(async (file) => {
      const text = await file.text();

      const jsonArray = csv2json(text);

      if (jsonArray.length > 0) {
        // Zerodha
        if (jsonArray[0].symbol) {
          allTrades.push(...jsonArray);
        }
        // Groww
        else {
          jsonArray.forEach((growwRow) => {
            if (
              growwRow['Stock name'] &&
              growwRow['Buy date'] &&
              growwRow['Sell date']
            ) {
              let buyTrade = {
                trade_type: 'buy',
              };
              let sellTrade = {
                trade_type: 'sell',
              };
              const commonTradeData = {};

              const [bdd, bmm, byy] = growwRow['Buy date'].split('-');
              const [sdd, smm, syy] = growwRow['Sell date'].split('-');

              const buyDate = new Date(`${bmm}/${bdd}/${byy}`);
              const sellDate = new Date(`${smm}/${sdd}/${syy}`);

              commonTradeData.symbol = growwRow['Stock name'];
              commonTradeData.quantity = growwRow['Quantity'];
              buyTrade.trade_date = buyDate.toISOString();
              sellTrade.trade_date = sellDate.toISOString();
              buyTrade.order_execution_time = buyDate.toISOString();
              sellTrade.order_execution_time = sellDate.toISOString();
              buyTrade.price = growwRow['Buy price'];
              sellTrade.price = growwRow['Sell price'];

              buyTrade = {
                ...buyTrade,
                ...commonTradeData,
              };
              sellTrade = {
                ...sellTrade,
                ...commonTradeData,
              };

              allTrades.push(buyTrade);
              allTrades.push(sellTrade);
            }
          });
        }
      }
    });

    await Promise.all(jsonContent);
    console.log(allTrades);
    recalculateXirr(allTrades);

    router.push('/');
  };

  return (
    <Dropzone
      onDrop={processFiles}
      onReject={(files) =>
        alert('rejected files: ' + JSON.stringify(files, null, 4))
      }
      maxSize={128 * 1024 ** 2}
      accept={MIME_TYPES.csv}
      style={{
        height: '96vh',
        margin: '2vh',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}
      {...props}
    >
      <Group
        justify="center"
        gap="xl"
        style={{ pointerEvents: 'none', height: '100%' }}
      >
        <Dropzone.Accept>
          <Title>✅</Title>
        </Dropzone.Accept>
        <Dropzone.Reject>
          <Title>❌</Title>
        </Dropzone.Reject>

        <div>
          <Title mb="xs">Upload Trade Files</Title>
          <Text size="xl" inline>
            Drag CSVs here or click to select files.
          </Text>
          <Text size="sm" c="dimmed" mb="md" inline mt={7}>
            Attach as many files as you like, each file should not exceed 128mb
          </Text>
          <Stack mb="xl">
            <Title mb={0}>Zerodha</Title>
            <Text>
              For Zerodha users CSV files should be in the following format
            </Text>
            <Code>
              symbol,isin,trade_date,exchange,segment,series,trade_type,auction,quantity,price,trade_id,order_id,order_execution_time
            </Code>
          </Stack>

          <Stack>
            <Title mb={0}>Groww</Title>
            <Text>Groww users follow these steps:</Text>
            <List type="ordered">
              <ListItem>
                Download the P&L Report Excel sheet from Groww.
              </ListItem>
              <ListItem>
                Copy the trade table and paste it in another blank sheet.
              </ListItem>
              <ListItem>Export the new sheet as a CSV file.</ListItem>
            </List>
            <Text>
              For Groww users CSV files should be in the following format
            </Text>
            <Code>
              Stock name,ISIN,Quantity,Buy date,Buy price,Buy value,Sell
              date,Sell price,Sell value,Realised P&L,Remark
            </Code>
          </Stack>
        </div>
      </Group>
    </Dropzone>
  );
}
