import { client } from '../../client'
import { Interaction, MessageEmbed } from 'discord.js'
import { addDbCoinTransfer, getDbGuild, getDbMember } from '../../models'
// import { createInventory } from '../../models/db-inventory/create-inventory'
import { getLanguage } from '../../language'
import { expAdjustment } from './helper/exp-adjustment'
import { logger } from '../../logger'
import { createInventory } from '../../models/db-inventory'
import moment from 'moment'
import { DBGift } from '../../models/db-gift/creat-gift'

client.on('interactionCreate', async (interaction: Interaction) => {
  try {
    if (!interaction.isCommand() || !interaction.guild) return
    // localization
    const dbGuild = await getDbGuild(interaction.guild.id)
    const language = await getLanguage(dbGuild.languageInGuild)
    if (interaction.commandName !== language.gift.command.name) return
    const giftID = interaction.options.getString(language.gift.command.sendGift.stringOptionName)
    const receiver = interaction.options.getUser(language.gift.command.sendGift.userOptionName)

    if (!giftID || !receiver) return

    if (!client.user) return
    if (receiver.id === client.user.id) {
      await interaction.reply(language.gift.errorHandler.botReply)
      return
    }
    if (receiver.id === interaction.user.id) {
      await interaction.reply(language.gift.errorHandler.userReply)
      return
    }
    // query sender and receiver from db with ids
    const senderInfo = await getDbMember(interaction.user.id, interaction.guild.id)
    const receiverInfo = await getDbMember(receiver.id, interaction.guild.id)
    // get gift info
    const giftName = interaction.options.getString(language.gift.command.sendGift.stringOptionName)
    if (!giftName) return
    const gift = await DBGift.getGift(giftName, dbGuild.id)
    if (!gift) return
    const price = Number(gift.giftData.price)
    if (senderInfo.coinBalanceInGuild < price) {
      await interaction.reply(language.gift.hasEnoughMoney)
      return
    }
    // adjust money and exp between gift sender and receiver after gift sent
    await senderInfo.reduceCoins(price)
    await senderInfo.addMemberExperience(expAdjustment(price).senderExp)
    await receiverInfo.addMemberExperience(expAdjustment(price).receiverExp)
    await addDbCoinTransfer(senderInfo.userID, interaction.guild.id, price, null, '', 'sendGift')
    // create inventory
    await createInventory(giftName, price, 'gift', receiver.id, moment().utc().toDate(), interaction.guild.id)

    await interaction.reply('gift sent')
    const emoji = gift.giftData.emoji
    const embed = new MessageEmbed()
      .setTitle(emoji)
      .setDescription('')
      .setColor('#FF99CC')
    if (!interaction.channel) return
    if (!dbGuild.announcementChannelID) {
      interaction.channel.send({
        content: `<@${senderInfo.userID}>给老板<@${receiverInfo.userID}>送了${interaction.options.getString(language.gift.command.sendGift.stringOptionName)}`,
        embeds: [embed]
      })
    }
  } catch (e) {
    console.log(e)
    logger.error('error occurs when executing features/gift/gift-listener')
  }
})
