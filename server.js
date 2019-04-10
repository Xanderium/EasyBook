const express = require("express");
const asynch = require("async");
const MongoClient = require("mongodb").MongoClient;
const ObjectID = require("mongodb").ObjectID;
const bcrypt = require("bcrypt");
const saltRounds = 10;
const session = require("express-session");
const bodyParser = require("body-parser");
const app = express();

var db;
MongoClient.connect("mongodb://97.90.112.19:27017", { useNewUrlParser:true }, (error, database) => {
  if(error) {
    throw error;
    return;
  }
  db = database.db("easybook");
  db.createCollection("users", (error, result) => {
    if(error) throw error;
    console.log("Collection " + result.s.name + " created...");
  });
  db.createCollection("classes", (error, result) => {
    if(error) throw error;
    console.log("Collection " + result.s.name + " created...");
  });
  db.createCollection("books", (error, result) => {
    if(error) throw error;
    console.log("Collection " + result.s.name + " created...");
  });
  console.log("Connected to database...");
});

app.use(express.static("public"));
app.use(session({ secret:"Hey. Psst. Yeah, you. You wanna know a secret? WELL, TOO BAD!" }));
app.use(bodyParser.urlencoded({ extended:true }));
app.use(bodyParser.json());
app.set("view engine", "ejs");

app.get(/\//, (req, res, next) => {
  if(req.session.user) {
    var query = { _id:ObjectID(req.session.user._id) };
    db.collection("users").findOne(query, (error, user) => {
      if(error || !user) {
        next();
        return;
      }
      req.session.user = user;
      next();
    });
  } else {
    next();
  }
});

app.get("/test", (req, res) => {
  res.render(__dirname + "/views/profile.ejs");
});

app.get("/", (req, res) => {
  if(req.session.user) {
    res.redirect("/home");
    return;
  }
  res.render(__dirname + "/views/index.ejs", { message:null });
});

app.get("/login", (req, res) => {
  if(req.session.user) {
    res.redirect("/home");
    return;
  }
  if(req.session.error) {
    var error = req.session.error;
    req.session.error = "";
    res.render(__dirname + "/views/index.ejs", { message:error });
    return;
  }
  res.render(__dirname + "/views/index.ejs", { message:null });
});

app.get("/signup", (req, res) => {
  if(req.session.user) {
    res.redirect("/home");
    return;
  }
  if(req.session.error) {
    var error = req.session.error;
    req.session.error = "";
    res.render(__dirname + "/views/signup.ejs", { message:error });
    return;
  }
  res.render(__dirname + "/views/signup.ejs", { message:null });
});

app.get("/register", (req, res) => {
  if(req.session.user) {
    res.redirect("/home");
    return;
  }
  res.render(__dirname + "/views/signup.ejs", { message:null });
});

app.get("/logout", (req, res) => {
  if(req.session.user) {
    req.session.user = "";
  }
  res.redirect("/login");
});

app.get("/home", (req, res) => {
  if(!req.session.user) {
    res.redirect("/login");
    return;
  }
  var user = req.session.user;
  var queryArray = [];
  for(var i in user.classes) {
    queryArray.push(ObjectID(user.classes[i]));
  }
  var query = { _id:{ $in:queryArray } };
  db.collection("classes").find(query).toArray((error, classes) => {
    if(error) {
      req.session.user = "";
      res.redirect("/login");
      return;
    }
    if(classes.length === 0) {
      res.render(__dirname + "/views/home.ejs", { type:user.type,classes:[] });
      return;
    }
    if(user.type === "student") {
      classes = classes.map((curClass) => {
        for(var i in curClass.students) {
          if(curClass.students[i]._id + "" === user._id + "") {
            return {
                _id:curClass._id,
                name:curClass.name,
                teacher:curClass.teacher.name,
                code:curClass.students[i].code
              };
          }
        }
      });
    } else if(user.type === "teacher") {
      classes = classes.map((curClass) => {
        return {
          _id:curClass._id,
          name:curClass.name,
          students:curClass.students.length,
        };
      });
    }
    res.render(__dirname + "/views/home.ejs", { type:user.type,classes:classes });
  });
});

app.get("/report", (req, res) => {
  if(!req.session.user) {
    res.redirect("/login");
    return;
  }
  if(req.session.user.type !== "teacher") {
    res.redirect("/home");
    return;
  }
  var query = { _id:{ $in:req.session.user.classes } };
  db.collection("classes").find(query).toArray((error, classes) => {
    if(error) {
      res.redirect("/home");
      return;
    }
    var queryArray = [];
    for(var i in classes) {
      queryArray.push(classes[i].book);
    }
    asynch.waterfall([(callback) => {
      query = { _id:{ $in:queryArray } };
      db.collection("books").find(query, { name:1 }).toArray((error, books) => {
        if(error) {
          callback(error);
          return;
        }
        var classBooks = [];
        for(var i in books) {
          for(var j in classes) {
            if(classes[j].book + "" === books[i]._id + "" && !classBooks.includes(books[j].name)) {
              classBooks[books[i]._id + ""] = books[i].name;
              break;
            }
          }
        }
        callback(null, classBooks);
      });
    }, (books, callback) => {
      var students = [];
      var counter = 0;
      asynch.whilst(() => {
        return counter < classes.length;
      }, (callback2) => {
        queryArray = [];
        for(var i in classes[counter].students) {
          queryArray.push(ObjectID(classes[counter].students[i]._id));
        }
        query = { _id:{ $in:queryArray } };
        db.collection("users").find(query).toArray((error, users) => {
          if(error) {
            callback2(error);
            return;
          }
          for(var i in users) {
            users[i] = {
              name:users[i].name,
              class:classes[counter].name,
              book:books[classes[counter].book + ""],
              code:classes[counter].students[i].code
            }
          }
          students = students.concat(users);
          counter++;
          callback2(null, counter);
        });
      }, (error, counter) => {
        if(error) {
          callback(error);
        }
        callback(null, students);
      });
      }], (error, students) => {
        if(error) {
          res.redirect("/home");
          return;
        }
        res.render(__dirname + "/views/report.ejs", { students:students });
    });
  });
});

app.get("/classes/:classID/view", (req, res) => {
  var user = req.session.user;
  if(!req.session.user) {
    res.redirect("/login");
    return;
  }
  var query = { _id:ObjectID(req.params.classID) };
  db.collection("classes").findOne(query, (error, resultClass) => {
    if(error || !resultClass) {
      res.redirect("/home");
      return;
    }
    query = { _id:ObjectID(resultClass.book) };
    db.collection("books").findOne(query, (error, book) => {
      if(error || !book) {
        res.redirect("/home");
        return;
      }
      resultClass.book = book;
      var queryArray = [];
      for(var i in resultClass.students) {
        queryArray.push(ObjectID(resultClass.students[i]._id));
      }
      query = { _id:{ $in:queryArray } };
      db.collection("users").find(query).toArray((error, users) => {
        if(error) {
          res.redirect("/home");
          return;
        }
        for(var i in resultClass.students) {
          console.log(i);
          resultClass.students[i].name = users[i].name;
        }
        // resultClass.students = users;
        if(user.type === "teacher" && resultClass.teacher._id + "" === user._id + "") {
          res.render(__dirname + "/views/class.ejs", { type:user.type,viewClass:resultClass,code:null });
          return;
        }
        if(user.type === "student") {
          for(var i in resultClass.students) {
            if(resultClass.students[i]._id + "" === req.session.user._id + "") {
              res.render(__dirname + "/views/class.ejs", { type:user.type,viewClass:resultClass,code:resultClass.students[i].code });
              return;
            }
          }
        }
        res.redirect("/home");
        return;
      });
    });
  });
});

app.get("/books/:book/search", (req, res) => {
  var regex = new RegExp(req.params.book, "i");
  var query = { $or: [ { name: { $regex:regex } }, { author: { $regex:regex } } ] };
  var cursor = db.collection("books").find(query);
  cursor.toArray((error, books) => {
    if(error) {
      res.status(500).send(null);
      return;
    }
    if(books.length === 0) {
      res.send(null);
      return;
    }
    for(var i in books) {
      books[i]._id = books[i]._id + "";
    }
    console.log(books);
    res.send(JSON.stringify(books));
  });
});

app.get("/codes/:code/search", (req, res) => {
  var query = { codes:req.params.code,$or:[ { students:{ $ne:{ _id:ObjectID(req.session.user._id),code:{ $exists:true } } } },{ students:[] } ] };
  console.log(JSON.stringify(query));
  db.collection("classes").findOne(query, (error, codeClass) => {
    if(error) {
      res.status(500).send(JSON.stringify(error));
      return;
    }
    if(codeClass) {
      query = { _id:ObjectID(codeClass.teacher._id) };
      db.collection("users").findOne(query, (error, teacher) => {
        if(error) {
          res.status(500).send(JSON.stringify(error));
          return;
        }
        if(!teacher) {
          res.send(null);
          return;
        }
        codeClass = {
          _id:codeClass._id + "",
          name:codeClass.name,
          teacher:teacher.name
        };
        res.send(codeClass);
      });
      return;
    }
    query = { students:{ code:req.body.code } };
    db.collection("classes").findOne(query, (error, codeClass) => {
      if(error) {
        res.status(500).send(JSON.stringify(error));
        return;
      }
      if(!codeClass) {
        res.send(null);
        return;
      }
      codeClass = {
        _id:codeClass._id,
        name:codeClass.name,
        teacher:codeClass.teacher
      };
      res.send(codeClass);
    });
  });
});

app.get("/profile", (req, res) => {
  if(!req.session.user) {
    res.redirect("/login");
    return;
  }
  var user = req.session.user;
  user.firstName = user.name.split(" ")[0];
  user.lastName = user.name.split(" ")[1];
  if(req.session.updateInfoMsg) {
    var error = req.session.updateInfoMsg;
    req.session.updateInfoMsg = "";
    res.render(__dirname + "/views/profile.ejs", { user:req.session.user,information:message,password:null });
    return;
  }
  if(req.session.updatePassMsg) {
    var message = req.session.updatePassMsg;
    req.session.updatePassMsg = "";
    res.render(__dirname + "/views/profile.ejs", { user:req.session.user,information:null,password:message });
    return;
  }
  res.render(__dirname + "/views/profile.ejs", { user:req.session.user,information:null,password:null });
});

app.post("/login", (req, res, next) => {
  var query = { email:req.body.email };
  db.collection("users").findOne(query, (error, user) => {
    if(error) {
      req.session.error = "Could not log you in. Please try again later.";
      res.redirect("/login");
      return;
    }
    if(!user) {
      req.session.error = "Invalid credentials";
      res.redirect("/login");
      return;
    }
    bcrypt.compare(req.body.password, user.password, (error, match) => {
      if(error) {
        req.session.error = "Could not log you in. Please try again later.";
        res.redirect("/login");
        return;
      }
      if(!match) {
        req.session.error = "Invalid credentials";
        res.redirect("/login");
        return;
      }
      req.session.user = user;
      res.redirect("/home");
    });
  });
});

app.post("/register", (req, res) => {
  var query = { email:req.body.email };
  db.collection("users").findOne(query, (error, user) => {
    if(error) {
      req.session.error = "Could not register new account. Please try again later.";
      res.redirect("/signup");
      return;
    }
    if(user) {
      req.session.error = "Account with that email address already exists";
      res.redirect("/signup");
      return;
    }
    bcrypt.genSalt(saltRounds, (error, salt) => {
      if(error) {
        req.session.error = "Could not register new account. Please try again later.";
        res.redirect("/signup");
        return;
      }
      bcrypt.hash(req.body.password, salt, (error, hash) => {
        if(error) {
          req.session.error = "Could not register new account. Please try again later.";
          res.redirect("/signup");
          return;
        }
        var newUser = {
          email:req.body.email,
          name:req.body.firstName + " " + req.body.lastName,
          password:hash,
          grade:req.body.grade,
          type:req.body.type,
          classes:[]
        }
        db.collection("users").insertOne(newUser, (error, result) => {
          if(error) {
            req.session.error = "Could not register new account. Please try again later.";
            res.redirect("/signup");
            return;
          }
          req.session.user = newUser;
          res.redirect("/home");
        });
      });
    });
  });
});

app.post("/create-class", (req, res) => {
  var query = { _id:ObjectID(req.body.bookID) };
  db.collection("books").findOne(query, (error, book) => {
    if(error) {
      res.status(500).send(JSON.stringify(error));
      return;
    }
    if(!book) {
      res.send(null);
      return;
    }
    var codes = generateCodes(req.body.codes);
    console.log(codes);
    var newClass = {
      name:req.body.className,
      book:ObjectID(req.body.bookID),
      teacher:{
        _id:req.session.user._id,
        name:req.session.user.name
      },
      students:[],
      codes:codes
    };
    console.log(newClass);
    db.collection("classes").insertOne(newClass, (error, result) => {
      if(error) {
        res.status(500).send(JSON.stringify(error));
        return;
      }
      db.collection("classes").findOne(newClass, (error, foundClass) => {
        if(error) {
          res.status(500).send(JSON.stringify(error));
          return;
        }
        if(!foundClass) {
          res.send(null);
          return;
        }
        var query = { $push:{ classes:ObjectID(foundClass._id) } };
        db.collection("users").updateOne({ _id:ObjectID(req.session.user._id) }, query, (error, result3) => {
          if(error) {
            res.status(500).send(JSON.stringify(error));
            return;
          }
          res.send(JSON.stringify(foundClass));
        });
      });
    });
  });
});

app.post("/redeem-code", (req, res) => {
  var query = { _id:ObjectID(req.body.classID) };
  db.collection("classes").findOne(query, (error, codeClass) => {
    if(error) {
      res.status(500).send(JSON.stringify(error));
      return;
    }
    if(!codeClass) {
      res.send(null);
      return;
    }
    query = { $push:{ classes:ObjectID(codeClass._id) } };
    db.collection("users").updateOne({ _id:ObjectID(req.session.user._id) }, query, (error, result) => {
      if(error) {
        res.status(500).send(JSON.stringify(error));
        return;
      }
      query = { $push:{ students:{ _id:ObjectID(req.session.user._id),code:req.body.code } },$pull:{ codes:req.body.code } };
      db.collection("classes").updateOne({ _id:ObjectID(req.body.classID) }, query, (error, result2) => {
        if(error) {
          res.status(500).send(JSON.stringify(error));
          return;
        }
        res.send(codeClass);
      });
    });
  });
});

app.post("/delete-student", (req, res) => {
  var query = {};
  db.collection("classes").find(query).toArray((error, classes) => {
    if(error || !classes.length === 0) {
      res.status(500).send(JSON.stringify(error));
      return;
    }
    var resultClass;
    for(var i in classes) {
      for(var j in classes[i].students) {
        if(classes[i].students[j].code === req.body.studentCode) {
          resultClass = classes[i];
        }
      }
    }
    console.log(resultClass);
    for(var i in resultClass.students) {
      if(resultClass.students[i].code === req.body.studentCode) {
        query = { $pull:{ classes:ObjectID(req.body.classID) } };
        db.collection("users").updateOne({ _id:resultClass.students[i]._id }, query, (error, result) => {
          if(error || !result) {
            res.status(500).send(JSON.stringify(error));
            return;
          }
          var query = { $pull:{ students:{ code:req.body.studentCode } } };
          db.collection("classes").updateOne({ _id:ObjectID(req.body.classID) }, query, (error, result) => {
            if(error || !result) {
              res.status(500).send(JSON.stringify(error));
              return;
            }
            res.send(200);
          });
        });
      }
    }
  });
});

app.post("/delete-code", (req, res) => {
  var query = { $pull:{ codes:req.body.code } };
  db.collection("classes").updateOne({ _id:ObjectID(req.body.classID) }, query, (error, result) => {
    if(error || !result) {
      res.status(500).send(JSON.stringify(error));
      return;
    }
    res.send(200);
  });
});

app.post("/update-info", (req, res) => {
  var query = { $set:{} };
  if(req.body.firstName && req.body.lastName) {
    query.$set.name = req.body.firstName + " " + req.body.lastName;
  }
  if(req.body.email) {
    query.$set.email = req.body.email;
  }
  if(req.body.grade) {
    query.$set.grade = req.body.grade;
  }
  db.collection("users").updateOne({ _id:ObjectID(req.session.user._id) }, query, (error, result) => {
    if(error) {
      req.session.updateInfoMsg = "An error occurred while updating your information";
      res.redirect("/profile");
      return;
    }
    if(!(req.session.user.type === "teacher" && req.body.firstName && req.body.lastName)) {
      req.session.updateInfoMsg = "Successfully updated!";
      res.redirect("/profile");
      return;
    }
    var queryArray = [];
    for(var i in req.session.user.classes) {
      queryArray.push(ObjectID(req.session.user.classes[i]));
    }
    var query = { $set:{ teacher:{ _id:req.session.user._id,name:req.body.firstName + " " + req.body.lastName } } };
    db.collection("classes").updateMany({ _id:{ $in:queryArray } }, query, (error, result) => {
      if(error) {
        req.session.updateInfoMsg = "An error occured while updating your information;";
        res.redirect("/profile");
        return;
      }
      req.session.updateInfoMsg = "Successfully updated!";
      res.redirect("/profile");
    });
  });
});

app.post("/update-password", (req, res) => {
  bcrypt.genSalt(saltRounds, (error, salt) => {
    if(error) {
      req.session.updatePassMsg = "An error occured while updating your password.";
      res.redirect("/profile");
      return;
    }
    bcrypt.hash(req.body.password, salt, (error, hash) => {
      if(error) {
        req.session.updatePassMsg = "An error occured while updating your password.";
        res.redirect("/profile");
        return;
      }
      var query = { $set:{ password:hash } };
      db.collection("users").updateOne({ _id:ObjectID(req.session.user._id) }, query, (error, result) => {
        if(error) {
          req.session.updatePassMsg = "An error occured while updating your password.";
          res.redirect("/profile");
          return;
        }
        req.session.updatePassMsg = "Successfully updated!";
        res.redirect("/profile");
      });
    });
  });
});

const listener = app.listen(process.env.PORT, () => {
  console.log("Listening on port " + listener.address().port + "...");
});

function generateCodes(amount) {
  amount = parseInt(amount);
  console.log(amount);
  var codes = [];
  var characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ123456789";
  for(var i = 0; i < amount; i++) {
    var code = "";
    for(var j = 0; j < 32; j++) {
      code += characters[Math.floor(Math.random() * (characters.length))];
    }
    codes.push(code);
  }
  return codes;
}