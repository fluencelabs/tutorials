import "bootstrap/dist/css/bootstrap.min.css";
import * as fluence from "fluence";

let globalInfo = {losses_number: 0};
let history = [];

window.info = globalInfo;

// save fluence to global variable, so it can be accessed from Developer Console
window.fluence = fluence;

// convert result to a string
window.getResultAsString = function (result) {
	return result.result().then((r) => r.asString())
};

window.logResultAsString = function(result) {
	return getResultAsString(result).then((r) => console.log(r))
};

console.log(`

Thank you for trying Fluence out! Please, break something.

You can find docs at https://fluence.dev

Check out http://dash.fluence.network to deploy your own SQL DB instance
Check out http://sql.fluence.network to play with your data via web interface
Check out https://github.com/fluencelabs/tutorials for more Fluence examples

If you have any questions, feel free to join our Discord https://fluence.chat :)

`)

window.onload = function () {
	// locate html elements
	const statusDiv = document.getElementById('status');

	const gameDiv = document.getElementById('game');
	const resultDiv = document.getElementById('result');
	const balanceDiv = document.getElementById('balance');
	const betSizeInput = document.getElementById('bet-size');
	const betPlacementInput = document.getElementById('bet-placement');
	const rollButton = document.getElementById('roll');
	const historyTable = document.getElementById('history');
	const prizeDiv = document.getElementById('prize');

	// address to Fluence contract in Ethereum blockchain. Interaction with blockchain created by MetaMask or with local Ethereum node
	let contractAddress = "0xeFF91455de6D4CF57C141bD8bF819E5f873c1A01";

	// set ethUrl to `undefined` to use MetaMask instead of Ethereum node
	let ethUrl = "http://data.fluence.one:8545/";

	// application to interact with that stored in Fluence contract
	let appId = "2";

	// create a session between client and backend application, and then join the game
	fluence.connect(contractAddress, appId, ethUrl).then((s) => {
		console.log("Session created");
		window.session = s;
	}).then(() => join());

	// send request to join the game
	function join() {
		let result = session.request(`{ "action": "Join" }`);
		getResultAsString(result).then(function (str) {
			let response = JSON.parse(str);
			if (response.player_id || response.player_id === 0) {
				statusDiv.innerText = "You joined to game. Your id is: " + response.player_id;
				// 100 is hardcoded, because we always register a new player
				updateBalance(100);
				calcPrize();
				startGame(response.player_id);
			} else {
				showError("Unable to register: " + str);
			}
		});
	}

	// hide registration, show game controls and balance
	function startGame(id) {
		globalInfo.player_id = id;
		gameDiv.hidden = false;
		betSizeInput.focus();
	}

	// call roll() on button click
	rollButton.addEventListener("click", roll);

	betSizeInput.addEventListener("input", calcPrize);

	function calcPrize() {
		let bet = betSizeInput.value;
		if (bet) {
			bet = parseInt(bet);
			if (bet > globalInfo.balance) {
				prizeDiv.innerHTML = "You cannot bet this amount!"
			} else {
				let prize = bet * 5;
				prizeDiv.innerHTML = `Your prize will be: ${prize}!`
			}
		} else {
			prizeDiv.innerHTML = ""
		}
	}

	// roll the dice by sending a request to backend, show the outcome and balance
	function roll() {
		if (checkInput()) {
			resultDiv.innerHTML = "";
			let request = rollRequest();
			let result = session.request(JSON.stringify(request));
			getResultAsString(result).then(str => {
				let response = JSON.parse(str);
				if (response.outcome) {
					showResult(parseInt(response.outcome), request.bet_placement);
					updateHistoryTable(request, response);
				} else {
					showError("Unable to roll: " + str);
				}
			});
		}
	}

	// build a bet JSON request from inputs
	function rollRequest() {
		let betSize = parseInt(betSizeInput.value.trim());
		let betPlacement = parseInt(betPlacementInput.value.trim());

        return {
            player_id: globalInfo.player_id,
            action: "Roll",
            bet_placement: betPlacement,
            bet_size: parseInt(betSize)
        };
	}

	// check inputs are valid, and report if they're not
	function checkInput() {
		if (!(betSizeInput.checkValidity() && betPlacementInput.checkValidity())) {
			betSizeInput.reportValidity();
			betPlacementInput.reportValidity();
			return false;
		}

		return true;
	}

	// display results in UI
	function showResult(outcome, betPlacement) {
		let resultStr = `<h4>Outcome is ${outcome}.   `;
		if (outcome !== betPlacement) {
			globalInfo.losses_number = globalInfo.losses_number + 1;
			let time = globalInfo.losses_number === 1 ? "time" : "times in a row";
			resultDiv.innerHTML =  `${resultStr}<b style='color:red'>You've lost ${globalInfo.losses_number} ${time}!</b></h4>`
		} else {
			globalInfo.losses_number = 0;
			resultDiv.innerHTML = resultStr + "<b style='color:green'>You won!</b></h4>"
		}
	}

	// prepend game results to the game history table
	function updateHistoryTable(request, response) {
		updateBalance(response.player_balance);
		history.unshift(`<tr><td class="align-middle">${request.bet_size}</td><td>${request.bet_placement}</td><td>${response.outcome}</td><td>${response.player_balance}</td></tr>`);
		historyTable.innerHTML = history.join("");
	}

	// update balance in UI
	function updateBalance(balance) {
		globalInfo.balance = balance;
		balanceDiv.innerHTML = globalInfo.balance;
	}

	// show error to the user
	function showError(error) {
		console.error(error);
		resultDiv.innerHTML = `<h4>${error}</h4>`
	}

	// hackity-hack! we could get balance for any player
	function getBalance(id) {
		let result = session.request(`{ "player_id": ${id}, "action": "GetBalance"}`);
		return getResultAsString(result).then(function (str) {
			let response = JSON.parse(str);
			if (response.player_balance) {
				updateBalance(response.player_balance)
			} else {
				showError("Unable to get balance: " + str);
			}
		});
	}
};
