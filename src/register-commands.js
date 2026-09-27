import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

const roleOptions = Array.from({ length: 10 }, (_, index) =>
  new SlashCommandBuilder().addRoleOption(option =>
    option
      .setName(`role-${index + 1}`)
      .setDescription(`Role option ${index + 1}`)
      .setRequired(index === 0),
  ),
);

const command = new SlashCommandBuilder()
  .setName('role-panel')
  .setDescription('Create a self-assignable role dropdown panel')
  .setDefaultMemberPermissions(PermissionFlagsBits.ManageRoles)
  .addSubcommand(subcommand => {
    subcommand
      .setName('create')
      .setDescription('Post a role dropdown panel')
      .addChannelOption(option =>
        option.setName('channel').setDescription('Channel to post the panel in').setRequired(true),
      )
      .addStringOption(option =>
        option.setName('title').setDescription('Panel title').setRequired(true).setMaxLength(256),
      )
      .addStringOption(option =>
        option.setName('description').setDescription('Optional panel description').setMaxLength(4000),
      )
      .addStringOption(option =>
        option.setName('color').setDescription('Embed colour, e.g. #5865F2').setMaxLength(7));

    for (const roleOption of roleOptions) subcommand.addRoleOption(roleOption.options[0].toJSON());
    return subcommand;
  });

if (!process.env.DISCORD_TOKEN || !process.env.CLIENT_ID) {
  throw new Error('DISCORD_TOKEN and CLIENT_ID must be set in .env');
}

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);
const route = process.env.GUILD_ID
  ? Routes.applicationGuildCommands(process.env.CLIENT_ID, process.env.GUILD_ID)
  : Routes.applicationCommands(process.env.CLIENT_ID);

await rest.put(route, { body: [command.toJSON()] });
console.log(`Registered role-panel command ${process.env.GUILD_ID ? 'for the development server' : 'globally'}.`);
