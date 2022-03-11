require("@nomiclabs/hardhat-waffle");
const fs = require('fs');

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

function loadconf() {
  try {
    const conf = fs.readFileSync('state.conf');
    return JSON.parse(conf);
  }
  catch {
    return {
      mainbridge: {},
      subbridge: {},
    };
  }
}

function saveconf(conf) {
  try {
    fs.writeFileSync('state.conf', JSON.stringify(conf));
  }
  catch(err) {
    console.log('writing to state.conf failed', err);
    return;
  }
}

task("deploy", "Deploy bridge and token contracts to both EN and SCN", async (taskArgs, hre) => {
  const conf = loadconf();

  const Bridge = await hre.ethers.getContractFactory("Bridge");
  const bridge = await Bridge.deploy(true);
  await bridge.deployed();

  const Token = await hre.ethers.getContractFactory("ServiceChainToken");
  const token = await Token.deploy(bridge.address);
  await token.deployed(bridge.address);

  await token.addMinter(bridge.address);

  await bridge.registerOperator(hre.network.config.operator);

  if (hre.network.name == 'mainbridge') {
    conf.mainbridge.bridge = bridge.address;
    conf.mainbridge.token = token.address;
  }
  else if (hre.network.name == 'subbridge') {
    conf.subbridge.bridge = bridge.address;
    conf.subbridge.token = token.address;
  }
  saveconf(conf);
});

task("regtoken", "Register operator and token to bridge", async (taskArgs, hre) => {
  const conf = loadconf();
  const c = conf[hre.network.name];
  const Bridge = await hre.ethers.getContractFactory("Bridge");
  const bridge = await Bridge.attach(c.bridge);

  if (hre.network.name == 'mainbridge') {
    await bridge.registerToken(c.token, conf.subbridge.token);
  }
  else {
    await bridge.registerToken(c.token, conf.mainbridge.token);
  }
  await bridge.transferOwnership(hre.network.config.operator);

  console.log(">>> Run the following commands in kscn:")
  console.log(`subbridge.registerBridge("${conf.subbridge.bridge}", "${conf.mainbridge.bridge}")`)
  console.log(`subbridge.subscribeBridge("${conf.subbridge.bridge}", "${conf.mainbridge.bridge}")`)
  console.log(`subbridge.registerToken("${conf.subbridge.bridge}", "${conf.mainbridge.bridge}", "${conf.subbridge.token}", "${conf.mainbridge.token}")`)
});

task("transfer", "Cross value transfer from mainbridge to subbridge", async (taskArgs, hre) => {
  const conf = loadconf();
  const c = conf[hre.network.name];
  const Token = await hre.ethers.getContractFactory("ServiceChainToken");
  const token = await Token.attach(c.token);
  const signers = await hre.ethers.getSigners();
  await token.requestValueTransfer(100, signers[3].address, 0, []);
});

task("bal", "Check the balance", async (taskArgs, hre) => {
  const conf = loadconf();
  const c = conf[hre.network.name];
  const Token = await hre.ethers.getContractFactory("ServiceChainToken");
  const token = await Token.attach(c.token);
  const signers = await hre.ethers.getSigners();
  console.log(await token.balanceOf(signers[3].address));
});

// You need to export an object to set up your config
// Go to https://hardhat.org/config/ to learn more

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  solidity: {
    version: '0.5.6',
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      }
    }
  },
  networks: {
    mainbridge: {
      url: "http://127.0.0.1:8554",
      chainId: 1000,
      gas: 50000000,
      gasPrice: 0,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        initialIndex: 0,
      },
      operator: '0x9388349e71140c1f099ca8293892ab0d1e151d4f',
    },
    subbridge: {
      url: "http://127.0.0.1:8555",
      chainId: 1001,
      gas: 50000000,
      gasPrice: 0,
      accounts: {
        mnemonic: "test test test test test test test test test test test junk",
        initialIndex: 0,
      },
      operator: '0xcb5e2874276d3a96ab6331cafeb80baa6453eeb0',
    },
    hardhat: {
      accounts: {
        accountsBalance: '100000000000000000000000000',
      }
    },
  },
};
