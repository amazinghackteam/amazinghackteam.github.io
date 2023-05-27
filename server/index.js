const { ApiPromise, WsProvider, Keyring } = require( '@polkadot/api' );

const { stringToU8a, u8aToHex, BN, BN_ONE } = require( '@polkadot/util' );

// https://github.com/polkadot-js/api/issues/4704
const { cryptoWaitReady } = require( '@polkadot/util-crypto' );

const { ContractPromise } = require( '@polkadot/api-contract' );

const smartContractJson = require( './LiquidZeroDogToken.json' );


async function main ()
{
	// Construct
	const wsProvider = new WsProvider( 'wss://ws.test.azero.dev' );
	const api = await ApiPromise.create( { provider: wsProvider } );

	// do this first
	await api.isReady;

	// Do something
	console.log( api.genesisHash.toHex() );

	// // -------------------------------------------------------------------------------------------
	// RPC queries
	// https://polkadot.js.org/docs/api/start/api.rpc

	// Retrieve the chain name
	const chain = await api.rpc.system.chain();

	// Retrieve the latest header
	const lastHeader = await api.rpc.chain.getHeader();

	// Log the information
	console.log( `${ chain }: last block #${ lastHeader.number } has hash ${ lastHeader.hash }` );

	//define two new variables
	const MAX_CALL_WEIGHT = new BN(5_000_000_000_000).isub(BN_ONE);
	const PROOFSIZE = new BN(1_000_000);

	// -------------------------------------------------------------------------------------------
	// keyring

	// https://polkadot.js.org/docs/api/start/keyring/
	const keyring = new Keyring( { type: 'sr25519' } );

	// Adding accounts
	// Some mnemonic phrase
	const PHRASE = 'entire material egg meadow latin bargain dutch coral blood melt acoustic thought';


	// Add an account, straight mnemonic
	const newPair = keyring.addFromUri( PHRASE );

	// (Advanced) add an account with a derivation path (hard & soft)
	const newDeri = keyring.addFromUri( `${ PHRASE }//hard-derived/soft-derived` );

	// (Advanced, development-only) add with an implied dev seed and hard derivation
	const alice = keyring.addFromUri( '//Alice', { name: 'Alice default' } );
	console.log( { aliceAddress: alice.address } );

	// Adding accounts with raw seeds
	// add a hex seed, 32-characters in length
	const hexPair = keyring.addFromUri( '0x1234567890123456789012345678901234567890123456789012345678901234' );

	// add a string seed, internally this is padded with ' ' to 32-bytes in length
	const strPair = keyring.addFromUri( 'Janice' );

	// Log some info
	console.log( `${ alice.meta.name }: has address ${ alice.address } with publicKey [${ alice.publicKey }]` );

	// Convert message, sign and then verify
	const message = stringToU8a( 'this is our message' );
	const signature = alice.sign( message );
	const isValid = alice.verify( message, signature, alice.publicKey );

	// Log info
	console.log( `The signature ${ u8aToHex( signature ) }, is ${ isValid ? '' : 'in' }valid` );

	// -------------------------------------------------------------------------------------------
	// Reading contract values

	console.log( 'Reading contract values' );

	// https://polkadot.js.org/docs/api-contract/start/contract.read/

	// The address is the actual on-chain address as ss58 or AccountId object.
	const contract = new ContractPromise( api, smartContractJson, '5HPxrgxXKty68BJNT3RGikEEQNrTmKngTXJLYqGQ62FVcGF6' );

	console.log( JSON.stringify( { address: contract.address } ) );

	// maximum gas to be consumed for the call. if limit is too small the call will fail.
	const gasLimit = 3000n * 1000000n;
	// a limit to how much Balance to be used to pay for the storage created by the contract call
	// if null is passed, unlimited balance can be used
	const storageDepositLimit = null;

	const query = await contract.query;
	console.log( { query } );

	const { gasRequired, storageDeposit, result, output } = await contract.query.totalSupply(
		'5FByQK5rfjhwNziJWj8dkdPwMZd4Y6AMfB4R5mf1PApPGbZp',
		{
			gasLimit: api?.registry.createType('WeightV2', {
				refTime: MAX_CALL_WEIGHT,
				proofSize: PROOFSIZE,
			}),
			storageDepositLimit,
		}
	);

	// check if the call was successful
	if (result.isOk) {
		// output the return value
		console.log("Success", output?.toHuman());
	} else {
		console.error("Error", result.asErr);
	}
	// The actual result from RPC as `ContractExecResult`
	console.log( result.toHuman() );
	console.log( output?.toHuman() );
	console.log( storageDeposit.toHuman() );
	console.log( gasRequired.toHuman() );


	// balance to transfer to the contract account. use only with payable messages, will fail otherwise.
	// formerly know as "endowment"
	const value = api.registry.createType( 'Balance', 1000 );

	// (We perform the send from an account, here using Alice's address)
	// const { gasRequired, storageDeposit, result, output } = await contract.query.get(
	// 	newPair.address,
	// 	{
	// 		gasLimit,
	// 		storageDepositLimit,
	// 	}
	// );
   
	// await contract.tx
	//   .flip({
	//     gasLimit,
	//     storageDepositLimit
	//   })
	//   .signAndSend(alice, async (res) => {
	//     if (res.status.isInBlock) {
	//       console.log('in a block')
	//     } else if (res.status.isFinalized) {
	//       console.log('finalized')
	//     }
	//   });
}

main();
