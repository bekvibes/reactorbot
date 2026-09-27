import 'dotenv/config';
import {
  Client,
  Events,
  GatewayIntentBits,
  EmbedBuilder,
  StringSelectMenuBuilder,
  StringSelectMenuOptionBuilder,
  ActionRowBuilder,
  PermissionFlagsBits,
  ChannelType,
} from 'discord.js';

const DEFAULT_COLOR = 0x5865F2;
const PANEL_PREFIX = 'role-panel:';

if (!process.env.DISCORD_TOKEN) throw new Error('DISCORD_TOKEN must be set in .env');

function parseColor(value) {
  if (!value) return DEFAULT_COLOR;
  const normalized = value.trim().replace(/^#/, '');
  if (!/^[0-9a-f]{6}$/i.test(normalized)) return null;
  return Number.parseInt(normalized, 16);
}

function makePanelId(roleIds) {
  // Role IDs fit safely in a custom ID. A random suffix lets duplicate panels coexist.
  return `${PANEL_PREFIX}${roleIds.join('.')}:${Date.now().toString(36)}`;
}

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers],
});

client.once(Events.ClientReady, readyClient => {
  console.log(`Ready as ${readyClient.user.tag}`);
});

client.on(Events.InteractionCreate, async interaction => {
  try {
    if (interaction.isChatInputCommand() && interaction.commandName === 'role-panel') {
      if (interaction.options.getSubcommand() !== 'create') return;

      if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageRoles)) {
        await interaction.reply({ content: 'You need **Manage Roles** to create a role panel.', ephemeral: true });
        return;
      }

      const channel = interaction.options.getChannel('channel', true);
      if (!channel.isTextBased() || channel.type === ChannelType.DM) {
        await interaction.reply({ content: 'Choose a server text channel where I can post messages.', ephemeral: true });
        return;
      }

      const roles = Array.from({ length: 10 }, (_, index) => interaction.options.getRole(`role-${index + 1}`))
        .filter(Boolean);
      const uniqueRoles = [...new Map(roles.map(role => [role.id, role])).values()];
      const color = parseColor(interaction.options.getString('color'));

      if (color === null) {
        await interaction.reply({ content: 'Use a six-digit hex colour, such as `#5865F2`.', ephemeral: true });
        return;
      }
      if (uniqueRoles.length === 0) {
        await interaction.reply({ content: 'Add at least one role.', ephemeral: true });
        return;
      }
      if (uniqueRoles.some(role => role.managed || role.id === interaction.guild.id)) {
        await interaction.reply({ content: 'Panels cannot include integration-managed or `@everyone` roles.', ephemeral: true });
        return;
      }

      const title = interaction.options.getString('title', true);
      const description = interaction.options.getString('description')
        ?? 'Choose the roles that best fit you. You can update your choices whenever you like.';
      const embed = new EmbedBuilder()
        .setColor(color)
        .setTitle(title)
        .setDescription(description)
        .addFields({ name: 'Available roles', value: uniqueRoles.map(role => `• ${role}`).join('\n') })
        .setFooter({ text: 'Select roles below to add or remove them' })
        .setTimestamp();
      const menu = new StringSelectMenuBuilder()
        .setCustomId(makePanelId(uniqueRoles.map(role => role.id)))
        .setPlaceholder('Choose your roles…')
        .setMinValues(0)
        .setMaxValues(uniqueRoles.length)
        .addOptions(uniqueRoles.map(role =>
          new StringSelectMenuOptionBuilder().setLabel(role.name).setValue(role.id).setDescription(`Toggle ${role.name}`),
        ));

      await channel.send({ embeds: [embed], components: [new ActionRowBuilder().addComponents(menu)] });
      await interaction.reply({ content: `Role panel sent to ${channel}.`, ephemeral: true });
      return;
    }

    if (!interaction.isStringSelectMenu() || !interaction.customId.startsWith(PANEL_PREFIX)) return;
    const [, payload] = interaction.customId.split(PANEL_PREFIX);
    const [ids] = payload.split(':');
    const allowedRoleIds = ids.split('.');
    const selectedIds = interaction.values.filter(id => allowedRoleIds.includes(id));
    const member = await interaction.guild.members.fetch(interaction.user.id);
    const assignable = allowedRoleIds.filter(id => {
      const role = interaction.guild.roles.cache.get(id);
      return role && !role.managed && role.editable;
    });
    const toAdd = selectedIds.filter(id => !member.roles.cache.has(id) && assignable.includes(id));
    const toRemove = assignable.filter(id => !selectedIds.includes(id) && member.roles.cache.has(id));

    if (toAdd.length) await member.roles.add(toAdd, 'Role panel selection');
    if (toRemove.length) await member.roles.remove(toRemove, 'Role panel selection');

    const changes = [
      toAdd.length && `added ${toAdd.map(id => `<@&${id}>`).join(', ')}`,
      toRemove.length && `removed ${toRemove.map(id => `<@&${id}>`).join(', ')}`,
    ].filter(Boolean);
    await interaction.reply({
      content: changes.length ? `Roles updated: ${changes.join('; ')}.` : 'Your role selection is already up to date.',
      ephemeral: true,
    });
  } catch (error) {
    console.error(error);
    const response = { content: 'I could not update the panel or roles. Check that I can view the channel and that my role is above the panel roles.', ephemeral: true };
    if (interaction.isRepliable()) {
      if (interaction.replied || interaction.deferred) await interaction.followUp(response);
      else await interaction.reply(response);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);
