import "bootstrap/dist/css/bootstrap.min.css";
import * as fluence from "fluence";

window.onload = function () {
	// locate button
	const helloBtn = document.querySelector('#submit');
	// locate input text box
	const inputLbl = document.querySelector('#input');
	// locate output label
	const outputLbl = document.querySelector('#result');
	// Number of try
	var tryNum = 1;

	// address to Fluence contract in Ethereum blockchain. Interaction with blockchain created by MetaMask or with local Ethereum node
	let contractAddress = "0xeFF91455de6D4CF57C141bD8bF819E5f873c1A01";

	// set ethUrl to `undefined` to use MetaMask instead of Ethereum node
	let ethUrl = "http://geth.fluence.one:8545";

	// application to interact with that stored in Fluence contract
	let appId = "3";

	// save fluence to global variable, so it can be accessed from Developer Console
	window.fluence = fluence;

	// create a session between client and backend application
	fluence.connect(contractAddress, appId, ethUrl).then((s) => {
		console.log("Session created");
		window.session = s;
		helloBtn.disabled = false;
	});


	// convert result to a string
	window.getResultString = function (result) {
		return result.result().then((r) => r.asString())
	};

	window.logResultAsString = function(result) {
		return getResultString(result).then((r) => console.log(r))
	}

	// set callback on button click
	helloBtn.addEventListener("click", send);
	
	// send input as a transaction and display results in grettingLbl
	function send() {
		const input = inputLbl.value.trim();
		let result = session.request(input);
		getResultString(result).then(function (str) {
			outputLbl.innerHTML = `<tr><td>#${tryNum++}:</td><td>${input}</td><td>${str}</td></tr>${outputLbl.innerHTML}`
		});
	}

};

console.log(`

Thank you for trying Fluence out! Please, break something.

You can find docs at https://fluence.dev

Check out http://dash.fluence.network to deploy your own SQL DB instance
Check out http://sql.fluence.network to play with your data via web interface
Check out https://github.com/fluencelabs/tutorials for more Fluence examples

If you have any questions, feel free to join our Discord https://fluence.chat :)

`)