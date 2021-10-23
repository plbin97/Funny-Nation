from discord import Client, Reaction, User
from typing import List, Dict
from pymysql import Connection

from src.data.casino.Casino import Casino
from src.data.casino.table.Table import Table
from src.data.casino.table.BlackJackTable import BlackJackTable
from src.controller.onMessage.joinGame import joinGameByReaction


async def onMessageReaction(self: Client, reaction: Reaction, user: User, casino: Casino, db: Connection):

    # For game
    tables: Dict[int, Table] = casino.tables
    for tableID in tables:
        if tables[tableID].isInviteMessage(reaction.message):
            table: Table = tables[tableID]
            gameType: str = table.game
            if gameType == 'blackJack':
                table: BlackJackTable
                await joinGameByReaction(table, user, reaction, self, db)
                break

