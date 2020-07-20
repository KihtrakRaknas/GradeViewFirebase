const admin = require('firebase-admin');
const functions = require('firebase-functions');
//const { PubSub } = require('@google-cloud/pubsub');
const { Expo } = require('expo-server-sdk')
const fetch = require("node-fetch");
const cors = require("cors")
//const NodeRSA = require('node-rsa');
//const key = new NodeRSA({ b: 512 });
//const keysObj = require('./secure_content/keys')


admin.initializeApp(functions.config().firebase);

var db = admin.firestore();

const express = require("express");

// const puppeteer = require('puppeteer');
// const $ = require('cheerio');
const bodyParser = require('body-parser');

let expo = new Expo();


// const pubsub = new PubSub({
//   projectId: 'gradeviewapp',
// });

const app = express()
const port = process.env.PORT || 3000
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

// var currentUsers = [];

// app.get('/', async (req, res) => {
//   //res.json({get:"gotten"})
//   const username = req.query.username;//'10012734'
//   const password = req.query.password; //'Sled%2#9'
//   console.log("username: " + username + "; password: " + password);

//   var userRef = db.collection('users').doc(username);



//   const data = JSON.stringify({ username: username, password: password });
//   const dataBuffer = Buffer.from(data);

//   pubsub
//     .topic("updateGrades")
//     .publish(dataBuffer)
//     .then(messageId => {
//       console.log(`:::::::: Message ${messageId} has now published. :::::::::::`);
//       return true;
//     })
//     .catch(err => {
//       console.error("ERROR:", err);
//       throw err;
//     });

//   userRef.get()
//     .then(doc => {
//       if (!doc.exists) {
//         console.log('No such document!');

//         console.log("cached object not found")
//         res.json({ "Status": "loading..." })

//       } else {
//         console.log('Document data:', doc.data());

//         console.log("returning cached object")
//         res.json(doc.data())
//       }

//     })
//     .catch(err => {
//       console.log('Error getting document', err);
//     });

//   return updateGrades(username, password).then(() => {
//     //res.end();
//   }).catch(err => {
//     console.log('Error updating grades', err);
//   })

// })


// app.post('/', async (req, res) => {

//   const username = req.body.username;//'10012734'
//   const password = req.body.password; //'Sled%2#9'
//   console.log(req.body);
//   var obj //= await storage.getItem(username);
//   if (obj != null) {
//     console.log("returning cached object")
//     res.json(obj)
//     res.end();
//   } else {
//     console.log("cached object not found")
//     res.json({ "Status": "loading..." })
//   }
//   if (!currentUsers.includes(username)) {
//     currentUsers.push(username)
//     console.log("Updating cache for future requests")
//     res.json(getData(username, password))
//     var dataObj //= await getData(username,password)
//     if (dataObj["Status"] == "Completed") {
//       console.log(dataObj["Status"])
//       storage.setItem(username, dataObj)
//     } else {
//       console.log("Not cached due to bad request")
//     }

//     var index = currentUsers.indexOf(username);
//     if (index !== -1) currentUsers.splice(index, 1);
//   }
//   res.end();
// })

// app.post('/check', async (req, res) => {

//   const username = req.body.username;//'10012734'
//   const password = req.body.password; //'Sled%2#9'
//   console.log(req.body);
//   var signedIn = await checkUser(username, password)
//   console.log({ valid: signedIn })
//   res.json({ valid: signedIn })
//   res.end();

//   if (!currentUsers.includes(username)) {
//     currentUsers.push(username)
//     console.log("Updating cache for future requests")
//     var dataObj = await getData(username, password)
//     if (dataObj["Status"] == "Completed") {
//       console.log(dataObj["Status"])
//       storage.setItem(username, dataObj)
//     } else {
//       console.log("Not cached due to bad request")
//     }

//     var index = currentUsers.indexOf(username);
//     if (index !== -1) currentUsers.splice(index, 1);
//   }

// })

//Function to message everyone on the app
app.get('/msg', async (req, res) => {
  const password = req.query.password;
  return db.collection('errors').doc('secure').get().then(doc => {
    if (!doc.exists) {
      console.log('No such document!');
    } else {
      if (!(doc.data()["pass"] && doc.data()["pass"] == password))
        return res.json({ "status": "Invalid Pass" });
      const title = req.query.title;
      const subtitle = req.query.subtitle;
      const body = req.query.body;
      return db.collection('userData').get()
        .then(snapshot => {
          snapshot.forEach(doc => {
            const data = doc.data();
            if (data && data["Tokens"]) {
              notify(data["Tokens"], title, subtitle, body, { txt: body })
            }
          });
        }).then(() => {
          return res.json({ "status": "done" });
        })
        .catch(err => {
          console.log('Error getting documents', err);
        });
    }
  })
    .catch(err => {
      console.log('Error getting document', err);
    });

})

app.use(cors({ origin: true }))

//Used to check the last time the scraper ran
app.get('/timestamps', async (req, res) => {
  db.collection('errors').doc("Auto-Scraper").get().then(doc => {
    res.json(doc.data())
  })
})

//Display # of users
app.get('/users', async (req, res) => {
  return db.collection('userData').get().then(snapshot => {
    return db.collection('userEmails').doc("backup").get().then(docBackup => {
      return fetch('https://raw.githubusercontent.com/KihtrakRaknas/DirectoryScraper/master/outputObj.json', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
      }).then((response) => {
        return response.json();
      }).then((responseJson) => {
        let output = docBackup.data()["backup"];
        snapshot.forEach(doc => {
          let err = false
          if (output.map(function (e) { return e.email; }).indexOf(doc.id) != -1)
            err = true;
          if (!err)
            output.push({ email: doc.id, name: responseJson[doc.id] })
        });
        return res.json(output);
      })
    }).catch(err => {
      console.log('Error getting documents', err);
    });
  }).catch(err => {
    console.log('Error getting documents', err);
  });
})

//Used to calculate the number of active users
app.get('/userTimestamps', async (req, res) => {
  return db.collection('userTimestamps').get().then(snapshot => {
    let output = []
    snapshot.forEach(doc => {
      output.push(doc.data())
    });

    return res.json(output);
  })
    .catch(err => {
      console.log('Error getting documents', err);
    });

})

// module.exports.updateGradesPubSub = functions.pubsub.topic('updateGrades').onPublish(async (message) => {
//   try {
//     var username = message.json.username;
//     var password = message.json.password;
//     var userRef = db.collection('users').doc(username);

//     var dataObj = await getData(username, password)
//     if (dataObj["Status"] == "Completed") {
//       userRef.set(dataObj);
//     } else {
//       console.log("Not cached due to bad request")
//     }

//   } catch (e) {
//     console.error('PubSub message was not JSON' + message.json.username, e);
//   }
//   return 0;
// });

// async function updateGrades(username, password) {
//   //if(!currentUsers.includes(username)){
//   //currentUsers.push(username)

//   var dataObj = await getData(username, password)
//   if (dataObj["Status"] == "Completed") {
//     userRef.set(dataObj);
//   } else {
//     console.log("Not cached due to bad request")
//   }

//   //var index = currentUsers.indexOf(username);
//   //if (index !== -1) currentUsers.splice(index, 1);
//   //}
//   return "done";
// }


app.listen(port, () => console.log(`Example app listening on port ${port}!`))

// const url = 'https://students.sbschools.org/genesis/parents?gohome=true';

// //var id = '10012734'





// function func() {
//   eval("header_goToTab('studentdata&tab2=gradebook','studentid=" + id + "');");
// }

// async function checkUser(email, pass) {
//   var email = encodeURIComponent(email);
//   pass = encodeURIComponent(pass);
//   var url2 = 'https://students.sbschools.org/genesis/j_security_check?j_username=' + email + '&j_password=' + pass;


//   const browser = await puppeteer.launch({
//     args: ['--no-sandbox', '--disable-setuid-sandbox'],
//     /*
//       headless: false, // launch headful mode
//       slowMo: 250, // slow down puppeteer script so that it's easier to follow visually
//     */
//   });
//   const page = await browser.newPage();
//   await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3738.0 Safari/537.36');

//   /*await page.setViewport({
//     width: 1920,
//     height: 1080
// })*/

//   await page.setRequestInterception(true);

//   page.on('request', (req) => {
//     if (req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() === 'image' || req.resourceType() === 'media') {
//       req.abort();
//     }
//     else {
//       req.continue();
//     }
//   });

//   await page.goto(url, { waitUntil: 'networkidle2' });
//   await page.goto(url2, { waitUntil: 'networkidle2' });

//   var signedIn = false;
//   if (await $('.sectionTitle', await page.content()).text().trim() != "Invalid user name or password.  Please try again.")
//     signedIn = true;
//   await browser.close();

//   return signedIn;


// }

// async function scrapeMP(page) {
//   var list = await page.evaluate(() => {
//     var assignments = [];
//     for (var node of document.getElementsByClassName("list")[0].childNodes[1].childNodes) {

//       if (node.classList && !node.classList.contains("listheading") && node.childNodes.length >= 11) {
//         var assignData = {};

//         //console.log(node.childNodes);
//         //console.log(node.childNodes[3].innerText);
//         assignData["Date"] = node.childNodes[3].innerText;
//         //console.log(node.childNodes[7].innerText);
//         assignData["Category"] = node.childNodes[7].innerText
//         //console.log(node.childNodes[9].innerText);
//         assignData["Name"] = node.childNodes[9].innerText;
//         //console.log(node.childNodes[11].childNodes[0].textContent.replace(/\s/g,''));
//         assignData["Grade"] = node.childNodes[11].childNodes[0].textContent.replace(/\s/g, '')
//         assignments.push(assignData);
//       }
//     }
//     return assignments;
//   });
//   return list;
// }


// async function getData(email, pass) {
//   var grades = {};

//   var email = encodeURIComponent(email);
//   pass = encodeURIComponent(pass);
//   var url2 = 'https://students.sbschools.org/genesis/j_security_check?j_username=' + email + '&j_password=' + pass;

//   const browser = await puppeteer.launch({
//     args: [
//       '--no-sandbox',
//       '--disable-setuid-sandbox',
//       '--disable-dev-shm-usage',
//       '--disable-accelerated-2d-canvas',
//       '--disable-gpu',
//       '--window-size=1920x1080',
//     ],
//     /*
//       //headless: false, // launch headful mode
//       //slowMo: 1000, // slow down puppeteer script so that it's easier to follow visually
//     */
//   });
//   const page = await browser.newPage();
//   await page.setUserAgent('Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/75.0.3738.0 Safari/537.36');

//   await page.setRequestInterception(true);
//   const blockedResourceTypes = [
//     'image',
//     'media',
//     'font',
//     'texttrack',
//     'object',
//     'beacon',
//     'csp_report',
//     'imageset',
//     'stylesheet',
//   ];

//   const skippedResources = [
//     'quantserve',
//     'adzerk',
//     'doubleclick',
//     'adition',
//     'exelator',
//     'sharethrough',
//     'cdn.api.twitter',
//     'google-analytics',
//     'googletagmanager',
//     'google',
//     'fontawesome',
//     'facebook',
//     'analytics',
//     'optimizely',
//     'clicktale',
//     'mixpanel',
//     'zedo',
//     'clicksor',
//     'tiqcdn',
//   ];
//   page.on('request', (req) => {
//     const requestUrl = req._url.split('?')[0].split('#')[0];
//     if (
//       blockedResourceTypes.indexOf(req.resourceType()) !== -1 ||
//       skippedResources.some(resource => requestUrl.indexOf(resource) !== -1)
//     ) {
//       req.abort();
//     } else {
//       req.continue();
//     }
//   });

//   await page.goto(url, { waitUntil: 'domcontentloaded' });
//   await page.goto(url2, { waitUntil: 'domcontentloaded' });

//   var signedIn = false;
//   if (await $('.sectionTitle', await page.content()).text().trim() != "Invalid user name or password.  Please try again.")
//     signedIn = true;
//   if (!signedIn) {
//     await browser.close();
//     console.log("BAD user||pass")
//     return { Status: "Invalid" };
//   }

//   const url3 = "https://students.sbschools.org/genesis/parents?tab1=studentdata&tab2=gradebook&tab3=coursesummary&action=form&studentid=" + email.split("%40")[0];
//   await page.goto(url3, { waitUntil: 'domcontentloaded' });


//   //await page.evaluate(text => [...document.querySelectorAll('*')].find(e => e.textContent.trim() === text).click(), "Gradebook");
//   //await page.waitForNavigation({ waitUntil: 'domcontentloaded' })
//   //await page.evaluate(text => [...document.querySelectorAll('*')].find(e => e.textContent.trim() === text).click(), "Course Summary");
//   //await page.waitForNavigation({ waitUntil: 'domcontentloaded' })

//   const classes = await page.evaluate(() => (Array.from((document.getElementById("fldCourse")).childNodes, element => element.value)));

//   for (var indivClass of classes) {
//     if (indivClass) {
//       //indivClass
//       await page.evaluate((classID) => changeCourse(classID), indivClass);
//       await page.waitForNavigation({ waitUntil: 'domcontentloaded' })
//       const markingPeriods = await page.evaluate(() => (Array.from((document.getElementById("fldSwitchMP")).childNodes, element => element.value)));
//       const defaultMP = await page.evaluate(() => document.getElementById("fldSwitchMP").value);
//       markingPeriods.splice(markingPeriods.indexOf(defaultMP), 1);

//       const ClassName = await page.evaluate((classID) => document.querySelectorAll('[value="' + classID + '"]')[0].innerText, indivClass);
//       if (!grades[ClassName])
//         grades[ClassName] = {}

//       grades[ClassName]["teacher"] = await page.evaluate(() => {
//         let list = document.getElementsByClassName("list")[0].childNodes[1].childNodes[4].childNodes[5];
//         if (list)
//           return list.innerText
//         else
//           return null;
//       });

//       if (!grades[ClassName][defaultMP])
//         grades[ClassName][defaultMP] = {}
//       grades[ClassName][defaultMP]["Assignments"] = await scrapeMP(page);
//       grades[ClassName][defaultMP]["avg"] = await page.evaluate(() => document.getElementsByTagName("b")[0].innerText.replace(/\s+/g, '').replace(/[^\d.%]/g, ''))
//       //console.log(ClassName)
//       for (var indivMarkingPeriod of markingPeriods) {
//         if (indivMarkingPeriod) {

//           if (!grades[ClassName]["teacher"]) {
//             grades[ClassName]["teacher"] = await page.evaluate(() => {
//               let list = document.getElementsByClassName("list")[0].childNodes[1].childNodes[4].childNodes[5];
//               if (list)
//                 return list.innerText
//               else
//                 return null;
//             });
//           }

//           await page.evaluate((indivMP) => {

//             document.getElementById("fldSwitchMP").value = indivMP;
//             displayMPs();
//             document.getElementsByTagName("BUTTON")[1].click()//"Switch Marking Period btn"
//           }, indivMarkingPeriod);
//           await page.waitForNavigation({ waitUntil: 'domcontentloaded' })

//           //console.log("MP switch")

//           if (!grades[ClassName][indivMarkingPeriod])
//             grades[ClassName][indivMarkingPeriod] = {}
//           //console.log("Scraping page")
//           grades[ClassName][indivMarkingPeriod]["Assignments"] = await scrapeMP(page);
//           //console.log("Getting avg")
//           grades[ClassName][indivMarkingPeriod]["avg"] = await page.evaluate(() => document.getElementsByTagName("b")[0].innerText.replace(/\s+/g, '').replace(/[^\d.%]/g, ''))
//           //console.log("Done")
//         }
//       }
//     }
//   }
//   grades["Status"] = "Completed";
//   return grades;
//   await browser.close();
// }


const api1 = functions.https.onRequest(app);


module.exports.api1 = api1;

//A notification sent to my phone when a user joins
exports.createUser = functions.firestore.document('userData/{userId}').onCreate((snap, context) => {
  return fetch('https://raw.githubusercontent.com/KihtrakRaknas/DirectoryScraper/master/outputObj.json', {
    method: 'GET',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
  })
    .then((response) => {
      return response.json();
    })
    .then((responseJson) => {
      let email = context.params.userId;
      let name = responseJson[email]
      notify(["ExponentPushToken[ZJ68NIFKa7aXibIqU3X6LE]"], name, "Created an account", "Email: " + context.params.userId, {})
    });
})

//Ensure that tokens are removed when accounts are changed
exports.tokenChanged = functions.firestore.document('userData/{userID}').onWrite((change, context) => {
  // Identify the new Tokens
  const document = change.after.exists ? change.after.data() : null;
  const oldDocument = change.before.data();
  var newTokens = []
  if (document["Tokens"]) {
    newTokens = document["Tokens"];
    if (oldDocument && oldDocument["Tokens"]) {
      newTokens = newTokens.filter(function (i) { return oldDocument["Tokens"].indexOf(i) < 0; });
    }
    //Check if token is being used by another account
    let promises = []
    for (var token of newTokens) {
      var tokenReverseIndexRef = db.collection('tokenReverseIndex').doc(token);
      //console.log("need to check:"+token)
      promises.push(tokenReverseIndexRef.get().then(doc => {
        if (doc.exists) {
          var userDataRef = db.collection('userData').doc(doc.data()["username"]);
          userDataRef.update({
            Tokens: admin.firestore.FieldValue.arrayRemove(token)
          });
        }
        //Update reverse index
        tokenReverseIndexRef.set({
          username: context.params.userID
        });
        //console.log("checked:"+token)
        return "done";
      }));
    }
    return Promise.all(promises).then(() => { return "done" })
  }
});


// exports.updateAllGradesSchedule = functions.pubsub.schedule('20 14 * * *') //functions.pubsub.schedule('*/30 6-18 * * *') //30 min intervals from 6 am to 6pm //functions.pubsub.schedule('41 15 * * *')//
//   .timeZone('America/New_York') // Users can choose timezone - default is UTC
//   .onRun((context) => {
//     db.collection('userData').get()
//       .then(snapshot => {
//         key.importKey(process.env.PRIVATE/*keysObj.private*/, 'pkcs1-private-pem');
//         snapshot.forEach(doc => {
//           if (doc.exists) {
//             if (doc.data()["password"] || doc.data()["passwordEncrypted"]) {
//               var username = doc.id;
//               var password = doc.data()["password"] ? doc.data()["password"] : key.decrypt(doc.data()["passwordEncrypted"], 'utf8');
//               const data = JSON.stringify({ username: username, password: password });
//               const dataBuffer = Buffer.from(data);

//               pubsub
//                 .topic("updateGrades")
//                 .publish(dataBuffer)
//                 .then(messageId => {
//                   //console.log(`:::::::: Message ${messageId} has now published. :::::::::::`);
//                   return true;
//                 })
//                 .catch(err => {
//                   console.error("ERROR:", err);
//                   throw err;
//                 });
//             }
//           }
//         });
//       })
//       .catch(err => {
//         console.log('Error getting documents', err);
//       });
//   });


exports.gradeChanged = functions.firestore.document('users/{userID}').onWrite((change, context) => {
  //Check if user wants notifications
  var userDataRef = db.collection('userData').doc(context.params.userID);
  return userDataRef.get().then(doc => {
    if (doc.exists) {
      if (doc.data()["Tokens"] && doc.data()["Tokens"].length > 0) {
        var targetTokens = doc.data()["Tokens"]

        //search for changes

        // Get an object with the current document value.
        // If the document does not exist, it has been deleted.
        const document = change.after.exists ? change.after.data() : null;

        // Get an object with the previous document value (for update or delete)
        const oldDocument = change.before.data();
        if (oldDocument) {
          for (classs in document) {
            for (mp in document[classs]) {
              if (document[classs][mp]) {
                if (oldDocument[classs][mp]["avg"] && document[classs][mp]["avg"]) {
                  var oldAvg = oldDocument[classs][mp]["avg"].substring(0, oldDocument[classs][mp]["avg"].length - 1);
                  var newAvg = document[classs][mp]["avg"].substring(0, document[classs][mp]["avg"].length - 1);
                  if (Number(oldAvg) && Number(newAvg)) {
                    if (Number(oldAvg) > Number(newAvg)) {
                      notify(targetTokens, classs, "Average dropped to " + document[classs][mp]["avg"], "Your average for " + classs + " went down to a " + document[classs][mp]["avg"] + " from a " + oldDocument[classs][mp]["avg"], { txt: "Your average for " + classs + " went down to a " + document[classs][mp]["avg"] + " from a " + oldDocument[classs][mp]["avg"] });
                      //console.log("Your average for "+classs+" went down to a "+document[classs][mp]["avg"]+" from a "+oldDocument[classs][mp]["avg"])
                    } else if (Number(oldAvg) < Number(newAvg)) {
                      notify(targetTokens, classs, "Average jumped to " + document[classs][mp]["avg"], "Your average for " + classs + " went up to a " + document[classs][mp]["avg"] + " from a " + oldDocument[classs][mp]["avg"], { txt: "Your average for " + classs + " went up to a " + document[classs][mp]["avg"] + " from a " + oldDocument[classs][mp]["avg"] });
                      //console.log("Your average for "+classs+" went up to a "+document[classs][mp]["avg"]+" from a "+oldDocument[classs][mp]["avg"])
                    } else {
                      //No change
                    }
                  }
                }
                if (document[classs][mp]["Assignments"] && oldDocument[classs][mp]["Assignments"]) {
                  for (var assignment of document[classs][mp]["Assignments"]) {
                    var found = false;
                    for (var indexOfAssign2 in oldDocument[classs][mp]["Assignments"]) {
                      assignment2 = oldDocument[classs][mp]["Assignments"][indexOfAssign2]
                      if (assignment["Name"] == assignment2["Name"] && assignment["Date"] == assignment2["Date"]) {
                        //Delete assignement from list of old assignments to make finding next match faster
                        oldDocument[classs][mp]["Assignments"].splice(indexOfAssign2, 1);

                        var fractionParts1 = assignment["Grade"].split("/").map(x => parseFloat(x))
                        var fractionParts2 = assignment2["Grade"].split("/").map(x => parseFloat(x))
                        if (fractionParts1[0] && fractionParts1[1]) {
                          var scoreCalc1 = fractionParts1[0] / fractionParts1[1];
                          if (fractionParts2[0] && fractionParts2[1]) {
                            var scoreCalc2 = fractionParts2[0] / fractionParts2[1];
                            if (scoreCalc1 > scoreCalc2) {
                              //up
                              notify(targetTokens, assignment["Name"], "Score increased to " + assignment["Grade"], "Your grade for " + assignment["Name"] + " in " + classs + " went up!" + "\nYour score: " + assignment["Grade"] + "\n(Used to be: " + assignment2["Grade"] + ")", { txt: "Your grade for " + assignment["Name"] + " in " + classs + " went up from " + assignment2["Grade"] + " to " + assignment["Grade"] });
                              //console.log("Your grade for "+assignment["Name"]+" in "+classs+" went up!"+"\nYour score: "+assignment["Grade"]+"\n(Used to be: "+assignment2["Grade"]+")")
                            } else if (scoreCalc1 < scoreCalc2) {
                              //down
                              notify(targetTokens, assignment["Name"], "Score decreased to " + assignment["Grade"], "Your grade for " + assignment["Name"] + " in " + classs + " went down" + "\nYour score: " + assignment["Grade"] + "\n(Used to be: " + assignment2["Grade"] + ")", { txt: "Your grade for " + assignment["Name"] + " in " + classs + " went down from " + assignment2["Grade"] + " to " + assignment["Grade"] + ")" });
                              //console.log("Your grade for "+assignment["Name"]+" in "+classs+" went down"+"\nYour score: "+assignment["Grade"]+"\n(Used to be: "+assignment2["Grade"]+")")
                            }
                          } else {
                            notify(targetTokens, assignment["Name"], assignment["Grade"], classs + " has posted the grade for " + assignment["Name"] + "\nYour score: " + assignment["Grade"], { txt: classs + " has posted the grade for " + assignment["Name"] + " and got " + assignment["Grade"] });
                            //console.log(classs+" has posted the grade for "+assignment["Name"]+"\nYour score: "+assignment["Grade"])                        
                          }
                        }

                        found = true;
                        break;
                      }
                    }
                    if (!found) {
                      if (assignment["Grade"]) {
                        notify(targetTokens, assignment["Name"], assignment["Grade"], classs + " has posted a new assignment: " + assignment["Name"] + "\nYour score: " + assignment["Grade"], { txt: classs + " has posted a new assignment called " + assignment["Name"] + " and you got " + assignment["Grade"] });
                        //console.log(classs+" has posted a new assignment: "+assignment["Name"]+"\nYour score: "+assignment["Grade"])
                      }

                    }
                  }
                }
              }
            }
          }
        }
      } else {
        //console.log("No tokens")
      }
    } else {
      //console.log("No doc")
    }
    return 0;
  }).catch(err => {
    console.log('Error getting document', err);
  });

});


function notify(tokens, title, subtitle, body, data) {
  let messages = [];
  for (let pushToken of tokens) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }
    // Construct a message (see https://docs.expo.io/versions/latest/guides/push-notifications.html)
    messages.push({
      to: pushToken,
      sound: 'default',
      title: title,
      subtitle: subtitle,
      body: body,
      data: data,
    })
  }
  let chunks = expo.chunkPushNotifications(messages);
  (async () => {
    for (let chunk of chunks) {
      try {
        let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
      } catch (error) {
        console.error(error);
      }
    }
  })();
}

