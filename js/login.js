class LoginChatForm {
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
            // switch (options.type) {
            //     case "registration": {
            //         fieldsetRegister.style.display = "none";
            //         fieldsetLogin.style.display = "block";
            //         break;
            //     }
            //     case "autorisation": {
            //         fieldsetRegister.style.display = "block";
            //         fieldsetLogin.style.display = "none";
            //         break;
            //     }
            // }
        }
    }
}

async function getProducts() {
    let responseProducts = await fetch('http://localhost:8090/products');
    let products = await responseProducts.json(); // will not work without "await" word

    await new Promise((resolve, reject) => setTimeout(resolve, 3000)); // this works like Sleep(3000) in threads
    console.log(JSON.stringify(products, '', ' '));
    let responseFirstProduct = await fetch('http://localhost:8090/products/1');
    let firstProduct = await responseFirstProduct.json();
    console.log(JSON.stringify(firstProduct, '', ' '));
    return products;
  }
//   getProducts();


window.onload = function () {
    // let formRegister = new LoginChatForm({type:"registration",apiRoute:"register"}, 
    //     (xhr, elem) => alert("Успешно") 
    // );

    let url_string = window.location.href;
    let url = new URL(url_string);
    let key = url.searchParams.get("key");

    let loginChatForm = document.getElementsByName("loginChat")[0];

    function createChatSusccess(xhr) {
        let respObj = JSON.parse(xhr.response);
        console.dir(respObj);

        loginChatForm.roomName.disabled = true;
        loginChatForm.userName.disabled = false;
        
        loginChatForm.nextButton.disabled = true;

        sessionStorage.setItem('key', respObj.key);
        sessionStorage.setItem('chatname', respObj.name);
    }

    function checkExistChatSuccess() {
        loginChatForm.roomName.disabled = true;
        loginChatForm.userName.disabled = false;
        
        loginChatForm.nextButton.disabled = true;
        
        sessionStorage.setItem('key', respObj.key);
        sessionStorage.setItem('chatname', respObj.name);
    }

    function loginChatSuccess(xhr) {
        let respObj = JSON.parse(xhr.response);
        console.dir(respObj);

        loginChatForm.roomName.disabled = true;
        loginChatForm.userName.disabled = true;
        loginChatForm.roomLink.disabled = false;

        sessionStorage.setItem('username', respObj.username);
        sessionStorage.setItem('token', respObj.userid);


        //elem.submit();
    }

    // ВАЛИДАЦИЯ
    loginChatForm.roomName.oninput = function () {
        if ( loginChatForm.roomName.value.length < 3 || loginChatForm.roomName.value.length > 50 )  {
            loginChatForm.nextButton.disabled = true;
        } else {
            loginChatForm.nextButton.disabled = false;
        }
    }
    loginChatForm.userName.oninput = function () {
        if (loginChatForm.userName.value.length < 3 || loginChatForm.userName.value.length > 50) {
            loginChatForm.nextButton.disabled = true;
        } else {
            loginChatForm.nextButton.disabled = false;
        }
    }

    var first = true;

    loginChatForm.onsubmit = function () {

        if(first) {
            let xhr = new XMLHttpRequest();
            xhr.open("POST", SettingController.getUrl()+"api/chat/create/"+loginChatForm.roomName.value, true)
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        createChatSusccess(xhr);
                        first = false;
                    }
                }
            }
            xhr.send();
        } else {
            let from = new FormData();
            from.append("name", loginChatForm.userName.value);

            let xhr = new XMLHttpRequest();
            xhr.open("POST", SettingController.getUrl()+"api/user/login/"+sessionStorage.getItem('key'), true)
            xhr.onreadystatechange = function () {
                if (xhr.readyState == 4) {
                    if (xhr.status == 200) {
                        loginChatSuccess(xhr);
                    }
                }
            }
            xhr.send(from);
        }



        return false;
    }
}