var forms;
var classContainer;
var codeSearch;
var searching;
var searchingInterval;

window.addEventListener("load", () => {
//   Set global variables to elements
  forms = document.forms;
  classContainer = document.getElementById("class");
  searching = document.getElementById("searching");
//   Set event listeners for buttons to lead to popups
  document.getElementById("redeem").addEventListener("click", popup);
  document.getElementById("redeemCode").addEventListener("click", popup);
//   On form submit, stop event
  forms[0].addEventListener("submit", (event) => {
    event.preventDefault();
  });
//   On keydown event, invoke clickNext to click on next element
  forms[0].addEventListener("keydown", clickNext);
  var searchTimeout = setTimeout(() => {}, 0);
//   For search box element, set timeout to invoke search in a half of a second
  document.getElementById("code").addEventListener("keydown", (event) => {
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
// Hide first popup
function finish(event) {
  var code = codeSearch.value;
  // search.value = "";
  var classID = document.getElementById("codeClass").getAttribute("cid");
  document.getElementById("popup_stage1").style.display = "none";
  var request = new XMLHttpRequest();
  request.onreadystatechange = () => {
    if(request.readyState === 4 && request.status === 200) {
      var newClass = JSON.parse(request.responseText);
      var classElement = document.createElement("div");
      classElement.className = "class";
      classElement.setAttribute("cid", newClass._id);
      var name = document.createElement("h2");
      name.textContent = newClass.name;
      var teacher = document.createElement("h3");
      teacher.textContent = newClass.teacher.name;
      var codeElement = document.createElement("h5");
      codeElement.textContent = code;
      var link = document.createElement("a");
      link.href = "classes/" + newClass._id + "/view";
      link.textContent = "Enter Class";
      classElement.appendChild(name);
      classElement.appendChild(teacher);
      classElement.appendChild(codeElement);
      classElement.appendChild(link);
      document.getElementById("classes").appendChild(classElement);
//      <div class="class" classID="<%= curClass.id %>">
//      <h2><%= curClass.name %></h2>
//      <% if(type === "student") { %>
//      <h3><%= curClass.teacher %></h3>
//      <% } else { %>
//      <h3><%= curClass.students %> Student<% if(curClass.students !== 1) { %>s<% } %></h3>
//      <% } %>
//      <% if(type === "student") { %>
//      <h5><%= curClass.code %></h5>
//      <% } %>
//      <a href="#">Enter Class</a>
//    </div>
    }
  };
  request.open("POST", "redeem-code");
  request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
  request.send("classID=" + classID + "&code=" + code);
  // {
  //   className:className,
  //   bookID:bookID,
  //   codes:codeNumber
  // }
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
// Search for code in code input
function search(code) {
//   Retrieve search bar element
  codeSearch = document.getElementById("code");
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
      if(!request.responseText) {
        searching.textContent = "No class found";
        return;
      }
      var codeClass = JSON.parse(request.responseText);
      classContainer.innerHTML = "";
      if(!codeClass) {
        classContainer.style.display = "none";
        return;
      }
      classContainer.style.display = "block";
      var classElement = document.createElement("div");
      classElement.id = "codeClass";
      classElement.className = "book";
      classElement.setAttribute("cid", codeClass._id);
      console.log(codeClass);
      var title = document.createElement("span");
      title.textContent = codeClass.name;
      var teacher = document.createElement("span");
      teacher.className = "bookauthor";
      teacher.textContent = codeClass.teacher;
      var addButton = document.createElement("input");
      addButton.type = "button";
      addButton.value = "Redeem Code";
      addButton.className = "uibutton";
      addButton.onclick = finish;
      classElement.appendChild(title);
      classElement.appendChild(teacher);
      classElement.appendChild(addButton);
      classContainer.appendChild(classElement);
    } else if(request.readyState === 0) {
      searching.textContent = "";
      clearInterval(searchingInterval);
    }
  };
  request.open("GET", "/codes/" + encodeURIComponent(codeSearch.value) + "/search");
  request.send();
}

// Update search list
function updateSearches() {

}