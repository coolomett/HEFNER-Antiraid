const { handleMemberJoin } = require('../../utils/antiraid');

module.exports = {
  name: 'guildMemberAdd',
  async execute(member, client) {
    await handleMemberJoin(member, client);
  },
};
