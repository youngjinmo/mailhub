# Private MailHub 배포 가이드

이 가이드는 Private MailHub 애플리케이션을 AWS EC2와 RDS에 배포하는 전체 과정을 안내합니다.

## 목차
1. [사전 요구사항](#사전-요구사항)
2. [AWS 인프라 구축](#aws-인프라-구축)
3. [EC2 서버 설정](#ec2-서버-설정)
4. [애플리케이션 배포](#애플리케이션-배포)
5. [SSL/HTTPS 설정](#sslhttps-설정)
6. [GitHub Actions CI/CD 설정](#github-actions-cicd-설정)
7. [검증 및 모니터링](#검증-및-모니터링)

---

## 사전 요구사항

- AWS 계정 및 CLI 설정
- 도메인 (예: private-mailhub.com)
- GitHub 저장소 접근 권한
- SSH 키 페어 (EC2 접근용)

---

## AWS 인프라 구축

### 1. VPC 및 보안 그룹 설정

#### EC2 보안 그룹 생성
AWS Console > EC2 > Security Groups > Create security group

**Inbound Rules:**
- SSH (22): Your IP
- HTTP (80): 0.0.0.0/0
- HTTPS (443): 0.0.0.0/0

#### RDS 보안 그룹 생성
**Inbound Rules:**
- MySQL (3306): EC2 Security Group

### 2. RDS MySQL 인스턴스 생성

AWS Console > RDS > Create database

**설정:**
- Engine: MySQL 8.0.39
- Template: Free tier (또는 Production)
- DB instance identifier: `private-mailhub-db`
- Master username: `admin`
- Master password: (강력한 비밀번호 생성)
- DB instance class: db.t3.micro
- Storage: 20GB gp3
- VPC security groups: RDS Security Group
- Public access: No

**중요:** RDS 엔드포인트를 메모하세요 (예: `private-mailhub-db.xxxxx.us-east-1.rds.amazonaws.com`)



### 3. IAM 역할 생성

AWS Console > IAM > Roles > Create role

**Service:** EC2

**Permissions policies:** (Create inline policy)
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "s3:GetObject",
        "s3:PutObject",
        "s3:DeleteObject",
        "s3:ListBucket"
      ],
      "Resource": [
        "arn:aws:s3:::private-mailhub-bucket",
        "arn:aws:s3:::private-mailhub-bucket/*"
      ]
    },
    {
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
        "sqs:GetQueueUrl"
      ],
      "Resource": "arn:aws:sqs:us-east-1:*:Private-MailHub-incoming-queue"
    }
  ]
}
```

**Role name:** `private-mailhub-ec2-role`

### 4. EC2 인스턴스 시작

AWS Console > EC2 > Launch instance

**설정:**
- Name: `private-mailhub-server`
- AMI: Ubuntu Server 22.04 LTS
- Instance type: t3.medium
- Key pair: 기존 키 선택 또는 생성
- VPC: Default (또는 사용자 정의)
- Subnet: Public subnet
- Auto-assign public IP: Enable
- Security group: EC2 Security Group
- IAM instance profile: `private-mailhub-ec2-role`
- Storage: 30GB gp3

**Elastic IP 할당:**
```bash
# AWS CLI로 실행
aws ec2 allocate-address --domain vpc --region us-east-1
aws ec2 associate-address --instance-id i-xxxxx --allocation-id eipalloc-xxxxx
```

Elastic IP를 메모하세요.

---

## 도메인 설정

DNS 레코드를 추가하세요 (Route 53, Cloudflare 등):

```
Type: A
Name: @
Value: YOUR_ELASTIC_IP

Type: A
Name: www
Value: YOUR_ELASTIC_IP
```

DNS 전파 확인 (5-10분 소요):
```bash
dig private-mailhub.com +short
```

---

## EC2 서버 설정

### 1. SSH 접속

```bash
ssh -i /path/to/private-mail-hub-key.pem ubuntu@YOUR_ELASTIC_IP
```

### 2. 시스템 업데이트

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git build-essential
```

### 3. Node.js 설치 (v20 LTS)

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

node --version  # v20.x 확인
npm --version   # v10.x 확인
```

### 4. Redis 설치 및 설정

```bash
# Redis 설치
sudo apt install -y redis-server

# Redis 설정 편집
sudo nano /etc/redis/redis.conf
```

**설정 변경:**
```conf
bind 127.0.0.1
maxmemory 512mb
maxmemory-policy allkeys-lru
```

**Redis 시작:**
```bash
sudo systemctl enable redis-server
sudo systemctl restart redis-server
redis-cli ping  # PONG 반환 확인
```

### 5. PM2 설치

```bash
sudo npm install -g pm2
pm2 startup systemd
# 출력된 명령어 실행
```

### 6. Nginx 설치

```bash
sudo apt install -y nginx
sudo systemctl enable nginx
sudo systemctl start nginx
```

### 7. Certbot 설치

```bash
sudo apt install -y certbot python3-certbot-nginx
```

---

## 애플리케이션 배포

### 1. 저장소 클론

```bash
sudo mkdir -p /var/www/private-mailhub
sudo chown ubuntu:ubuntu /var/www/private-mailhub
cd /var/www/private-mailhub
git clone https://github.com/YOUR_USERNAME/private-mailhub.git .
```

### 2. 백엔드 환경 변수 설정

```bash
cd /var/www/private-mailhub/back-end
nano .env
```

**.env 내용:**
```env
NODE_ENV=production
APP_NAME=private-mailhub
APP_DOMAIN=private-mailhub.com
PORT=8080

# RDS 연결 (RDS 엔드포인트로 변경)
DATABASE_URL=mysql://admin:YOUR_RDS_PASSWORD@private-mailhub-db.xxxxx.us-east-1.rds.amazonaws.com:3306/private_mailhub

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_TTL=3600

# JWT (아래 명령어로 생성)
JWT_SECRET=PASTE_GENERATED_SECRET
JWT_ACCESS_TOKEN_EXPIRATION=3600000
JWT_REFRESH_TOKEN_EXPIRATION=604800000

# Verification
VERIFICATION_CODE_EXPIRATION=300000
VERIFICATION_CODE_MAX_ATTEMPTS=3

# AWS (IAM 역할 사용, 키 불필요)
AWS_REGION=us-east-1
AWS_S3_EMAIL_BUCKET=private-mailhub-bucket
AWS_SES_FROM_EMAIL=noreply@private-mailhub.com
AWS_SQS_QUEUE_NAME=Private-MailHub-incoming-queue
AWS_SQS_QUEUE_URL=https://sqs.us-east-1.amazonaws.com/YOUR_ACCOUNT_ID/Private-MailHub-incoming-queue

# CORS
CORS_ORIGINS=https://private-mailhub.com,https://www.private-mailhub.com

# Encryption (아래 명령어로 생성)
ENCRYPTION_KEY=PASTE_GENERATED_KEY
```

**시크릿 생성:**
```bash
# JWT_SECRET 생성
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"

# ENCRYPTION_KEY 생성
node -e "console.log(require('crypto').randomBytes(16).toString('hex'))"
```

생성된 값을 `.env` 파일에 붙여넣으세요.

### 3. 백엔드 빌드

```bash
cd /var/www/private-mailhub/back-end
npm ci --production
npm run build
```

### 4. 데이터베이스 초기화

```bash
# RDS에 연결하여 스키마 생성
mysql -h private-mailhub-db.xxxxx.us-east-1.rds.amazonaws.com -u admin -p < /var/www/private-mailhub/scripts/init-db.sql
```

### 5. 프론트엔드 환경 변수 설정

```bash
cd /var/www/private-mailhub/front-end
nano .env
```

**.env 내용:**
```env
VITE_API_URL=https://private-mailhub.com
```

### 6. 프론트엔드 빌드

```bash
cd /var/www/private-mailhub/front-end
npm ci
npm run build
```

### 7. PM2로 백엔드 시작

```bash
# 로그 디렉토리 생성
sudo mkdir -p /var/log/pm2
sudo chown ubuntu:ubuntu /var/log/pm2

# PM2 시작
cd /var/www/private-mailhub
pm2 start ecosystem.config.js
pm2 save

# 상태 확인
pm2 status
pm2 logs private-mailhub-backend
```

### 8. Nginx 설정

```bash
# 설정 파일 복사
sudo cp /var/www/private-mailhub/scripts/nginx-config.conf /etc/nginx/sites-available/private-mailhub

# 심볼릭 링크 생성
sudo ln -s /etc/nginx/sites-available/private-mailhub /etc/nginx/sites-enabled/

# 기본 사이트 제거
sudo rm /etc/nginx/sites-enabled/default

# 설정 테스트
sudo nginx -t

# Nginx 재시작
sudo systemctl reload nginx
```

### 9. 초기 테스트

```bash
# 백엔드 테스트
curl http://localhost:8080/api

# 프론트엔드 테스트 (브라우저)
# http://YOUR_ELASTIC_IP
```

---

## SSL/HTTPS 설정

### 1. Let's Encrypt 인증서 발급

```bash
# Certbot 디렉토리 생성
sudo mkdir -p /var/www/certbot

# 인증서 발급 (이메일 주소 변경)
sudo certbot certonly --webroot \
  -w /var/www/certbot \
  -d private-mailhub.com \
  -d www.private-mailhub.com \
  --email your-email@example.com \
  --agree-tos \
  --no-eff-email
```

### 2. Nginx HTTPS 설정 활성화

```bash
sudo nano /etc/nginx/sites-available/private-mailhub
```

**변경사항:**
1. HTTP 서버 블록에서 프론트엔드 설정 주석 처리
2. HTTP → HTTPS 리디렉션 주석 해제
3. HTTPS 서버 블록 주석 해제

또는 `scripts/nginx-config.conf`의 주석 처리된 HTTPS 블록을 활성화하세요.

**Nginx 재시작:**
```bash
sudo nginx -t
sudo systemctl reload nginx
```

### 3. HTTPS 접속 확인

브라우저에서 `https://private-mailhub.com` 접속

### 4. 자동 갱신 확인

```bash
# 갱신 테스트
sudo certbot renew --dry-run

# 자동 갱신 서비스 확인
sudo systemctl status certbot.timer
```

---

## GitHub Actions CI/CD 설정

### 1. EC2에 배포용 SSH 키 생성

```bash
# EC2에서 실행
ssh-keygen -t ed25519 -C "github-deploy" -f ~/.ssh/github_deploy -N ""

# 공개 키를 authorized_keys에 추가
cat ~/.ssh/github_deploy.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys

# 프라이빗 키 출력 (복사)
cat ~/.ssh/github_deploy
```

### 2. GitHub Secrets 추가

GitHub 저장소 > Settings > Secrets and variables > Actions > New repository secret

**추가할 Secrets:**
- `EC2_HOST`: Elastic IP 또는 `private-mailhub.com`
- `EC2_USER`: `ubuntu`
- `EC2_SSH_KEY`: 위에서 생성한 프라이빗 키 전체 내용

### 3. GitHub Actions 워크플로우 확인

`.github/workflows/deploy.yml` 파일이 이미 생성되어 있습니다.

### 4. 첫 배포 테스트

```bash
# 로컬에서 변경사항 커밋 및 푸시
git add .
git commit -m "Setup deployment configuration"
git push origin main
```

GitHub Actions 탭에서 배포 진행 상황 확인.

---

## 검증 및 모니터링

### 백엔드 헬스체크

```bash
# API 응답 확인
curl https://private-mailhub.com/api

# PM2 상태 확인
pm2 status

# 로그 확인
pm2 logs private-mailhub-backend
tail -f /var/log/pm2/private-mailhub-out.log
```

### 데이터베이스 연결 확인

```bash
mysql -h RDS_ENDPOINT -u admin -p -e "USE private_mailhub; SHOW TABLES;"
```

### Redis 확인

```bash
redis-cli ping  # PONG 반환
```

### SSL 인증서 확인

```bash
curl -vI https://private-mailhub.com 2>&1 | grep "SSL"
```

### Nginx 로그

```bash
# 액세스 로그
sudo tail -f /var/log/nginx/access.log

# 에러 로그
sudo tail -f /var/log/nginx/error.log
```

---

## 트러블슈팅

### 502 Bad Gateway

```bash
# 백엔드 재시작
pm2 restart private-mailhub-backend

# Nginx 재시작
sudo systemctl restart nginx

# 로그 확인
pm2 logs private-mailhub-backend --err
```

### 데이터베이스 연결 실패

1. RDS 보안 그룹에서 EC2 보안 그룹 허용 확인
2. DATABASE_URL 형식 확인
3. RDS 엔드포인트 확인

```bash
# 연결 테스트
telnet RDS_ENDPOINT 3306
```

### SSL 인증서 문제

```bash
# 인증서 정보 확인
sudo certbot certificates

# 강제 갱신
sudo certbot renew --force-renewal
```

### 배포 실패 (GitHub Actions)

1. GitHub Secrets 확인
2. EC2 SSH 접속 가능 여부 확인
3. PM2 프로세스 실행 중인지 확인

---

## 유지보수

### 백업

```bash
# 애플리케이션 백업
sudo tar -czf /var/backups/app-$(date +%Y%m%d).tar.gz -C /var/www private-mailhub

# RDS 스냅샷 (AWS Console 또는 CLI)
aws rds create-db-snapshot \
  --db-instance-identifier private-mailhub-db \
  --db-snapshot-identifier backup-$(date +%Y%m%d)
```

### 롤백

```bash
# PM2 중지
pm2 stop private-mailhub-backend

# 백업 복원
cd /var/www
LATEST_BACKUP=$(ls -t /var/www/backups/ | head -1)
sudo rm -rf private-mailhub
sudo cp -r /var/www/backups/$LATEST_BACKUP private-mailhub

# PM2 재시작
pm2 start /var/www/private-mailhub/ecosystem.config.js
```

---

## 비용 최적화

- **Reserved Instances**: 1년 예약으로 40% 절감
- **t3a 인스턴스**: t3 대신 t3a 사용시 10% 절감
- **RDS 자동 중지**: 개발 환경에서 사용하지 않을 때 자동 중지 활성화
- **CloudWatch 알림**: 예상치 못한 비용 증가 모니터링

---

## 보안 체크리스트

- [ ] RDS 프라이빗 서브넷 배치
- [ ] 보안 그룹으로 포트 제한
- [ ] SSL 인증서 설치 완료
- [ ] JWT 시크릿 강력하게 생성
- [ ] IAM 역할 사용 (하드코딩된 키 없음)
- [ ] Redis localhost 바인딩
- [ ] Nginx rate limiting 활성화
- [ ] SSH 키 기반 인증만 허용
- [ ] 정기 시스템 업데이트 스케줄

---

## 도움말

문제가 발생하면:
1. 로그 확인 (PM2, Nginx, 시스템)
2. AWS 서비스 상태 확인
3. GitHub Issues에 질문 올리기

**월간 예상 비용**: ~$58 (t3.medium + db.t3.micro + 기타 서비스)
