##how to run on local machine
add all the three CSV Files in data folder
-> npm install
-> npm run preStart
-> npm run start

###Some of the optimizing point
1) I have used redish for chaching the status and file for a report which will save time instead of making a database query.
2) I have also implemented redis pub/sub to handle the report creation asynchronously(Could have used RabbitMQ But since for the shake of simplicity I have implemented using redis pub/sub).
3) I have also used connection pooling for db connection which will save some time instead of making db connection on each query.
4) Since I am using node/express for backend and it is single threaded so i don't have to take care of multithreading to access synchronous request.
5) If I had more time with me to complete i will do the following optimizations:
   a) I will create index on most queried parameter (in current case one of them will be store_id)
   b) Since the number of the row in store_status is quite huge so i could have implemented sharding to query from db in much faster way.
   c) I can use lock/mutex/semaphore while accessing the database to prevent dirty read, phantom read and non-repeatable read problems.


