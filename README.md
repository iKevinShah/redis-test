
# Redis Test 
This test covers the use-case of writing to source and reading from the replica.

#### Pre-reqs
- The script runs on node js (v17.8.0 and above)
- The script comes with all required dependencies downloaded in `node_modules` directory. 
- Run `npm update` in case required dependencies are not available. *Internet access required for this step.*
- This script expects source and replica are already created and in sync.
- The details (with auth) needs to be provided by updating `sourceDBConnection` and `replicaDBConnection` in `index.js` on line number 14 and 15 respectively.
- The script accepts one parameter i.e. the type to use to check.
- Supported types are `string`, `hash` and `sorted-set`.
    - In `string` type, 100 strings are written to source database in order of 1 to 100 and are read in order of 100 to 1 from replica.
    - In `hash` type, 1 Hash map is set with 100 fields from 1..100 and the same hash field is read from the replica in order of 100 to 1.
    - In `sorted-set` type, 1 Sorted set is set with 100 values and their scores range from 1..100 (all unique) and the values are displayed in descending order of scores i.e. 100 to 1.

### Usage:
- To run the test, you could use `npm run` or `node index.js` which ever is comfortable.
- In case of `npm run`: 
    - `npm run test-string` will run the test use-case with `string` type.
    - `npm run test-hash` will run the test use-case with `hash` type.
    - `npm run test-sorted-set` will run the test use-case with `sorted-set` type.

- In case of `node index.js`
    - `node index.js string` will run the test use-case with `string` type.
    - `node index.js hash` will run the test use-case with `hash` type.
    - `node index.js sorted-set` will run the test use-case with `sorted-set` type.
    - 

### Errors
In case there are errors, the script will log the error on terminal and exit.

### Warning
- The script clears the keys created on start of program (in case there was an error earlier and stale entries remain). 
- The script also clears all the keys created at the end of program to avoid keys being overwritten / stale data being read.
- The script uses following names for keys. If you feel your application(s) use the same name / prefix, you may update the key to be used in script at line no. 20,21 and 22.
    - Key prefix for String based keys: `test-string`
    - Key name for Hash: `test-hash`
    - Key name for Sorted-set: `test-sorted-set`


`This was a part of the take home test for Kevin Shah <kevin.mohan.shah@gmail.com>`