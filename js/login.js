class SignForm {
    constructor(options, callback) {

        let fieldsetRegister = document.querySelector(".login-fieldset.sign-up");
        let fieldsetLogin = document.querySelector(".login-fieldset.sign-in");

        let elem = document.getElementsByName(options.type)[0];

        elem.onsubmit = function() {
            let form = new FormData(elem);
            var xhr = new XMLHttpRequest();
            xhr.open("POST", SettingController.getUrl() + "api/users/"+options.apiRoute, true);
            xhr.onreadystatechange = () => {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200)
                    {
                        callback(xhr, elem);
                    } else {
                        alert(xhr.status+": "+xhr.statusText);
                    }
                }
            }; 
            xhr.send(form);
            return false;
        }    
        elem.elements.changeType.onclick = function() {
            switch (options.type) {
                case "registration": {
                    fieldsetRegister.style.display = "none";
                    fieldsetLogin.style.display = "block";
                    break;
                }
                case "autorisation": {
                    fieldsetRegister.style.display = "block";
                    fieldsetLogin.style.display = "none";
                    break;
                }
            }
        }
    }
}


window.onload = function () {

    let formRegister = new SignForm({type:"registration",apiRoute:"register"}, 
        (xhr, elem) => alert("Успешно") 
    );

    let formLogin = new SignForm({type:"autorisation",apiRoute:"login"}, 
        (xhr, elem) => {
                let respObj = JSON.parse(xhr.responseText);

                sessionStorage.setItem('token', respObj.token);
                sessionStorage.setItem('userid', respObj.userid);
                sessionStorage.setItem('login', elem.login.value);

                elem.submit();
            }
    );


}