# Kue supervisor
> Visit http://anyfetch.com for details about AnyFetch.

Supervising multiples Redis queues in [kue](https://github.com/learnboost/kue)

# How to install?
Install `redis-server`.
Clone the repo, then `npm install`.

# How it works ?
Starting `bin/server` will retrieve all Kue queues in redis server automatically.

Navigate to `http://localhost:port/queue_prefix/` to retrieve details and tasks about this specific queue, or go to `/` for a list of queues on the server.

Internally, each queue forks the main process and create a worker AND a server which listens on port config.port + 1, config.port + 2. For very large applications using many queues, this can quickly get unwieldy.

# Security
You can use HTTP Basic Authentication to secure access to kue supervisor, by setting the `USER` and `PASS` environment variables.

Support: `support@anyfetch.com`.

