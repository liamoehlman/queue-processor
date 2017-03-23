var AWS = require('aws-sdk'),
    righto = require('righto');

function deleteMessage(sqs, queue, messageHandle, callback) {
    sqs.deleteMessage({
        QueueUrl: queue,
        ReceiptHandle: messageHandle
    }, callback);
}

function getMessage(sqs, config, callback) {
    sqs.receiveMessage(
        {
            QueueUrl: config.queueUrl,
            MaxNumberOfMessages: 1,
            WaitTimeSeconds: config.waitTime || 10
        },
        function(error, data) {
            if (data && data.Messages) {
                var nextMessage = data.Messages[0];

                return callback(null, nextMessage);
            }

            callback(error);
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

    function processNextMessage() {
        var message = righto(getMessage, sqs, config);
        var processed = righto.mate(righto.after(righto(processingFunction, message)));
        var shouldDelete = righto.handle(processed, function(error, done){
            logger.error(error);
            done(null, !!config.deleteOnError);
        });
        var complete = righto(function(message, shouldDelete, done){
            if(shouldDelete !== false){
                return deleteMessage(sqs, config.queueUrl, message.ReceiptHandle, done);
            }

            done();
        }, message, shouldDelete);

        complete(function(error){
            if (error) {
                logger.error(error);
            }

            processNextMessage();
        });
    }

    processNextMessage();
}

module.exports = setupListener;