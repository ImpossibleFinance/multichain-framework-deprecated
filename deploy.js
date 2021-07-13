  /* 
    This is impossible finance's multichain smart contract deployment framework
    We use this to get sc's to have the same addresses on every deployed EVM chain.
    This is done using the create2 opcode and Andre's create2 deployer
    Supports: ETH, BSC, FTM, xDai, 0xpolygon/matic

    *** Constructor arguments must be the same across all chains ***
    *** The current mpc set up supports "BSC-as-main-chain" ***

    Usage: 
      node deploy.js [network] [filename]
      e.g. node deploy.js eth ./if-v1.js (deploys if-v1 on ethereum)

    Current multichain contract
      1. IF governance token v1: Init with pascal as mpc
      2. IDIA v1: Init with pascal as mpc
  */

  // TODO: add programmatic verification for contracts

  const ethers = require("ethers");    

  // Address of create2 deployer. Same address on all anyswap/multichain.xyz chains
  const factoryAddress = "0x54f5a04417e29ff5d7141a6d33cb286f50d5d50e";
  const factoryABI = '[{"anonymous":false,"inputs":[{"indexed":false,"internalType":"address","name":"addr","type":"address"},{"indexed":false,"internalType":"uint256","name":"salt","type":"uint256"}],"name":"Deployed","type":"event"},{"inputs":[{"internalType":"bytes","name":"code","type":"bytes"},{"internalType":"uint256","name":"salt","type":"uint256"}],"name":"deploy","outputs":[],"stateMutability":"nonpayable","type":"function"}]'; 

  function buildCreate2Address(creatorAddress, saltHex, byteCode) {
    return `0x${ethers.utils
      .keccak256(
        `0x${["ff", creatorAddress, saltHex, ethers.utils.keccak256(byteCode)]
          .map(x => x.replace(/0x/, ""))
          .join("")}`
      )
      .slice(-40)}`.toLowerCase();
  }

  function numberToUint256(value) {
    const hex = value.toString(16);
    return `0x${"0".repeat(64 - hex.length)}${hex}`;
  }

  async function isContract(address) {
    const code = await provider.getCode(address);
    return code.slice(2).length > 0;
  }
  
  setup()
  
  async function setup() {

    let provider;
    const network = process.argv[2];

    switch(network) {
      case "eth": provider = new ethers.getDefaultProvider('homestead');                                   break;
      case "bsc": provider = new ethers.providers.JsonRpcProvider("https://bsc-dataseed1.binance.org/");   break;
      case "ftm": provider = new ethers.providers.JsonRpcProvider("https://rpc.fantom.network");           break;
      case "xdai": provider = new ethers.providers.JsonRpcProvider("https://rpc.xdaichain.com");           break;
      case "matic": provider = new ethers.providers.JsonRpcProvider("https://rpc-mainnet.matic.network");  break;

      default: throw 'Invalid network name';
    }

    const file = require(process.argv[3]);
    const bytecode = file.bytecode();
    const salt = file.salt;
    
    if (!bytecode) {
      throw 'Empty bytecode, check import file'
    }

    const signer = new ethers.Wallet(process.env.PRIV_KEY, provider);
    const factory = new ethers.Contract(factoryAddress, factoryABI, signer);

    // First see if already deployed
    const computedAddr = buildCreate2Address(
      factoryAddress,
      numberToUint256(salt),
      bytecode
    );
    console.log("Address of deployed contract is: " + computedAddr)

    // Check if address has code
    const code = await provider.getCode(computedAddr);
    const isDeployed = code.slice(2).length > 0;

    if (!isDeployed) {
      await (await factory.deploy(bytecode, salt)).wait();
      console.log("Just deployed contract");
    } else {
      console.log("Contract already exists, nothing deployed");
    }
   
    // 1. Post-processing transaction
    // 2. Multichain smart contract with permissions (governance/owner transactions) should ALWAYS involve a post-processing tx
    // 3. Permissions SHOULD NOT BE GIVEN TO MSG.SENDER (since msg.sender will be the multichain.xyz deployer smart contract) OR TX.ORIGIN (allows griefing)
    // 4. Instead: either hardcode the address to give permissions to in the contract, or pass it in the constructor
    // 5. For other variables that vary per chain (e.g. WETH/WBNB address), use a "xxxSetter" that allows deployer to change variable once
    await file.postProcessing(computedAddr, network, signer);
  }