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

class GH {
    constructor() {
        /** @type {string} */
        this.api_url;
        /** @type {string} */
        this.auth_token;
    }
}

class OF {
    constructor() {
        /** @type {string} */
        this.tag;
        /** @type {string} */
        this.issue_project;
        /** @type {string} */
        this.pr_project;
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

    loaded.github = loaded.github || {}
    c.github.api_url = loaded.github.api_url || ""
    c.github.auth_token = loaded.github.auth_token || ""

    loaded.omnifocus = loaded.omnifocus || {}
    c.omnifocus.tag = loaded.omnifocus.tag || "github";
    c.omnifocus.issue_project = loaded.omnifocus.issue_project || 'GitHub Issues';
    c.omnifocus.pr_project = loaded.omnifocus.pr_project || 'GitHub PRs';

    console.log("Config loaded:")
    console.log(`  GitHub API server: ${c.github.api_url}`);
    console.log(`  GitHub token: ${c.github.auth_token}`);
    console.log(`  Omnifocus tag: ${c.omnifocus.tag}`)
    console.log(`  Omnifocus issue project: ${c.omnifocus.issue_project}`)
    console.log(`  Omnifocus PRs project: ${c.omnifocus.pr_project}`)

    return c
}
