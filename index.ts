import { config } from 'dotenv'
config()
import Discord, { TextChannel, Message, Emoji, Guild, GuildEmoji, MessageReaction } from 'discord.js'

const songRequestsChannelID = '718834639392997497'
const pinnedMessageID = '732406140830351382'
const groovyID = '234395307759108106'

const startHereID = '718626372582506616'
let reactionEmojiDictionary: {
    [emojiname: string]: {
        messageID: string,
        roleID: string
    }
} = {
    'appiconleagueoflegends': {
        messageID: '778760999960051762',
        roleID: '778078392830001182'
    },
    'appiconminecraft': {
        messageID: '778761057459634216',
        roleID: '718621099490934894'
    },
    'appiconamongus': {
        messageID: '778761100635930626',
        roleID: '778696375407607838'
    },
    'appicondeadbydaylight': {
        messageID: '778761172047364127',
        roleID: '778079635031851058'
    }
}

const client = new Discord.Client();

function log(...args: any[]) {
    console.log(`[${new Date().toLocaleString()}]`, ...args)
}

client.on('ready', async () => {
    log('snvjBOT ready to work!')

    // trashes all the messages except for the instrucions
    let t = await client.channels.fetch(songRequestsChannelID) as TextChannel
    t.awaitMessages((m: Message) => m.id != pinnedMessageID, {
        max: 1,
        time: 10000,
        errors: ['time']
    }).catch(e => { })

    // caches the messages which reactions are needed to be watched
    let startHere = await client.channels.fetch(startHereID) as TextChannel
    Object.entries(reactionEmojiDictionary).forEach(async entry => {
        let message = await startHere.messages.fetch(entry[1].messageID)
        if (!message.guild) throw 'guild undefined'
        let guild = message.guild

        let emoji = guild.emojis.cache.find(e => e.name == entry[0])!
        await message.react(emoji)

        let a = message.reactions.cache.first()
        if (!a) throw 'reaction undefined'
        let reaction = a

        let cachedUsersIds: string[] = []

        let fetchReactions = async () => {
            let users = await reaction.users.fetch()
            users = users.filter(u => u.id != client.user?.id)

            for (const id of cachedUsersIds.filter(id => !users.get(id))) {
                let member = await guild.members.fetch(id)
                await member.roles.remove(entry[1].roleID)
            }

            cachedUsersIds = users.map(u => u.id)
            for (const id of cachedUsersIds) {
                let m = await guild.members.fetch(id)
                if (!m.roles.cache.has(entry[1].roleID)) await m.roles.add(entry[1].roleID)
            }
        }
        setInterval(fetchReactions, 5 * 1000)
    })
})

client.on('message', async message => {
    if (message.channel.id != songRequestsChannelID) return
    // instantly deletes unrelated messages
    if (!message.content.startsWith('-') && message.author.id != groovyID && message.deletable)
        message.delete()
    else setTimeout(() => {
        // deletes messages after 10 minutes
        if (message.deletable) message.delete()
    }, 15 * 60 * 1000)
})

client.login(process.env.TOKEN)