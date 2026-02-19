import { AlgorandClient } from '@algorandfoundation/algokit-utils';
import algosdk from 'algosdk';
import * as fs from 'fs';
import { NextResponse } from 'next/server';
import * as path from 'path';

function encodeTreeData(claim: any, txId?: string): Uint8Array {
  const istOffset = 5.5 * 60 * 60 * 1000;
  const storedAt = new Date(Date.now() + istOffset)
    .toISOString()
    .replace('Z', '+05:30');
  const boxData = { ...claim, storedAt, txId };
  return new TextEncoder().encode(JSON.stringify(boxData));
}

export async function POST(req: Request) {
  try {
    const body = await req.json();

    let BLOCKCHAIN_CONFIG: any = null;
    try {
      const configPath = path.resolve(
        process.cwd(),
        'src/lib/algorand/config.json',
      );
      if (fs.existsSync(configPath)) {
        BLOCKCHAIN_CONFIG = JSON.parse(fs.readFileSync(configPath, 'utf8'));
      }
    } catch (e) {
      console.warn('Could not read config.json, using environment variables');
    }

    const appId =
      BLOCKCHAIN_CONFIG?.appId ||
      parseInt(process.env.NEXT_PUBLIC_AQI_APP_ID || '0');

    if (!appId) {
      return NextResponse.json(
        { success: false, error: 'App ID missing' },
        { status: 500 },
      );
    }

    const algorand = AlgorandClient.fromEnvironment();
    const sender = await algorand.account.fromEnvironment('DEPLOYER');

    const boxData = encodeTreeData(body);
    const boxName = body.treeId;

    const result = await algorand.send.appCall({
      sender: sender.addr,
      appId: BigInt(appId),
      args: [
        new TextEncoder().encode('store_tree'),
        new TextEncoder().encode(boxName),
        boxData,
      ],
      boxReferences: [
        { appId: BigInt(appId), name: new TextEncoder().encode(boxName) },
      ],
    });

    // 2) ALSO award Green Points to the user on the Rewards Contract!
    const rewardsAppId = parseInt(
      process.env.NEXT_PUBLIC_REWARDS_APP_ID || '0',
    );
    if (rewardsAppId && body.userId) {
      try {
        await algorand.send.appCall({
          sender: sender.addr,
          appId: BigInt(rewardsAppId),
          args: [
            new TextEncoder().encode('recordAction'),
            algosdk.decodeAddress(body.userId).publicKey, // the user address
            new algosdk.ABIUintType(64).encode(
              BigInt(Math.floor(body.estimatedCo2Offset * 10)),
            ), // e.g. 100 points
          ],
          boxReferences: [
            {
              appId: BigInt(rewardsAppId),
              name: new TextEncoder().encode('pts:' + body.userId),
            },
          ],
        });
      } catch (e) {
        console.error('Failed to award points on Testnet:', e);
      }
    }

    return NextResponse.json({
      success: true,
      txId: result.transaction.txID(),
    });
  } catch (err: any) {
    console.error('Failed to process tree storage via API:', err);
    return NextResponse.json(
      { success: false, error: err.message },
      { status: 500 },
    );
  }
}
