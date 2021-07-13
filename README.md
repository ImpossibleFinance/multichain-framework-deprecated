# Impossible Finance multichain contract deployment framework

## Usage 

touch app.env && echo "export PRIV_KEY="'0x...'" >> app.env
node deploy.js {network} {file} (e.g. "node deploy.js eth ./scripts/if-v1.js")

## Test:

After setting up app.env:

"node deploy.js eth ./scripts/if-v1.js" or "node deploy.js bsc ./scripts/if-v1.js"
-> Address of deployed contract is: 0xb0e1fc65c1a741b4662b813eb787d369b8614af1
-> Contract already exists, nothing deployed

"node deploy.js eth ./scripts/idia-v1.js" or "node deploy.js bsc ./scripts/idia-v1.js"
-> Address of deployed contract is: 0x0b15ddf19d47e6a86a56148fb4afffc6929bcb89
-> Contract already exists, nothing deployed

## Architecture and format

/scripts contains the contract details to deploy (include bytecode, ABI, postprocessing tx if necessary) 
/contracts contains the smart contracts to deploy (use sol flattener to get all contracts in a single file)

## TODO (QOL changes):

1. On ETH, manually configure gasprice and gaslimit. Check with ethgasstation to decide when to deploy
2. Programmatically verify contracts