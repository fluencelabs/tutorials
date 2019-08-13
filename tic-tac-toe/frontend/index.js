import "bootstrap/dist/css/bootstrap.min.css";
import * as fluence from "fluence";

// save fluence to global variable, so it can be accessed from Developer Console
window.fluence = fluence;

window.onload = async function () {

	// address to Fluence contract in Ethereum blockchain. Interaction with blockchain created by MetaMask or with local Ethereum node
	let contractAddress = "0xeFF91455de6D4CF57C141bD8bF819E5f873c1A01";

	// set ethUrl to `undefined` to use MetaMask instead of Ethereum node
	let ethUrl = "http://geth.fluence.one:8545/";

	// application to interact with that stored in Fluence contract
	let appId = "4";

	// create a session between client and backend application
	window.session = await fluence.connect(contractAddress, appId, ethUrl);
	console.log("Session created");

	let BOARD_SIZE = 3;
	let boxes = [];
	let EMPTY = "&nbsp;";
	let player_tile = "X";
	let player_name;

	let gameBoard = document.getElementById("game-board");
	let resultDiv = document.getElementById("result");
	let resultScreenDiv = document.getElementById("result-screen");
	let newGameBtn = document.getElementById("new-game");
	let loginBtn = document.getElementById("login-action");
	let logoutBtn = document.getElementById("logout");
	let loginContainer = document.getElementById("login-container");

	loginBtn.addEventListener("click", loginGame);
	logoutBtn.addEventListener("click", logout);
	newGameBtn.addEventListener("click", newGame);

	function logout() {
		gameBoard.hidden = true;
		loginContainer.hidden = false;
	}

	function appTile() {
		return player_tile === "X" ? "O" : "X"
	}

	function initState(state) {
		boxes.forEach((v, idx) => {
			let st = state.board[idx];
			if (st === "_") v.innerHTML = EMPTY;
			else v.innerHTML = st;
			player_tile = state.player_tile;
		});
	}

	async function newGame() {
		let request = JSON.stringify({
			action: "CreateGame",
			player_name: player_name
		});

		console.log("request: " + request);

		resultDiv.hidden = true;

		let r = await session.request(request);
		let result = JSON.parse(r.asString());
		player_tile = result.player_tile;
		initState(result);
		console.log("response: " + JSON.stringify(result));
	}

	async function loginGame() {
		let name = document.getElementById("login").value;

		if (name) {
			let request = JSON.stringify({
				action: "Login",
				player_name: name
			});

			console.log("request: " + request);

			let r = await session.request(request);
			let result = JSON.parse(r.asString());

			initState(result);
			gameBoard.hidden = false;
			console.log("response: " + JSON.stringify(result));
			resultScreen(result);
			player_name = name;
			loginContainer.hidden = true;
		} else {
			console.log("login no name")
		}
	}

	function appMove(result) {
		let appMove = result.coords;
		let cell = boxes.find((el) => {
			return el.game_col === appMove[1] && el.game_row === appMove[0]
		});
		setInCell(cell, appTile(), false);
	}

	function resultScreen(result) {
		if (result.winner !== "None") {
			let rsc;
			if (result.winner === player_tile) {
				rsc = "You win!";
			} else {
				rsc = "You lose!";
			}

			resultDiv.hidden = false;
			resultScreenDiv.innerHTML = rsc;

		}
	}

	async function playerMove(name, x, y) {
		let request = JSON.stringify({
			action: "PlayerMove",
			player_name: name,
			coords: [x, y]
		});

		console.log("request: " + request);

		let r = await session.request(request);
		let result = JSON.parse(r.asString());

		console.log("response: " + JSON.stringify(result));
		// trick because server returns unsuitable coords if there is no coords
		if (result.coords[0] >= 0 && result.coords[0] <= 2) appMove(result);
		if (result.winner !== "None") resultScreen(result);
	}

	/*
	 * Initializes the Tic Tac Toe board and starts the game.
	 */
	function init() {
		var board = document.createElement('table');
		board.setAttribute("border", 1);
		board.setAttribute("cellspacing", 0);

		for (var i = 0; i < BOARD_SIZE; i++) {
			var row = document.createElement('tr');
			board.appendChild(row);
			for (var j = 0; j < BOARD_SIZE; j++) {
				var cell = document.createElement('td');
				cell.setAttribute('height', 80);
				cell.setAttribute('width', 80);
				cell.setAttribute('align', 'center');
				cell.setAttribute('valign', 'center');
				cell.game_row = i;
				cell.game_col = j;
				cell.addEventListener("click", setAction);
				cell.innerHTML = EMPTY;
				row.appendChild(cell);
				boxes.push(cell);
			}
		}

		document.getElementById("tictactoe").appendChild(board);
	}

	async function setAction() {
		await setInCell(this, player_tile, true)
	}

	async function setInCell(el, tile, from_player) {
		if (el.innerHTML === EMPTY) {
			el.innerHTML = tile;
			if (from_player) await playerMove(player_name, el.game_row, el.game_col)
		}
	}

	init();
};

console.log(`

Thank you for trying Fluence out! Please, break something.

You can find docs at https://fluence.dev

Check out http://dash.fluence.network to deploy your own SQL DB instance
Check out http://sql.fluence.network to play with your data via web interface
Check out https://github.com/fluencelabs/tutorials for more Fluence examples

If you have any questions, feel free to join our Discord https://fluence.chat :)

`)
