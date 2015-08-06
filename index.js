var AWS = require('aws-sdk');

function deleteMessage(sqs, queue, messageHandle, logger) {
    sqs.deleteMessage({
        QueueUrl: queue,
        ReceiptHandle: messageHandle
    }, function(error) {
        if (error) {
            logger.error(error);
        }
    });
}

function createProcessedCallback(sqs, config, message, logger, recurse) {
    return function(error) {
        recurse();

        if (error && !config.deleteOnError) {
            return;
        }

        deleteMessage(sqs, config.queueUrl, message.ReceiptHandle, logger);
    };
}

function getMessage(sqs, config, logger, processingFunction, recurse) {
    var currentMessage;

    sqs.receiveMessage(
        {
            QueueUrl: config.queueUrl,
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: config.waitTime || 10
        },
        function(error, data) {
            if (error) {
                logger.error(error);
            }

            if (data.Messages) {
                currentMessage = data.Messages[0];

                return processingFunction(
                    currentMessage,
                    createProcessedCallback(sqs, config, currentMessage, logger, recurse)
                );
            }

            recurse();
        }
    );
}

function setupListener(config, logger, processingFunction) {
    var sqs = new AWS.SQS({
            accessKeyId: config.accessKeyId,
            secretAccessKey: config.secretAccessKey,
            region: config.region
        });

    if (!processingFunction) {
        processingFunction = logger;
        logger = console;
    }

    function recurse() {
        process.nextTick(function() {
            getMessage(sqs, config, logger, processingFunction, recurse);
        });
    }

    recurse();
}

module.exports = setupListener;