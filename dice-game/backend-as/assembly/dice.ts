import {ErrorResponse, GetBalanceResponse, JoinResponse, RollResponse} from "./response";

const PLAYERS_MAX_COUNT: i32 = 1024;
const SEED: u64 = 123456;
// the account balance of new players
const INIT_ACCOUNT_BALANCE: u64 = 100;
// if win, player receives bet_amount * PAYOUT_RATE money
const PAYOUT_RATE: u64 = 5;
const DICE_LINE_COUNT: u8 = 6;

export class GameManager {

    registeredPlayers: u64 = 0;
    playerIds: u64[] = new Array();
    playerBalance: Map<u64, u64> = new Map<u64, u64>();

    constructor() {
        NativeMath.seedRandom(SEED);
    }

    join(): string {
        // delete the oldest player, if maximum players reach
        if (this.playerIds.length >= PLAYERS_MAX_COUNT) {
            let lastPlayer = this.playerIds.pop();
            this.playerBalance.delete(lastPlayer);
        }

        this.playerIds.push(this.registeredPlayers);

        this.playerBalance.set(this.registeredPlayers, INIT_ACCOUNT_BALANCE);

        let response = new JoinResponse(this.registeredPlayers);

        this.registeredPlayers = this.registeredPlayers + 1;

        return response.serialize();
    }

    roll(playerId: u64, betPlacement: u8, betSize: u64): string {

        if (betPlacement > DICE_LINE_COUNT) {
            let error = new ErrorResponse("Incorrect placement, please choose number from 1 to 6");
            return error.serialize();
        }

        if (!this.playerBalance.has(playerId)) {
            let error = new ErrorResponse("There is no player with such id: " + playerId.toString());
            return error.serialize();
        }

        let balance: u64 = this.playerBalance.get(playerId);

        if (betSize > balance) {
            let error = new ErrorResponse("Player hasn't enough money: player's current balance is " + balance.toString()  + " while the bet is " + betSize.toString());
            return error.serialize();
        }

        let outcome = ((Math.random() * 1000000) % DICE_LINE_COUNT + 1) as u8;

        let newBalance: u64 = 0;

        if (betPlacement == outcome) {
            newBalance = balance + (betSize * PAYOUT_RATE);
        } else {
            newBalance = balance - betSize;
        }

        this.playerBalance.set(playerId, newBalance);

        let response = new RollResponse(outcome, newBalance);
        return response.serialize();
    }

    getBalance(playerId: u64): string {
        if (!this.playerBalance.has(playerId)) {
            let error = new ErrorResponse("There is no player with id: " + playerId.toString());
            return error.serialize();
        }
        let response = new GetBalanceResponse(this.playerBalance.get(playerId));
        return response.serialize();
    }
}
