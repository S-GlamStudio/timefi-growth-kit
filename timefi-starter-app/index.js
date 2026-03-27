const { TimeFiClient, formatSTX } = require("timefi-sdk");
const { StacksClickerSDK } = require("stacks-clicker-sdk");
const { MinimintClient } = require("stacksminimint-sdk");
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

async function runStarterIntegration() {
  const timefi = new TimeFiClient(NETWORK);
  const minimint = new MinimintClient(NETWORK);
  minimint.contractName = MINIMINT_CONTRACT_NAME;
  const chainstamp = createChainstampClient({ network: NETWORK });
  const clicker = new StacksClickerSDK({ network: CLICKER_NETWORK });
  const stackpulse = new StackPulseClient({ network: NETWORK });
  const aegis = new AegisVaultClient({ network: NETWORK });
  let successfulCalls = 0;

  console.log("Starter app using real SDK integration");
  console.log(`Network: ${NETWORK}`);
  console.log(`Using minimint contract: ${minimint.contractAddress}.${minimint.contractName}`);

  try {
    const tvl = await timefi.getTVL();
    console.log(`TimeFi TVL: ${formatSTX(tvl)} STX`);
    successfulCalls += 1;
  } catch (error) {
    console.warn("TimeFi read call failed:", error?.message || error);
  }

  try {
    const lastTokenId = await minimint.getLastTokenId();
    console.log(`StacksMinimint last token id: ${lastTokenId}`);
    successfulCalls += 1;
  } catch (error) {
    console.warn("StacksMinimint read call failed:", error?.message || error);
  }

  try {
    const clickPayload = clicker.click();
    const tipPayload = clicker.tip("1000");
    const votePayload = clicker.vote(1, 1);
    console.log(`StacksClicker contract: ${clickPayload.contractAddress}.${clickPayload.contractName}`);
    console.log(`StacksClicker tip args: ${tipPayload.functionArgs.length}`);
    console.log(`StacksClicker vote args: ${votePayload.functionArgs.length}`);
    successfulCalls += 1;
  } catch (error) {
    console.warn("StacksClicker SDK call failed:", error?.message || error);
  }

  try {
    const hashCount = await chainstamp.getHashCount();
    console.log(`Chainstamp total hashes: ${hashCount.value}`);
    successfulCalls += 1;
  } catch (error) {
    console.warn("Chainstamp read call failed:", error?.message || error);
  }

  try {
    const registerTx = stackpulse.buildRegisterAndSubscribeTxOptions({
      username: "starterkit",
      email: "",
      tier: 0,
      alertsBitmask: 31,
    });

    console.log(`StackPulse tx: ${registerTx.contractAddress}.${registerTx.contractName}::${registerTx.functionName}`);
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
}

runStarterIntegration().catch(error => {
  console.error("Starter integration failed:", error?.message || error);
  process.exitCode = 1;
});
