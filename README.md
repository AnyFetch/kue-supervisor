# Kue supervisor
> Visit http://anyfetch.com for details about AnyFetch.

A supervisor for multiples queues in kue

# How to install?
Clone the repo, then `npm install`.

#How it works ?
When you launch it with `bin/server`, it will retrieve queues in redis server automatically.
Then you can use the URL `http://localhost:port/queue_prefix/` to access to UI about a specific queue.

Each queue have a worker which is launched with config.port + 1, config.port + 2, ...

Support: `support@anyfetch.com`.

