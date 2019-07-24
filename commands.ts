import discord from 'discord.js'
import Player from './player'
import Song from './ytSong'

interface command {
    desc: string,
    exec(message: discord.Message, player: Player, payload?: string): void
}

var commands: { [key: string]: command } = {
    'summon': {
        desc: 'Summons the bot in the summoner\'s current voice channel',
        exec(message) {
            // Only try to join the sender's voice channel if they are in one themselves
            if (message.member.voiceChannel) {
                message.member.voiceChannel.join()
            } else {
                message.reply('You need to be in a voice channel first')
            }
        }
    },

    'play': {
        desc:
            `Adds a new song to the queue
        Usage: !play title or youtube URL`,
        exec(message, player, payload) {
            if (payload) player.push(new Song(payload))
            else {
                message.reply('You have to pass a search term or a URL')
            }
        }
    },

    'resume': {
        desc: `resumes the paused player`,
        exec(message, player, payload) {
            player.resume()
        }
    },

    'pause': {
        desc: `Pauses the player`,
        exec(message, player, payload) {
            player.pause()
        }
    },

    'skip': {
        desc: `Skips the current song, goes on with the next one in the queue if present, else it stops`,
        exec(message, player, payload) {
            player.skip()
        }
    },

    'queue': {
        desc: `Prints the current song queue`,
        exec(message, player, payload) {
            var q = new discord.RichEmbed()
            q.setColor(`#FF9900`)
                .setTitle(`Queue`)
            for (let entry of player.queue) {
                q.addField(entry.title, '')
            }
            message.channel.send(q)
        }
    },

    'help': {
        desc: 'Sends this message',
        exec(message, player, payload) {
            var q = new discord.RichEmbed()
            q.setColor(`#FF9900`)
                .setTitle(`Command list`)
            for (let key in commands) {
                q.addField(key, commands[key].desc)
            }
            message.channel.send(q)
        }
    }
}

export default commands