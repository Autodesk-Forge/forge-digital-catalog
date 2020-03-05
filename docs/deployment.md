# Deployment

## Table of Contents

* [Single App Mode](#single-app-mode)
* [Create Forge Production App](#create-forge-production-app)
* [Create MongoDB Atlas Cluster](#create-mongodb-atlas-cluster)
* [Amazon Web Services](#amazon-web-services)
* [Microsoft Azure](#microsoft-azure)
* [Heroku](#heroku)

## Single App Mode

To run both the frontend and backend in a single app mode, we need to have the frontend built beforehand.

    NODE_ENV=production npm run tsbuild
    npm run init
    npm run build
    npm start

## Create Forge Production App

To separate your development from your production environments, Autodesk recommends creating separate Forge app for each
environment.

To create a new Forge application for production use:

1. Navigate to [Create App](https://forge.autodesk.com/myapps/create)
1. Select Data Management API, Model Derivative API, Webhooks API
1. Give the new app a name and description
1. Set callback URL to your deployment server on AWS, Azure or Heroku
e.g.: *<https://forge-digital-catalog.herokuapp.com/api/forge/callback/oauth>*

Upon save, the new app client ID and secret will become available and you can use those new values by setting environment variables (**FORGE_CLIENT_ID**, **FORGE_CLIENT_SECRET** and **FORGE_CALLBACK_URL**) in your deployment environment.

## Create MongoDB Atlas Cluster

MongoDB Atlas is a fully-managed cloud database developed by the same people that build MongoDB. Atlas handles all the complexity of deploying, managing and healing your deployments on the cloud service provider of your choice (AWS, Azure and Google Cloud).

For our digital catalog application, we will create a new free tier cluster. Please follow the instructions below:

[Create Free Atlas MongoDB Cluster](https://docs.atlas.mongodb.com/getting-started/)

Create a new user, name him **admin** and give the user a password you can remember.

Under network access, whitelist against **0.0.0.0/0**.

To locate the connection string value, navigate to *Clusters*, select your new cluster, click on *Connect* button. Next, select *Connect your Application*, choose driver *Node.js* with version *3.0 or later*.

Here is my connection string:
```mongodb+srv://admin:<password>@forge-digital-catalog-cluster-jhb8c.mongodb.net/test?retryWrites=true&w=majority```

You will need to input your password in your connection string. This will give you your final connection string. That value will need to be set in the environment variable **MONGODB_URI** set in your deployment server.

## Amazon Web Services

Amazon Web Services (AWS) supports many different environments and programming languages, here are few options:

### Elasic Beanstalk

_Simply upload your code and Elastic Beanstalk automatically handles the deployment, from capacity provisioning, load balancing,
auto-scaling to application health monitoring. At the same time, you retain full control over the AWS resources powering
your application and can access the underlying resources anytime._ [Learn more](https://aws.amazon.com/elasticbeanstalk).

[Deployment Instructions for Node.js](deployment/aws)

## Microsoft Azure

Azure supports many different environments and programming languages, here are few options:

### App Service

_Create powerful cloud apps using a fully managed platform: Quickly build, deploy, and scale enterprise-grade web, mobile, and API apps running on any platform. Meet rigorous performance, scalability, security and compliance requirements while using a fully managed platform to perform infrastructure maintenance._ [Learn more](https://azure.microsoft.com/en-us/services/app-service/).

<!--Introduction - [What's Azure and its App Service, and why?](deployment/azure/)-->

[Deployment Instructions for Node.js](deployment/azure)

<!--Advanced Topics - [Custom domain name, Security, Load balancing, Backup and Restore, Elasticity and Autoscaling](deployment/azure/advanced)-->

## Heroku

_Heroku is a cloud-based, platform-as-a-service (PaaS) based on a managed container system for building, running, and managing modern apps. Heroku’s platform, tools, integrated services, and ecosystem are meticulously designed to support the best possible developer experience._ [Learn more](https://devcenter.heroku.com/articles/git).

[Deployment Instructions for Node.js](deployment/heroku)
