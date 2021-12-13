class Settings {
    constructor(appPort, dbHost, dbUser, dbPass, dbDatabase, authToken, accessLog) {
        this.appPort = appPort;
        this.dbHost = dbHost;
        this.dbUser = dbUser;
        this.dbPass = dbPass;
        this.dbDatabase = dbDatabase;
        this.authToken = authToken;
        this.accessLog = accessLog;
    }
}
exports.Settings = Settings;