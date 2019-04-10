var forms;
var booksElement;
var searching;
var searchingInterval;
var className;
var bookID;
var codeNumber;

window.addEventListener("load", () => {
//   Set global variables to elements
  forms = document.forms;
  booksElement = document.getElementById("books");
  searching = document.getElementById("searching");
//   Set event listeners for buttons to lead to popups
  document.getElementById("newClass").addEventListener("click", popup);
  document.getElementById("start").addEventListener("click", popup);
  document.getElementById("next1").addEventListener("click", popup2);
  document.getElementById("finish").addEventListener("click", finish);
//   For each form, set an event listener
  for(var i = 0; i < forms.length; i++) {
//     On form submit, stop event
    forms[i].addEventListener("submit", (event) => {
      event.preventDefault();
    });
//     On keydown event, invoke clickNext to click on next element
    forms[i].addEventListener("keydown", clickNext);
  }
  var searchTimeout = setTimeout(() => {}, 0);
//   For search box element, set timeout to invoke search in a half of a second
  document.getElementById("search").addEventListener("keydown", (event) => {
//     Clear search timeout
    clearTimeout(searchTimeout);
//     Set new timeout to invoke search after half of a second
    searchTimeout = setTimeout(search, 500);
  });
});

//   Show first popup
function popup() {
  document.getElementById("popup_stage1").style.display = "block";
}
// Hide first popup and show second popup
function popup2(event) {
    className = event.target.parentElement.class.value;
    document.getElementById("popup_stage1").style.display = "none";
    document.getElementById("popup_stage2").style.display = "block";
}
// Hide second popup and show third popup
function popup3(event) {
    bookID = event.target.parentElement.getAttribute("bid");
    document.getElementById("popup_stage2").style.display = "none";
    document.getElementById("popup_stage3").style.display = "block";
}
// Hide third popup
function finish(event) {
  codeNumber = document.getElementById("codeNumber").value;
  document.getElementById("popup_stage3").style.display = "none";
  var request = new XMLHttpRequest();
  request.onreadystatechange = () => {
    if(request.readyState === 4 && request.status === 200) {
      var newClass = JSON.parse(request.responseText);
      var classElement = document.createElement("div");
      classElement.className = "class";
      classElement.setAttribute("cid", newClass._id);
      var name = document.createElement("h2");
      name.textContent = newClass.name;
      var students = document.createElement("h3");
      students.textContent = newClass.students.length + " Student";
      if(newClass.students.length !== 1) {
        students.textContent += "s";
      }
      var link = document.createElement("a");
      link.href = "/classes/" + newClass._id + "/view";
      link.textContent = "Enter Class";
      classElement.appendChild(name);
      classElement.appendChild(students);
      classElement.appendChild(link);
      document.getElementById("classes").appendChild(classElement);
    }
  };
  request.open("POST", "create-class");
  request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  console.log(codeNumber);
  request.send("className=" + className + "&bookID=" + bookID + "&codes=" + codeNumber);
}
// If the enter button was pressed, click the form's next button
function clickNext(event) {
//     If key was the enter key, retrieve form and click its next button
  if(event.keyCode === 13) {
    var form = event.target.parentElement;
    if(form.next) {
      form.next.click();
      return false;
    }
  }
  return true;
}
// Search for book in search bar
function search(book) {
//   Retrieve search bar element
  var search = document.getElementById("search");
//   Clear and set searching interval to signal searching
  clearInterval(searchingInterval);
  searching.textContent = "Searching";
  var counter = 0;
  searchingInterval = setInterval(() => {
    switch(counter) {
      case 0:
        counter++;
        searching.textContent = "Searching.";
        break;
      case 1:
        counter++;
        searching.textContent = "Searching..";
        break;
      case 2:
        counter++;
        searching.textContent = "Searching...";
        break;
      case 3:
        counter = 0;
        searching.textContent = "Searching";
        break;
    }
  }, 500);
  var request = new XMLHttpRequest();
  request.onreadystatechange = () => {
    if(request.readyState === 4 && request.status === 200) {
      searching.textContent = "";
      clearInterval(searchingInterval);
      var books = JSON.parse(request.responseText);
      booksElement.innerHTML = "";
      if(books.length === 0) {
        booksElement.style.display = "none";
        return;
      }
      booksElement.style.display = "block";
      for(var i in books) {
        var bookElement = document.createElement("div");
        bookElement.className = "book";
        bookElement.setAttribute("bid", books[i]._id);
        var title = document.createElement("span");
        title.textContent = books[i].name;
        var author = document.createElement("span");
        author.className = "bookauthor";
        author.textContent = books[i].author;
        var addButton = document.createElement("input");
        addButton.type = "button";
        addButton.value = "Add Book";
        addButton.className = "uibutton";
        addButton.onclick = popup3;
        bookElement.appendChild(title);
        bookElement.appendChild(author);
        bookElement.appendChild(addButton);
        booksElement.appendChild(bookElement);
      }
    } else if(request.readyState === 0) {
      searching.textContent = "";
      clearInterval(searchingInterval);
    }
  };
  request.open("GET", "/books/" + encodeURIComponent(search.value) + "/search");
  request.send();
}