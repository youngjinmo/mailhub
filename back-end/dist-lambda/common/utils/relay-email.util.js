"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.RELAY_USERNAME_ERROR_MESSAGE = exports.RELAY_USERNAME_PATTERN = void 0;
exports.isValidRelayUsername = isValidRelayUsername;
exports.generateRandomRelayUsername = generateRandomRelayUsername;
const crypto_1 = require("crypto");
exports.RELAY_USERNAME_PATTERN = /^[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?$/;
function isValidRelayUsername(username) {
    return exports.RELAY_USERNAME_PATTERN.test(username);
}
function generateRandomRelayUsername(length = 16) {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    const bytes = (0, crypto_1.randomBytes)(length);
    let result = '';
    for (let i = 0; i < length; i++) {
        result += chars[bytes[i] % chars.length];
    }
    return result;
}
exports.RELAY_USERNAME_ERROR_MESSAGE = 'Username must start and end with alphanumeric characters, and can only contain letters, numbers, dots, and hyphens';
//# sourceMappingURL=relay-email.util.js.map