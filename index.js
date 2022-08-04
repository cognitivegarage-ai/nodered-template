var http = require('http');
var express = require("express");
var RED = require("node-red");
const Bootstrap = require('./Bootstrap/bootstrap.js');
const mongodb = require("mongodb")
const serverless = require("serverless-http");

// Fetching Nodered settings from file now
var settings = require('./settings')

// Create an Express app
var app = express();
let headless = false;
let reloadFlow = true;

const swaggerUi = require('swagger-ui-express');
const YAML = require('yamljs');
const swaggerDocument = YAML.load('./swagger.yaml');
 

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// Add a simple route for static content served from 'public'
app.use("/",express.static("public"));

app.use(express.json({limit: "20mb"}));
app.use(express.urlencoded({ extended: false }));

app.get('/hi', (req, res) => {
    
    res.send('hi');
})


// Create a server
// var server = http.createServer(app);

// Create the settings object - see default settings.js file for other options
// var settings = {
//     httpAdminRoot:"/red",
//     httpNodeRoot: "/api",
//     userDir:"./",
//     flowFile:"flows.json",
//     credentialSecret: "nskjdvfhbkjshdfvhbsdfvlauetowiryeughdf",
//     functionGlobalContext: {}    // enables global context
// };



// Initialise the runtime with a server and settings
// RED.init(server,settings);

// Serve the editor UI from /red
// app.use(settings.httpAdminRoot, RED.httpAdmin);

// // Serve the http nodes UI from /api
// app.use(settings.httpNodeRoot,RED.httpNode);

// Promise.all(Bootstrap.intializeServices()).then(() => {
//     server.listen(8000, () => {
//         console.log('Server Started Successfully');
//     });
    
// }).catch((error) => {
//     console.error(error);
// });

let init = (() => {
    if (headless) {
      RED.init(settings)
    }else{
      RED.init(server, settings)
      //app.use(settings.httpAdminRoot,RED.httpAdmin);
      app.use(settings.httpNodeRoot,RED.httpNode);
    }
    return new Promise((resolve, reject) => {
      let deployed;
      RED.events.on("runtime-event", deployed = function(data){
        if (data.id === "runtime-deploy") {
          RED.events.removeListener("runtime-event", deployed);
          // console.log('flow deployed');
          resolve();
        }
      })
      RED.start();
    });
  })()
  
  function setup(){
    return init.then(() => {
      return new Promise((resolve, reject) => {
        if (reloadFlow) {
          RED.nodes.loadFlows().then(() => { resolve() });
        }else{
          resolve();
        }
      });
    });
  }
  
  let sapp = serverless(app);
// setup();
//   exports.handler = async (event, context) => {
//     await setup().then(async ()=>{
//         return await sapp(event, context)
//     })
//   }

// Start the runtime
// RED.start();

exports.handler = sapp