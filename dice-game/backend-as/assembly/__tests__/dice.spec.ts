import {handler} from "../game_handler";

function roundripTest(jsonString: string, expectedString: string | null = null): bool {
    log<string>("--------" + jsonString + (expectedString ? " " + expectedString! : ""));
    expectedString = expectedString || jsonString;
    let bytes = String.UTF8.encode(jsonString);
    let typedBytes = Uint8Array.wrap(bytes);
    let resultString = handler(typedBytes);

    log<string>("expected string: " + (expectedString? expectedString! : "null"));
    log<string>("result string: " + resultString);
    if (expectedString) {
        expect<string>(resultString).toStrictEqual(expectedString);
    }

    return true;
}

describe("Dice game", () => {

    it("should handle player join", () => {
        expect<bool>(roundripTest(
            ' { "action":"Join"} ',
            '{"action":"Join","player_id":0}')).toBe(true);
    });

    it("should return an error if there is no such player", () => {
        expect<bool>(roundripTest(
            ' { "action":"Roll", "player_id":199, "bet_placement": 2, "bet_size": 11} ',
            '{"action":"Error","message":"There is no player with such id: 199"}')).toBe(true);
    });

    it("should return an error if there is incorrect bet placement", () => {
        expect<bool>(roundripTest(
            ' { "action":"Roll", "player_id":0, "bet_placement":18, "bet_size":11} ',
            '{"action":"Error","message":"Incorrect placement, please choose number from 1 to 6"}')).toBe(true);
    });

    it("should return an error if there is bet size is more than balance", () => {
        expect<bool>(roundripTest(
            ' { "action":"Roll", "player_id":0, "bet_placement":2, "bet_size":111} ',
            '{"action":"Error","message":"Player hasn\'t enough money: player\'s current balance is 100 while the bet is 111"}')).toBe(true);
    });

    it("should handle successful bid", () => {
        expect<bool>(roundripTest(
            ' { "action":"Roll", "player_id":0, "bet_placement": 2, "bet_size": 11} ',
            '{"action":"Roll","outcome":2,"player_balance":155}')).toBe(true);
    });

    it("should handle bad bid", () => {
        expect<bool>(roundripTest(
            ' { "action":"Roll", "player_id":0, "bet_placement": 2, "bet_size": 11} ',
            '{"action":"Roll","outcome":6,"player_balance":144}')).toBe(true);
    });

    it("should get a balance", () => {
        expect<bool>(roundripTest(
            ' { "action":"GetBalance", "player_id":0 } ',
            '{"action":"GetBalance","player_balance":144}')).toBe(true);
    });
});
