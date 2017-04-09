const express = require('express');
const db = require('sqlite');

let app = express();
const port = 4001;

const parser = require('body-parser');
app.use(parser.json())

const DB_NAME = './database.sqlite';

// this is sqliteui stuff
const socket = require('./sqliteui/websocket');
app.use('/', express.static('./sqliteui/public', {
    'index': ['index.html']
}));
const SocketInst = socket(DB_NAME, app);
app = SocketInst.app;
// end sqliteui stuff

app.get('/employees', (req, res, next) => {
    db.all('SELECT * FROM employee')
        .then((data) => {
            res.header('Content-Type', 'application/json');
            res.send({ employees: data });
        })
        .catch((e) => {
            res.status(401);
        });
});

app.use((req, res, next) => {
    let args = {};
    for (const prop in req.body) {
        console.log(prop, req.body[prop]);
        args['$' + prop] = req.body[prop];
    }
    req.body = args;
    next();
})

app.post('/employee', (req, res, next) => {
    db.all('SELECT * FROM employee')
        .then(() => {
            return db.run("INSERT INTO employee (name) values ($name)", req.body)
        })
        .then((employee) => {

            // *SUPER IMPORTANT* always broadcast to update the UI
            SocketInst.broadcast('LOAD_BUFFER');
            // END 

            return db.get('SELECT * FROM employee WHERE employee.id = ?', [employee.lastID])
        })
        .then((data) => {
            res.header('Content-Type', 'application/json');
            res.send({ employee: data });
        })
        .catch((e) => {
            res.status(401);
        });
});

app.get('/dept/:dept_id/employees', (req, res) => {
    const {dept_id} = req.params;
    db.all(`
SELECT
    d.id as id,
    d.name as name,
    e.name as employee_name,
    e.id as employee_id
FROM  dept as d 
INNER JOIN employee_dept as ed on d.id = ed.dept_id
INNER JOIN employee as e on e.id = ed.user_id
WHERE d.id = ${dept_id}
    `).then((data) => {
        res.header('Content-Type', 'application/json');
        res.send({
            employees: data,
            numResults: data.length
        });
    })
    
});

app.get('/employee/:employee_id/depts', (req, res) => {
    const {employee_id} = req.params;
    db.all(`
SELECT
    d.id as id,
    d.name as name,
    e.name as employee_name,
    e.id as employee_id
FROM  dept as d 
INNER JOIN employee_dept as ed on d.id = ed.dept_id
INNER JOIN employee as e on e.id = ed.user_id
WHERE e.id = ${employee_id}
    `).then((data) => {
        res.header('Content-Type', 'application/json');
        res.send({
            employees: data,
            numResults: data.length
        });
    })
    
});

Promise.resolve()
    .then(() => db.open(DB_NAME, { Promise }))
    .then(() => db.migrate({ force: 'last' }))
    .then(() => app.listen(port))
    .then(() => {
        console.log(`Server started on port ${port}`)
     })
    .catch(err => console.error(err.stack))
