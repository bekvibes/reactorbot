import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';

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
      );

    for (let index = 1; index <= 10; index += 1) {
      subcommand.addRoleOption(option => option
        .setName(`role-${index}`)
        .setDescription(`Role option ${index}`)
        .setRequired(index === 1));
    }

    subcommand
      .addStringOption(option =>
        option.setName('description').setDescription('Optional panel description').setMaxLength(4000),
      )
      .addStringOption(option =>
        option.setName('color').setDescription('Embed colour, e.g. #5865F2').setMaxLength(7));
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