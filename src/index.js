const fs = require('fs');
const mariadb = require('mariadb');
const archiver = require('archiver');

class MariaDBSnapshotter {
    constructor(snapshotDirectory, poolOptions, callback = () => {}) {
        this.pool = mariadb.createPool(poolOptions);
        this.snapshotDirectory = snapshotDirectory;
        this.callback = callback;
    }

    initTableSnapshot(table, interval, startTime = null) {
        const date = new Date();
        const waitTime = startTime ? startTime - date : 0;

        if (date < startTime || !startTime) {
            setTimeout(() => {
                this.snapshotTable(table);
                setInterval(() => this.snapshotTable(table), interval);
            }, waitTime);
        }
    }

    async snapshotTable(table) {
        let connection;

        try {
            connection = await this.pool.getConnection();
            const rows = await connection.query(`SELECT * FROM ${table}`);
            connection.end();

            const zipName = this.zipSnapshot(table, rows);

            this.callback({ success: true, zipName });
        } catch (err) {
            this.callback({ success: false, err });
        }
    }

    zipSnapshot(table, snapshot) {
        const date = new Date();
        const csvString = this.convertSnapshotToCSVString(snapshot);
        const zipName = `snapshot-${table}-${date.toLocaleTimeString().replace(/\/| /g, '-')}.zip`

        const output = fs.createWriteStream(`${this.snapshotDirectory}/${zipName}`);
        const archive = archiver('zip');
        archive.pipe(output);
        archive.append(csvString, { name: `snapshot-${table}-${date.toLocaleTimeString().replace(/\/| /g, '-')}.csv` });
        archive.finalize();

        output.on('close', () => {
            this.logSnapshot(table, zipName, archive.pointer());
        });

        return zipName;
    }

    logSnapshot(table, zipName, zipSize) {
        console.log(`Snapshot success | Table: ${table}, Zip Name: ${zipName}, Zip Size: ${zipSize} bytes`);
    }

    convertSnapshotToCSVString(snapshot) {
        let csv = '';
        const keys = Object.keys(snapshot[0]);

        keys.forEach((key, i) => {
            csv += key.toString();
            csv += i === keys.length - 1 ? '\n' : ',';
        });

        snapshot.forEach(row => {
            keys.forEach((key, i) => {
                csv += row[key].toString();
                csv += i === keys.length - 1 ? '\n': ',';
            });
        });

        return csv;
    }
}

module.exports = MariaDBSnapshotter;
