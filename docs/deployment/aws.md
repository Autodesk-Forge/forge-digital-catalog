# AWS Deployment

Amazon Web Services (AWS) comprises over one hundred services, each of which exposes an area of functionality.

With Elastic Beanstalk service, you can quickly deploy and manage applications in the AWS Cloud without having to learn about the infrastructure that runs those applications.

Elastic Beanstalk supports applications developed in Node.js.

## Table of Contents

* [Prerequisites](#prerequisites)
* [Build and archive the app](#build-and-archive-the-app)
* [Creating an Elastic Beanstalk App](#creating-an-elastic-beanstalk-app)
* [Setting the environment](#setting-the-environment)
* [Troubleshooting Elastic Beanstalk App](#troubleshooting-elastic-beanstalk-app)
* [Additional Resources](#additional-resources)

## Prerequisites

If you're not already an AWS customer, you need to sign up. Signing up enables you to access Elastic Beanstalk and other AWS services that you need.

### To sign up for an AWS account

1. Open the [Elastic Beanstalk console](https://console.aws.amazon.com/elasticbeanstalk)
2. Follow the instructions

## Build and archive the app

1. Download the application code to a local directory \
```git clone https://github.com/Autodesk-Forge/forge-digital-catalog digital-catalog```
2. Change directory \
```cd digital-catalog```
3. Delete the ```node_modules``` directory if present
4. Delete the ```www``` directory if present
5. Delete the files ```./config/development.json``` ```./config/test.json``` and ```./config.production.json``` if present
6. Archive the files in current directory into a compressed zip file including the folder `.ebextensions`
7. If pointing to a new database, you will need to run the command to add your web admins \
```npm run setadmin add web.admin@acme.com```

## Creating an Elastic Beanstalk App

1. Open the Elastic Beanstalk console with this preconfigured link:
   <https://console.aws.amazon.com/elasticbeanstalk/home#/gettingStarted?applicationName=getting-started-app>

2. Specify Application name as **forge-digital-catalog**

3. Choose **Node.js** for the platform

4. Select **Upload your code** and browse to your local ZIP archive

5. Click on **Create application** next

## Setting the Environment

Log back into your AWS console, and select Elastic Beanstalk service.

You should now see your new application listed. Select the app to set the environment variables. To do so, navigate to

```All Applications > forge-digital-catalog > ForgeDigitalCatalog-env > Configuration > Software > Click on Modify```

Scroll to the bottom of the page and under ```Environment properties``` specify your environment variables:

    DEPLOY_TARGET=aws
    FORGE_CALLBACK_URL=<Elastic Beanstalk Url>/api/forge/callback/oauth
    FORGE_CLIENT_ID=<your app ID>
    FORGE_CLIENT_SECRET=<your app secret>
    MONGODB_URI=<your MongoDB connection uri>
    NPM_CONFIG_UNSAFE_PERM=true
    USE_LOAD_BALANCER=false
    VUE_APP_KOA_HOST=<Elastic Beanstalk Url>
    VUE_HOST=<Elastic Beanstalk Url>

Finally click ```Apply```.

## Troubleshooting Elastic Beanstalk App

To troubleshoot and monitor your new Elastic Beanstalk environment, please refer to <https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/environments-health.html.>

If running into `npm update check failed` error, you will need to change ownership on the /tmp/.config folder and files.

### Establish SSH tunnel

1. Login to your AWS console
2. Navigate to EC2 Dashboard
3. Select Key Pairs under Network & Security
4. Create a key pair
5. Save the .pem file in a local directory (do not lose this file)
6. Change permission using `chmod 400 <file name>.pem`
7. Go to Elastic Beanstalk console
8. Open your environment
9. Click on Configuration > Security > select the EC2 key pair you created previously
10. Save the configuration change and wait for the Elastic Beanstalk instance to restart
11. Go back to EC2 Dashboard
12. Select Instances
13. Select the instance associated to the Beanstalk instance
14. Click on Connect
15. Copy the ssh command and run it from the directory where you've stored the pem file

## Additional Resources

[Official Documentation](https://docs.aws.amazon.com/elasticbeanstalk/latest/dg/GettingStarted.html#GettingStarted.Walkthrough.CreateApp)
