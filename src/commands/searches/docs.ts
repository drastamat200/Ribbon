/**
 * @file Searches DocsCommand - Get an entry from the Discord.JS documentation
 *
 * **Aliases**: `djsguide`, `guide`, `djs`
 * @module
 * @category searches
 * @name docs
 * @example docs ClientUser
 * @param {string} DocEntry The entry from the docs you want to get info about
 * @param {string} [version] The Doc version to pick, one of `stable`, `master` or `commando`
 */

import { Command, CommandoClient, CommandoMessage } from 'awesome-commando';
import { MessageEmbed } from 'awesome-djs';
import { oneLine, stripIndents } from 'common-tags';
import Fuse from 'fuse.js';
import fetch from 'node-fetch';
import { DEFAULT_EMBED_COLOR, deleteCommandMessages, globalObjectsMap, startTyping, stopTyping } from '../../components';

export default class DocsCommand extends Command {
    private readonly docs: any;

    constructor (client: CommandoClient) {
        super(client, {
            name: 'docs',
            aliases: ['djsguide', 'guide', 'djs'],
            group: 'searches',
            memberName: 'docs',
            description: 'Gets info from something in the DJS docs',
            format: 'TopicToFind [master|stable|commando]',
            examples: ['docs ClientUser'],
            guildOnly: false,
            throttling: {
                usages: 2,
                duration: 3,
            },
            args: [
                {
                    key: 'query',
                    prompt: 'what would you like to find?\n',
                    type: 'string',
                    parse: (p: string) => p.split(/[#.]/),
                },
                {
                    key: 'version',
                    prompt: 'which version of docs would you like (stable, master, commando)?',
                    type: 'string',
                    oneOf: ['stable', 'master', 'commando'],
                    default: 'stable',
                    parse: (value: string) => value.toLowerCase(),
                }
            ],
        });

        this.docs = {};
    }

    /* tslint:disable: cyclomatic-complexity*/
    public async run (msg: CommandoMessage, { query, version }: { query: string[]; version: string }) {
        try {
            startTyping(msg);

            const docs = await this.fetchDocs(version);
            const sourceBaseURL = `https://github.com/discordjs/${
                version === 'commando'
                    ? 'commando/blob/master'
                    : `discord.js/blob/${version}`
                }`;
            const docOptions: Fuse.FuseOptions<any> = {
                shouldSort: true,
                keys: [{ name: 'name', getfn: t => t.name, weight: 1 }],
                location: 0,
                distance: 100,
                threshold: 0.3,
                maxPatternLength: 32,
                minMatchCharLength: 1,
            };
            const input = {
                main: query[0],
                sub: query[1] ? (query[1] as string).replace(/(\(.*\))/gm, '') : null,
            };
            const docsFuse = new Fuse(docs.classes.concat(docs.typedefs), docOptions);
            const docsEmbed = new MessageEmbed();
            const docsSearch = docsFuse.search(input.main);
            const hit = docsSearch[0];

            docsEmbed
                .setColor(msg.guild ? msg.guild.me.displayHexColor : DEFAULT_EMBED_COLOR)
                .setAuthor(
                    version === 'commando'
                        ? 'Commando Docs'
                        : `Discord.JS Docs (${version})`,
                    'https://github.com/discordjs.png'
                );

            if (input.sub) {
                const subOptions: Fuse.FuseOptions<any> = {
                    shouldSort: true,
                    keys: [{ name: 'name', getfn: t => t.name, weight: 1 }],
                    location: 5,
                    distance: 0,
                    threshold: 0.2,
                    maxPatternLength: 32,
                    minMatchCharLength: 1,
                };
                const propsFuse = hit.props ? new Fuse(hit.props, subOptions) : null;
                const methodFuse = hit.methods ? new Fuse(hit.methods, subOptions) : null;
                const eventsFuse = hit.events ? new Fuse(hit.events, subOptions) : null;
                const subHit: any = {
                    events: eventsFuse ? eventsFuse.search(input.sub) : [],
                    methods: methodFuse ? methodFuse.search(input.sub) : [],
                    props: propsFuse ? propsFuse.search(input.sub) : [],
                };

                subLoop: for (const sub in subHit) {
                    if (subHit[sub].length) {
                        const res: any = subHit[sub][0];

                        Array.prototype.toString = function () {
                            return this.join('');
                        };

                        switch (sub) {
                            case 'props':
                                docsEmbed
                                    .setDescription(stripIndents`
                                        ${oneLine`[__**${hit.name}.${res.name}**__](${this.docifyLink(hit.name, version, docs)}?scrollTo=${res.name})`}
                                        ${hit.description}`
                                    )
                                    .addField(
                                        'Type',
                                        `${this.joinType(res.type, version, docs)}`
                                    );
                                break subLoop;
                            case 'methods':
                                docsEmbed
                                    .setDescription(stripIndents`
                                        ${oneLine`[__**${hit.name}.${res.name}()**__](${this.docifyLink(hit.name, version, docs)}?scrollTo=${res.name})`}
                                        ${hit.description}
                                    `);

                                if (res.params) {
                                    docsEmbed.addField(
                                        'Parameters',
                                        res.params.map((param: any) => oneLine`\`${param.optional ? `[${param.name}]` : param.name}:\`
                                            **${this.joinType(param.type, version, docs)}**
                                            \n${this.clean(param.description)}\n`)
                                    );
                                }

                                docsEmbed.addField('Returns',
                                    oneLine`${res.returns.description
                                        ? `${this.clean(res.returns.description)}`
                                        : ''} **⇒** **${this.joinType(res.returns.types || res.returns, version, docs)}**`);

                                if (res.examples) docsEmbed.addField('Example(s)', `\`\`\`js\n${res.examples.join('```\n```js\n')}\`\`\``);

                                docsEmbed.addField('\u200b', `[View Source](${sourceBaseURL}/${res.meta.path}/${res.meta.file}#L${res.meta.line})`);
                                break subLoop;
                            case 'events':
                                docsEmbed
                                    .setDescription(stripIndents`
                                        ${oneLine`[__**${hit.name}.on('${res.name}' … )**__](${this.docifyLink(hit.name, version, docs)}?scrollTo=${res.name})`}
                                        ${hit.description}
                                    `)
                                    .addField('Parameters',
                                        res.params.map((param: any) => oneLine`\`${param.optional ? `[${param.name}]` : param.name}:\`
                                            **${this.joinType(param.type, version, docs)}**
                                            \n${this.clean(param.description)}\n
                                        `)
                                    )
                                    .addField('\u200b', `[View Source](${sourceBaseURL}/${res.meta.path}/${res.meta.file}#L${res.meta.line})`);
                                break subLoop;
                            default:
                                throw new Error('none found');
                        }
                    }
                }
            } else {
                docsEmbed.setDescription(stripIndents`
                    ${oneLine`[__**${hit.name}**__](${this.docifyLink(hit.name, version, docs)})
                        ${hit.extends ? ` (extends [**${hit.extends}**](${this.docifyLink(hit.extends[0], version, docs)}))` : ''}`}
                    ${hit.description}
                `);

                if (hit.props) docsEmbed.addField('Properties', `\`${hit.props.map((p: any) => p.name).join('` `')}\``);
                if (hit.methods) docsEmbed.addField('Methods', `\`${hit.methods.map((m: any) => m.name).join('` `')}\``);
                if (hit.events) docsEmbed.addField('Events', `\`${hit.events.map((e: any) => e.name).join('` `')}\``);
                if (hit.type) docsEmbed.addField('Type', this.joinType(hit.type, version, docs));

                docsEmbed.addField('\u200b', `[View Source](${sourceBaseURL}/${hit.meta.path}/${hit.meta.file}#L${hit.meta.line})`);
            }

            deleteCommandMessages(msg, this.client);
            stopTyping(msg);

            return msg.embed(docsEmbed);
        } catch (err) {
            deleteCommandMessages(msg, this.client);
            stopTyping(msg);

            return msg.reply(`could not find an item for \`${query.join('.')}\` in the ${version === 'commando' ? 'Commando' : `Discord.JS ${version}`} docs.`);
        }
    }

    private async fetchDocs (version: string) {
        if (this.docs[version]) {
            return this.docs[version];
        }

        const link =
            version === 'commando'
                ? 'https://raw.githubusercontent.com/Gawdl3y/discord.js-commando/docs/master.json'
                : `https://raw.githubusercontent.com/discordjs/discord.js/docs/${version}.json`;
        const res = await fetch(link);
        const json = res.json();

        this.docs[version] = json;

        return json;
    }

    private clean (text: string) {
        return text
            .replace(/\n/g, ' ')
            .replace(/<\/?(?:info|warn)>/g, '')
            .replace(/{@link (.+?)}/g, '`$1`');
    }

    private joinType (types: any, version: string, docs: DocsCommand['docs']) {
        let final = '';

        types.forEach((typeBits: any[], outerIndex: number, thisArr: any[]) => {
            typeBits.forEach((t: string) => {
                if (globalObjectsMap.includes(t[0].toLowerCase()) && !(/(?:Global_Objects)/).test(final)) {
                    final += '[';
                    final += t[0];
                    if (t[1]) final += t[1];
                    if (thisArr[0][1]) final += thisArr[0][1].join('');
                    final += `](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/${t[0]})`;
                } else if (t.length === 1) {
                    final += `[${t[0]}](${this.docifyLink(t[0], version, docs)})`;
                } else if (!(/(?:discord.js.org|Global_Objects)/).test(final)) {
                    if (thisArr[0][2]) {
                        final += `[${t[0]}<${thisArr[0][2][0]}>](${this.docifyLink(t[0], version, docs)})`;
                    } else {
                        final += `[${t[0]}<${thisArr[0][1][0]}>](${this.docifyLink(t[0], version, docs)})`;
                    }
                }
            });
        });

        return final;
    }

    private docifyLink (prop: any, version: string, docs: DocsCommand['docs']) {
        let section = 'classes';
        const docsBaseURL = `https://discord.js.org/#/docs/${version === 'commando' ? 'commando/master' : `main/${version}`}`;
        const matchCheck = docs[section].find((el: any) => el.name === prop);

        if (!matchCheck || matchCheck.name !== prop) section = 'typedefs';

        return `${docsBaseURL}/${section === 'classes' ? 'class' : 'typedef'}/${prop}`;
    }
}
