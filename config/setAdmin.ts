import config from 'config';
import { connect, connection, disconnect } from 'mongoose';
import readline from 'readline';
import validator from 'validator';
import { Admin } from '../src/server/controllers/admin';
import { ISetting } from '../src/shared/admin';
import Settings from '../src/server/models/admin';

const adminController = new Admin();

const args = process.argv;

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

if (args.length === 2) {
  console.info(`npm run setadmin
Usage: npm run setadmin [commands] [arguments]
Commands:
  init      script runs for first time
  add       script adds new webAdmins
  list      script lists the current webAdmins
  remove    scripts removes a single webAdmin
Arguments:
  One or more emails`);
  process.exit();
}

connect(
  config.get('db.url'), {
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true
  }
)
  .then(async () => {
    console.info('... MongoDB Connected');
    const settings: ISetting[] = await Settings.find({
      name: 'webAdmins'
    }).exec();
    if (args[2].includes('init') && (settings.length === 0 || settings[0].webAdmins.length === 0)) {
      rl.question('No webAdmins found, please type email of first webAdmin.\n', email => {
        if (!validator.isEmail(email)) {
          console.error('Value entered is not a valid email. Aborting.');
          rl.close();
          void disconnect();
        } else {
          adminController.setSysAdmins([email]).then(
            () => {
              console.info(`... New webAdmin added for ${email}`);
              rl.close();
              void disconnect();
            }
          ).catch((err: Error) => {
            console.error(`Error while attempting to set web admins: ${err.message}`);
          });
        }
      });
    } else if (args[2].includes('add')) {
      const newWebAdmins: string[] = [];
      for (let i = 3; i < args.length; i++) {
        if (!validator.isEmail(args[i])) {
          throw new Error('Argument value is not a valid email.');
        }
        newWebAdmins.push(args[i]);
      }
      await adminController.setSysAdmins(newWebAdmins);
      console.info(`... new webAdmins added for ${JSON.stringify(newWebAdmins)}`);
      void disconnect();
    } else if (args[2].includes('list')) {
      const admins = await adminController.getSetting('webAdmins');
      if (!!admins) {
        console.info(`... current webAdmins are ${JSON.stringify(admins[0].webAdmins)}`);
      }
      void disconnect();
    } else if (args[2].includes('remove')) {
      if (args.length === 4 && validator.isEmail(args[3])) {
        await adminController.deleteWebAdmin(args[3]);
        console.info(`... removed ${args[3]} from webAdmins`);
      } else {
        console.error('Email is invalid or multiple emails provided. Aborting.');
      }
      void disconnect();
    } else {
      console.info('... Found at least one webAdmin');
      void disconnect();
    }
  })
  .catch((err) => {
    console.error('Error occurred trying to connect to MongoDB', err);
    void disconnect();
  });

connection.on('error', (err: Error) => {
  console.error(`Error event occurred: ${err.message}`);
  void disconnect();
});

connection.on('close', () => {
  console.info('... MongoDB Disconnected');
  process.exit();
});