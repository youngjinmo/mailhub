package com.emailrelay.listener;

import com.emailrelay.service.EmailRelayService;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import io.awspring.cloud.sqs.annotation.SqsListener;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class SqsMessageListener {

    private final EmailRelayService emailRelayService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    /**
     * Listen to SQS messages from S3 Event Notifications
     * Message format: S3 Event Notification JSON
     */
    @SqsListener("${aws.sqs.email-queue-name}")
    public void receiveMessage(String message) {
        try {
            log.info("Received SQS message: {}", message);

            // Parse S3 Event Notification
            JsonNode rootNode = objectMapper.readTree(message);
            JsonNode records = rootNode.get("Records");

            if (records == null || !records.isArray() || records.isEmpty()) {
                log.error("Invalid S3 Event Notification format: no Records found");
                return;
            }

            // Process each S3 event record
            for (JsonNode record : records) {
                processS3Event(record);
            }

        } catch (Exception e) {
            log.error("Failed to process SQS message", e);
            throw new RuntimeException("SQS message processing failed", e);
        }
    }

    /**
     * Process individual S3 event record
     */
    private void processS3Event(JsonNode record) {
        try {
            JsonNode s3 = record.get("s3");
            if (s3 == null) {
                log.error("Invalid S3 event: no s3 field found");
                return;
            }

            // Extract S3 bucket and key
            String bucketName = s3.get("bucket").get("name").asText();
            String objectKey = s3.get("object").get("key").asText();

            log.info("Processing S3 event - Bucket: {}, Key: {}", bucketName, objectKey);

            // Forward email using the S3 key
            emailRelayService.forwardEmail(objectKey);

            log.info("Successfully processed S3 event for key: {}", objectKey);

        } catch (Exception e) {
            log.error("Failed to process S3 event", e);
            throw new RuntimeException("S3 event processing failed", e);
        }
    }
}
