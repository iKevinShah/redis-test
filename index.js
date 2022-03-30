/**
 * The program inserts the values 1-100 into the redis source-db
 * and reads those value in reversed order from replica-db.
 * @author Kevin Shah <kevin.mohan.shah@gmail.com>
 */
import { createClient } from 'redis';

const cliArgs = process.argv.slice(2);
let typeToCheck = 'string';

/**
 * Setting the connection details.
 */
const sourceDBConnection = 'redis://redis-13272.re-cluster1.ps-redislabs.org:13272';
const replicaDBConnection = 'redis://redis-14403.re-cluster1.ps-redislabs.org:14403';

/**
 * Hash table and sorted set name, string prefix to use
 */
const sortedSetName = 'test-sorted-set';
const hashName = 'test-hash';
const stringPrefix = 'test-string';

if (cliArgs.length === 0) {
    console.log('Couldn\'t read the required type to test, using default (single key-single value) as fallback.');
} else if (cliArgs.length > 1) {
    console.log('It seems that there are multiple options specified, using default (single key-single value) as fallback.');
} else {
    switch (cliArgs[0]) {
        case 'hash':
          console.log('Proceeding with 100 keys and values in a single hash');
          typeToCheck = 'hash';
          break;
        case 'sorted-set':
            console.log('Proceeding with 100 keys and values in a single sorted set');
            typeToCheck = 'sorted-set';
          break;
        default:
          console.log('Unsupported option specified, using default (single key-single value) as fallback.');
      }
}

(async () => {
    /**
     * First lets create the clients to the source and replica DBs
     */
	const clientSourceDB = createClient({
		url: sourceDBConnection
	});

	const clientReplicaDB = createClient({
        url: replicaDBConnection
	});

    /**
     * Set the action to perform if any of them throws an Error unavailable - Log the error.
     */
	clientSourceDB.on('error', (err) => {
        console.log('The request to the source-db failed. Please report to respective team on critical basis for further analysis.', err);
        console.log('Exiting');
        // Exit the process with error code 1 (any error code is OK, except 0 i.e. success code)
        process.exit(1);
    });

	clientReplicaDB.on('error', (err) => {
        console.log('The request to the replica-db failed. Please report to respective team on critical basis for further analysis.', err)
        console.log('Exiting');
        // Exit the process with error code 1 (any error code is OK, except 0 i.e. success code)
        process.exit(1);
    });

    /**
     * Establish connection
     */
	await clientSourceDB.connect();
    console.log('Connected to source-db');

    /**
     * Clear older entries, if any.
     */
    console.log('Clearing older entries, if any...');
    await clientSourceDB.del([hashName, sortedSetName]);
    for(let i = 1; i <= 100; i++) {
        await clientSourceDB.del([`${stringPrefix}_${i}`]);
    }

    /**
     * Connection established and older entries cleared. Start writing to source-db depending on type mentioned.
     */
    console.log('Beginning writing to source-db');

    for(let i = 1; i <= 100; i++) {
        if (typeToCheck === 'hash') {
            await clientSourceDB.HSET(hashName, i, i);
            console.log(`Field '${i}' Set in Hash named '${hashName}' with value: '${i}'`);
        } else if (typeToCheck === 'sorted-set') {
            await clientSourceDB.zAdd(sortedSetName, {
                score: i,
                value: i,
            });
            console.log(`Key no. ${i} Set in Sorted-Set named '${sortedSetName}' with value: '${i}'`);
        } else {
            await clientSourceDB.set(`${stringPrefix}-${i}`, i);
            console.log(`Key ${stringPrefix}-${i} Set with value: '${i}'`);
        }
    }
    console.log('Values 1-100 inserted in Redis source-db');

    /**
     * Write operations finished. Off to reading from replica.
     */
    console.log('Beginning reading from replica-db');

    /**
     * Connection to replica
     */
	await clientReplicaDB.connect();

    /**
     * Connection established, read depending on the type
     */
    console.log('Connected to replicaDB');
    if (typeToCheck === 'sorted-set') {
        // Call the range in 'REV' format. Use Max = 100, Min = 1
        // Update : That for some reason was not working, so had to fetch and then reverse
        const valueReturned = await clientReplicaDB.zRangeWithScores(sortedSetName, 0, 100);
        const valueReturnedReversed = valueReturned.reverse();
        valueReturnedReversed.forEach((entry) => {
            console.log(`Key no. ${entry.score} in Sorted-Set named '${sortedSetName}' returned with value: '${entry.value}'`);
        });
    } else {
        for(let i = 100; i >= 1; i--) {
            if (typeToCheck === 'hash') {
                const valueReturned = await clientReplicaDB.HGET(hashName, i);
                console.log(`Field '${i}' in hash named '${hashName}' returned with value: '${valueReturned}'`);
            } else if (typeToCheck === 'string') {
                const valueReturned = await clientReplicaDB.get(`${stringPrefix}-${i}`);
                console.log(`Key ${stringPrefix}-${i} returned value: '${valueReturned}'`);
            }
        }
    }

    /**
     * Values read, delete all keys
     */
    console.log('Values read from replica-db. Clearing');
    await clientSourceDB.del([hashName, sortedSetName]);
    for(let i = 100; i >= 1; i--) {
        await clientSourceDB.del([`${stringPrefix}_${i}`]);
    }

    /**
     * Everything is OK, exit with status code 0.
     */
    process.exit(0);
})();
