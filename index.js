const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
let mongoose = require("mongoose");
const bodyParser = require("body-parser");
 var isodate = require('isodate');

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

try {
  mongoose.connect(process.env.MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
  }, () =>
      console.log("DB connected"));
} catch (error) {
  console.log("could not connect to DB");
}

try {
  let usernameSchema = new mongoose.Schema({
    username: String
  })
  Username = mongoose.model("Username", usernameSchema);
  console.log('Username', Username);
} catch (error) {
  console.log("could not create person");
}

try {
  let exercisesSchema = new mongoose.Schema({
    userid: String,
    username: String,
    description: String,
    duration: Number,
    date: Date})
  Exercises = mongoose.model("Exercises", exercisesSchema);
  console.log('Exercises', Exercises);
} catch (error) {
  console.log("could not create Exercises");
}


const corsOption = {
    credentials: true,
    origin: "*",
    methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
    preflightContinue: false,
    optionsSuccessStatus: 204

}

app.use(cors(corsOption));

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({ extended: "false" }));
app.use(bodyParser.json());



app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


app.get('/api/users', (req, res) => {
  console.log('get /api/users');

  Username.find({}, function(err, result) {
    if (err) {
      console.log(err);
    } else {
      res.json(result);
    }
  });
});
// logs?[from][&to][&limit]
async function TransformData(params) {
  let result = [];
      let array = [];
      params.forEach(element => {
        result.push({
          description: element.description,
          duration: element.duration,
          date: element.date.toDateString(),
        })
      });
  return result
}

async function createOption(par) {
  let options =  {userid: par.params._id};
  console.log('par.query.from', par.query.from);
  if(par.query.from){
    console.log('if >>>>>', par.query.from);
      options['date'] ={$gte:new Date(par.query.from),$lte:new Date(par.query.to)};
    console.log('optionso',options);
    return options
  }else{
    return options
  }
  
}

async function transformResult(user, logs, req) {
  let result = {
    username: user.username,
    count: logs.length,
    _id: req.params._id,
    log: logs 
  }
  if(req.query.from){
    console.log('if >>>>>', req.query.from);
      result['from'] = new Date(req.query.from).toDateString();
      result['to'] = new Date(req.query.to).toDateString();
    
    console.log('result',result);
    return result
  }else{
    return result
  }
   
}

app.get('/api/users/:_id/logs', async (req, res) => {
  console.log('get /api/users/:_id/logs', req.params, req.query);
  let options = await createOption(req);
  console.log('options[0]', options);
  
  const user = await Username.findById(req.params._id);
  
  const exercises = await Exercises.find(
    options
  ).limit(req.query.limit || 0);
  // console.log('exercises', exercises);
  let logs = await TransformData(exercises);
  console.log('logs', logs)

  if(user && logs && req){
  let result = await transformResult(user, logs, req)
  res.json(result)
    
  }
  
  
});


app.post('/api/users/:_id/exercises', (req, res) => {
  console.log('/api/users/:_id/exercises', req.body);

   Username.findById(req.params._id,function(err, user) {
    if (err) return console.error(err);
     if(user){
      let username = new Exercises({
      description: req.body.description, 
      duration: req.body.duration, 
      date: req.body.date || new Date(),
      userid: req.params._id,
      username: user.username
      })
     username.save(function(err, data) {
          if (err) return console.error(err);
          let returnData = {
            description: data.description, 
            duration: data.duration, 
            date: data.date.toDateString(),
            _id: data.userid,
            username: data.username
          };
          res.json(returnData);
        });
     }
  })
  
  
});


app.post('/api/users', (req, res) => {
  console.log('/api/users', req.body.username);
  let username = new Username({username: req.body.username})
  username.save(function(err, data) {
    if (err) return console.error(err);
    let returnData = {username: data.username, _id: data._id};
    res.json(returnData);
  });
  
});





const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
