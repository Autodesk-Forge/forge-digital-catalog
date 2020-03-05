# WebHooks

## Table of Contents

* [Configuring your local server](#configuring-your-local-server)
* [Installing ngrok](#installing-ngrok)
* [Running ngrok](#runnning-ngrok)

## Configuring your local server

For WebHooks service to send notifications to your `localhost` server, you can use `ngrok`.

## Installing ngrok

To install ngrok, please visit the [download page](https://ngrok.com/download).

## Running ngrok

1. To run ngrok, open a terminal and run the command
    `ngrok http 3000 -host-header="localhost:3000"`

2. You should see output like:

    ```js
    Session Status                online
    Version                       2.2.8
    Region                        United States (us)
    Web Interface                 http://127.0.0.1:4040
    Forwarding                    http://bf067e05.ngrok.io -> localhost:5678
    Forwarding                    https://bf067e05.ngrok.io -> localhost:5678
    ```

3. Open in your favorite text editor `./config/development.json` and locate the line with `ngrok: { callbackURL: '' }`.

4. Copy the ngrok url value, e.g. `bf067e05` into the callbackURL value. Save the change.

5. Restart the local backend server, by running `npm run dev`

6. Login to the administration console, and delete existing webhook to add new one.

You should now be able to publish CAD files to the catalog.
