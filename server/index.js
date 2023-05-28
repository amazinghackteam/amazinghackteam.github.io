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

	// -------------------------------------------------------------------------------------------
	// RPC queries
	// https://polkadot.js.org/docs/api/start/api.rpc

	// Retrieve the chain name
	const chain = await api.rpc.system.chain();

	// Retrieve the latest header
	const lastHeader = await api.rpc.chain.getHeader();

	// Log the information
	console.log( `${ chain }: last block #${ lastHeader.number } has hash ${ lastHeader.hash }` );

	// -------------------------------------------------------------------------------------------
	// Reading contract values

	console.log( 'Reading contract values' );

	// https://polkadot.js.org/docs/api-contract/start/contract.read/

	// The address is the actual on-chain address as ss58 or AccountId object.
	const contract = new ContractPromise( api, smartContractJson, '5HPxrgxXKty68BJNT3RGikEEQNrTmKngTXJLYqGQ62FVcGF6' );

	console.log( JSON.stringify( { address: contract.address } ) );

	// https://github.com/polkadot-js/api/issues/5255
	// https://substrate.stackexchange.com/questions/6401/smart-contract-function-call-error

	//define two new variables
	const MAX_CALL_WEIGHT = new BN( 5_000_000_000_000 ).isub( BN_ONE );
	const PROOFSIZE = new BN( 1_000_000 );

	// maximum gas to be consumed for the call. if limit is too small the call will fail.
	const gasLimit = api?.registry.createType( 'WeightV2', {
		refTime: MAX_CALL_WEIGHT,
		proofSize: PROOFSIZE,
	} );
	console.log( { gasLimit: gasLimit.toHuman() } );

	// a limit to how much Balance to be used to pay for the storage created by the contract call
	// if null is passed, unlimited balance can be used
	const storageDepositLimit = null;

	const query = await contract.query;
	console.log( { query } );



	const { gasRequired, storageDeposit, result, output } = await contract.query.totalSupply(
		'5FByQK5rfjhwNziJWj8dkdPwMZd4Y6AMfB4R5mf1PApPGbZp',
		{ gasLimit }
	);

	// check if the call was successful
	if ( result.isOk )
	{
		// output the return value
		console.log( "Success", output?.toHuman() );
	} else
	{
		console.error( "Error", result.asErr );
	}
	// The actual result from RPC as `ContractExecResult`
	console.log( result.toHuman() );
	console.log( output?.toHuman() );
	console.log( storageDeposit.toHuman() );
	console.log( gasRequired.toHuman() );


	console.log('balance of action');

	const bof = await contract.query.balanceOf(
		'5FByQK5rfjhwNziJWj8dkdPwMZd4Y6AMfB4R5mf1PApPGbZp',
		{ gasLimit },
		'5FByQK5rfjhwNziJWj8dkdPwMZd4Y6AMfB4R5mf1PApPGbZp',
	);
	console.log( bof.result.toHuman() );
	console.log( bof.output?.toHuman() );
	console.log( bof.storageDeposit.toHuman() );
	console.log( bof.gasRequired.toHuman() );



	console.log( 'transfer action' );

	const amount = api.registry.createType( 'Balance', 7 );

	const tout = await contract.query.transfer(
		'5FByQK5rfjhwNziJWj8dkdPwMZd4Y6AMfB4R5mf1PApPGbZp',
		{ gasLimit },
		'5FWWf41gG6isBuqVmCaut8ZTMB5fRa2CJ5YV1uXhv7Tfuevm',
		amount,
	);
	console.log( tout.result.toHuman() );
	console.log( tout.output?.toHuman() );
	console.log( tout.storageDeposit.toHuman() );
	console.log( tout.gasRequired.toHuman() );



	// balance to transfer to the contract account. use only with payable messages, will fail otherwise.
	// formerly know as "endowment"
	// const value = api.registry.createType( 'Balance', 1000 );

	// (We perform the send from an account, here using Alice's address)
	// const { gasRequired, storageDeposit, result, output } = await contract.query.get(
	// 	newPair.address,
	// 	{
	// 		gasLimit,
	// 		storageDepositLimit,
	// 	}
	// );

	// // TODO - create amount/transfer input on frontend ???
	// const bobAddress = '5FHneW46xGXgs5mUiveU4sbTyGBzmstUspZC92UhjJM694ty';
	// const amount = 10000;

	// const transfer = api.tx.balances.transfer( bobAddress, amount );
	// await transfer.signAndSend( alice,
	// 	async ( res ) =>
	// 	{
	// 		if ( res.status.isInBlock )
	// 		{
	// 			console.log( 'in a block' );
	// 		} else if ( res.status.isFinalized )
	// 		{
	// 			console.log( 'finalized' );
	// 		}
	// 	}
	// );
}

main().catch( console.error );
