/**
 * @file Weeb PatCommand - Pat a good person 🐇!
 * @module
 * @category weeb
 * @name pat
 * @example pat Ruby
 * @param {GuildMemberResolvable} [MemberToPat] Name of the member you want to pat
 */

import { Command, CommandoClient, CommandoMessage } from 'awesome-commando';
import { GuildMember } from 'awesome-djs';
import fetch from 'node-fetch';
import { ASSET_BASE_PATH, deleteCommandMessages, startTyping, stopTyping } from '../../components';

export default class PatCommand extends Command {
    constructor (client: CommandoClient) {
        super(client, {
            name: 'pat',
            group: 'weeb',
            memberName: 'pat',
            description: 'Pat a good person 🐇!',
            format: 'MemberToPat',
            examples: ['pat Favna'],
            guildOnly: true,
            throttling: {
                usages: 2,
                duration: 3,
            },
            args: [
                {
                    key: 'member',
                    prompt: 'Who do you want to pat?',
                    type: 'member',
                    default: '',
                }
            ],
        });
    }

    public async run (msg: CommandoMessage, { member }: { member: GuildMember }) {
        try {
            startTyping(msg);

            const patFetch = await fetch('https://nekos.life/api/v2/img/pat');
            const petImg = await patFetch.json();
            if (member.id === msg.member.id) member = null;

            deleteCommandMessages(msg, this.client);
            stopTyping(msg);

            return msg.embed({
                    color: msg.guild ? msg.guild.me.displayColor : 10610610,
                    description: member
                        ? `${member.displayName}! You got patted by ${msg.member.displayName} 🐇!`
                        : `${msg.member.displayName} you must feel alone... Have a 🐈`,
                    image: { url: member ? petImg.url : `${ASSET_BASE_PATH}/ribbon/digicat.gif` },
                },
                `<@${member ? member.id : msg.author.id}>`
            );
        } catch (err) {
            stopTyping(msg);

            return msg.reply('something went wrong getting a pat image 💔');
        }
    }
}
