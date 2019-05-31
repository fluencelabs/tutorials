import StreamrClient from 'streamr-client'
import * as fluence from "fluence"

const streamrClient = new StreamrClient();
let fluenceSession;

const createTableQuery = "CREATE TABLE polution_uusimaa(id varchar(128), location varchar(128), parameter varchar(128), " +
    "value double, unit varchar(128), country varchar(128), city varchar(128), latitude double, " +
    "longitude double, local varchar(128), utc varchar(128))";

const deleteQuery = "DELETE FROM polution_uusimaa";

// address to Fluence contract in Ethereum blockchain. Interaction with blockchain created by MetaMask or with local Ethereum node
let contractAddress = "0xfb405cf664369d1f07668cb07649afbcd37af823";

// set ethUrl to `undefined` to use MetaMask instead of Ethereum node
let ethUrl = "http://geth.fluence.one:8545/";

// Authorization private key
let privateKey = "569ae4fed4b0485848d3cf9bbe3723f5783aadd0d5f6fd83e18b45ac22496859"; 

// application to interact with that stored in Fluence contract
let appId = "105";


fluence.connect(contractAddress, appId, ethUrl, privateKey).then((s) => {
    s.request(deleteQuery).result().then((r) => console.log(r.asString())).catch((e) => {});

    s.request(createTableQuery)
        .result() // to return promise and wait for result we need to call `result()` function
        .then((r) => console.log(r.asString())) // `asString()` decodes bytes format to string
        .catch((e) => {});
    fluenceSession = s
});

function insertQuery(data) {
    const query = `INSERT INTO polution_uusimaa VALUES ('${data.id}', '${data.location}', '${data.parameter}', ${data.value}, ` +
        `'${JSON.stringify(data.unit)}', '${data.country}', '${data.city}', ${data.latitude}, ${data.longitude}, '${data.local}', '${data.utc}')`;
    console.log("Query: " + query);
    return query;
}

function getData() {
    streamrClient.subscribe(
        {
            stream: 'dVoD8tzLR6KLJ-z_Pz8pMQ', // it is an id of stream of pollution data in Uusimaa, Finland
            resend_last: 100 // will send last 100 rows
        },
        (message, metadata) => {
            const query = insertQuery(message); // generates query
            fluenceSession.request(query); // and inserts it in into LlamaDB
        }
    )
}

function getCount() {
    const query = "SELECT COUNT(*) FROM polution_uusimaa";
    fluenceSession.request(query).result().then((r) => {
        console.log("Data count: " + r.asString().split("\n")[1])
    })
}

const parameters = ["pm25", "pm10", "no2", "o3"];

/**
 * Get maximum value of parameter
 *
 * @param parameter [pm25, pm10, no2, o3]
 */
function getMax(parameter) {
    if (!parameters.includes(parameter)) throw new Error(`No such parameter ${parameter}. Use only one of: ${parameters}`);
    const query = `SELECT MAX(value) FROM polution_uusimaa WHERE parameter = '${parameter}'`;
    fluenceSession.request(query).result().then((r) => {
        console.log(`Maximum of ${parameter}: ${r.asString().split("\n")[1]}`);
    })
}

console.log(`

Usage:
    callData() -- reteieves data from StreamR 'dVoD8tzLR6KLJ-z_Pz8pMQ', and imports it to Fluence SQL DB (llamadb)
    getCount() -- calculates 'SELECT COUNT(*)' on imported data
    getMax()   -- calculates 'SELECT MAX(value)' on imported data

Please note that this is a shared instance of the SQL DB, and data may be altered by other users.

Check out http://dash.fluence.network to deploy your own SQL DB instance
Check out http://sql.fluence.network to play with your data via web interface
Check out https://github.com/fluencelabs/tutorials for more Fluence examples

You can find docs at https://fluence.dev

If you have any questions, feel free to join our Discord https://fluence.chat :)


`)

const _global = (window /* browser */ || global /* node */);
_global.fluence = fluence;
_global.getCount = getCount;
_global.getMax = getMax;
_global.getData = getData;





