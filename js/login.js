async function checkExistChat(key) {
    let responJson = await fetch(SettingController.getUrl()+"api/chat/exists/"+key, {method: "GET"});
    let json = await responJson.json();
    return json;
}

async function createChat(value) {
    let responJson = await fetch(SettingController.getUrl()+"api/chat/create/"+value, {method: "POST"});
    let json = await responJson.json();
    return json;
}

async function loginChat(key, data) {
    let responJson = await fetch(SettingController.getUrl()+"api/user/login/"+key, {method: "POST", body: data});
    
    if (responJson.ok) {
        let json = await responJson.json();
        return json;
    } else {
        throw new Error(responJson.status +  ": " + responJson.statusText);
    }

}

window.onload = function () {
    var first = true;

    let url = new URL(window.location.href);
    let key = url.searchParams.get("key");

    let loginChatForm = document.getElementsByName("loginChat")[0];


    function checkExistChatSuccess(responJson) {
        loginChatForm.roomName.disabled = true;
        loginChatForm.userName.disabled = false;
        
        loginChatForm.nextButton.disabled = true;
        
        sessionStorage.setItem('key', responJson.key);
        sessionStorage.setItem('chatname', responJson.name);

    }

    function loginChatSuccess(responJson) {
        loginChatForm.roomName.disabled = true;
        loginChatForm.userName.disabled = true;
        loginChatForm.roomLink.disabled = false;

        if(key==null) {
            key = sessionStorage.getItem('key');
            loginChatForm.roomLink.value = url+"?key="+key;
        } else {
            loginChatForm.roomLink.value = url;
        }

        sessionStorage.setItem('username', responJson.username);
        sessionStorage.setItem('token', responJson.userid);

        // elem.submit();
    }

    if (key != null) {
        checkExistChat(key)
            .then(result => {
                first = false;
                checkExistChatSuccess(result);
                loginChatForm.roomName.value = result.name;
            });
    }

    loginChatForm.onsubmit = function () {

        if(first) {
            createChat(loginChatForm.roomName.value)
                .then(result => {
                    first = false;
                    checkExistChatSuccess(result);
                });
        } else {
            let data = new FormData();
            data.append("name", loginChatForm.userName.value);

            loginChat(key, data)
                .then(result => {
                    loginChatSuccess(result);
                }, reject => {
                    alert(reject);   
                });
        }

        return false;
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

}