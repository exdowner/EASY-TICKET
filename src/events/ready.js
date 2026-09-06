const { ActivityType } = require('discord.js');

module.exports = {
  name: 'ready',
  once: true,
  execute(client) {
    console.log(`✅ Bot online em ${client.guilds.cache.size} servidores`);
    
    client.user.setPresence({
      activities: [{ 
        name: '🎫 EASY TICKET | /panel', 
        type: ActivityType.Watching 
      }],
      status: 'online'
    });
  }
};
