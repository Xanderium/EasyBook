var classID;
var acceptButton;
var cancelButton;
window.addEventListener("load", () => {
  classID = document.getElementById("class").getAttribute("cid");
  acceptButton = document.getElementById("accept");
  cancelButton = document.getElementById("cancel");
  var deleteStudentButtons = document.getElementsByClassName("delete-student");
  for(var i = 0; i < deleteStudentButtons.length; i++) {
    deleteStudentButtons[i].addEventListener("click", deleteStudent);
  }
  var deleteCodeButtons = document.getElementsByClassName("delete-code");
  for(var i = 0; i < deleteCodeButtons.length; i++) {
    deleteCodeButtons[i].addEventListener("click", deleteCode);
  }
  acceptButton.addEventListener("click", acceptDelete);
  cancelButton.addEventListener("click", closeDelete);
});

var toDelete = 0;
var student;
var code;
function deleteStudent(event) {
  toDelete = 1;
  student = event.target.parentNode;
  document.getElementById("popup_delete").style.display = "block";
}

function deleteCode(event) {
  toDelete = 2;
  code = event.target.parentNode;
  document.getElementById("popup_delete").style.display = "block";
}

function closeDelete() {
  if(toDelete === 1) {
    student = null;
  } else if(toDelete === 2) {
    code = null;
  }
  toDelete = 0;
  resetPopup();
}

function acceptDelete() {
  var request = new XMLHttpRequest();
  if(toDelete === 1) {
    request.onreadystatechange = () => {
      if(request.readyState === 4 && request.status === 200) {
        resetPopup();
        var studentsHeaderContent = document.getElementById("students-header").textContent.split("");
        studentsHeaderContent[studentsHeaderContent.length - 2] = parseInt(studentsHeaderContent.splice(studentsHeaderContent.length - 2, studentsHeaderContent.length - 1)) - 1;
        studentsHeaderContent[studentsHeaderContent.length] = ")";
        document.getElementById("students-header").textContent = studentsHeaderContent.join("");
        student.style.display = 'none';
        student = null;
      } else if(request.readyState === 0) {
        errorDelete();
      }
    };
    request.open("POST", "/delete-student");
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    var studentCode = student.getElementsByTagName("span")[0].textContent;
    request.send("classID=" + classID + "&studentCode=" + studentCode);
  } else if(toDelete === 2) {
    request.onreadystatechange = () => {
      if(request.readyState === 4 && request.status === 200) {
        resetPopup();
        var codesHeaderContent = document.getElementById("codes-header").textContent.split("");
        codesHeaderContent[codesHeaderContent.length - 2] = parseInt(codesHeaderContent.splice(codesHeaderContent.length - 2, codesHeaderContent.length - 1)) - 1;
        codesHeaderContent[codesHeaderContent.length] = ")";
        document.getElementById("codes-header").textContent = codesHeaderContent.join("");
        code.style.display = 'none';
        code = null;
      } else if(request.readyState === 0) {
        errorDelete();
      }
    };
    request.open("POST", "/delete-code");
    request.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    var redemptionCode = code.getElementsByTagName("span")[0].textContent;
    request.send("classID=" + classID + "&code=" + redemptionCode);
  }
  toDelete = 0;
}

function resetPopup() {
  document.getElementById("popup-header").textContent = "Delete this student?";
  document.getElementById("popup-label").textContent = "Are you sure you want to delete this student?";
  acceptButton.value = "Yes, I'm Sure";
  document.getElementById("popup_delete").style.display = "none";
}

function errorDelete() {
  document.getElementById("popup-header").textContent = "Could not delete item";
  document.getElementById("popup-label").textContent = "The selected item could not be deleted.";
  acceptButton.value = "Try Again";
}