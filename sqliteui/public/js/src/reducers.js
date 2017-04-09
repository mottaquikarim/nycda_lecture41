const DEFAULT_TABLE_QUERY = "SELECT * FROM sqlite_master WHERE type='table' ORDER BY name";
const getArrayBuffer = (url) => {
    return new Promise((resolve, reject) => {
        const http = new XMLHttpRequest();
        http.open('GET', url);
        http.responseType = 'arraybuffer';
        http.onload = () => {
            try {
                resolve(http.response);
            }
            catch (e) {
                reject(e);
            }
        };
        http.onerr = (err) => {
            reject(err);
        }
        http.send();
    });
}

const getDbInstance = (data) => {
    return new Promise((resolve, reject) => {
        resolve(new SQL.Database(new Uint8Array(data)));
    });
}

const getTables = (db, query, defaultModel) => {
    try {
        const tables = db.prepare(query);
        return tables;
    } catch(err) {
        console.log(err); 
        return defaultModel;
    }
}

const getTablesAndDb = (db, query, defaultModel) => {
    try {
        const raw = db.exec(query);
        const tables = []; //db.prepare(query);
        return {db, tables, raw};
    } catch(err) {
        console.log(err); 
        alert(err + '\n check the console.log for more info');
        return defaultModel;
    }

}

const getTableColumnTypes = (tableName, db) => {
    var result = [];
    var sel = db.prepare("PRAGMA table_info('" + tableName + "')");

    while (sel.step()) {
        var obj = sel.getAsObject();
        result[obj.name] = obj.type;
    }

    return result;
}


export function loadData(defaultModel, data) {
    if (data !== 'LOAD_BUFFER') {
        return defaultModel;
    }

    const getData = getArrayBuffer('/sqlite-data');
    const getDb = getData.then(data => getDbInstance(data));
    const tryTables = getDb.then(db => {
        return getTables(db, DEFAULT_TABLE_QUERY, defaultModel);
    });
    const generateTables = tryTables.then((tables) => {
            const tableNames = [];
            let activeTable = null;

            while (tables.step()) {
                const rowObj = tables.getAsObject();
                const {name} = rowObj;

                if (activeTable === null) {
                    activeTable = name;
                }
                tableNames.push(name);

            }
            return {tableNames, activeTable};
    });

    return Promise.all([getDb, generateTables]).then((res) => {
        const [db, obj] = res;
        const {tableNames, activeTable} = obj;

        return Object.assign(defaultModel, {db, tableNames, activeTable});
    }).then((defaultModel) => {
        return updateActiveTable(defaultModel, -1);
    });
}

export function updateActiveTable(defaultModel, index) {
    return new Promise((resolve, reject) => {
        const {tableNames, db}  = defaultModel;
        const activeTable = (index > -1) ? tableNames[index] : defaultModel.activeTable;

        const sqlQuery = "SELECT * FROM '" + activeTable + "'";
        const dbRows = getTables(db, sqlQuery, defaultModel);

        const columnTypes = getTableColumnTypes(activeTable, db);
        let addedCols = false;
        let colNames;
        const cols = [];
        const rows = [];
        while (dbRows.step()) {
            if (!addedCols) {
                addedCols = true; 

                colNames = dbRows.getColumnNames();
                cols.push(...colNames.map((colName, index) => {
                    return {
                        key: colName,
                        name: colName,
                        width: 200,
                    }
                }));
            }

            const currRow = dbRows.get();
            rows.push(currRow.reduce((_hash, row, index) => {
                _hash[colNames[index]] = row;
                return _hash;
            }, {}));

        }

        resolve(Object.assign(defaultModel, {activeTable, cols, rows}));
    });
}

export function runQuery(defaultModel, query) {
    return new Promise((resolve, reject) => {
        const {tableNames, db}  = defaultModel;

        const obj = getTablesAndDb(db, query, defaultModel);
        const newDb = obj.db;
        const raw = obj.raw;

        if (raw.length === 0) {
            const tryTables = Promise.resolve().then(() => {
                return getTables(newDb, DEFAULT_TABLE_QUERY, defaultModel);
            });
            const generateTables = tryTables.then((tables) => {
                    const tableNames = [];
                    let activeTable = null;

                    while (tables.step()) {
                        const rowObj = tables.getAsObject();
                        const {name} = rowObj;

                        if (activeTable === null) {
                            activeTable = name;
                        }
                        tableNames.push(name);

                    }
                    return {tableNames, activeTable};
            });

            return Promise.all([generateTables]).then((res) => {
                const [obj] = res;
                const {tableNames, activeTable} = obj;

                return Object.assign(defaultModel, {db: newDb, tableNames, activeTable});
            }).then((defaultModel) => {
                resolve(updateActiveTable(defaultModel, -1));
            });
        }
        // ---------- END NON SELECTION CASE

        const _tableNames = [];
        let activeTable = null;

        let addedCols = false;
        let colNames;
        const dbRows = db.prepare(query);
        const cols = [];
        const rows = [];
        while (dbRows.step()) {
            const rowObj = dbRows.getAsObject();

            if (!addedCols) {
                addedCols = true; 

                colNames = dbRows.getColumnNames();
                cols.push(...colNames.map((colName, index) => {
                    return {
                        key: colName,
                        name: colName,
                        width: 200,
                    }
                }));
            }

            const currRow = dbRows.get();
            rows.push(currRow.reduce((_hash, row, index) => {
                _hash[colNames[index]] = row;
                return _hash;
            }, {}));

        }

        resolve(Object.assign(defaultModel, {newDb, cols, rows, freezeQuery: true, activeTable: -1}));
    });
}

export function freezeQuery(defaultModel) {
    return new Promise((resolve) => {
        resolve(Object.assign(defaultModel, {freezeQuery: true}));
    });
}
