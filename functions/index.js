const admin = require('firebase-admin');
const functions = require('firebase-functions');
const {PubSub} = require('@google-cloud/pubsub');
const { Expo } = require('expo-server-sdk')

admin.initializeApp(functions.config().firebase);

var db = admin.firestore();

const express = require("express");

const puppeteer = require('puppeteer');
const $ = require('cheerio');
const bodyParser = require('body-parser');

let expo = new Expo();

//console.log(getData('10012734@sbstudents.org','Sled%2#9'));

const pubsub = new PubSub({
  projectId: 'gradeviewapp',
});

/*pubsub
  .createTopic("updateGrades")
  .then(results => {
    const topic = results[0];
    console.log(`Topic ${topic.name} created.`);
  })
  .catch(err => {
    console.error('ERROR:', err);
  });*/

const app = express()
const port = process.env.PORT || 3000
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

var currentUsers=[];
 
app.get('/test', async (req, res) => {
  notify(["ExponentPushToken[0xjpWiMqJBvOJUTi1iTSsw]"],"Hi","This is a message from","Karthik!",{ withSome: 'data' })
  res.send('Done!');
});

app.get('/', async (req, res) => {
	//res.json({get:"gotten"})
  const username = req.query.username;//'10012734'
  const password = req.query.password; //'Sled%2#9'
  console.log("username: "+username+"; password: "+password);

  var userRef = db.collection('users').doc(username);



  const data = JSON.stringify({username:username,password:password});
  const dataBuffer = Buffer.from(data);

  pubsub
  .topic("updateGrades")
  .publish(dataBuffer)
  .then(messageId => {
      console.log(`:::::::: Message ${messageId} has now published. :::::::::::`);
      return true;
  })
  .catch(err => {
      console.error("ERROR:", err);
      throw err;
  });

  userRef.get()
  .then(doc => {
      if (!doc.exists) {
        console.log('No such document!');

        console.log("cached object not found")
        res.json({"Status":"loading..."})

      } else {
        console.log('Document data:', doc.data());

        console.log("returning cached object")
        res.json(doc.data())
      }

    })
    .catch(err => {
      console.log('Error getting document', err);
    });

    return updateGrades(username,password).then(() => {
        //res.end();
    }).catch(err => {
      console.log('Error updating grades', err);
    })

	})


	app.post('/', async (req, res) => {

		const username = req.body.username;//'10012734'
		const password = req.body.password; //'Sled%2#9'
		console.log(req.body);
		var obj //= await storage.getItem(username);
		if(obj!=null){
			console.log("returning cached object")
			res.json(obj)
      res.end();
		}else{
      console.log("cached object not found")
      res.json({"Status":"loading..."})
		}
    if(!currentUsers.includes(username)){
      currentUsers.push(username)
      console.log("Updating cache for future requests")
      res.json(getData(username,password))
      var dataObj //= await getData(username,password)
      if(dataObj["Status"] == "Completed"){
        console.log(dataObj["Status"])
        storage.setItem(username,dataObj)
      }else{
        console.log("Not cached due to bad request")
      }

      var index = currentUsers.indexOf(username);
      if (index !== -1) currentUsers.splice(index, 1);
    }
    res.end();
  })
  
  app.post('/check', async (req, res) => {

		const username = req.body.username;//'10012734'
		const password = req.body.password; //'Sled%2#9'
    console.log(req.body);
    var signedIn = await checkUser(username,password)
    console.log({valid: signedIn})
			res.json({valid: signedIn})
		  res.end();
    
      if(!currentUsers.includes(username)){
        currentUsers.push(username)
        console.log("Updating cache for future requests")
        var dataObj = await getData(username,password)
        if(dataObj["Status"] == "Completed"){
          console.log(dataObj["Status"])
          storage.setItem(username,dataObj)
        }else{
          console.log("Not cached due to bad request")
        }
  
        var index = currentUsers.indexOf(username);
        if (index !== -1) currentUsers.splice(index, 1);
      }

  })

  

  module.exports.updateGradesPubSub = functions.pubsub.topic('updateGrades').onPublish(async (message) => {
    console.log("SUB PUB CALLED");
    try {
      var username = message.json.username;
      var password = message.json.password;

      
      var userRef = db.collection('users').doc(username);

      var dataObj = await getData(username,password)
      console.log("Updating cache for future requests")
      if(dataObj["Status"] == "Completed"){
        console.log(dataObj["Status"])
        userRef.set(dataObj);
      }else{
        console.log("Not cached due to bad request")
      }

    } catch (e) {
      console.error('PubSub message was not JSON', e);
    }
    return 0;
  });

async function updateGrades(username,password){
    //if(!currentUsers.includes(username)){
      //currentUsers.push(username)
      console.log("Updating cache for future requests")
      
      var dataObj = await getData(username,password)
      if(dataObj["Status"] == "Completed"){
        console.log(dataObj["Status"])
        userRef.set(dataObj);
      }else{
        console.log("Not cached due to bad request")
      }
  
      //var index = currentUsers.indexOf(username);
      //if (index !== -1) currentUsers.splice(index, 1);
    //}
    return "done";  
  }


//app.listen(port, () => console.log(`Example app listening on port ${port}!`))

const url = 'https://students.sbschools.org/genesis/parents?gohome=true';

//var id = '10012734'





function func(){
    eval("header_goToTab('studentdata&tab2=gradebook','studentid="+id+"');");
}

async function checkUser(email,pass) {
    var email = encodeURIComponent(email);
    pass = encodeURIComponent(pass);
    var url2 = 'https://students.sbschools.org/genesis/j_security_check?j_username='+email+'&j_password='+pass;


      const browser = await puppeteer.launch({
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
        /*
          headless: false, // launch headful mode
          slowMo: 250, // slow down puppeteer script so that it's easier to follow visually
        */
        });
      const page = await browser.newPage();
  
      /*await page.setViewport({
        width: 1920,
        height: 1080
    })*/
  
      await page.setRequestInterception(true);
  
      page.on('request', (req) => {
          if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() === 'image' || req.resourceType() === 'media'){
              req.abort();
          }
          else {
              req.continue();
          }
    });
  
      await page.goto(url, {waitUntil: 'networkidle2'});
      await page.goto(url2, {waitUntil: 'networkidle2'});

      var signedIn = false;
      if(await $('.sectionTitle', await page.content()).text().trim() != "Invalid user name or password.  Please try again.")
        signedIn = true;
      await browser.close();

      return signedIn;

      
}

async function getData(email, pass) {
	var email = encodeURIComponent(email);
	pass = encodeURIComponent(pass);
var url2 = 'https://students.sbschools.org/genesis/j_security_check?j_username='+email+'&j_password='+pass;

    const browser = await puppeteer.launch({
      args: ['--no-sandbox', '--disable-setuid-sandbox'],
      /*
        headless: false, // launch headful mode
        slowMo: 250, // slow down puppeteer script so that it's easier to follow visually
      */
      });
    const page = await browser.newPage();

    /*await page.setViewport({
	    width: 1920,
	    height: 1080
	})*/

    await page.setRequestInterception(true);

    page.on('request', (req) => {
        if(req.resourceType() == 'stylesheet' || req.resourceType() == 'font' || req.resourceType() === 'image' || req.resourceType() === 'media'){
            req.abort();
        }
        else {
            req.continue();
        }
	});

    await page.goto(url, {waitUntil: 'networkidle2'});
    await page.goto(url2, {waitUntil: 'networkidle2'});

    var signedIn = false;
    if(await $('.sectionTitle', await page.content()).text().trim() != "Invalid user name or password.  Please try again.")
      signedIn = true;
    if(!signedIn){
      await browser.close();
      console.log("BAD user||pass")
      return {Status:"Invalid"};
    }

	console.log(signedIn);

    await page.evaluate(text => [...document.querySelectorAll('*')].find(e => e.textContent.trim() === text).click(), "Gradebook");
	await page.waitForNavigation({ waitUntil: 'networkidle2' })

    const markingPeriods = await page.evaluate( () => (Array.from( (document.querySelectorAll( '[name="fldMarkingPeriod"]')[0]).childNodes, element => element.value ) ));

    console.log( "marking period:" + markingPeriods );
    //var htmlOld = await page.content();
    var grades = {}
    var isCurrentMarking = false;
    for(var period of markingPeriods){
      if(period!=null){
        console.log("period: " + period);
        navresponse = page.waitForNavigation(['networkidle0', 'load', 'domcontentloaded']);
        await page.evaluate(text => [...document.querySelectorAll('*')].find(e => e.textContent.trim() === text).click(), "Gradebook");
        await navresponse
        var htmlOld = await page.content();
        //htmlTemp = await page.content()
        console.log("navigated to gradebook")

        navresponse = page.waitForNavigation(['networkidle0', 'load', 'domcontentloaded']);
        const currentMarking = await page.evaluate( () => ((document.querySelectorAll( '[name="fldMarkingPeriod"]')[0]).value));
		var htmlTemp;
        if(currentMarking!=period){
			console.log("switchSTART")
          await page.evaluate((markingPeriod) => switchMarkingPeriod(markingPeriod),period);
          console.log("switch")
          await navresponse
          	var htmlTemp = await page.content();
        	console.log("HTML1");
          isCurrentMarking = false;
        }else{
			htmlTemp = htmlOld;
      console.log("tempDone");
      isCurrentMarking = true;
		}

    const html = htmlTemp;
		//console.log(html);

        //await page.screenshot({path: period+'examples.png'});
        var title
        await $('.list', html).find("tbody").find(".categorytab").each(function() {
          const className = $(this).text().trim();
            console.log("ClassName: "+className);
            if(!grades[className])
              grades[className] = {}
            var teacherName = $(this).parent().parent().find(".cellLeft").eq(1).text().trim();
            teacherName=teacherName.substring(0,teacherName.indexOf("\n"));
            console.log("Teacher Name: "+teacherName);
            if(!grades[className]["teacher"])
              grades[className]["teacher"]=teacherName;


              //var avg = $(this).parent().parent().find($("td[title='View Course Summary']")).textContent;
              var avg = $(this).parent().parent().find(".cellRight").eq(0).text().trim();
              avg=avg.substring(0,avg.indexOf("\n"));
              console.log("Average"+avg);
            if(!grades[className][period])
              grades[className][period]={}
            grades[className][period]["avg"]=avg;
            grades[className]["title"]= $(this).prop('title');


        });
        console.log("done");
        if(!isCurrentMarking)
          var html2 = await page.content();
        for(var classs in grades){
          console.log("Getting grades for: "+grades[classs]["title"]);

          navresponse = page.waitForNavigation(['networkidle0', 'load', 'domcontentloaded']);

          try{
              await page.evaluate((text) => document.querySelector("span[title='"+text+"']").click(),grades[classs]["title"]);
                    //var res = page.click("span[title='"+grades[classs]["title"]+"']");
          }catch(e){
            console.log("Err: "+e)
          }

          console.log("res")
          //await res;
          await navresponse;
          console.log("response")

          var list = await page.evaluate(() => {
            var assignments = [];
            for(var node of document.getElementsByClassName("list")[0].childNodes[1].childNodes){

              if(node.classList && !node.classList.contains("listheading")&&node.childNodes.length>=11){
                var assignData={};

                //console.log(node.childNodes);
                //console.log(node.childNodes[3].innerText);
                  assignData["Date"] = node.childNodes[3].innerText;
                //console.log(node.childNodes[7].innerText);
                assignData["Category"] = node.childNodes[7].innerText
                //console.log(node.childNodes[9].innerText);
                assignData["Name"] = node.childNodes[9].innerText;
                //console.log(node.childNodes[11].childNodes[0].textContent.replace(/\s/g,''));
                assignData["Grade"] = node.childNodes[11].childNodes[0].textContent.replace(/\s/g,'')
                assignments.push(assignData);
                }
            }
            return assignments;
          });
          grades[classs][period]["Assignments"] = list;
          //console.log(grades[classs][period]["Assignments"]);


          //await page.screenshot({path: classs+'examples.png'});
          console.log("Going to grade book");
          navresponse = page.waitForNavigation(['networkidle0', 'load', 'domcontentloaded']);
          await page.evaluate(text => [...document.querySelectorAll('*')].find(e => e.textContent.trim() === text).click(), "Gradebook");
          await navresponse;
          //await page.waitForNavigation(['networkidle0', 'load', 'domcontentloaded']);//page.waitForNavigation({ waitUntil: 'networkidle2' })
          if(!isCurrentMarking){
            console.log("Slecting marking");

            navresponse = page.waitForNavigation(['networkidle0', 'load', 'domcontentloaded']);

            await page.evaluate((markingPeriod) => switchMarkingPeriod(markingPeriod),period);
            //await page.waitForNavigation({ waitUntil: 'networkidle2' })
            await navresponse;
            //console.log(navresponse)
            //await page.screenshot({path: 'examples.png'});
          }

        }
        htmlOld = html2;

      }
    }

    grades["Status"] = "Completed";
	console.log("Function done")
    //console.log(grades);



    await browser.close();

    return grades;

  }


/*puppeteer
  .launch()
  .then(function(browser){
    return browser.newPage();
  })
  .then(function(page) {
    return page.goto().then(function() {
        return page.goto(url2).then(function() {
            //page.find(".headerCategoryTabSelected").click();
            page.evaluate(text => [...document.querySelectorAll('*')].find(e => e.textContent.trim() === text).click(), "Gradebook")
            //console.log(page.content())
            page.waitForNavigation({ waitUntil: 'networkidle0' })

            return page.content();
        });
    });
  })
  .then(function(html) {
    //console.log(html);
    page.screenshot({path: 'examples.png'});

  })
  .catch(function(err) {
    //handle error
  });*/


const api1 = functions.https.onRequest(app);


module.exports.api1 = api1;

exports.tokenChanged = functions.firestore
    .document('userData/{userID}')
    .onWrite((change, context) => {
      // Identify the new Tokens
      const document = change.after.exists ? change.after.data() : null;
      const oldDocument = change.before.data();
      var newTokens = []
      if(document["Tokens"]){
        newTokens=document["Tokens"];
        if(oldDocument && oldDocument["Tokens"]){
          newTokens = newTokens.filter(function(i) {return oldDocument["Tokens"].indexOf(i) < 0;});
        }
        //Check if token is being used by another account
        for(var token of newTokens){
          var tokenReverseIndexRef = db.collection('tokenReverseIndex').doc(token);
          tokenReverseIndexRef.get().then(doc => {
            if (doc.exists) {
              var userDataRef = db.collection('userData').doc(doc.data()["username"]);
              userDataRef.update({
                regions: admin.firestore.FieldValue.arrayRemove('east_coast')
              });
            }
            //Update reverse index
            tokenReverseIndexRef.set({
              username: context.params.userID
            });
          });
        }
      }
    });

    
    exports.updateAllGradesSchedule = functions.pubsub.schedule('*/30 6-18 * * *') //30 min intervals from 6 am to 6pm //functions.pubsub.schedule('41 15 * * *')//functions.pubsub.schedule('20 7,14 * * *') //
    .timeZone('America/New_York') // Users can choose timezone - default is UTC
    .onRun((context) => {
    //console.log(‘This will be run every day at 11:05 AM Eastern!’);
    db.collection('userData').get()
    .then(snapshot => {
      snapshot.forEach(doc => {
        if (doc.exists) {
          if(doc.data()["password"]){
            console.log(doc.id);
            var username = doc.id;
            var password = doc.data()["password"];
            const data = JSON.stringify({username:username,password:password});
            const dataBuffer = Buffer.from(data);
          
            pubsub
            .topic("updateGrades")
            .publish(dataBuffer)
            .then(messageId => {
                console.log(`:::::::: Message ${messageId} has now published. :::::::::::`);
                return true;
            })
            .catch(err => {
                console.error("ERROR:", err);
                throw err;
            });
          }
        }
      });
    })
    .catch(err => {
      console.log('Error getting documents', err);
    });

  });


exports.gradeChanged = functions.firestore
    .document('users/{userID}')
    .onWrite((change, context) => {
      //Check if user wants notifications
      var userDataRef = db.collection('userData').doc(context.params.userID);
      userDataRef.get().then(doc => {
        if (doc.exists) {
          if(doc.data()["Tokens"]&&doc.data()["Tokens"].length>0){
            var targetTokens = doc.data()["Tokens"]

            //search for changes

            // Get an object with the current document value.
            // If the document does not exist, it has been deleted.
            const document = change.after.exists ? change.after.data() : null;

            // Get an object with the previous document value (for update or delete)
            const oldDocument = change.before.data();
            if(oldDocument){
              for(classs in document){
                for(mp in document[classs]){
                  if(document[classs][mp]){
                    if(oldDocument[classs][mp]["avg"]&&document[classs][mp]["avg"]){
                      var oldAvg = oldDocument[classs][mp]["avg"].substring(0,oldDocument[classs][mp]["avg"].length-1);
                      var newAvg = document[classs][mp]["avg"].substring(0,document[classs][mp]["avg"].length-1);
                      if(Number(oldAvg)&&Number(newAvg)){
                        if(Number(oldAvg) > Number(newAvg)){
                          notify(targetTokens,classs,"Average dropped to "+document[classs][mp]["avg"],"Your average for "+classs+" when down to a "+document[classs][mp]["avg"]+" from a "+oldDocument[classs][mp]["avg"],{});
                          console.log("Your average for "+classs+" when down to a "+document[classs][mp]["avg"]+" from a "+oldDocument[classs][mp]["avg"])
                        }else if(Number(oldAvg) < Number(newAvg)){
                          notify(targetTokens,classs,"Average jumped to "+document[classs][mp]["avg"],"Your average for "+classs+" when up to a "+document[classs][mp]["avg"]+" from a "+oldDocument[classs][mp]["avg"],{});
                          console.log("Your average for "+classs+" when up to a "+document[classs][mp]["avg"]+" from a "+oldDocument[classs][mp]["avg"])
                        }else{
                          //No change
                        }
                      }
                    }
                    if(document[classs][mp]["Assignments"]&&oldDocument[classs][mp]["Assignments"]){
                      for(var assignment of document[classs][mp]["Assignments"]){
                        var found = false;
                        for(var indexOfAssign2 in oldDocument[classs][mp]["Assignments"]){
                          assignment2 = oldDocument[classs][mp]["Assignments"][indexOfAssign2]
                          if(assignment["Name"]==assignment2["Name"]&&assignment["Date"]==assignment2["Date"]){
                            //Delete assignement from list of old assignments to make finding next match faster
                            oldDocument[classs][mp]["Assignments"].splice(indexOfAssign2, 1);

                            var fractionParts1 = assignment["Grade"].split("/").map(x => parseFloat(x))
                            var fractionParts2 = assignment2["Grade"].split("/").map(x => parseFloat(x))
                            if(fractionParts1[0]&&fractionParts1[1]){
                              var scoreCalc1 = fractionParts1[0]/fractionParts1[1];
                              if(fractionParts2[0]&&fractionParts2[1]){
                                var scoreCalc2 = fractionParts2[0]/fractionParts2[1];
                                if(scoreCalc1>scoreCalc2){
                                  //up
                                  notify(targetTokens,assignment["Name"],"Score increased to "+assignment["Grade"],"Your grade for "+assignment["Name"]+" in "+classs+" went up!"+"\nYour score: "+assignment["Grade"]+"\n(Used to be: "+assignment2["Grade"]+")",{});
                                  console.log("Your grade for "+assignment["Name"]+" in "+classs+" went up!"+"\nYour score: "+assignment["Grade"]+"\n(Used to be: "+assignment2["Grade"]+")")
                                }else if(scoreCalc1<scoreCalc2){
                                  //down
                                  notify(targetTokens,assignment["Name"],"Score decreased to "+assignment["Grade"],"Your grade for "+assignment["Name"]+" in "+classs+" went down"+"\nYour score: "+assignment["Grade"]+"\n(Used to be: "+assignment2["Grade"]+")",{});
                                  console.log("Your grade for "+assignment["Name"]+" in "+classs+" went down"+"\nYour score: "+assignment["Grade"]+"\n(Used to be: "+assignment2["Grade"]+")")
                                }   
                              }else{
                                notify(targetTokens,assignment["Name"],assignment["Grade"],classs+" has posted the grade for"+assignment["Name"]+"\nYour score: "+assignment["Grade"],{});
                                console.log(classs+" has posted the grade for"+assignment["Name"]+"\nYour score: "+assignment["Grade"])                        
                              }
                            }
                            
                            found = true;
                            break;
                          }
                        }
                        if(!found){
                          if(assignment["Grade"]){
                            notify(targetTokens,assignment["Name"],assignment["Grade"],classs+" has posted a new assignment: "+assignment["Name"]+"\nYour score: "+assignment["Grade"],{});
                            console.log(classs+" has posted a new assignment: "+assignment["Name"]+"\nYour score: "+assignment["Grade"])
                          }
                            
                        }
                      }
                    }
                  }
                }
              }
            }
          }else{
            console.log("No tokens")
          }
        }else{
          console.log("No doc")
        }
        return 0;
      })
      .catch(err => {
        console.log('Error getting document', err);
      });

    });


  function notify(tokens, title, subtitle, body, data){
    let messages = [];
    for (let pushToken of tokens) {
      // Each push token looks like ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]
  
      // Check that all your push tokens appear to be valid Expo push tokens
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
  
    // The Expo push notification service accepts batches of notifications so
    // that you don't need to send 1000 requests to send 1000 notifications. We
    // recommend you batch your notifications to reduce the number of requests
    // and to compress them (notifications with similar content will get
    // compressed).
    let chunks = expo.chunkPushNotifications(messages);
    (async () => {
      // Send the chunks to the Expo push notification service. There are
      // different strategies you could use. A simple one is to send one chunk at a
      // time, which nicely spreads the load out over time:
      for (let chunk of chunks) {
        try {
          let ticketChunk = await expo.sendPushNotificationsAsync(chunk);
          console.log(ticketChunk);
          // NOTE: If a ticket contains an error code in ticket.details.error, you
          // must handle it appropriately. The error codes are listed in the Expo
          // documentation:
          // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
        } catch (error) {
          console.error(error);
        }
      }
    })();
  }

