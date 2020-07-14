import { config } from 'dotenv'
config()
import Discord from 'discord.js'

const client = new Discord.Client();

client.on('ready', async () => {
    console.log('snvjBOT ready to work!')
})

client.on('message', async message => {
    if (message.channel.id != '718834639392997497') return
    setTimeout(() => {
        if (message.deletable) message.delete()
    }, 15 * 60 * 1000)
})

client.login(process.env.TOKEN)