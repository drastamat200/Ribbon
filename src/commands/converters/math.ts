/**
 * @file Converters MathCommand - Take the effort out of calculations and let Ribbon do it for you
 *
 * **Aliases**: `maths`, `calc`
 * @module
 * @category converters
 * @name math
 * @example math (pi - 1) * 3
 * @param {string} Equation The equation to solve
 */

import { Command, CommandoClient, CommandoMessage } from 'awesome-commando';
import { MessageEmbed, TextChannel } from 'awesome-djs';
import { oneLine, stripIndents } from 'common-tags';
import moment from 'moment';
import fetch from 'node-fetch';
import { DEFAULT_EMBED_COLOR, deleteCommandMessages, startTyping, stopTyping } from '../../components';

export default class MathCommand extends Command {
    constructor (client: CommandoClient) {
        super(client, {
            name: 'math',
            aliases: ['maths', 'calc'],
            group: 'converters',
            memberName: 'math',
            description: 'Calculate anything',
            format: 'EquationToSolve',
            examples: ['math (PI - 1) * 3'],
            guildOnly: false,
            throttling: {
                usages: 2,
                duration: 3,
            },
            args: [
                {
                    key: 'equation',
                    prompt: 'What is the equation to solve?',
                    type: 'string',
                    parse: (p: string) => p.toLowerCase().replace(/x/gim, '*'),
                }
            ],
        });
    }

    public async run (msg: CommandoMessage, { equation }: { equation: string }) {
        try {
            startTyping(msg);
            const calculator = await fetch('http://api.mathjs.org/v4/', {
                body: JSON.stringify({ expr: equation }),
                method: 'POST',
            });
            const maths = await calculator.json();
            const mathEmbed = new MessageEmbed();

            if (maths.error) throw new Error('matherr');

            mathEmbed
                .setTitle('Calculator')
                .setColor(msg.guild ? msg.guild.me.displayHexColor : DEFAULT_EMBED_COLOR)
                .setDescription(oneLine`The answer to \`${equation.toString()}\` is \`${maths.result}\``);

            deleteCommandMessages(msg, this.client);
            stopTyping(msg);

            return msg.embed(mathEmbed);
        } catch (err) {
            stopTyping(msg);

            if (/(?:matherr)/i.test(err.toString())) {
                return msg.reply(
                    oneLine`\`${equation.toString()}\` is is not a supported equation. I use Math.js for my calculations (http://mathjs.org/)`
                );
            }

            const channel = this.client.channels.get(process.env.ISSUE_LOG_CHANNEL_ID) as TextChannel;

            channel.send(stripIndents`
                <@${this.client.owners[0].id}> Error occurred in \`math\` command!
                **Server:** ${msg.guild.name} (${msg.guild.id})
                **Author:** ${msg.author.tag} (${msg.author.id})
                **Time:** ${moment(msg.createdTimestamp).format('MMMM Do YYYY [at] HH:mm:ss [UTC]Z')}
                **Input:** \`${equation}\`
                **Error Message:** ${err}
            `);

            return msg.reply(oneLine`An unknown and unhandled error occurred but I notified ${this.client.owners[0].username}
                Want to know more about the error? Join the support server by getting an invite by using the \`${msg.guild.commandPrefix}invite\` command `);
        }
    }
}
