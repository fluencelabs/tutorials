# Dice game
- [Developing the backend app](#developing-the-backend-app)
  - [Setting up Rust](#setting-up-rust)
  - [Understanding the existing code](#understanding-the-existing-code)
  - [Implementing the state storage](#implementing-the-state-storage)
  - [Implementing the request handling](#implementing-the-request-handling)
  - [Compiling Rust to WebAssembly](#compiling-rust-to-webassembly)
- [Publishing the backend app](#publishing-the-backend-app)
- [Verifying the application status](#verifying-the-application-status)
- [Developing the web app](#developing-the-web-app)
  - [package.json](#packagejson)
  - [index.js](#indexjs)
    - [JS SDK: request(), result()](#js-sdk-invoke-result)
    - [JS SDK: connect()](#js-sdk-connect)
    - [Game: join()](#game-join)
    - [Game: roll()](#game-roll)
  - [Running the app](#running-the-app)
- [Hacking around](#hacking-around)

In this simple dice game, you can bet your points against the dice rolled by the backend. The backend handles dice throws, user registrations and user balances, and the frontend provides the end-user interface to play the game.

In this tutorial we will use Rust as a language of choice for the backend because of its tremendous WebAssembly support. For the frontend we will use JavaScript with some TypeScript under the hood 😉

## Developing the backend app

### Setting up Rust

Let's get some Rust!

Install the Rust compiler:

```bash
# installs the Rust compiler and supplementary tools to `~/.cargo/bin`
~ $ curl https://sh.rustup.rs -sSf | sh -s -- -y
info: downloading installer
...
Rust is installed now. Great!
To configure your current shell run source $HOME/.cargo/env
```

Let's listen to the installer and configure your current shell:  
<sup>(new shell environments should pick up the right configuration automatically)</sup>

```bash
~ $ source $HOME/.cargo/env
<no output>
```

After that, we need to install the nightly Rust toolchain:  
<sup>(Fluence Rust SDK requires the nightly toolchain due to certain memory operations)</sup>
```bash
~ $ rustup toolchain install nightly
info: syncing channel updates ...
...
  nightly-<arch> installed - rustc 1.34.0-nightly (57d7cfc3c 2019-02-11)
```

Let's check that the nightly toolchain was installed successfully:
```bash
~ $ rustup toolchain list | grep nightly
# the output should contain the nightly toolchain
...
nightly-<arch>
```

To compile Rust to WebAssembly, we also need to add the `wasm32` compilation target:
```bash
# install target for WebAssembly
~ $ rustup target add wasm32-unknown-unknown --toolchain nightly
info: downloading component 'rust-std' for 'wasm32-unknown-unknown'
info: installing component 'rust-std' for 'wasm32-unknown-unknown'
```

Finally, let's check that everything was set up correctly and compile a sample Rust code:
```bash
# create a simple program that always returns 1
~ $ echo "fn main(){1;}" > test.rs

# compile it to WebAssembly using rustc from the nightly toolchain
~ $ rustup run nightly rustc --target=wasm32-unknown-unknown test.rs
<no output>
# check that the test.wasm output file was created
~ $ ls -lh test.wasm
-rwxr-xr-x  1 user  user   1.4M Feb 11 11:59 test.wasm
```

Now it's time to create a Rust dice game project!  
For that, clone this repository, and open the `dice-game/backend` directory:
```bash
$ git clone https://github.com/fluencelabs/tutorials
$ cd tutorials/dice-game/backend/src
```

### Understanding the existing code

Most of the game logic is already implemented in the [`GameManager`](backend/src/game_manager.rs), so for now your task is to handle user interactions: route client requests, handle errors, and bring the game to life!  

All this should be done inside [`lib.rs`](backend/src/lib.rs) file, so open it in your favorite text editor, and you should see the following code:

```Rust
// Describe modules used in the backend
mod error_type;
mod game_manager;
mod request_response;

// Import needed libraries
use crate::error_type::AppResult;
use crate::game_manager::GameManager;
use crate::request_response::{Request, Response};

use fluence::sdk::*;
use serde_json::Value;
use std::cell::RefCell;

// Define game settings
mod settings {
    pub const PLAYERS_MAX_COUNT: usize = 1024;
    pub const SEED: u64 = 12345678;
    // the account balance of new players
    pub const INIT_ACCOUNT_BALANCE: u64 = 100;
    // if win, player receives bet_amount * PAYOUT_RATE money
    pub const PAYOUT_RATE: u64 = 5;
}
```

This snippet imports required modules and crates, and also defines the `settings` module with various game constants.

Most of the game logic is implemented inside the [`GameManager`](backend/src/game_manager.rs), which maintains a dictionary of users and their balances stored in the [insertion order](https://contain-rs.github.io/linked-hash-map/linked_hash_map/index.html). This dictionary can contain up to `PLAYERS_MAX_COUNT` players: if the limit is exceeded, the oldest player is removed.

The `GameManager` has three public functions: 
- `join` - creates a new player and returns the player id
- `roll` - makes a bet, returns the outcome and the new player's balance
- `get_player_balance` - returns the balance for the player specified by an id

### Implementing the state storage

To store the game state, we need to create a `GameManager` instance. Because the game state should be persisted between transactions, the `GameManager` instance should be a global variable. Since the WebAssembly environment is single-threaded, the `thread_local!` macro is used for global variables.

To add the game state, paste this snippet to [`lib.rs`](backend/src/lib.rs):
```Rust
thread_local! {
    static GAME_MANAGER: RefCell<GameManager> = RefCell::new(GameManager::new());
}
```

`RefCell` here is needed to provide interior mutability since the `thread_local!` macro assumes that its content is immutable. Do not worry about this for now :)

### Implementing the request handling

_Note: you can find the full working example in the [`lib.rs.full`](backend/src/lib.rs.full) file._

In [`request_response.rs`](backend/src/request_response.rs) you can find `Request` and `Response` enums. These enums can be serialized and deserialized by the `serde` serialization framework, and can then be used to parse requests and send back reponses. With the great power of `serde_json`, the routing can be easily implemented using pattern matching.

To add request handling, paste this snippet to [`lib.rs`](backend/src/lib.rs):
```Rust
fn do_request(req: String) -> AppResult<Value> {
    let request: Request = serde_json::from_str(req.as_str())?;

    match request {
        Request::Join => GAME_MANAGER.with(|gm| gm.borrow_mut().join()),

        Request::Roll {
            player_id,
            bet_placement,
            bet_size,
        } => GAME_MANAGER.with(|gm| gm.borrow_mut().roll(player_id, bet_placement, bet_size)),

        Request::GetBalance { player_id } => {
            GAME_MANAGER.with(|gm| gm.borrow_mut().get_player_balance(player_id))
        }
    }
}
```

Now we have request parsing and routing implemented! Great, now we need to tell Fluence how to call our code. For that, we need to mark some function with the `#[invocation_handler]` macro, for example:

```rust
#[invocation_handler]
fn main(req: String) -> String
```

The function marked with the `#[invocation_handler]` macro is called a _gateway function_. It is essentially the entry point to your application: all client transactions will be passed to this function, and once it returns a result, clients can read this result. 

Gateway functions are allowed to take and return only `String` or `Vec<u8>` values, and `String` seems like a better fit for a JSON-based protocol, so we will go with that. 

Note that `do_request` method returns `Result`, so let's convert it to `String`.  
Paste this snippet to the [`lib.rs`](backend/src/lib.rs):

```rust
#[invocation_handler]
fn main(req: String) -> String {
    match do_request(req) {
        Ok(res) => res.to_string(),
        Err(err) => {
            let response = Response::Error {
                message: err.to_string(),
            };
            serde_json::to_string(&response).unwrap()
        }
    }
}
```

Now we've got the `main` function that takes a JSON input, processes it with `do_request`, and returns a JSON output.

### Compiling Rust to WebAssembly

To build the `.wasm` file, run this from the application directory:  
<sup>(note: downloading and compiling dependencies might take a few minutes)</sup>

```bash
# in directory dice-game/backend/src
$ cargo +nightly build --target wasm32-unknown-unknown --release
    Updating crates.io index
    ...
    Finished release [optimized] target(s) in 1m 16s
```

If everything goes well, you should have a `.wasm` file deep in `target`. Let's check it:
```bash
# in directory dice-game/backend/src
$ ls -lh ../target/wasm32-unknown-unknown/release/dice_game.wasm
-rwxr-xr-x  2 user  user  1.4M Mar 5 00:00 target/wasm32-unknown-unknown/release/dice_game.wasm
```

## Publishing the backend app

Let's refer to the [Fluence Book](https://fluence.network/docs/book/quickstart/publish.html) to guide us through the publishing process.

## Verifying the application status

Now you should have a deployed backend application with the assigned `appId`. To check that your application was launched on a healthy real-time cluster, check out the [Fluence Network Dashboard](http://dash.fluence.network). 

You should see something like this:

<div style="text-align:center">
<kbd>
<img src="img/dash.png" width="800px"/>
</kbd>
<br><br><br>
</div>

Click `Apps` and then find and click on the application with your `appId`:

<div style="text-align:center">
<kbd>
<img src="img/dash_app.png" width="800px"/>
</kbd>
<br><br><br>
</div>

Click the `Check cluster` button, and you should see the blockchain height for each real-time node in the cluster. The height should increase every time when you send a request to the backend application. If everything is fine, the height should be bigger than `1`, equal between the nodes, and marked green:

<div style="text-align:center">
<kbd>
<img src="img/check_cluster.png" width="600px"/>
</kbd>
<br><br><br>
</div>

If the backend application was deployed correctly, let's move to the frontend!

## Developing the web app
_For this part, you will need installed `npm`. Please refer to [npm docs](https://www.npmjs.com/get-npm) for installation instructions._

Having a [Rust backend](#implement-requests-handling) for the Dice game, the next logical step is to provide potential users with a web interface for the game. 

Let's open `dice-game/frontend` directory:
```bash
# from dice-game/backend/src
$ cd ../../frontend
```

There are two files of interest in `dice-game/frontend`:
- [`package.json`](frontend/package.json) that declares needed dependencies
- [`index.js`](frontend/index.js) that imports `fluence` js library and shows how to connect to a cluster

### package.json
Fluence JS SDK is specified as a dependency along with `bootstrap`:
```json
  "dependencies": {
    "fluence": "0.1.16",
    "bootstrap": "4.3.1"
  }
```

You can find the latest version on [npmjs.org](https://www.npmjs.com/package/fluence).

### index.js
Now let's look at the [`index.js`](frontend/index.js).

First, we import Fluence JS SDK, and define two helper functions:
```js
import * as fluence from "fluence";
...
// save fluence to global variable, so it can be accessed from Developer Console
window.fluence = fluence;

// convert result to a string
window.getResultAsString = function (result) {
	return result.result().then((r) => r.asString())
};

window.logResultAsString = function(result) {
	return getResultAsString(result).then((r) => console.log(r))
};
```

#### JS SDK: request(), result()
Main method in Fluence SDK is `request`, it takes a string, and returns an object similar to promise. Object has a method called `result`. Responses are lazy in Fluence, and `result` retrieves the response of a specific `request` from the real-time cluster.

So methods `getResultAsString` and `logResultAsString` are to automate calling `result`, and save some typing. It's not always a good idea to call `result` on every request, because result is available only after two Tendermint blocks, so it can take a while. Sometimes a better approach would be to send a batch on `request`'s, and then call `result` as you need.

#### JS SDK: connect()

Next, connect to the Fluence real-time cluster hosting the app:
```javascript
// address to Fluence contract in Ethereum blockchain. Interaction with blockchain created by MetaMask or with local Ethereum node
let contractAddress = "0xfb405cf664369d1f07668cb07649afbcd37af823";

// set ethUrl to `undefined` to use MetaMask instead of Ethereum node
let ethUrl = "http://geth.fluence.one:8545/";

// application to interact with that stored in Fluence contract
let appId = "10";

// create a session between client and backend application, and then join the game
fluence.connect(contractAddress, appId, ethUrl).then((s) => {
    console.log("Session created");
    window.session = s;
}).then(() => join());
```

Let's move from SDK API to the actual game interface implementation!

#### Game: join()
`join()` sends a request with `{ "action": "Join" }` inside, and then changes some UI elements:
```javascript
// send request to join the game
function join() {
    let result = session.request(`{ "action": "Join" }`);
    getResultAsString(result).then(function (str) {
        let response = JSON.parse(str);
        ...
        updateBalance(100);
        startGame(response.player_id);
        ...
    });
}
```

#### Game: roll()
Then we set a callback on roll button to make a bet, and roll the dice by sending a request to the backend:
```javascript
// call roll() on button click
rollButton.addEventListener("click", roll);

// roll the dice by sending a request to backend, show the outcome and balance
function roll() {
    ...
    let request = betRequest();
    let result = session.request(request);
    getResultAsString(result).then(str => {
        let response = JSON.parse(str);
        ...
        showResult(parseInt(response.outcome), guess);
        saveGame(bet, response);
        ...
    });
}
```

`roll()` sends the following `Bet` request:
```js
{
    "action": "Bet",
    "player_id": globalInfo.player_id,
    "placement": guess,
    "bet_amount": parseInt(bet)`
}
```

There are few helper functions that build a JSON request, validate user input, and update UI in different ways:
```js
// build a bet JSON request from inputs
function betRequest() { ... }

// check inputs are valid, and report if they're not
function checkInput() { ... }

// display results in UI
function showResult(fact, guess) { ... }

// prepend game results to the game history table
function saveGame(bet, response) { ... }

// update balance in UI
function updateBalance(balance) { ... }
```

### Running the app
After putting it all together, let's run it:

```bash
# in directory dice-game/frontend
frontend $ npm install
frontend $ npm run start
> frontend-template@1.0.0 start /private/tmp/frontend-template
> webpack-dev-server

ℹ ｢wds｣: Project is running at http://localhost:8080/
...
```

Open [http://localhost:8080/](http://localhost:8080/), and you will see a joining screen:

<div style="text-align:center">
<kbd>
<img src="img/joining.png" width="400px"/>
</kbd>
<br><br><br>
</div>

And shortly after that, a betting screen:

<div style="text-align:center">
<kbd>
<img src="img/betting.png" width="800px"/>
</kbd>
<br><br><br>
</div>

Let's make a bet!

<div style="text-align:center">
<kbd>
<img src="img/you_won.png" width="800px"/>
</kbd>
<br><br><br>
</div>


You can press `Ctrl-C` now to kill the web server.

## Hacking around

Ideas to implement:

- Add the leaderboard (tip: use the `GetBalance` method)
- Add the ability to resume the game after page reload
- Add names support (instead of player ids)
