# Heroku Deployment

## Table of Contents

* [Prerequisites](#prerequisites)
* [Creating a Heroku remote](#creating-a-heroku-remote)
* [Deploying code](#deploying-code)
* [Setting the environment](#setting-the-environment)
* [Define the Web Admins](#define-the-web-admins)
* [Troubleshooting Heroku](#troubleshooting-heroku)
* [Additional Resources](#additional-resources)

## Prerequisites

Install Git and the Heroku CLI

[Git installation instructions](https://git-scm.com/book/en/v2/Getting-Started-Installing-Git) \
[Heroku CLI installation instructions](https://devcenter.heroku.com/articles/heroku-cli#download-and-install)

## Creating a Heroku remote

The `heroku create` CLI command creates a new empty application on Heroku, along with an associated
empty Git repository.

First, change directory to the local folder where you downloaded the application source code. Then, run the command
`heroku create forge-digital-catalog`

    $ heroku create forge-digital-catalog
    Creating ⬢ forge-digital-catalog... done
    https://forge-digital-catalog.herokuapp.com/ | https://git.heroku.com/forge-digital-catalog.git

To confirm that a remote named `heroku` has been set for the digital catalog app, run the command: `git remote -v`

    $ git remote -v
    heroku https://git.heroku.com/forge-digital-catalog.git (fetch)
    heroku https://git.heroku.com/forge-digital-catalog.git (push)

## Deploying code

To deploy the digital catalog app to Heroku, we need to run `git push` command to push code from local repository's
**master** branch to the new heroku **remote**. To do so, run next `git push heroku master`

    $ git push heroku master
    Enumerating objects: 2068, done.
    Counting objects: 100% (2068/2068), done.
    Delta compression using up to 12 threads
    Compressing objects: 100% (2062/2062), done.
    Writing objects: 100% (2068/2068), 2.09 MiB | 583.00 KiB/s, done.
    Total 2068 (delta 1486), reused 0 (delta 0)
    remote: Compressing source files... done.
    remote: Building source:
    remote: -----> Node.js app detected
    remote: -----> Creating runtime environment
    remote: -----> Installing binaries
    remote: -----> Installing dependencies
    remote:        Installing node modules (package.json + package-lock)
    remote: -----> Build
    remote:        Running build
    remote:        > forge-digital-catalog-app@0.1.0 build /tmp/build_08badcd0d16ad4d56ff6cda2359b0600
    remote:        > vue-cli-service build
    remote: -  Building for production...
    remote:         DONE  Build complete. The www directory is ready to be deployed.
    remote:         INFO  Check out deployment instructions at https://cli.vuejs.org/guide/deployment.html
    remote: -----> Caching build
    remote:        - node_modules
    remote: -----> Pruning devDependencies
    remote: -----> Build succeeded!
    remote: -----> Discovering process types
    remote:        Procfile declares types     -> (none)
    remote:        Default types for buildpack -> web
    remote: -----> Compressing...
    remote:        Done: 31.3M
    remote: -----> Launching...
    remote:        Released v3
    remote:        https://forge-digital-catalog.herokuapp.com/ deployed to Heroku
    remote: Verifying deploy... done.
    To https://git.heroku.com/forge-digital-catalog.git
     * [new branch]      master -> master

Use this same command whenever you want to deploy the latest committed version of your code to Heroku.

## Setting the environment

Now that we have successfully deployed the app to Heroku, we need to set the environment variables.

Login to your [Heroku dashboard](https://dashboard.heroku.com), go to **Settings** > **Config Vars**
select **Reveal Config Vars**, finally input the below environment variables:

    DEPLOY_TARGET=heroku
    FORGE_CALLBACK_URL=https://forge-digital-catalog.herokuapp.com/api/forge/callback/oauth
    FORGE_CLIENT_ID=<your app ID>
    FORGE_CLIENT_SECRET=<your app secret>
    MONGODB_URI=<your MongoDB connection uri>
    USE_LOAD_BALANCER=false
    VUE_APP_KOA_HOST=https://forge-digital-catalog.herokuapp.com
    VUE_HOST=https://forge-digital-catalog.herokuapp.com

If you prefer to set the environment variables via the command line, run the command:
`heroku config:set`, as an example the command to set VUE_HOST to new value is `heroku config:set VUE_HOST:<new value>`.

## Define the Web Admins

To add new web admins to the web application, we need to run below command

```heroku run npm run setadmins add web.admin@acme.com```

Please change the email address to the email of the administrator of your choice.

## Troubleshooting Heroku

If at any given time, you run into issues, heroku offers a command that lets you connect to your instance:

    heroku login
    heroku ps:exec
    cat ./config/production.json

This will show you if the configuration file is correctly configured for the application to run.

Heroku provides another command to **View Logs**. If any error occurs, it will be reported there.

## Additional Resources

[Official Documentation](https://devcenter.heroku.com/articles/git)
