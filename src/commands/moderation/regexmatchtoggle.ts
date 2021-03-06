/**
 * @file Moderation RegexMatchToggleCommand - Toggle commands matching on regex for this server
 *
 * **Aliases**: `rmt`, `regexmatch`
 * @module
 * @category moderation
 * @name regexmatchtoggle
 * @example regexmatchtoggle enable
 * @param {boolean} Option True or False
 */

import { Command, CommandoClient, CommandoMessage } from 'awesome-commando';
import { MessageEmbed, TextChannel } from 'awesome-djs';
import { deleteCommandMessages, modLogMessage, startTyping, stopTyping, validateBool } from '../../components';

export default class RegexMatchToggleCommand extends Command {
    constructor (client: CommandoClient) {
        super(client, {
            name: 'regexmatchtoggle',
            aliases: ['rmt', 'regexmatch'],
            group: 'moderation',
            memberName: 'regexmatchtoggle',
            description: 'Toggle commands matching on regex for this server',
            format: 'boolean',
            examples: ['regexmatchtoggle enable'],
            guildOnly: true,
            userPermissions: ['MANAGE_MESSAGES'],
            throttling: {
                usages: 2,
                duration: 3,
            },
            args: [
                {
                    key: 'option',
                    prompt: 'Enable or disable regex matches?',
                    type: 'boolean',
                    validate: (bool: boolean) => validateBool(bool),
                }
            ],
        });
    }

    public run (msg: CommandoMessage, { option }: { option: boolean }) {
        startTyping(msg);

        const modlogChannel = msg.guild.settings.get('modlogchannel', null);
        const regexMatchEmbed = new MessageEmbed();

        msg.guild.settings.set('regexmatches', option);

        regexMatchEmbed
            .setColor('#3DFFE5')
            .setAuthor(msg.author.tag, msg.author.displayAvatarURL())
            .setDescription(`**Action:** Pattern matching commands are now ${option ? 'enabled' : 'disabled'}`)
            .setTimestamp();

        if (msg.guild.settings.get('modlogs', true)) {
            modLogMessage(msg, msg.guild, modlogChannel, msg.guild.channels.get(modlogChannel) as TextChannel, regexMatchEmbed);
        }

        deleteCommandMessages(msg, this.client);
        stopTyping(msg);

        return msg.embed(regexMatchEmbed);
    }
}
