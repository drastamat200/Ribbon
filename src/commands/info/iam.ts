/**
 * @file Info IamCommand - Self Assign roles
 *
 * **Aliases**: `self`
 * @module
 * @category info
 * @name iam
 * @example iam uploader
 * @param {RoleResolvable} AnyRole The role you want to assign to yourself
 */

import { Command, CommandoClient, CommandoMessage } from 'awesome-commando';
import { MessageEmbed, Role, TextChannel } from 'awesome-djs';
import { oneLine, stripIndents } from 'common-tags';
import moment from 'moment';
import { deleteCommandMessages, modLogMessage, startTyping, stopTyping } from '../../components';

export default class IamCommand extends Command {
    constructor (client: CommandoClient) {
        super(client, {
            name: 'iam',
            aliases: ['self'],
            group: 'info',
            memberName: 'iam',
            description: 'Self Assign roles',
            examples: ['iam uploader'],
            guildOnly: true,
            throttling: {
                usages: 2,
                duration: 3,
            },
            args: [
                {
                    key: 'role',
                    prompt: 'Which role do you want to assign to yourself?',
                    type: 'role',
                }
            ],
        });
    }

    public async run (msg: CommandoMessage, { role }: { role: Role }) {
        try {
            if (!msg.member.manageable) {
                return msg.reply(oneLine`looks like I do not have permission to edit your roles.
                    The staff will have to fix the server\'s role permissions if you want to use this command!`);
            }

            startTyping(msg);

            const modlogChannel = msg.guild.settings.get('modlogchannel', null);
            const roleAddEmbed = new MessageEmbed();
            const selfRoles = msg.guild.settings.get('selfroles', null);

            if (!selfRoles) {
                deleteCommandMessages(msg, this.client);
                stopTyping(msg);

                return msg.reply('this server has no self assignable roles');
            }

            const roleNames: Array<string | undefined> = selfRoles.map((r: string) => msg.guild.roles.get(r) ? msg.guild.roles.get(r).name : undefined).filter(Boolean);

            if (!selfRoles.includes(role.id)) {
                deleteCommandMessages(msg, this.client);
                stopTyping(msg);

                return msg.reply(`that role is not self-assignable. The self-assignable roles are ${roleNames.map(val => `\`${val}\``).join(', ')}`);
            }

            await msg.member.roles.add(role);

            roleAddEmbed
                .setColor('#AAEFE6')
                .setAuthor(msg.author.tag, msg.author.displayAvatarURL())
                .setDescription(stripIndents`
                    **Action:** \`${msg.member.displayName}\` (\`${msg.author.id}\`) assigned \`${role.name}\` to themselves with the \`iam\` command`
                )
                .setTimestamp();

            if (msg.guild.settings.get('modlogs', true)) {
                modLogMessage(msg, msg.guild, modlogChannel, msg.guild.channels.get(modlogChannel) as TextChannel, roleAddEmbed);
            }

            deleteCommandMessages(msg, this.client);
            stopTyping(msg);

            return msg.embed(roleAddEmbed);
        } catch (err) {
            deleteCommandMessages(msg, this.client);
            stopTyping(msg);

            if (/(?:Missing Permissions)/i.test(err.toString())) {
                return msg.reply(stripIndents`an error occurred adding the role \`${role.name}\` to you.
                    The server staff should check that I have \`Manage Roles\` permission and I have the proper hierarchy.`);
            } else if (/(?:is not an array or collection of roles)/i.test(err.toString())) {
                return msg.reply(oneLine`it looks like you supplied an invalid role to add. If you are certain that the
                    role is valid please feel free to open an issue on the GitHub.`);
            }

            const channel = this.client.channels.get(process.env.ISSUE_LOG_CHANNEL_ID) as TextChannel;

            channel.send(stripIndents`
                <@${this.client.owners[0].id}> Error occurred in \`iam\` command!
                **Server:** ${msg.guild.name} (${msg.guild.id})
                **Author:** ${msg.author.tag} (${msg.author.id})
                **Time:** ${moment(msg.createdTimestamp).format('MMMM Do YYYY [at] HH:mm:ss [UTC]Z')}
                **Input:** \`${role.name} (${role.id})\` || \`${msg.author.tag} (${msg.author.id})\`
                **Error Message:** ${err}
            `);

            return msg.reply(oneLine`An unknown and unhandled error occurred but I notified ${this.client.owners[0].username}
                Want to know more about the error? Join the support server by getting an invite by using the \`${msg.guild.commandPrefix}invite\` command `);
        }
    }
}
