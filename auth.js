function authenticate(event) {
    event.preventDefault(); // login to not go through

    var username = document.getElementById("username").value;
    var password = document.getElementById("password").value;

    //  sample username and password
    if (username === "cyberGuy2362" && password === "password") {
        window.location.href = "filesPage.html";
    } else {
        alert("Login failed. Please check your username and password.");
    }
}

function logout() {
    window.location.href = "loginPage.html"
    // alert("Logout Successful.")
}