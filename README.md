# TimeFi Growth Kit

## What this project does

- **timefi-growth-bot**: Installs and executes real read-only calls using:
  - `timefi-sdk`
  - `stackpulse-sdk`
  - `aegis-vault-sdk`
  - `stacks-clicker-sdk`
  - `stacksminimint-sdk`
  - `@bamzzstudio/chainstamps-sdk`
- **timefi-starter-app**: Minimal developer starter app that performs real SDK integration calls.
- **workflow**: Runs integration checks on a schedule and on manual trigger.

This is an integration-validation kit, not a fake-download bot.

## Run locally

```bash
cd timefi-growth-bot
npm install
npm run start
```

```bash
cd timefi-starter-app
npm install
npm run start
```

If needed, you can override the minimint contract name:

```bash
MINIMINT_CONTRACT_NAME=minimint-core-v-i27 npm run start
```

## Automation (Growth Pulse)

The workflow in `.github/workflows/growth-pulse.yml`:

- Runs every 5 minutes (test mode).
- Performs a fresh `npm ci` in each integration project.
- Runs real SDK calls afterward.

## Expected output

Both apps should print:

- active network
- TimeFi TVL result
- StackPulse registry/tier result
- Aegis vault result
- StacksClicker payload details
- StacksMinimint token info
- Chainstamp hash count
