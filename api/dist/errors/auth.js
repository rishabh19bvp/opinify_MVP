"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PasswordResetError = exports.TokenError = exports.ValidationError = exports.AuthenticationError = void 0;
class AuthenticationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'AuthenticationError';
    }
}
exports.AuthenticationError = AuthenticationError;
class ValidationError extends Error {
    constructor(message) {
        super(message);
        this.name = 'ValidationError';
    }
}
exports.ValidationError = ValidationError;
class TokenError extends Error {
    constructor(message) {
        super(message);
        this.name = 'TokenError';
    }
}
exports.TokenError = TokenError;
class PasswordResetError extends Error {
    constructor(message) {
        super(message);
        this.name = 'PasswordResetError';
    }
}
exports.PasswordResetError = PasswordResetError;
