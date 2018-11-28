/**
 * @file Music MusicStatusCommand - Gets status about the currently playing song  
 * **Aliases**: `song`, `playing`, `current-song`, `now-playing`
 * @module
 * @category music
 * @name status
 */

import { stripIndents } from 'common-tags';
import { Command, CommandoClient, CommandoMessage } from 'discord.js-commando';
import { deleteCommandMessages, Song, startTyping, stopTyping } from '../../components/util';

export default class MusicStatusCommand extends Command {
  private songQueue: any;
  constructor (client: CommandoClient) {
    super(client, {
      name: 'status',
      aliases: [ 'song', 'playing', 'current-song', 'now-playing' ],
      group: 'music',
      memberName: 'status',
      description: 'Shows the current status of the music.',
      guildOnly: true,
      throttling: {
        usages: 2,
        duration: 3,
      },
    });
  }

  public run (msg: CommandoMessage) {
    startTyping(msg);
    const queue = this.queue.get(msg.guild.id);

    if (!queue) {
      deleteCommandMessages(msg, this.client);
      stopTyping(msg);

      return msg.say('There isn\'t any music playing right now. You should get on that.');
    }
    const song = queue.songs[0];
    const currentTime = song.dispatcher ? song.dispatcher.streamTime / 1000 : 0;
    const embed = {
        author: {
          iconURL: song.avatar,
          name: `${song.username}`,
        },
        color: 3447003,
        description: stripIndents`
				[${song}](${`${song.url}`})

				We are ${Song.timeString(currentTime)} into the song, and have ${song.timeLeft(currentTime)} left.
				${!song.playing ? 'The music is paused.' : ''}
			`,
        image: { url: song.thumbnail },
    };

    deleteCommandMessages(msg, this.client);
    stopTyping(msg);

    return msg.embed(embed);
  }

  get queue () {
    if (!this.songQueue) {
      // @ts-ignore
      this.songQueue = this.client.registry.resolveCommand('music:play').queue;
    }

    return this.songQueue;
  }
}