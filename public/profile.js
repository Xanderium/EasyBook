window.addEventListener("load", () => {
  console.log("a");
  var gradeSelect = document.forms.updateInfo.grade;
  var gradeValue = parseInt(gradeSelect.getAttribute("grade"));
  console.log(gradeSelect);
  console.log(gradeSelect.getAttribute("grade"));
  console.log(gradeValue);
  if(!gradeValue) {
    var newOption = document.createElement("option");
    newOption.textContent = "Select";
    gradeSelect.insertBefore(gradeSelect.options[0], newOption);
  } else {
    gradeSelect.selectedIndex = gradeValue - 1;
  }
});