import { IsNotEmpty } from "class-validator";

export class TokenResponseDto {
    @IsNotEmpty()
    accessToken: string;
    @IsNotEmpty()
    refreshToken: string;
}