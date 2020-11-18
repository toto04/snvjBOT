import { config } from 'dotenv'
config()
import Discord, { TextChannel, Message, Emoji, Guild, GuildEmoji } from 'discord.js'

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

client.on('ready', async () => {
    console.log('snvjBOT ready to work!')

    // trashes all the messages except for the instrucions
    let t = await client.channels.fetch(songRequestsChannelID) as TextChannel
    t.awaitMessages((m: Message) => m.id != pinnedMessageID, {
        max: 1,
        time: 10000,
        errors: ['time']
    }).catch(e => { })

    // caches the messages which reactions are needed to be watched
    let startHere = await client.channels.fetch(startHereID) as TextChannel
    Object.entries(reactionEmojiDictionary).map(async entry => {
        let message = await startHere.messages.fetch(entry[1].messageID)
        let emoji = message.guild?.emojis.cache.find(e => e.name == entry[0])!
        message.react(emoji)
    })
})

client.on('message', async message => {
    if (message.channel.id != songRequestsChannelID) return
    // instantly deletes unrelated messages
    if (!message.content.startsWith('!') && message.author.id != groovyID && message.deletable)
        message.delete()
    else setTimeout(() => {
        // deletes messages after 10 minutes
        if (message.deletable) message.delete()
    }, 15 * 60 * 1000)
})

client.on('messageReactionAdd', async (reaction, user) => {
    if (user.id == client.user?.id) return
    if (reaction.message.channel.id != startHereID) return
    let emoji = reaction.emoji as GuildEmoji
    let entry = reactionEmojiDictionary[emoji.name]
    if (!entry) return

    console.log(`User ${user.username} added emoji ${emoji.name}`)
    let member = await emoji.guild.members.fetch(user.id)
    member.roles.add(entry.roleID)
})

client.on('messageReactionRemove', async (reaction, user) => {
    if (reaction.message.channel.id != startHereID) return
    let emoji = reaction.emoji as GuildEmoji
    let entry = reactionEmojiDictionary[emoji.name]
    if (!entry) return

    console.log(`User ${user.username} removed emoji ${emoji.name}`)
    let member = await emoji.guild.members.fetch(user.id)
    member.roles.remove(entry.roleID)
})

client.login(process.env.TOKEN)