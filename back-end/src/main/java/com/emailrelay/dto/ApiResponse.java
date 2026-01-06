package com.emailrelay.dto;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Getter
@NoArgsConstructor
@AllArgsConstructor
public class ApiResponse<T> {
    private String result;
    private T data;

    public static <T> ApiResponse<T> success(T data) {
        return new ApiResponse<>("success", data);
    }

    public static <T> ApiResponse<T> fail(T data) {
        return new ApiResponse<>("fail", data);
    }

    public static ApiResponse<Void> success() {
        return new ApiResponse<>("success", null);
    }

    public static ApiResponse<Void> fail() {
        return new ApiResponse<>("fail", null);
    }
}
