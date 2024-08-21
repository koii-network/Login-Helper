const { namespaceWrapper } = require('@_koii/namespace-wrapper');

class Audit {
  /**
   * Audits the submission value by your logic
   *
   * @param {number} roundNumber - The current round number
   * @returns {void}
   */
  async validateNode(submission_value, round) {
    return true;
  }
  async auditTask(roundNumber) {
    console.log('AUDIT CALLED IN ROUND', roundNumber);
    console.log('CURRENT SLOT IN AUDIT', await namespaceWrapper.getSlot());
    await namespaceWrapper.validateAndVoteOnNodes(
      this.validateNode,
      roundNumber,
    );
  }
}
const audit = new Audit();
module.exports = { audit };
