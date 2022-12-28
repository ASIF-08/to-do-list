const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://localhost:27017/todolistDB");

const itemsSchema = new mongoose.Schema({
  name: String
});

const customListSchema = {
  name: String,
  items: [itemsSchema]
};

const Item = mongoose.model("Item", itemsSchema);
const List = mongoose.model("List", customListSchema);

app.get("/", function (req, res) {
  Item.find({}, function (err, items) {
    if (!err) {
      res.render("list", { listTitle: "Today", newListItems: items });
    } else {
      console.log(err);
    }
  });
});

app.get("/about", function (req, res) {
  res.render("about");
});

app.get("/:listName", function (req, res) {
  const listName = _.capitalize(req.params.listName);

  List.findOne({ name: listName }, function (err, foundList) {
    if (!err) {
      if (!foundList) {
        const item = new List({
          name: listName,
          items: []
        });
        item.save(function (err) {
          if(!err){
            res.render("list", { listTitle: listName, newListItems: item.items});
          } else {
            console.log(err);
          }
        });
      } else {
        res.render("list", { listTitle: listName, newListItems: foundList.items});
      }
    } else {
      console.log(err);
    }
  });
});

app.post("/", function (req, res) {
  const newItem = req.body.newItem;
  const listTitle = req.body.addItem;

  const item = new Item({
    name: newItem
  });

  if (listTitle === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({ name: listTitle }, function (err, foundList) {
      if (!err) {
        foundList.items.push(item);
        foundList.save();
        res.redirect("/" + listTitle);
      } else {
        console.log(err);
      }
    });
  }
});

app.post("/delete", function (req, res) {
  const itemId = req.body.deleteItem;
  const listTitle = req.body.listTitle;

  if (listTitle === "Today") {
    Item.findByIdAndRemove(itemId, function (err) {
      if (!err) {
        res.redirect("/");
      } else {
        console.log(err);
      }
    });
  } else {
    List.findOneAndUpdate({name: listTitle}, {$pull: {items: {_id: itemId}}}, function (err, foundList) {
        if (!err) {
          res.redirect("/" + listTitle);
        } else {
          console.log(err);
        }
      }
    );
  }
});


app.listen(3000, function () {
  console.log("Server started on port 3000");
});
