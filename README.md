# mariadb-snapshotter
Tiny package for creating snapshots of a MariaDB instance. Created for personal use, features are limited to what is applicable to my use-case scenario.

Features:
 - Schedule snapshots of full tables that are zipped and placed into user provided directory.

Install:
```
npm i https://github.com/mbenja/mariadb-snapshotter.git
```

Import package, provide DB connection options and an optional callback, and schedule snapshots:
```
const MariaDBSnapshotter = require('mariadb-snapshotter');

const poolOptions = {
	host: 'host',
	database: 'database',
	user: 'user',
	password: 'pw'
};

const snapshotter = new MariaDBSnapshotter(`${__dirname}/exampleDirectory`, poolOptions, (res) => snapshotCallback(res));

function snapshotCallback(res) {
	if (res.success) {
		console.log(res.zipName); // handle success
	} else {
		console.log(res.err); // handle error
	}
}

const futureDate  = new Date("sometime in future");
snapshotter.initTableSnapshot('todos', 1000 * 60 * 60); // snapshot todos table once per hour starting now
snapshotter.initTableSnapshot('notebooks', 1000 * 60 * 60, futureDate); // snapshot notebooks table once per hour starting at futureDate
```

