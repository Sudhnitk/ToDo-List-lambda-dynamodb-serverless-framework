'use strict';

const { DynamoDBClient, PutItemCommand, DeleteItemCommand, ScanCommand, UpdateItemCommand, GetItemCommand } = require('@aws-sdk/client-dynamodb');
const { marshall, unmarshall } = require('@aws-sdk/util-dynamodb');

const dynamoDBClient = new DynamoDBClient({ region: 'us-east-1' });
const tableName = 'TodoListTable';

module.exports.createTodo = async (event) => {
    try {
        const requestBody = JSON.parse(event.body);
        const { id, task,status } = requestBody || {};

        if (!id || !task ||!status) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'ID or  task or status is missing in the request body' })
            };
        }

        const params = {
            TableName: tableName,
            Item: marshall({
                id,
                task,
                status
            })
        };

        await dynamoDBClient.send(new PutItemCommand(params));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Todo created successfully' })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error creating todo', error: error.message })
        };
    }
};

module.exports.getTodo = async (event) => {
    try {
        const { id } = event.pathParameters || {};

        if (!id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'ID is missing in pathParameters' })
            };
        }

        const params = {
            TableName: tableName,
            Key: marshall({
                id: id
            })
        };

        const { Item } = await dynamoDBClient.send(new GetItemCommand(params));

        if (!Item) {
            return {
                statusCode: 404,
                body: JSON.stringify({ message: 'Todo not found' })
            };
        }

        const todo = unmarshall(Item);

        return {    
            statusCode: 200,
            body: JSON.stringify({ message: 'Todo retrieved successfully', todo })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error retrieving todo', error: error.message })
        };
    }
};

module.exports.updateTodo = async (event) => {
    try {
        const { id } = event.pathParameters || {};
        const { task } = JSON.parse(event.body || '{}');
        const { status } = JSON.parse(event.body || '{}');


        if (!id || !task || !status) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'ID or task or status is missing for update' })
            };
        }

        const params = {
            TableName: tableName,
            Key: marshall({
                id: id
            }),
        
            UpdateExpression: 'SET #task = :task, #status = :status',
            ExpressionAttributeNames: {
              '#task': 'task',
              '#status': 'status'
            },
            ExpressionAttributeValues: {
              ':task': { S: task },
              ':status': { S: status }
            },
            ReturnValues: 'ALL_NEW'
        };

        const { Attributes } = await dynamoDBClient.send(new UpdateItemCommand(params));
        const updatedTodo = unmarshall(Attributes);

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Todo updated successfully', updatedTodo })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error updating todo', error: error.message })
        };
    }
};

module.exports.deleteTodo = async (event) => {
    try {
        const { id } = event.pathParameters || {};

        if (!id) {
            return {
                statusCode: 400,
                body: JSON.stringify({ message: 'ID is missing in pathParameters' })
            };
        }

        const params = {
            TableName: tableName,
            Key: marshall({
                id: id
            })
        };

        await dynamoDBClient.send(new DeleteItemCommand(params));

        return {
            statusCode: 200,
            body: JSON.stringify({ message: 'Todo deleted successfully' })
        };
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ message: 'Error deleting todo', error: error.message })
        };
    }
};

module.exports.getAllTodo = async () => {
  try {
      const params = {
          TableName: tableName
      };

      const { Items } = await dynamoDBClient.send(new ScanCommand(params));

      if (!Items || Items.length === 0) {
          return {
              statusCode: 404,
              body: JSON.stringify({ message: 'No todos found' })
          };
      }

      const todos = Items.map((item) => unmarshall(item));

      console.log('Retrieved todos:', todos);

      return {
          statusCode: 200,
          body: JSON.stringify({ message: 'Todos retrieved successfully', todos })
      };
  } catch (error) {
      console.error('Error retrieving todos:', error);

      return {
          statusCode: 500,
          body: JSON.stringify({ message: 'Error retrieving todos', error: error.message })
      };
  }
};