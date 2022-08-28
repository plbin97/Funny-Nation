import { client } from '../../client'
import { GuildMember, Interaction } from 'discord.js'
import { getDbGuild } from '../../models'
import { getLanguage } from '../../language'
import { isAdmin } from '../../utils'
import { DBGift } from '../../models/db-gift/creat-gift'
import { updateGiftToOption } from './helper/update-gift-to-option'

client.on('interactionCreate', async (interaction:Interaction) => {
  if (!interaction.isCommand() || !interaction.guild) return
  // localization
  const dbGuild = await getDbGuild(interaction.guild.id)
  const language = await getLanguage(dbGuild.languageInGuild)
  const giftName = interaction.options.getString(language.gift.command.removeGift.stringOptionName)
  if (!giftName) return
  if (interaction.commandName !== language.gift.command.removeGift.name) return
  if (!interaction.member) return
  if (!(interaction.member instanceof GuildMember)) return
  // verify admin user
  const isAdministrator = await isAdmin(interaction.member)
  if (!isAdministrator) {
    await interaction.reply({
      content: 'you are not administrator'
    })
  }
  const gift = await DBGift.getGift(giftName, dbGuild.id)
  if (!gift) {
    await interaction.reply('gift is not existed')
    return
  }
  await gift.remove()
  await interaction.reply('successfully removed gift')
  // update gift to option
  const guildId = dbGuild.id
  const giftList = await DBGift.getGiftList(guildId)
  const option = 'remove'
  await updateGiftToOption(giftList, interaction, language, option)
  await interaction.reply({
    content: 'Gift created'
  })
})
