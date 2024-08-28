const { coreLogic } = require('../coreLogic');

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function executeTasks() {
    // i is the round number
    for (let i = 0; i < 5; i++) {
        let delay = 900000;
        let round = 0;
        await coreLogic.task(round);
        await sleep(delay);
    }
    console.log('All tasks executed. Test completed.')
    process.exit(0);
}

executeTasks();