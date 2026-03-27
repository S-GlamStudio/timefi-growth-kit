const { TimeFiClient, formatSTX } = require("timefi-sdk");
const { StacksClickerSDK } = require("stacks-clicker-sdk");
const { MinimintClient, getTokenExplorerUrl } = require("stacksminimint-sdk");
const { createChainstampClient } = require("@bamzzstudio/chainstamps-sdk");
const { StackPulseClient } = require("stackpulse-sdk");
const { AegisVaultClient } = require("aegis-vault-sdk");

const NETWORK = process.env.STACKS_NETWORK || "mainnet";
const MINIMINT_CONTRACT_NAME = process.env.MINIMINT_CONTRACT_NAME || "minimint-core-v-i27";
const CLICKER_NETWORK = NETWORK === "testnet" ? "testnet" : "mainnet";

function toLogValue(value) {
  if (typeof value === "string") return value;
  try {
    return JSON.stringify(value, (_, item) => (typeof item === "bigint" ? item.toString() : item));
  } catch {
    return String(value);
  }
}

async function runGrowthBot() {
  console.log("Growth Bot active");
  console.log(`Network: ${NETWORK}`);

  const timefi = new TimeFiClient(NETWORK);
  const minimint = new MinimintClient(NETWORK);
  minimint.contractName = MINIMINT_CONTRACT_NAME;
  const chainstamp = createChainstampClient({ network: NETWORK });
  const clicker = new StacksClickerSDK({ network: CLICKER_NETWORK });
  const stackpulse = new StackPulseClient({ network: NETWORK });
  const aegis = new AegisVaultClient({ network: NETWORK });
  let successfulCalls = 0;

  console.log("\nVerifying TimeFi SDK...");
  try {
    const tvl = await timefi.getTVL();
    console.log(`TimeFi TVL (formatted): ${formatSTX(tvl)} STX`);
    successfulCalls += 1;
  } catch (error) {
    console.warn("TimeFi read call failed:", error?.message || error);
  }

  console.log("\nVerifying StacksMinimint SDK...");
  console.log(`Using contract: ${minimint.contractAddress}.${minimint.contractName}`);
  try {
    const lastTokenId = await minimint.getLastTokenId();
    console.log(`Last minted token id: ${lastTokenId}`);
    console.log(`Explorer URL: ${getTokenExplorerUrl(String(lastTokenId), NETWORK)}`);
    successfulCalls += 1;
  } catch (error) {
    console.warn("StacksMinimint read call failed:", error?.message || error);
  }

  console.log("\nVerifying StacksClicker SDK...");
  try {
    const clickPayload = clicker.multiClick(3);
    const tipPayload = clicker.tip("1000");
    const votePayload = clicker.vote(1, 1);

    console.log(
      `Clicker payload: ${clickPayload.contractAddress}.${clickPayload.contractName}::${clickPayload.functionName}`
    );
    console.log(`Tip payload args: ${tipPayload.functionArgs.length}`);
    console.log(`Vote payload args: ${votePayload.functionArgs.length}`);
    successfulCalls += 1;
  } catch (error) {
    console.warn("StacksClicker SDK call failed:", error?.message || error);
  }

  console.log("\nVerifying Chainstamp SDK...");
  try {
    const hashCount = await chainstamp.getHashCount();
    console.log(`Chainstamp total hashes: ${hashCount.value}`);
    successfulCalls += 1;
  } catch (error) {
    console.warn("Chainstamp read call failed:", error?.message || error);
  }

  console.log("\nVerifying StackPulse SDK...");
  try {
    const registerTx = stackpulse.buildRegisterAndSubscribeTxOptions({
      username: "growthkit",
      email: "",
      tier: 0,
      alertsBitmask: 31,
    });

    console.log(
      `StackPulse tx: ${registerTx.contractAddress}.${registerTx.contractName}::${registerTx.functionName}`
    );
    try {
      const registryVersion = await stackpulse.getRegistryVersion();
      const tier0Price = await stackpulse.getTierPrice(0);
      console.log(`StackPulse registry version: ${String(registryVersion)}`);
      console.log(`StackPulse tier0 price: ${String(tier0Price)}`);
    } catch (error) {
      console.warn("StackPulse read call failed:", error?.message || error);
    }
    successfulCalls += 1;
  } catch (error) {
    console.warn("StackPulse SDK integration failed:", error?.message || error);
  }

  console.log("\nVerifying Aegis Vault SDK...");
  try {
    const stakeTx = aegis.buildStakeTxOptionsFromStx("1", 7);

    console.log(`Aegis tx: ${stakeTx.contractAddress}.${stakeTx.contractName}::${stakeTx.functionName}`);
    try {
      const stakingStats = await aegis.getStakingVaultStats();
      const totalStaked = stakingStats?.["total-staked"] ?? stakingStats?.totalStaked ?? stakingStats;
      console.log(`Aegis total staked (raw): ${toLogValue(totalStaked)}`);
    } catch (error) {
      console.warn("Aegis read call failed:", error?.message || error);
    }
    successfulCalls += 1;
  } catch (error) {
    console.warn("Aegis Vault SDK integration failed:", error?.message || error);
  }

  if (successfulCalls === 0) {
    throw new Error("No live SDK calls succeeded.");
  }

  console.log("\nSDK integration check completed successfully.");
}

runGrowthBot().catch(error => {
  console.error("SDK integration check failed:", error?.message || error);
  process.exitCode = 1;
});
