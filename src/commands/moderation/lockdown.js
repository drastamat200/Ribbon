/*
 *   This file is part of Ribbon
 *   Copyright (C) 2017-2018 Favna
 *
 *   This program is free software: you can redistribute it and/or modify
 *   it under the terms of the GNU General Public License as published by
 *   the Free Software Foundation, version 3 of the License
 *
 *   This program is distributed in the hope that it will be useful,
 *   but WITHOUT ANY WARRANTY; without even the implied warranty of
 *   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 *   GNU General Public License for more details.
 *
 *   You should have received a copy of the GNU General Public License
 *   along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 *   Additional Terms 7.b and 7.c of GPLv3 apply to this file:
 *       * Requiring preservation of specified reasonable legal notices or
 *         author attributions in that material or in the Appropriate Legal
 *         Notices displayed by works containing it.
 *       * Prohibiting misrepresentation of the origin of that material,
 *         or requiring that modified versions of such material be marked in
 *         reasonable ways as different from the original version.
 */

const Discord = require('discord.js'),
	commando = require('discord.js-commando'),
	moment = require('moment'),
	{oneLine} = require('common-tags');

module.exports = class lockdownCommand extends commando.Command {
	constructor (client) {
		super(client, {
			'name': 'lockdown',
			'group': 'moderation',
			'aliases': ['lock', 'ld'],
			'memberName': 'lockdown',
			'description': 'Locks the current channel to just staff',
			'examples': ['lockdown'],
			'guildOnly': true,
			'throttling': {
				'usages': 2,
				'duration': 3
			}
		});
	}

	deleteCommandMessages (msg) {
		if (msg.deletable && this.client.provider.get(msg.guild, 'deletecommandmessages', false)) {
			msg.delete();
		}
	}

	hasPermission (msg) {
		return this.client.isOwner(msg.author) || msg.member.hasPermission('ADMINISTRATOR');
	}

	run (msg) {
		const embed = new Discord.MessageEmbed(),
			modLogs = this.client.provider.get(msg.guild, 'modlogchannel',
				msg.guild.channels.exists('name', 'mod-logs')
					? msg.guild.channels.find('name', 'mod-logs').id
					: null),
			overwrite = msg.channel.overwritePermissions(msg.guild.roles.find('name', '@everyone'), {'SEND_MESSAGES': false}, 'Channel Lockdown');

		embed
			.setColor('#E24141')
			.setAuthor(msg.author.tag, msg.author.displayAvatarURL())
			.setDescription(oneLine `**Action:** 🔒 locked the ${msg.channel.name} channel. 
				Only staff can now access this channel. Use ${msg.guild.commandPrefix}unlock in this channel to unlock the channel`)
			.setFooter(moment().format('MMMM Do YYYY [at] HH:mm:ss [UTC]Z'));

		if (overwrite) {
			if (this.client.provider.get(msg.guild, 'modlogs', true)) {
				if (!this.client.provider.get(msg.guild, 'hasSentModLogMessage', false)) {
					msg.reply(oneLine `📃 I can keep a log of moderator actions if you create a channel named \'mod-logs\'
                            (or some other name configured by the ${msg.guild.commandPrefix}setmodlogs command) and give me access to it.
                            This message will only show up this one time and never again after this so if you desire to set up mod logs make sure to do so now.`);
					this.client.provider.set(msg.guild, 'hasSentModLogMessage', true);
				}

				this.deleteCommandMessages(msg);

				modLogs !== null ? msg.guild.channels.get(modLogs).send({embed}) : null;
			}
			
			return msg.say(embed.description.slice(12));
		}
		this.deleteCommandMessages(msg);

		return msg.reply('⚠️ An error occured locking this channel');
	}
};