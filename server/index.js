const { ApiPromise, WsProvider } = require( '@polkadot/api' );

const { BN, BN_ONE } = require( '@polkadot/util' );

const { ContractPromise } = require( '@polkadot/api-contract' );

const smartContractJson = require( './LiquidZeroDogToken.json' );
const express = require('express');
const bodyParser = require('body-parser');
const app = express();
app.use(bodyParser.json());

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

	console.log( 'query action list' );
	const query = await contract.query;
	console.log( { query } );


	console.log( 'totalSuppl action' );

	const totalOut = await contract.query.totalSupply(
		'5FByQK5rfjhwNziJWj8dkdPwMZd4Y6AMfB4R5mf1PApPGbZp',
		{ gasLimit }
	);
	console.log( totalOut.result.toHuman() );
	console.log( totalOut.output?.toHuman() );
	console.log( totalOut.storageDeposit.toHuman() );
	console.log( totalOut.gasRequired.toHuman() );


	console.log( 'balanceOf action' );

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
	// '5FByQK5rfjhwNziJWj8dkdPwMZd4Y6AMfB4R5mf1PApPGbZp',
	// 	'5FWWf41gG6isBuqVmCaut8ZTMB5fRa2CJ5YV1uXhv7Tfuevm',

	async function performTransfer(sender, receiver, amount) {
	const tout = await contract.query.transfer(
		sender,
		{ gasLimit },
		receiver,
		amount,
	);
	console.log( tout.result.toHuman() );
	console.log( tout.output?.toHuman() );
	console.log( tout.storageDeposit.toHuman() );
	console.log( tout.gasRequired.toHuman() );
	}

	app.post('/transfer', async (req, res) => {
    const sender = req.body.sender;
    const receiver = req.body.receiver;
    const amount = req.body.amount;

		console.log('sending from frontend', {sender, receiver, amount})
		//TODO
		console.log('translate eth address to azero address here on server')
    try {
        const result = await performTransfer(sender, receiver, amount);
        res.json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'An error occurred during the transfer.' });
    }
});
}

app.listen(3000, () => {
  console.log('Server is running on port 3000');
});

main().catch( console.error );

