//@ts-check
const toml = require('toml');
const fs = require('fs')
const os = require('os')

const log = (line) => console.log(`[${new Date().toISOString()}] ${line}`)

module.exports.Config = class Config {
    constructor() {
        /** @type {GH} */
        this.github = new GH()
        /** @type {OF} */
        this.omnifocus = new OF()
    }
}

// GH defines the available GitHub configuration values and defaults.
class GH {
    constructor() {
        /** @type {string} */
        this.api_url = "https://api.github.com";
        /** @type {string} */
        this.auth_token = "";
    }
}

// OF defines the available Omnifocus configuration values and defaults.
class OF {
    constructor() {
        /** @type {string} */
        this.app_tag = "github";
        /** @type {string} */
        this.assigned_project = 'GitHub Assigned';
        /** @type {string} */
        this.review_project = 'GitHub Reviews';
        /** @type {string} */
        this.notification_project = 'GitHub Notifications';
        /** @type {string} */
        this.assigned_tag = "assigned";         // Not settable from TOML
        /** @type {string} */
        this.review_tag = "review";             // Not settable from TOML
        /** @type {string} */
        this.notification_tag = "notification";        // Not settable from TOML
    }
}

module.exports.load = function load() {
    var tomlConfig, loaded

    var configFilePath = `${os.homedir()}/.github-to-omnifocus.toml`
    log(`Reading config at ${configFilePath}...`)

    try {
        tomlConfig = fs.readFileSync(configFilePath, 'utf8')
    } catch (err) {
        console.error(err)
        process.exit(1)
    }

    try {
        loaded = toml.parse(tomlConfig);
    } catch (e) {
        console.error("Parsing error on line " + e.line + ", column " + e.column +
            ": " + e.message);
        process.exit(1)
    }

    const c = new module.exports.Config()

    // Get value from TOML or use default.
    loaded.github = loaded.github || {}
    c.github.api_url = loaded.github.api_url || c.github.api_url
    c.github.auth_token = loaded.github.auth_token || c.github.auth_token

    loaded.omnifocus = loaded.omnifocus || {}
    c.omnifocus.app_tag = loaded.omnifocus.app_tag || c.omnifocus.app_tag;
    c.omnifocus.assigned_project = loaded.omnifocus.assigned_project || c.omnifocus.assigned_project;
    c.omnifocus.review_project = loaded.omnifocus.review_project || c.omnifocus.review_project;
    c.omnifocus.notification_project = loaded.omnifocus.notification_project || c.omnifocus.notification_project;

    log("Config loaded:")
    log(`  GitHub API server: ${c.github.api_url}`);
    log(`  GitHub token: ${c.github.auth_token ? "*****" : ""}`);
    log(`  Omnifocus tag: ${c.omnifocus.app_tag} `)
    log(`  Omnifocus issue project: ${c.omnifocus.assigned_project} `)
    log(`  Omnifocus PRs project: ${c.omnifocus.review_project} `)
    log(`  Omnifocus notifications project: ${c.omnifocus.notification_project} `)

    return c
}
