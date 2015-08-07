# queue-processor

Consume SQS messages and do something to them, with the SQS message passed in to your processing function as the first param and a complete callback as the second. The message will be deleted from SQS when the complete callback is called. If you pass an error / anything to the complete callback the message will be preserved unless deleteOnError is truthy.

## Usage
---------------
```
var queueProcessor = require('queue-processor'),
    config = {
        accessKeyId: 'xxxxxxxxxx', // required
        secretAccessKey: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx', // required
        region: 'ap-southeast-2', // required
        queueUrl: 'https://sqs.ap-southeast-2.amazonaws.com/1234/test-queue', // required
        deleteOnError: true/false // optional
    };

function mySweetMessageHandler(message, callback) {
    doStuffToMessage(message, function(error) {
        if (error) {
            return callback(error);
        }

        callback();
    });
}

queueProcessor(config, mySweetMessageHandler);
```

Also takes an optional logger as the second param. e.g queueProcessor(config, logger, mySweetMessageHandler)