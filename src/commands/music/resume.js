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

const commando = require('discord.js-commando');

module.exports = class ResumeSongCommand extends commando.Command {
	constructor (client) {
		super(client, {
			'name': 'resume',
			'aliases': ['go', 'continue', 'ale', 'loss', 'res'],
			'group': 'music',
			'memberName': 'resume',
			'description': 'Resumes the currently playing song.',
			'examples': ['resume'],
			'guildOnly': true,
			'throttling': {
				'usages': 2,
				'duration': 3
			}
		});
	}

	run (msg) {
		const queue = this.queue.get(msg.guild.id);

		if (!queue) {
			return msg.reply('there isn\'t any music playing to resume, oh brilliant one.');
		}
		if (!queue.songs[0].dispatcher) {
			return msg.reply('pretty sure a song that hasn\'t actually begun playing yet could be considered "resumed".');
		}
		if (queue.songs[0].playing) {
			return msg.reply('Resuming a song that isn\'t paused is a great move. Really fantastic.');
		} // eslint-disable-line max-len
		queue.songs[0].dispatcher.resume();
		queue.songs[0].playing = true;

		return msg.reply('resumed the music. This party ain\'t over yet!');
	}

	get queue () {

		/* eslint-disable no-underscore-dangle */
		if (!this._queue) {
			this._queue = this.client.registry.resolveCommand('music:play').queue;
		}

		return this._queue;
		/* eslint-enable no-underscore-dangle */
	}
};