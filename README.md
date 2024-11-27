how to run on the local machine <br>
add all three CSV Files to the data folder <br>
-> npm install <br>
-> npm run preStart <br>
-> npm run start <br>

Some of the optimizing points <br>
1) I have used redish for chaching the status and file for a report which will save time instead of making a database query.
2) I have also implemented Redis pub/sub to handle the report creation asynchronously(I could have used RabbitMQ, but for the sake of simplicity, I have implemented Redis pub/sub).
3) I have also used connection pooling for database connections, which saves some time instead of making a database connection for each query.
4) Since I am using node/express for the backend and it is single threaded so I don't have to take care of multithreading to access synchronous requests.
5) If I had more time to complete I would do the following optimizations:<br>
   a) I will create an index on the most queried parameter (in the current case one of them will be store_id)<br>
   b) Since the number of the rows in store_status is quite huge I could have implemented sharding to query from db in a much faster way.<br>
   c) I can use lock/mutex/semaphore while accessing the database to prevent dirty read, phantom read, and non-repeatable read problems.<be>


Demonstration Video Link -> https://drive.google.com/file/d/1W3ei1iSisdlttHW5KJk5XlFts3Fq3Mc5/view?usp=sharing

1st output CSV Data Google Drive link -> https://drive.google.com/file/d/1-o8Ix7Zkm6rXcsxao0dFnXa5QuHoDTNe/view?usp=sharing

2nd output CSV Data Google Drive link -> https://drive.google.com/file/d/1-TW717IUWTr6csofBm0lINqDlv3zMnA0/view?usp=sharing


