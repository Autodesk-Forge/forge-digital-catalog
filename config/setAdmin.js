const MongoClient = require('mongodb').MongoClient
const MongoUri = require('mongodb-uri')
const validator = require('validator')

const config = require('config')

const args = process.argv

const url = config.get('db.url')

MongoClient.connect(url, function(connectErr, db) {
  if (connectErr) throw connectErr
  const mongoUri = MongoUri.parse(url)
  const dbo = db.db(mongoUri.database)
  const query = { name: 'webAdmins' }
  let theAdmins = []
  dbo
    .collection('settings')
    .find(query)
    .toArray(function(findErr, result) {
      if (findErr) throw findErr
      theAdmins = result[0].webAdmins
      console.log('Current Web Admins are:')
      console.log('-----------------------')
      for (let i = 0; i < theAdmins.length; i++) {
        console.log(theAdmins[i])
      }
      executeNextPart()
    })
  function executeNextPart() {
    if (args[2].indexOf('list') > -1) {
      console.log('done')
    } else if (args[2].indexOf('add') > -1) {
      console.log('adding: ')
      let body = []
      for (let i = 3; i < args.length; i++) {
        if (!validator.isEmail(args[i])) {
          throw new Error('Argument value is not a valid email.')
        }
        body.push(args[i])
      }
      console.log(body)
      if (body.length !== 0) {
        console.log('Old: ' + theAdmins)
        for (let i = 0; i < body.length; i++) {
          theAdmins.push(body[i])
        }
        console.log('New: ' + theAdmins)
        const newvalues = { $set: { webAdmins: theAdmins } }
        dbo
          .collection('settings')
          .updateOne(query, newvalues, function(updateErr, res) {
            if (updateErr) throw updateErr
            console.log('1 document updated')
            db.close()
          })
      }
    } else if (args[2].indexOf('remove') > -1) {
      if (!validator.isEmail(args[3])) {
        throw new Error('Argument value is not a valid email.')
      }
      console.log('removing: ' + args[3])
      const index = theAdmins.indexOf(args[3])
      if (index > -1) {
        theAdmins.splice(index, 1)
      }
      console.log('New: ' + theAdmins)
      const newvalues = { $set: { webAdmins: theAdmins } }
      dbo
        .collection('settings')
        .updateOne(query, newvalues, function(updateOneErr, res) {
          if (updateOneErr) throw updateOneErr
          console.log('1 document updated')
          db.close()
        })
    }
    db.close()
  }
})
