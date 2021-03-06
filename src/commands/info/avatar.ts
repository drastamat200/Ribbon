/**
 * @file Games AvatarCommand - Get the avatar from any member on this server
 *
 * **Aliases**: `ava`
 * @module
 * @category info
 * @name avatar
 * @example avatar Favna
 * @param {GuildMemberResolvable} MemberName Member to get the avatar from
 * @param {GuildMemberResolvable} [ImageSize] Optional: Size of the avatar to get. Defaults to 1024
 */

import { Command, CommandoClient, CommandoMessage } from 'awesome-commando';
import { GuildMember, ImageSize, MessageEmbed } from 'awesome-djs';
import { DEFAULT_EMBED_COLOR, deleteCommandMessages, startTyping, stopTyping } from '../../components';

export default class AvatarCommand extends Command {
    constructor (client: CommandoClient) {
        super(client, {
            name: 'avatar',
            aliases: ['ava'],
            group: 'info',
            memberName: 'avatar',
            description: 'Gets the avatar from a user',
            format: 'MemberID|MemberName(partial or full) [ImageSize]',
            examples: ['avatar Favna 2048'],
            guildOnly: true,
            throttling: {
                usages: 2,
                duration: 3,
            },
            args: [
                {
                    key: 'member',
                    prompt: 'What user would you like to get the avatar from?',
                    type: 'member',
                    default: 'me',
                },
                {
                    key: 'size',
                    prompt: 'What size do you want the avatar to be? (Valid sizes: 128, 256, 512, 1024, 2048)',
                    type: 'integer',
                    oneOf: [128, 256, 512, 1024, 2048],
                    default: 1024,
                }
            ],
        });
    }

    public run (msg: CommandoMessage, { member, size }: { member: GuildMember; size: ImageSize }) {
        startTyping(msg);

        if (member as unknown as string === 'me') member = msg.member;
        const ava = member.user.displayAvatarURL({ size: size as ImageSize });
        const embed = new MessageEmbed();
        const ext = this.fetchExt(ava);

        embed
            .setColor(msg.guild ? msg.guild.me.displayHexColor : DEFAULT_EMBED_COLOR)
            .setImage(ext.includes('gif') ? `${ava}&f=.gif` : ava)
            .setTitle(member.displayName)
            .setURL(ava)
            .setDescription(`[Direct Link](${ava})`);

        deleteCommandMessages(msg, this.client);
        stopTyping(msg);

        return msg.embed(embed);
    }

    private fetchExt (str: string) {
        return str.substring(str.length - 14, str.length - 8);
    }
}
