"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ApiResponse = void 0;
class ApiResponse {
    static success(data) {
        return {
            result: 'success',
            data,
        };
    }
    static fail(message) {
        return {
            result: 'fail',
            data: message,
        };
    }
}
exports.ApiResponse = ApiResponse;
//# sourceMappingURL=api-response.dto.js.map