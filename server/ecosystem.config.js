module.exports = {
    apps: [
        {
            name: "LogMeBe",
            script: "index.js",

            // Options reference: https://pm2.io/doc/en/runtime/reference/ecosystem-file/
            args: "one two",
            instances: 8,
            autorestart: true,
            watch: false,
            max_memory_restart: "1500M",
            env: {
                NODE_ENV: "development"
            },
            env_production: {
                NODE_ENV: "production"
            }
        }
    ],

    deploy: {
        production: {
            key: "/home/anish/Work/Misc/remote-logging.pem",
            user: "ubuntu",
            host: "13.250.37.58",
            ref: "origin/master",
            repo: "git@github.com:pSenthil202/LogMeBE.git",
            path: "/var/www/logmebe",
            ssh_options: ["ForwardAgent=yes"],
            "post-deploy":
                "npm install && pm2 reload ecosystem.config.js --env production && node reactServer"
        }
    }
};
