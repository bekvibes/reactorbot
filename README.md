# Role Panels

A clean Discord role-panel bot. Staff use `/role-panel create` to post a pretty dropdown role picker in any channel. Members can choose up to 10 configured roles; choosing or removing an option updates their roles immediately.

## Setup

1. Create a Discord application and bot in the [Discord Developer Portal](https://discord.com/developers/applications).
2. Enable **Server Members Intent** under the bot's Privileged Gateway Intents.
3. Invite the bot with the `bot` and `applications.commands` scopes. Give it **Manage Roles** and **Send Messages**.
4. Copy `.env.example` to `.env` and add your token and application IDs.
5. Run `npm install`, then `npm run register`, then `npm start`.

Keep the bot's highest role above every role it should manage. Staff creating panels need the **Manage Roles** permission.

## Command

`/role-panel create`

- **channel** — where the panel should appear
- **title** — panel heading
- **description** — optional explanatory text
- **color** — optional hex color such as `5865F2` or `#5865F2`
- **role-1** through **role-10** — roles that members can opt into

You can run the command as many times as needed. Each panel has its own secure custom ID, so they work independently.
