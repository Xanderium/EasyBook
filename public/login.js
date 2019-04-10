window.addEventListner("load", () => {
  document.forms.login.addEventListener("submit", handleSubmit);
});

function handleSubmit(event) {
  event.preventDefault();
  const form = event.target;
  if(!form.email.value || !form.password.value) {
    document.getElementById("errorMessage").innerHTML = "Please fill out all required fields";
    return;
  }
  form.submit();
}