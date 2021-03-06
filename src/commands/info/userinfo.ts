/**
 * @file Info UserInfoCommand - Get the info of any member on this server
 * **Aliases**: `user`, `uinfo`
 * @module
 * @category info
 * @name userinfo
 * @example userinfo Favna
 * @param {GuildMemberResolvable} AnyMember Member you want to get info about
 */

import { Command, CommandoClient, CommandoMessage } from 'awesome-commando';
import { GuildMember, MessageEmbed } from 'awesome-djs';
import moment from 'moment';
import { arrayClean, capitalizeFirstLetter, deleteCommandMessages, startTyping, stopTyping } from '../../components';

export default class UserInfoCommand extends Command {
    constructor (client: CommandoClient) {
        super(client, {
            name: 'userinfo',
            aliases: ['user', 'uinfo'],
            group: 'info',
            memberName: 'userinfo',
            description: 'Gets information about a user.',
            format: 'MemberID|MemberName(partial or full)',
            examples: ['uinfo Favna'],
            guildOnly: true,
            throttling: {
                usages: 2,
                duration: 3,
            },
            args: [
                {
                    key: 'member',
                    prompt: 'What user would you like to snoop on?',
                    type: 'member',
                    default: 'me',
                }
            ],
        });
    }

    public run (msg: CommandoMessage, { member }: { member: GuildMember }) {
        startTyping(msg);

        if (member as unknown as string === 'me') member = msg.member;
        const uinfoEmbed = new MessageEmbed();

        uinfoEmbed
            .setAuthor(member.user.tag)
            .setThumbnail(member.user.displayAvatarURL())
            .setColor(member.displayHexColor)
            .addField('ID', member.id, true)
            .addField('Name', member.user.username, true)
            .addField('Nickname', member.nickname ? member.nickname : 'No Nickname', true)
            .addField(
                'Status',
                member.user.presence.status !== 'dnd' ? capitalizeFirstLetter(member.user.presence.status) : 'Do Not Disturb',
                true
            )
            .addField(
                member.user.presence.activity ? capitalizeFirstLetter(member.user.presence.activity.type) : 'Activity',
                member.user.presence.activity ? member.user.presence.activity.name : 'Nothing',
                true
            )
            .addField('Display Color', member.displayHexColor, true)
            .addField(
                'Role(s)',
                member.roles.size > 1 ? arrayClean(null, member.roles.map(r => r.name).filter(name => name !== '@everyone')).join(' | ') : 'None'
            )
            .addField('Account created at', moment(member.user.createdAt).format('MMMM Do YYYY [at] HH:mm:ss [UTC]Z'), true)
            .addField('Joined server at', moment(member.joinedAt).format('MMMM Do YYYY [at] HH:mm:ss [UTC]Z'), true);

        member.roles.size >= 1
            ? uinfoEmbed.setFooter(`${member.displayName} has ${member.roles.size - 1} role(s)`)
            : uinfoEmbed.setFooter(`${member.displayName} has 0 roles`);

        deleteCommandMessages(msg, this.client);
        stopTyping(msg);

        return msg.embed(uinfoEmbed);
    }
}
