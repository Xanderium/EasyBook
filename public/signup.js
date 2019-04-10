var gradeClassElements
window.addEventListener("load", () => {
  gradeClassElements = document.getElementsByClassName("grade");
  document.forms.signup.type.addEventListener("change", handleChange);
  document.forms.signup.addEventListener("submit", handleSubmit);
});

function handleChange(event) {
  if(event.target.selectedIndex === 0) {
    for(var i = 0; i < gradeClassElements.length; i++) {
      gradeClassElements[i].style.display = "block";
    }
  } else if(event.target.selectedIndex === 1) {
    for(var i = 0; i < gradeClassElements.length; i++) {
      gradeClassElements[i].style.display = "none";
    }
  }
}

function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  const errorMessage = document.getElementById("errorMessage");
  if(!(form.type.value === "student" || form.type.value === "teacher") || !form.firstName.value || !form.lastName.value || !form.email.value || !form.password.value || !form.confirm.value) {
    errorMessage.innerHTML = "Please fill out all required fields.";
    return;
  }
  if(!/^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/.test(form.email.value)) {
    errorMessage.innerHTML = "Please provide a valid email address.";
    return;
  }
  if(form.password.value !== form.confirm.value) {
    errorMessage.innerHTML = "Password confirmation does not match.";
    return;
  }
  if(!/^[A-Za-z0-9#$^+=!*()@%&]{8,}$/.test(form.password.value)) {
    errorMessage.innerHTML = "Password must be at least 8 characters.";
    return;
  }
  form.submit();
}