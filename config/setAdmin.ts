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
  // tslint:disable-next-line: no-console
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
    // tslint:disable-next-line: no-console
    console.info('... MongoDB Connected');
    const settings: ISetting[] = await Settings.find({
      name: 'webAdmins'
    }).exec();
    // tslint:disable-next-line: no-console
    if (args[2].indexOf('init') > -1 && (settings.length === 0 || settings[0].webAdmins.length === 0)) {
      rl.question('No webAdmins found, please type email of first webAdmin.\n', async (email) => {
        if (!validator.isEmail(email)) {
          // tslint:disable-next-line: no-console
          console.error('Value entered is not a valid email. Aborting.');
          rl.close();
          disconnect();
        } else {
          await adminController.setSysAdmins([email]);
          // tslint:disable-next-line: no-console
          console.info(`... New webAdmin added for ${email}`);
          rl.close();
          disconnect();
        }
      });
    } else if (args[2].indexOf('add') > -1) {
      const newWebAdmins: string[] = [];
      for (let i = 3; i < args.length; i++) {
        if (!validator.isEmail(args[i])) {
          throw new Error('Argument value is not a valid email.');
        }
        newWebAdmins.push(args[i]);
      }
      await adminController.setSysAdmins(newWebAdmins);
      // tslint:disable-next-line: no-console
      console.info(`... new webAdmins added for ${newWebAdmins}`);
      disconnect();
    } else if (args[2].indexOf('list') > -1) {
      const admins = await adminController.getSetting('webAdmins');
      if (admins) {
        // tslint:disable-next-line: no-console
        console.info(`... current webAdmins are ${admins[0].webAdmins}`);
      }
      disconnect();
    } else if (args[2].indexOf('remove') > -1) {
      if (args.length === 4 && validator.isEmail(args[3])) {
        await adminController.deleteWebAdmin(args[3]);
        // tslint:disable-next-line: no-console
        console.info(`... removed ${args[3]} from webAdmins`);
      } else {
        // tslint:disable-next-line: no-console
        console.error('Email is invalid or multiple emails provided. Aborting.');
      }
      disconnect();
    } else {
      // tslint:disable-next-line: no-console
      console.info('... Found at least one webAdmin');
      disconnect();
    }
  })
  .catch((err) => {
    // tslint:disable-next-line: no-console
    console.error('Error occurred trying to connect to MongoDB', err);
    disconnect();
  });

connection.on('error', err => {
  // tslint:disable-next-line: no-console
  console.error(`Error event occurred: ${err}`);
  disconnect();
});

connection.on('close', () => {
  // tslint:disable-next-line: no-console
  console.info('... MongoDB Disconnected');
  process.exit();
});