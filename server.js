// -----
// Import modules
// -----
const fs = require(`fs`);
const mysql = require(`mysql`);
const express = require(`express`);
const { exit } = require(`process`);
const { Person } = require(`./src/classes/person.js`);
const { Settings } = require(`./src/classes/settings.js`);
const { loadJSON } = require(`./src/parser/jsonParser`);
const app = express();


// -----
// Check for settings.json and if not found, create Preset
// -----
if(!(fs.existsSync(`./settings.json`))) {
    console.log(`No settings.json found!\nCreating one for you...`)
    fs.copyFileSync(`./presets/settings.json.preset`, `./settings.json`)
    console.log(`Edit the settings.json before restarting the API!`)
    exit(1)
}
else {
    loadJSON(`./settings.json`, (data) => {
        var appSettings = Object.assign(new Settings, data);

        // -----
        // Database connection
        // -----
        const db = mysql.createConnection({
            host: appSettings.host,
            user: appSettings.dbUser,
            password: appSettings.dbPass,
            database: appSettings.dbDatabase
        });

        db.connect();

        // -----
        // Setup Express (with authToken)
        // -----
        app.use(express.json());
        
        app.use((req, res, next) => { 
            if(appSettings.accessLogLevel == 1) {
                console.log(`Access from ` + req.ip);
            }
            if (req.headers.authtoken == appSettings.authToken) {
                if(appSettings.accessLogLevel == 1) {
                    console.log(`   Connection: Allowed`);
                    console.log(`   Auth Token = ${appSettings.authToken}`)
                    console.log(`   Request ${req.method} on ${req.originalUrl}`);
                }
                next();
            }
            else {
                if(appSettings.accessLog == 1) {
                    console.log(`   Connection: Denied`);
                }
                res.sendStatus(401);
            }
        });
        
        app.listen(appSettings.appPort, () => console.log(`API is listening on port ${appSettings.appPort}`));

        // -----
        // PUT functions
        // -----
        app.put(`/person`, (req, res) => {
            let newPerson = Object.assign(new Person, req.body);
            db.query(`INSERT INTO persons (name, age) VALUES ("${newPerson.name}, ${newPerson.age})`);
            res.sendStatus(201).send(`Updated user ${req.params.name}`);
        });

        // -----
        // POST functions
        // -----
        app.post(`/person/byId/:id`, (req, res) => {
            var newPerson = Object.assign(new Person, req.body);
            db.query(`UPDATE persons SET name = "${newPerson.name}", age = ${newPerson.age} WHERE id = ${req.params.id}`, (error, results, fields) => {
                if(error != null) {
                    let responseJSON;
                    responseJSON[0] = error.sqlMessage;
                    responseJSON[1] = error.sql;
                    res.sendStatus().send(responseJSON);
                }
                else if(results.affectedRows === 0) {
                    res.send(`No entry at id ${req.params.id}!`)
                }
                else if(results.changedRows > 0) {
                    res.send(`Successfully changed ${results.changedRows} Row!`)
                }
                else {
                    res.send(`The given values are the same as id ${req.params.id}!`)
                }
            });
        });
        
        // -----
        // GET functions
        // -----
        app.get(`/person/byId/:id`, (req, res) => {
            db.query(`SELECT * FROM persons WHERE id = ${req.params.id}`, (error, results, fields) => {
                if(error != null) {
                    let responseJSON;
                    responseJSON[0] = error.sqlMessage;
                    responseJSON[1] = error.sql;
                    res.send(responseJSON);
                }
                else {
                    res.send(results)
                }
            });
        });
        
        app.get(`/person/byName/:name`, (req, res) => {
            db.query(`SELECT * FROM persons WHERE name = "${req.params.name}"`, (error, results, fields) => {
                if(error != null) {
                    let responseJSON;
                    responseJSON[0] = error.sqlMessage;
                    responseJSON[1] = error.sql;
                    res.send(responseJSON);
                }
                else if (results.length == 0) {
                    res.send(`No entries found for ${req.params.name}`);
                }
                else {
                    res.send(results);
                }
            });
        });
        
        // -----
        // DELETE functions
        // -----
        app.delete(`/person/:id`, (req, res) => {
            db.query(`DELETE FROM persons WHERE id = ${req.params.id}`);
            res.end(`Deleted user with id ${req.params.id}`);
        })
    });
}