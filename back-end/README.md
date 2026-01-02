# Email Relay Backend

Spring Boot backend for Email Relay service with passwordless authentication and OAuth support.

## Features

- Passwordless authentication (email verification code)
- OAuth 2.0 login (Google, Apple, Kakao)
- JWT-based authentication
- Account management (signup, login, withdrawal)
- Redis-based verification code storage
- Comprehensive unit tests

## Tech Stack

- Java 17
- Spring Boot 3.2.1
- Spring Security
- Spring Data JPA
- PostgreSQL
- Redis
- JWT (io.jsonwebtoken)
- JUnit 5 + Mockito

## Service Flow


1. AWS SES: receive mail -> stored it into S3, publish message(S3 bucket name, object key(file route)) into AWS SQS

2. AWS S3: stored mail content.

3. AWS SQS: stored S3 bucket name and file routes(object key)

4. SpringBoot Server

    - Get S3 bucket name and file route from SQS by listening

    - Get mail content from AWS S3.

    - Summarize mail body by AI

    - Send mail to primary email by AWS SES sdk.

5. AWS SES: Send mail to primary email


## Setup

### 1. Database Setup

Create PostgreSQL database:

```sql
CREATE DATABASE email_relay;
```

### 2. Redis Setup

Start Redis server:

```bash
redis-server
```

### 3. Configure Application

Update `src/main/resources/application.properties` with your settings:

```properties
# Database
spring.datasource.url=jdbc:postgresql://localhost:5432/email_relay
spring.datasource.username=your_username
spring.datasource.password=your_password

# Email (Gmail example)
spring.mail.username=your-email@gmail.com
spring.mail.password=your-app-password

# OAuth2 credentials
spring.security.oauth2.client.registration.google.client-id=your-google-client-id
spring.security.oauth2.client.registration.google.client-secret=your-google-client-secret

spring.security.oauth2.client.registration.kakao.client-id=your-kakao-client-id
spring.security.oauth2.client.registration.kakao.client-secret=your-kakao-client-secret

spring.security.oauth2.client.registration.apple.client-id=your-apple-client-id
spring.security.oauth2.client.registration.apple.client-secret=your-apple-client-secret

# JWT Secret (use a strong random string)
jwt.secret=your-256-bit-secret-key
```

### 4. Build and Run

```bash
# Build
./gradlew build

# Run
./gradlew bootRun

# Run tests
./gradlew test
```

## API Endpoints

### Authentication

#### Signup

1. **Request verification code**
   ```
   POST /api/auth/signup/request
   Content-Type: application/json

   {
     "email": "user@example.com"
   }
   ```

2. **Verify code and create account**
   ```
   POST /api/auth/signup/verify
   Content-Type: application/json

   {
     "email": "user@example.com",
     "code": "123456",
     "username": "username"
   }
   ```

#### Login

1. **Request verification code**
   ```
   POST /api/auth/login/request
   Content-Type: application/json

   {
     "email": "user@example.com"
   }
   ```

2. **Verify code and login**
   ```
   POST /api/auth/login/verify
   Content-Type: application/json

   {
     "email": "user@example.com",
     "code": "123456"
   }
   ```

#### OAuth Login

```
GET /api/auth/oauth2/authorize/{provider}
```

Where provider is: `google`, `kakao`, or `apple`

#### Refresh Token

```
POST /api/auth/refresh
Content-Type: application/json

{
  "refreshToken": "your-refresh-token"
}
```

### User Management

#### Delete Account

```
DELETE /api/users/me
Authorization: Bearer {access-token}
```

## Project Structure

```
src/
├── main/
│   ├── java/com/emailrelay/
│   │   ├── config/           # Configuration classes
│   │   ├── controller/       # REST controllers
│   │   ├── dto/              # Data Transfer Objects
│   │   ├── exception/        # Custom exceptions
│   │   ├── model/            # JPA entities
│   │   ├── repository/       # JPA repositories
│   │   ├── security/         # Security & JWT
│   │   └── service/          # Business logic
│   └── resources/
│       └── application.properties
└── test/
    └── java/com/emailrelay/  # Unit tests
```

## Testing

Run all tests:

```bash
./gradlew test
```

Run with coverage:

```bash
./gradlew test jacocoTestReport
```

## Security Features

- JWT-based authentication
- Verification code: 6 digits, 5-minute expiration
- Rate limiting: 1 code per minute per email
- Max 3 verification attempts per code
- Soft delete for user accounts (30-day retention)
- CORS configuration for web clients

## License

MIT
