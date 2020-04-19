//@ts-check
const toml = require('toml');
const fs = require('fs')
const os = require('os')

class Config {
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
        this.tag = "github-to-omnifocus";
        /** @type {string} */
        this.issue_project = 'GitHub Issues';
        /** @type {string} */
        this.pr_project = 'GitHub PRs';
        /** @type {string} */
        this.issue_tag = "gh-issue";
        /** @type {string} */
        this.pr_tag = "gh-pr";
    }
}

exports.loadConfig = () => {
    var tomlConfig, loaded

    var configFilePath = `${os.homedir()}/.github-to-omnifocus.toml`
    console.log(`Reading config at ${configFilePath}...`)

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

    const c = new Config()

    // Get value from TOML or use default.
    loaded.github = loaded.github || {}
    c.github.api_url = loaded.github.api_url || c.github.api_url
    c.github.auth_token = loaded.github.auth_token || c.github.auth_token

    loaded.omnifocus = loaded.omnifocus || {}
    c.omnifocus.tag = loaded.omnifocus.tag || c.omnifocus.tag;
    c.omnifocus.issue_project = loaded.omnifocus.issue_project || c.omnifocus.issue_project;
    c.omnifocus.pr_project = loaded.omnifocus.pr_project || c.omnifocus.pr_project;

    console.log("Config loaded:")
    console.log(`  GitHub API server: ${c.github.api_url}`);
    console.log(`  GitHub token: ${c.github.auth_token ? "*****" : ""}`);
    console.log(`  Omnifocus tag: ${c.omnifocus.tag} `)
    console.log(`  Omnifocus issue project: ${c.omnifocus.issue_project} `)
    console.log(`  Omnifocus PRs project: ${c.omnifocus.pr_project} `)

    return c
}
